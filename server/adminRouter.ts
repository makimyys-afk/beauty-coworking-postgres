import type { Express, Request, Response } from "express";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { eq, sql } from "drizzle-orm";
import { users, workspaces, bookings, reviews, transactions } from "../drizzle/schema";

// Middleware для проверки прав администратора
async function requireAdmin(req: Request, res: Response, next: Function) {
  try {
    const user = await sdk.authenticateRequest(req);
    const dbUser = await db.getUserByOpenId(user.openId);
    
    if (!dbUser || dbUser.role !== "admin") {
      res.status(403).json({ error: "Доступ запрещен" });
      return;
    }
    
    // Сохраняем пользователя в request для дальнейшего использования
    (req as any).user = dbUser;
    next();
  } catch (error) {
    res.status(401).json({ error: "Не авторизован" });
  }
}

export function registerAdminRoutes(app: Express) {
  // Статистика для дашборда
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

  // === USERS ===
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
      const { name, email, phone, points } = req.body;

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await database.update(users)
        .set({ name, email, phone, points })
        .where(eq(users.id, userId));

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
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete user:", error);
      res.status(500).json({ error: "Ошибка удаления пользователя" });
    }
  });

  // === WORKSPACES ===
  app.get("/api/admin/workspaces", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allWorkspaces = await db.getAllWorkspaces();
      res.json(allWorkspaces);
    } catch (error) {
      console.error("[Admin] Failed to fetch workspaces:", error);
      res.status(500).json({ error: "Ошибка получения рабочих мест" });
    }
  });

  app.post("/api/admin/workspaces", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, description, type, pricePerHour, pricePerDay, imageUrl, isAvailable } = req.body;

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const [newWorkspace] = await database.insert(workspaces).values({
        name,
        description,
        type,
        pricePerHour,
        pricePerDay,
        imageUrl,
        isAvailable: isAvailable ?? true,
      }).returning();

      res.json(newWorkspace);
    } catch (error) {
      console.error("[Admin] Failed to create workspace:", error);
      res.status(500).json({ error: "Ошибка создания рабочего места" });
    }
  });

  app.put("/api/admin/workspaces/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const workspaceId = parseInt(req.params.id);
      const { name, description, type, pricePerHour, pricePerDay, imageUrl, isAvailable } = req.body;

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await database.update(workspaces)
        .set({
          name,
          description,
          type,
          pricePerHour,
          pricePerDay,
          imageUrl,
          isAvailable,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, workspaceId));

      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update workspace:", error);
      res.status(500).json({ error: "Ошибка обновления рабочего места" });
    }
  });

  app.delete("/api/admin/workspaces/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const workspaceId = parseInt(req.params.id);

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await database.delete(workspaces).where(eq(workspaces.id, workspaceId));
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete workspace:", error);
      res.status(500).json({ error: "Ошибка удаления рабочего места" });
    }
  });

  // === BOOKINGS ===
  app.get("/api/admin/bookings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const allBookings = await database
        .select({
          id: bookings.id,
          workspaceId: bookings.workspaceId,
          workspaceName: workspaces.name,
          userId: bookings.userId,
          userName: users.name,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
          status: bookings.status,
          totalPrice: bookings.totalPrice,
          paymentStatus: bookings.paymentStatus,
          notes: bookings.notes,
          createdAt: bookings.createdAt,
        })
        .from(bookings)
        .leftJoin(workspaces, eq(bookings.workspaceId, workspaces.id))
        .leftJoin(users, eq(bookings.userId, users.id))
        .orderBy(bookings.id);

      res.json(allBookings);
    } catch (error) {
      console.error("[Admin] Failed to fetch bookings:", error);
      res.status(500).json({ error: "Ошибка получения бронирований" });
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

      await database.update(bookings)
        .set({ status, updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));

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

      await database.update(bookings)
        .set({ paymentStatus, updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));

      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update payment status:", error);
      res.status(500).json({ error: "Ошибка обновления статуса оплаты" });
    }
  });

  // === REVIEWS ===
  app.get("/api/admin/reviews", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const allReviews = await database
        .select({
          id: reviews.id,
          workspaceId: reviews.workspaceId,
          workspaceName: workspaces.name,
          userId: reviews.userId,
          userName: users.name,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .leftJoin(workspaces, eq(reviews.workspaceId, workspaces.id))
        .leftJoin(users, eq(reviews.userId, users.id))
        .orderBy(reviews.id);

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

      // Получаем информацию об отзыве перед удалением
      const [review] = await database.select().from(reviews).where(eq(reviews.id, reviewId));
      
      if (review) {
        // Удаляем отзыв
        await database.delete(reviews).where(eq(reviews.id, reviewId));
        
        // Пересчитываем рейтинг рабочего места
        const workspaceReviews = await database.select().from(reviews).where(eq(reviews.workspaceId, review.workspaceId));
        
        if (workspaceReviews.length > 0) {
          const avgRating = workspaceReviews.reduce((sum, r) => sum + r.rating, 0) / workspaceReviews.length;
          await database.update(workspaces)
            .set({
              rating: avgRating.toFixed(1),
              reviewCount: workspaceReviews.length,
            })
            .where(eq(workspaces.id, review.workspaceId));
        } else {
          await database.update(workspaces)
            .set({
              rating: '0',
              reviewCount: 0,
            })
            .where(eq(workspaces.id, review.workspaceId));
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete review:", error);
      res.status(500).json({ error: "Ошибка удаления отзыва" });
    }
  });
}
