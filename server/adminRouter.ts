import { Express, Request, Response } from "express";
import * as db from "./db";
import { eq, sql, desc } from "drizzle-orm";
import jwt from "jsonwebtoken";
import {
  users, workspaces, bookings, reviews, transactions, adminLogs,
  tariffs, equipment, materials, contracts, accessPasses, serviceRecords,
  invoices, payments, maintenanceRequests, staff, financialReports,
  incidentRegistry, notifications, promotions, workSchedule
} from "../drizzle/schema";

const JWT_SECRET = process.env.JWT_SECRET || "beauty-coworking-secret-key-2024";
const COOKIE_NAME = "session";

interface JWTPayload {
  userId: number;
  openId: string;
  email: string;
  name: string;
}

// Middleware для проверки прав администратора
async function requireAdmin(req: Request, res: Response, next: Function) {
  try {
    const token = req.cookies[COOKIE_NAME];
    
    if (!token) {
      res.status(401).json({ error: "Не авторизован" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const dbUser = await db.getUserByOpenId(decoded.openId);
    
    if (!dbUser || dbUser.role !== "admin") {
      res.status(403).json({ error: "Доступ запрещен" });
      return;
    }
    
    (req as any).user = dbUser;
    next();
  } catch (error) {
    console.error("[Admin] Auth error:", error);
    res.status(401).json({ error: "Не авторизован" });
  }
}

// Функция для логирования действий администратора
async function logAdminAction(
  database: any,
  adminId: number,
  action: string,
  entityType: string,
  entityId: number | null,
  details: any
) {
  try {
    await database.insert(adminLogs).values({
      adminId,
      action: action as any,
      entityType,
      entityId,
      details: JSON.stringify(details),
    });
  } catch (error) {
    console.error("[Admin] Failed to log action:", error);
  }
}

export function registerAdminRoutes(app: Express) {
  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================
  
  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      const [usersCount] = await database.select({ count: sql<number>`count(*)` }).from(users);
      const [workspacesCount] = await database.select({ count: sql<number>`count(*)` }).from(workspaces);
      const [bookingsCount] = await database.select({ count: sql<number>`count(*)` }).from(bookings);
      const [reviewsCount] = await database.select({ count: sql<number>`count(*)` }).from(reviews);
      const [activeBookingsCount] = await database.select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(eq(bookings.status, "confirmed"));
      const [revenueSum] = await database.select({ sum: sql<number>`COALESCE(sum(${bookings.totalPrice}), 0)` })
        .from(bookings)
        .where(eq(bookings.paymentStatus, "paid"));
      res.json({
        totalUsers: Number(usersCount.count),
        totalWorkspaces: Number(workspacesCount.count),
        totalBookings: Number(bookingsCount.count),
        totalReviews: Number(reviewsCount.count),
        activeBookings: Number(activeBookingsCount.count),
        totalRevenue: Number(revenueSum.sum),
      });
    } catch (error) {
      console.error("[Admin] Failed to fetch stats:", error);
      res.status(500).json({ error: "Ошибка получения статистики" });
    }
  });

  // ============================================================================
  // ADMIN LOGS
  // ============================================================================
  
  app.get("/api/admin/logs/recent", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const recentLogs = await database
        .select({
          id: adminLogs.id,
          adminId: adminLogs.adminId,
          action: adminLogs.action,
          entityType: adminLogs.entityType,
          entityId: adminLogs.entityId,
          details: adminLogs.details,
          createdAt: adminLogs.createdAt,
          adminName: users.name,
        })
        .from(adminLogs)
        .leftJoin(users, eq(adminLogs.adminId, users.id))
        .orderBy(sql`${adminLogs.createdAt} DESC`)
        .limit(10);

      res.json(recentLogs);
    } catch (error) {
      console.error("[Admin] Failed to fetch recent logs:", error);
      res.status(500).json({ error: "Ошибка получения логов" });
    }
  });

  // ============================================================================
  // USERS
  // ============================================================================
  
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      const allUsers = await database.select().from(users).orderBy(users.id);
      res.json(allUsers);
    } catch (error) {
      console.error("[Admin] Failed to fetch users:", error);
      res.status(500).json({ error: "Ошибка получения пользователей" });
    }
  });

  app.put("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData = req.body;
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      await database.update(users).set(updateData).where(eq(users.id, userId));
      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "user_updated", "user", userId, updateData);
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update user:", error);
      res.status(500).json({ error: "Ошибка обновления пользователя" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      await database.delete(users).where(eq(users.id, userId));
      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "user_deleted", "user", userId, {});
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete user:", error);
      res.status(500).json({ error: "Ошибка удаления пользователя" });
    }
  });

  // ============================================================================
  // WORKSPACES
  // ============================================================================
  
  app.get("/api/admin/workspaces", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      const allWorkspaces = await database.select().from(workspaces).orderBy(workspaces.id);
      res.json(allWorkspaces);
    } catch (error) {
      console.error("[Admin] Failed to fetch workspaces:", error);
      res.status(500).json({ error: "Ошибка получения рабочих мест" });
    }
  });

  app.put("/api/admin/workspaces/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const workspaceId = parseInt(req.params.id);
      const updateData = req.body;
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      await database.update(workspaces).set(updateData).where(eq(workspaces.id, workspaceId));
      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "workspace_updated", "workspace", workspaceId, updateData);
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update workspace:", error);
      res.status(500).json({ error: "Ошибка обновления рабочего места" });
    }
  });

  // ============================================================================
  // BOOKINGS
  // ============================================================================
  
  app.get("/api/admin/bookings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      const allBookings = await database.select().from(bookings).orderBy(bookings.id);
      res.json(allBookings);
    } catch (error) {
      console.error("[Admin] Failed to fetch bookings:", error);
      res.status(500).json({ error: "Ошибка получения бронирований" });
    }
  });

  app.put("/api/admin/bookings/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const updateData = req.body;
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      await database.update(bookings).set(updateData).where(eq(bookings.id, bookingId));
      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "booking_updated", "booking", bookingId, updateData);
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update booking:", error);
      res.status(500).json({ error: "Ошибка обновления бронирования" });
    }
  });

  app.put("/api/admin/bookings/:id/status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      await database.update(bookings).set({ status }).where(eq(bookings.id, bookingId));
      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "booking_status_updated", "booking", bookingId, { status });
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update booking status:", error);
      res.status(500).json({ error: "Ошибка обновления статуса бронирования" });
    }
  });

  app.put("/api/admin/bookings/:id/payment", requireAdmin, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { paymentStatus } = req.body;
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      await database.update(bookings).set({ paymentStatus }).where(eq(bookings.id, bookingId));
      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "booking_payment_updated", "booking", bookingId, { paymentStatus });
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update payment status:", error);
      res.status(500).json({ error: "Ошибка обновления статуса оплаты" });
    }
  });

  // ============================================================================
  // REVIEWS
  // ============================================================================
  
  app.get("/api/admin/reviews", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      const allReviews = await database.select().from(reviews).orderBy(reviews.id);
      res.json(allReviews);
    } catch (error) {
      console.error("[Admin] Failed to fetch reviews:", error);
      res.status(500).json({ error: "Ошибка получения отзывов" });
    }
  });

  app.delete("/api/admin/reviews/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const reviewId = parseInt(req.params.id);
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }
      await database.delete(reviews).where(eq(reviews.id, reviewId));
      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "review_deleted", "review", reviewId, {});
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete review:", error);
      res.status(500).json({ error: "Ошибка удаления отзыва" });
    }
  });
}
