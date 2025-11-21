import { Express, Request, Response } from "express";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { eq, sql, desc } from "drizzle-orm";
import {
  users, workspaces, bookings, reviews, transactions, adminLogs,
  tariffs, equipment, materials, contracts, accessPasses, serviceRecords,
  invoices, payments, maintenanceRequests, staff, financialReports,
  incidentRegistry, notifications, promotions, workSchedule
} from "../drizzle/schema";

// Middleware для проверки прав администратора
async function requireAdmin(req: Request, res: Response, next: Function) {
  try {
    const user = await sdk.authenticateRequest(req);
    const dbUser = await db.getUserByOpenId(user.openId);
    
    if (!dbUser || dbUser.role !== "admin") {
      res.status(403).json({ error: "Доступ запрещен" });
      return;
    }
    
    (req as any).user = dbUser;
    next();
  } catch (error) {
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

  app.post("/api/admin/workspaces", requireAdmin, async (req: Request, res: Response) => {
    try {
      const workspaceData = req.body;

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const [newWorkspace] = await database.insert(workspaces).values(workspaceData).returning();

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "workspace_created", "workspace", newWorkspace.id, workspaceData);

      res.json(newWorkspace);
    } catch (error) {
      console.error("[Admin] Failed to create workspace:", error);
      res.status(500).json({ error: "Ошибка создания рабочего места" });
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

  app.delete("/api/admin/workspaces/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const workspaceId = parseInt(req.params.id);

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await database.delete(workspaces).where(eq(workspaces.id, workspaceId));

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "workspace_deleted", "workspace", workspaceId, {});

      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete workspace:", error);
      res.status(500).json({ error: "Ошибка удаления рабочего места" });
    }
  });

  // ============================================================================
  // TARIFFS
  // ============================================================================
  
  app.get("/api/admin/tariffs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const allTariffs = await database.select().from(tariffs).orderBy(tariffs.id);
      res.json(allTariffs);
    } catch (error) {
      console.error("[Admin] Failed to fetch tariffs:", error);
      res.status(500).json({ error: "Ошибка получения тарифов" });
    }
  });

  app.post("/api/admin/tariffs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const tariffData = req.body;

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const [newTariff] = await database.insert(tariffs).values(tariffData).returning();

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "tariff_created", "tariff", newTariff.id, tariffData);

      res.json(newTariff);
    } catch (error) {
      console.error("[Admin] Failed to create tariff:", error);
      res.status(500).json({ error: "Ошибка создания тарифа" });
    }
  });

  app.put("/api/admin/tariffs/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const tariffId = parseInt(req.params.id);
      const updateData = req.body;

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await database.update(tariffs).set(updateData).where(eq(tariffs.id, tariffId));

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "tariff_updated", "tariff", tariffId, updateData);

      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update tariff:", error);
      res.status(500).json({ error: "Ошибка обновления тарифа" });
    }
  });

  app.delete("/api/admin/tariffs/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const tariffId = parseInt(req.params.id);

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await database.delete(tariffs).where(eq(tariffs.id, tariffId));

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "tariff_deleted", "tariff", tariffId, {});

      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete tariff:", error);
      res.status(500).json({ error: "Ошибка удаления тарифа" });
    }
  });

  // ============================================================================
  // EQUIPMENT
  // ============================================================================
  
  app.get("/api/admin/equipment", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const allEquipment = await database.select().from(equipment).orderBy(equipment.id);
      res.json(allEquipment);
    } catch (error) {
      console.error("[Admin] Failed to fetch equipment:", error);
      res.status(500).json({ error: "Ошибка получения оборудования" });
    }
  });

  app.post("/api/admin/equipment", requireAdmin, async (req: Request, res: Response) => {
    try {
      const equipmentData = req.body;

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const [newEquipment] = await database.insert(equipment).values(equipmentData).returning();

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "equipment_created", "equipment", newEquipment.id, equipmentData);

      res.json(newEquipment);
    } catch (error) {
      console.error("[Admin] Failed to create equipment:", error);
      res.status(500).json({ error: "Ошибка создания оборудования" });
    }
  });

  app.put("/api/admin/equipment/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const updateData = req.body;

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await database.update(equipment).set(updateData).where(eq(equipment.id, equipmentId));

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "equipment_updated", "equipment", equipmentId, updateData);

      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update equipment:", error);
      res.status(500).json({ error: "Ошибка обновления оборудования" });
    }
  });

  app.delete("/api/admin/equipment/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.id);

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await database.delete(equipment).where(eq(equipment.id, equipmentId));

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "equipment_deleted", "equipment", equipmentId, {});

      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete equipment:", error);
      res.status(500).json({ error: "Ошибка удаления оборудования" });
    }
  });

  // ============================================================================
  // MATERIALS
  // ============================================================================
  
  app.get("/api/admin/materials", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const allMaterials = await database.select().from(materials).orderBy(materials.id);
      res.json(allMaterials);
    } catch (error) {
      console.error("[Admin] Failed to fetch materials:", error);
      res.status(500).json({ error: "Ошибка получения материалов" });
    }
  });

  app.post("/api/admin/materials", requireAdmin, async (req: Request, res: Response) => {
    try {
      const materialData = req.body;

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const [newMaterial] = await database.insert(materials).values(materialData).returning();

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "material_created", "material", newMaterial.id, materialData);

      res.json(newMaterial);
    } catch (error) {
      console.error("[Admin] Failed to create material:", error);
      res.status(500).json({ error: "Ошибка создания материала" });
    }
  });

  app.put("/api/admin/materials/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const materialId = parseInt(req.params.id);
      const updateData = req.body;

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await database.update(materials).set(updateData).where(eq(materials.id, materialId));

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "material_updated", "material", materialId, updateData);

      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update material:", error);
      res.status(500).json({ error: "Ошибка обновления материала" });
    }
  });

  app.delete("/api/admin/materials/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const materialId = parseInt(req.params.id);

      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      await database.delete(materials).where(eq(materials.id, materialId));

      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "material_deleted", "material", materialId, {});

      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete material:", error);
      res.status(500).json({ error: "Ошибка удаления материала" });
    }
  });

  // ============================================================================
  // ADMIN LOGS
  // ============================================================================
  
  app.get("/api/admin/logs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const logs = await database.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(1000);
      res.json(logs);
    } catch (error) {
      console.error("[Admin] Failed to fetch logs:", error);
      res.status(500).json({ error: "Ошибка получения логов" });
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
        .orderBy(desc(bookings.createdAt));
      res.json(allBookings);
    } catch (error) {
      console.error("[Admin] Failed to fetch bookings:", error);
      res.status(500).json({ error: "Ошибка получения бронирований" });
    }
  });

  app.put("/api/admin/bookings/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const id = parseInt(req.params.id);
      const adminUser = (req as any).user;
      
      const [updated] = await database
        .update(bookings)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Бронирование не найдено" });
        return;
      }

      await logAdminAction(database, adminUser.id, "update", "booking", id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("[Admin] Failed to update booking:", error);
      res.status(500).json({ error: "Ошибка обновления бронирования" });
    }
  });

  app.delete("/api/admin/bookings/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const id = parseInt(req.params.id);
      const adminUser = (req as any).user;
      
      const [deleted] = await database
        .delete(bookings)
        .where(eq(bookings.id, id))
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Бронирование не найдено" });
        return;
      }

      await logAdminAction(database, adminUser.id, "delete", "booking", id, {});
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete booking:", error);
      res.status(500).json({ error: "Ошибка удаления бронирования" });
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
        .set({ status: status as any, updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
      
      const adminUser = (req as any).user;
      await logAdminAction(database, adminUser.id, "update", "booking", bookingId, { status });
      
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update booking status:", error);
      res.status(500).json({ error: "Ошибка обновления статуса" });
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
        .set({ paymentStatus: paymentStatus as any, updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
      
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

      const allReviews = await database
        .select()
        .from(reviews)
        .orderBy(desc(reviews.createdAt));
      res.json(allReviews);
    } catch (error) {
      console.error("[Admin] Failed to fetch reviews:", error);
      res.status(500).json({ error: "Ошибка получения отзывов" });
    }
  });

  app.put("/api/admin/reviews/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const id = parseInt(req.params.id);
      const adminUser = (req as any).user;
      
      const [updated] = await database
        .update(reviews)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Отзыв не найден" });
        return;
      }

      await logAdminAction(database, adminUser.id, "update", "review", id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("[Admin] Failed to update review:", error);
      res.status(500).json({ error: "Ошибка обновления отзыва" });
    }
  });

  app.delete("/api/admin/reviews/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const id = parseInt(req.params.id);
      const adminUser = (req as any).user;
      
      const [deleted] = await database
        .delete(reviews)
        .where(eq(reviews.id, id))
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Отзыв не найден" });
        return;
      }

      await logAdminAction(database, adminUser.id, "delete", "review", id, {});
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete review:", error);
      res.status(500).json({ error: "Ошибка удаления отзыва" });
    }
  });

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  app.get("/api/admin/transactions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const database = await db.getDb();
      if (!database) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const allTransactions = await database
        .select()
        .from(transactions)
        .orderBy(desc(transactions.createdAt));
      res.json(allTransactions);
    } catch (error) {
      console.error("[Admin] Failed to fetch transactions:", error);
      res.status(500).json({ error: "Ошибка получения транзакций" });
    }
  });

  // Additional CRUD endpoints for other tables can be added similarly
}
