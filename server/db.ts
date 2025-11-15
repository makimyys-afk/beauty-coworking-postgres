import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, workspaces, bookings, reviews, transactions, sqlLogs, Workspace, Booking, Review, Transaction, SqlLog } from "../drizzle/schema";
import { ENV } from './_core/env';
import { executeWithLogging } from "./sqlLogger";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<{ id: number; openId: string; name: string | null; email: string | null }> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "avatar", "bio", "specialization"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });

    // Получаем созданного/обновленного пользователя
    const result = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (result.length === 0) {
      throw new Error("Failed to retrieve user after upsert");
    }
    return { id: result[0].id, openId: result[0].openId, name: result[0].name, email: result[0].email };
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Workspaces
export async function getAllWorkspaces(userId?: number): Promise<Workspace[]> {
  const db = await getDb();
  if (!db) return [];

  return executeWithLogging(
    () => db.select().from(workspaces).orderBy(desc(workspaces.rating)),
    "SELECT * FROM workspaces ORDER BY rating DESC",
    userId,
    "workspaces.getAll"
  );
}

export async function getWorkspaceById(id: number, userId?: number): Promise<Workspace | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await executeWithLogging(
    () => db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1),
    `SELECT * FROM workspaces WHERE id = ${id} LIMIT 1`,
    userId,
    "workspaces.getById",
    { id }
  );

  return result.length > 0 ? result[0] : undefined;
}

// Bookings
export async function getUserBookings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return executeWithLogging(
    () => db
      .select({
        id: bookings.id,
        workspaceId: bookings.workspaceId,
        userId: bookings.userId,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        totalPrice: bookings.totalPrice,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        workspaceName: workspaces.name,
        workspaceType: workspaces.type,
        workspaceImage: workspaces.imageUrl,
      })
      .from(bookings)
      .leftJoin(workspaces, eq(bookings.workspaceId, workspaces.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.startTime)),
    `SELECT bookings.*, workspaces.name, workspaces.type FROM bookings LEFT JOIN workspaces ON bookings.workspaceId = workspaces.id WHERE bookings.userId = ${userId} ORDER BY startTime DESC`,
    userId,
    "bookings.getUserBookings",
    { userId }
  );
}

export async function createBooking(booking: typeof bookings.$inferInsert, userId?: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await executeWithLogging(
    async () => {
      await db.insert(bookings).values(booking);
      // Получаем последний вставленный ID
      const [lastInsert] = await db.select({ id: sql<number>`LAST_INSERT_ID()` }).from(bookings).limit(1);
      return lastInsert.id;
    },
    `INSERT INTO bookings VALUES (...)`,
    userId,
    "bookings.create",
    booking
  );

  return result;
}

export async function updateBookingStatus(
  bookingId: number,
  status: "pending" | "confirmed" | "cancelled" | "completed",
  userId?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await executeWithLogging(
    () => db.update(bookings).set({ status }).where(eq(bookings.id, bookingId)),
    `UPDATE bookings SET status = '${status}' WHERE id = ${bookingId}`,
    userId,
    "bookings.updateStatus",
    { bookingId, status }
  );
}

// Reviews
export async function getWorkspaceReviews(workspaceId: number, userId?: number) {
  const db = await getDb();
  if (!db) return [];

  return executeWithLogging(
    () => db.select({
      id: reviews.id,
      userId: reviews.userId,
      workspaceId: reviews.workspaceId,
      bookingId: reviews.bookingId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      userName: users.name,
    }).from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.workspaceId, workspaceId))
      .orderBy(desc(reviews.createdAt)),
    `SELECT reviews.*, users.name as userName FROM reviews LEFT JOIN users ON reviews.userId = users.id WHERE workspaceId = ${workspaceId} ORDER BY createdAt DESC`,
    userId,
    "reviews.getByWorkspace",
    { workspaceId }
  );
}

export async function createReview(review: typeof reviews.$inferInsert, userId?: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await executeWithLogging(
    async () => {
      await db.insert(reviews).values(review);
      
      // Обновляем рейтинг рабочего места
      const allReviews = await db.select().from(reviews).where(eq(reviews.workspaceId, review.workspaceId));
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await db.update(workspaces)
        .set({ 
          rating: (avgRating).toFixed(1),
          reviewCount: allReviews.length 
        })
        .where(eq(workspaces.id, review.workspaceId));
      
      // Получаем последний вставленный ID
      const [lastInsert] = await db.select({ id: sql<number>`LAST_INSERT_ID()` }).from(reviews).limit(1);
      return lastInsert.id;
    },
    `INSERT INTO reviews VALUES (...) and UPDATE workspaces rating`,
    userId,
    "reviews.create",
    review
  );

  return result;
}

// Transactions
export async function getUserTransactions(userId: number): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  return executeWithLogging(
    () => db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)),
    `SELECT * FROM transactions WHERE userId = ${userId} ORDER BY createdAt DESC`,
    userId,
    "transactions.getUserTransactions",
    { userId }
  );
}

export async function createTransaction(transaction: typeof transactions.$inferInsert, userId?: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await executeWithLogging(
    async () => {
      await db.insert(transactions).values(transaction);
      // Получаем последний вставленный ID
      const [lastInsert] = await db.select({ id: sql<number>`LAST_INSERT_ID()` }).from(transactions).limit(1);
      return lastInsert.id;
    },
    `INSERT INTO transactions VALUES (...)`,
    userId,
    "transactions.create",
    transaction
  );

  return result;
}

// SQL Logs
export async function getSqlLogs(limit: number = 100, userId?: number): Promise<SqlLog[]> {
  const db = await getDb();
  if (!db) return [];

  // Не логируем запросы к самим логам, чтобы избежать рекурсии
  const result = await db.select().from(sqlLogs).orderBy(desc(sqlLogs.createdAt)).limit(limit);
  return result;
}

export async function getUserBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await executeWithLogging(
    async () => {
      const userTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId));
      
      // amount уже содержит знак: положительный для deposit/refund, отрицательный для payment/withdrawal
      return userTransactions.reduce((balance, t) => balance + t.amount, 0);
    },
    `SELECT and calculate balance from transactions WHERE userId = ${userId}`,
    userId,
    "transactions.getUserBalance",
    { userId }
  );

  return result;
}

// Statistics
export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  return executeWithLogging(
    async () => {
      const userBookings = await db.select().from(bookings).where(eq(bookings.userId, userId));
      const balance = await getUserBalance(userId);

      return {
        totalBookings: userBookings.length,
        activeBookings: userBookings.filter(b => b.status === 'confirmed').length,
        completedBookings: userBookings.filter(b => b.status === 'completed').length,
        balance,
      };
    },
    `SELECT statistics for user ${userId}`,
    userId,
    "stats.getUserStats",
    { userId }
  );
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  return executeWithLogging(
    async () => {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          avatar: users.avatar,
          bio: users.bio,
          specialization: users.specialization,
          points: users.points,
          status: users.status,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user || null;
    },
    "users.getUserProfile",
    userId,
    "users.getUserProfile",
    { userId }
  );
}
