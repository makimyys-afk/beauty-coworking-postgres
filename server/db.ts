import { eq, desc, and, or, gte, lte, sql, ne } from "drizzle-orm";
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

export async function createBooking(booking: typeof bookings.$inferInsert, userId?: number): Promise<{ id: number; finalPrice: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await executeWithLogging(
    async () => {
      // Check for booking conflicts (same workspace, overlapping time)
      // Note: booking.startTime and booking.endTime are timestamps
      const conflictingBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.workspaceId, booking.workspaceId),
            or(
              eq(bookings.status, 'confirmed'),
              eq(bookings.status, 'pending')
            )
          )
        );
      
      // Check if there's a time overlap with existing bookings
      // booking.startTime and booking.endTime are Date objects (timestamps)
      const newStart = new Date(booking.startTime).getTime();
      const newEnd = new Date(booking.endTime).getTime();
      
      for (const existing of conflictingBookings) {
        const existingStart = new Date(existing.startTime).getTime();
        const existingEnd = new Date(existing.endTime).getTime();
        
        // Check for overlap: new booking starts before existing ends AND new booking ends after existing starts
        if (newStart < existingEnd && newEnd > existingStart) {
          const existingDate = new Date(existing.startTime).toLocaleDateString('ru-RU');
          const existingStartTime = new Date(existing.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          const existingEndTime = new Date(existing.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          throw new Error(`Это рабочее место уже забронировано на ${existingDate} с ${existingStartTime} до ${existingEndTime}`);
        }
      }
      
      // Get user's points to determine status and discount
      const [user] = await db.select({ points: users.points }).from(users).where(eq(users.id, booking.userId)).limit(1);
      
      if (!user) throw new Error("User not found");
      
      // Calculate discount based on status (points)
      let discount = 0;
      const points = user.points || 0;
      
      if (points >= 3000) {
        discount = 0.15; // Platinum: 15%
      } else if (points >= 1500) {
        discount = 0.10; // Gold: 10%
      } else if (points >= 750) {
        discount = 0.05; // Silver: 5%
      }
      // Bronze (0-749): 0% discount
      
      // Apply discount to total price
      const originalPrice = booking.totalPrice;
      const discountedPrice = Math.round(originalPrice * (1 - discount));
      
      // Update booking with discounted price
      const bookingWithDiscount = {
        ...booking,
        totalPrice: discountedPrice
      };
      
      // PostgreSQL: используем RETURNING для получения ID
      const [inserted] = await db.insert(bookings).values(bookingWithDiscount).returning({ id: bookings.id });
      
      // Award points: 1 point per 100₽
      const pointsToAdd = Math.floor(discountedPrice / 100);
      if (pointsToAdd > 0) {
        await db.update(users)
          .set({ points: sql`${users.points} + ${pointsToAdd}` })
          .where(eq(users.id, booking.userId));
        
        // Update user status based on new points
        const [updatedUser] = await db.select({ points: users.points }).from(users).where(eq(users.id, booking.userId)).limit(1);
        if (updatedUser) {
          const newPoints = updatedUser.points || 0;
          let newStatus: "bronze" | "silver" | "gold" = "bronze";
          
          if (newPoints >= 1500) {
            newStatus = "gold";
          } else if (newPoints >= 750) {
            newStatus = "silver";
          }
          
          await db.update(users)
            .set({ status: newStatus })
            .where(eq(users.id, booking.userId));
        }
      }
      
      return { id: inserted.id, finalPrice: discountedPrice };
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
      // PostgreSQL: используем RETURNING для получения ID
      const [inserted] = await db.insert(reviews).values(review).returning({ id: reviews.id });
      
      // Обновляем рейтинг рабочего места
      const allReviews = await db.select().from(reviews).where(eq(reviews.workspaceId, review.workspaceId));
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await db.update(workspaces)
        .set({ 
          rating: (avgRating).toFixed(1),
          reviewCount: allReviews.length 
        })
        .where(eq(workspaces.id, review.workspaceId));
      
      // Award 10 points for creating a review
      await db.update(users)
        .set({ points: sql`${users.points} + 10` })
        .where(eq(users.id, review.userId));
      
      // Update user status based on new points
      const [updatedUser] = await db.select({ points: users.points }).from(users).where(eq(users.id, review.userId)).limit(1);
      if (updatedUser) {
        const newPoints = updatedUser.points || 0;
        let newStatus: "bronze" | "silver" | "gold" = "bronze";
        
        if (newPoints >= 1500) {
          newStatus = "gold";
        } else if (newPoints >= 750) {
          newStatus = "silver";
        }
        
        await db.update(users)
          .set({ status: newStatus })
          .where(eq(users.id, review.userId));
      }
      
      return inserted.id;
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

  const result = await executeWithLogging(
    () => db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)),
    `SELECT * FROM transactions WHERE userId = ${userId} ORDER BY createdAt DESC`,
    userId,
    "transactions.getUserTransactions",
    { userId }
  );
  
  // Преобразуем amount в число, так как DECIMAL возвращается как строка
  return result.map(t => ({ ...t, amount: Number(t.amount) }));
}

export async function createTransaction(transaction: typeof transactions.$inferInsert, userId?: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await executeWithLogging(
    async () => {
      // Используем RETURNING для PostgreSQL
      const [inserted] = await db.insert(transactions).values(transaction).returning({ id: transactions.id });
      return inserted.id;
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
      // Преобразуем amount в число, так как DECIMAL возвращается как строка
      return userTransactions.reduce((balance, t) => balance + Number(t.amount), 0);
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

// Update user status based on points
export async function updateUserStatus(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await executeWithLogging(
    async () => {
      const [user] = await db.select({ points: users.points }).from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user) throw new Error("User not found");
      
      const points = user.points || 0;
      let newStatus: "bronze" | "silver" | "gold" = "bronze";
      
      if (points >= 1500) {
        newStatus = "gold";
      } else if (points >= 750) {
        newStatus = "silver";
      }
      
      await db.update(users)
        .set({ status: newStatus })
        .where(eq(users.id, userId));
    },
    `UPDATE user status based on points for user ${userId}`,
    userId,
    "users.updateStatus",
    { userId }
  );
}

// Get occupied time slots for a workspace on a specific date
// Returns array of {start, end} time strings in HH:MM format
export async function getOccupiedTimeSlots(workspaceId: number, date: string) {
  const db = await getDb();
  if (!db) return [];

  return executeWithLogging(
    async () => {
      // Parse date string to get start and end of day
      const startOfDay = new Date(`${date}T00:00:00`);
      const endOfDay = new Date(`${date}T23:59:59`);

      const occupiedBookings = await db
        .select({
          startTime: bookings.startTime,
          endTime: bookings.endTime,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.workspaceId, workspaceId),
            gte(bookings.startTime, startOfDay),
            lte(bookings.startTime, endOfDay),
            or(
              eq(bookings.status, 'confirmed'),
              eq(bookings.status, 'pending')
            )
          )
        );

      return occupiedBookings.map(booking => {
        // Format timestamps to HH:MM
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        return {
          start: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
          end: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
        };
      });
    },
    `SELECT occupied time slots for workspace ${workspaceId} on ${date}`,
    undefined,
    "bookings.getOccupiedSlots",
    { workspaceId, date }
  );
}

export async function updateUserLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get booking by ID
export async function getBookingById(bookingId: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await executeWithLogging(
    () => db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1),
    `SELECT * FROM bookings WHERE id = ${bookingId} LIMIT 1`,
    userId,
    "bookings.getById",
    { bookingId }
  );
  
  return result.length > 0 ? result[0] : undefined;
}

// Update booking time (for rescheduling)
export async function updateBookingTime(bookingId: number, startTime: Date, endTime: Date, userId?: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await executeWithLogging(
    async () => {
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
      if (!booking) throw new Error("Бронирование не найдено");
      
      const conflictingBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.workspaceId, booking.workspaceId),
            ne(bookings.id, bookingId),
            or(
              eq(bookings.status, "confirmed"),
              eq(bookings.status, "pending")
            )
          )
        );
      
      const newStart = startTime.getTime();
      const newEnd = endTime.getTime();
      
      for (const existing of conflictingBookings) {
        const existingStart = new Date(existing.startTime).getTime();
        const existingEnd = new Date(existing.endTime).getTime();
        
        if (newStart < existingEnd && newEnd > existingStart) {
          throw new Error("Это время уже занято другим бронированием");
        }
      }
      
      await db.update(bookings)
        .set({ startTime, endTime, updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
    },
    `UPDATE bookings SET startTime, endTime WHERE id = ${bookingId}`,
    userId,
    "bookings.updateTime",
    { bookingId }
  );
}

