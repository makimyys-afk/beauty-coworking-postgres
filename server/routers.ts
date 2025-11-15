import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Mock user для автоматического входа
const MOCK_USER_ID = 1;

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(() => ({
      id: MOCK_USER_ID,
      openId: "mock-orlova-maria",
      name: "Орлова Мария",
      email: "orlova.maria@example.com",
      role: "user" as const,
    })),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Workspaces - рабочие места
  workspaces: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllWorkspaces(MOCK_USER_ID);
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getWorkspaceById(input.id, MOCK_USER_ID);
      }),
  }),

  // Bookings - бронирования
  bookings: router({
    getUserBookings: publicProcedure.query(async () => {
      return db.getUserBookings(MOCK_USER_ID);
    }),

    create: publicProcedure
      .input(z.object({
        workspaceId: z.number(),
        startTime: z.coerce.date(),
        endTime: z.coerce.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Вычисляем стоимость
        const workspace = await db.getWorkspaceById(input.workspaceId, MOCK_USER_ID);
        if (!workspace) {
          throw new Error("Workspace not found");
        }

        const hours = Math.ceil((input.endTime.getTime() - input.startTime.getTime()) / (1000 * 60 * 60));
        const totalPrice = workspace.pricePerHour * hours;

        // Проверяем достаточность средств
        const balance = await db.getUserBalance(MOCK_USER_ID);
        if (balance < totalPrice) {
          throw new Error(`Недостаточно средств. Баланс: ${balance}₽, требуется: ${totalPrice}₽`);
        }

        // Создаем бронирование
        const bookingId = await db.createBooking({
          workspaceId: input.workspaceId,
          userId: MOCK_USER_ID,
          startTime: input.startTime,
          endTime: input.endTime,
          totalPrice,
          notes: input.notes,
          status: "confirmed",
          paymentStatus: "paid",
        }, MOCK_USER_ID);

        // Автоматически создаем транзакцию оплаты
        await db.createTransaction({
          userId: MOCK_USER_ID,
          type: "payment",
          amount: -totalPrice,
          description: `Оплата бронирования #${bookingId}`,
          status: "completed",
        }, MOCK_USER_ID);

        return { id: bookingId, totalPrice };
      }),

    updateStatus: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateBookingStatus(input.bookingId, input.status, MOCK_USER_ID);
        return { success: true };
      }),
  }),

  // Reviews - отзывы
  reviews: router({
    getByWorkspace: publicProcedure
      .input(z.object({ workspaceId: z.number() }))
      .query(async ({ input }) => {
        return db.getWorkspaceReviews(input.workspaceId, MOCK_USER_ID);
      }),

    create: publicProcedure
      .input(z.object({
        workspaceId: z.number(),
        bookingId: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const reviewId = await db.createReview({
          workspaceId: input.workspaceId,
          userId: MOCK_USER_ID,
          bookingId: input.bookingId,
          rating: input.rating,
          comment: input.comment,
        }, MOCK_USER_ID);

        return { id: reviewId };
      }),
  }),

  // Transactions - транзакции
  transactions: router({
    getUserTransactions: publicProcedure.query(async () => {
      return db.getUserTransactions(MOCK_USER_ID);
    }),

    getUserBalance: publicProcedure.query(async () => {
      return db.getUserBalance(MOCK_USER_ID);
    }),

    create: publicProcedure
      .input(z.object({
        type: z.enum(["deposit", "payment", "refund", "withdrawal"]),
        amount: z.number(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const transactionId = await db.createTransaction({
          userId: MOCK_USER_ID,
          type: input.type,
          amount: input.amount,
          status: "completed",
          description: input.description,
        }, MOCK_USER_ID);

        return { id: transactionId };
      }),
  }),

  // Stats - статистика
  stats: router({
    getUserStats: publicProcedure.query(async () => {
      return db.getUserStats(MOCK_USER_ID);
    }),
  }),

  // Logs - логи SQL запросов
  logs: router({
    getSqlLogs: publicProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return db.getSqlLogs(input.limit, MOCK_USER_ID);
      }),
  }),

  // Users - пользователи
  users: router({
    getProfile: publicProcedure.query(async () => {
      return db.getUserProfile(MOCK_USER_ID);
    }),
  }),
});

export type AppRouter = typeof appRouter;
