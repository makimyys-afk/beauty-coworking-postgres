import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { loginWithPassword } from "./simpleAuth";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) throw new Error("Не авторизован");
      return ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return loginWithPassword(input.email, input.password, ctx.res);
      }),
  }),

  // Workspaces - рабочие места
  workspaces: router({
    getAll: publicProcedure.query(async ({ ctx }) => {
      return db.getAllWorkspaces(ctx.user?.id);
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getWorkspaceById(input.id, ctx.user?.id);
      }),
  }),

  // Bookings - бронирования
  bookings: router({
    getUserBookings: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Не авторизован");
      return db.getUserBookings(ctx.user.id);
    }),

    getOccupiedSlots: publicProcedure
      .input(z.object({
        workspaceId: z.number(),
        date: z.string(), // Format: YYYY-MM-DD
      }))
      .query(async ({ input }) => {
        return db.getOccupiedTimeSlots(input.workspaceId, input.date);
      }),

    create: publicProcedure
      .input(z.object({
        workspaceId: z.number(),
        startTime: z.coerce.date(),
        endTime: z.coerce.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Не авторизован");
        const userId = ctx.user.id;
        
        // Вычисляем стоимость
        const workspace = await db.getWorkspaceById(input.workspaceId, userId);
        if (!workspace) {
          throw new Error("Рабочее место не найдено");
        }
        const hours = Math.ceil((input.endTime.getTime() - input.startTime.getTime()) / (1000 * 60 * 60));
        const totalPrice = workspace.pricePerHour * hours;
        
        // Проверяем достаточность средств
        const balance = await db.getUserBalance(userId);
        if (balance < totalPrice) {
          throw new Error(`Недостаточно средств. Баланс: ${balance}₽, требуется: ${totalPrice}₽`);
        }
        
        // Создаем бронирование
        const booking = await db.createBooking({
          workspaceId: input.workspaceId,
          userId: userId,
          startTime: input.startTime,
          endTime: input.endTime,
          totalPrice,
          notes: input.notes,
          status: "confirmed",
          paymentStatus: "paid",
        }, userId);
        
        // Автоматически создаем транзакцию оплаты
        await db.createTransaction({
          userId: userId,
          type: "payment",
          amount: -booking.finalPrice,
          description: `Оплата бронирования #${booking.id}`,
          status: "completed",
        }, userId);
        
        return { id: booking.id, totalPrice: booking.finalPrice };
      }),

    updateStatus: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Не авторизован");
        await db.updateBookingStatus(input.bookingId, input.status, ctx.user.id);
        return { success: true };
      }),

    // Отмена бронирования
    cancelBooking: publicProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Не авторизован");
        const userId = ctx.user.id;
        
        // Получаем бронирование
        const booking = await db.getBookingById(input.bookingId, userId);
        if (!booking) {
          throw new Error("Бронирование не найдено");
        }
        
        if (booking.userId !== userId) {
          throw new Error("Нет доступа к этому бронированию");
        }
        
        if (booking.status === 'completed' || booking.status === 'cancelled') {
          throw new Error("Невозможно отменить это бронирование");
        }
        
        // Обновляем статус на cancelled
        await db.updateBookingStatus(input.bookingId, 'cancelled', userId);
        
        // Возвращаем средства если было оплачено
        if (booking.paymentStatus === 'paid') {
          const refundAmount = booking.totalPrice;
          await db.createTransaction({
            userId: userId,
            type: 'refund',
            amount: refundAmount,
            description: `Возврат за отмену бронирования #${booking.id}`,
            status: 'completed',
          }, userId);
        }
        
        return { success: true, refunded: booking.paymentStatus === 'paid' };
      }),

    // Перенос бронирования
    rescheduleBooking: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        startTime: z.coerce.date(),
        endTime: z.coerce.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Не авторизован");
        const userId = ctx.user.id;
        
        // Получаем бронирование
        const booking = await db.getBookingById(input.bookingId, userId);
        if (!booking) {
          throw new Error("Бронирование не найдено");
        }
        
        if (booking.userId !== userId) {
          throw new Error("Нет доступа к этому бронированию");
        }
        
        if (booking.status !== 'confirmed' && booking.status !== 'pending') {
          throw new Error("Можно перенести только подтвержденные или ожидающие бронирования");
        }
        
        // Проверяем, что новое время в будущем
        if (input.startTime < new Date()) {
          throw new Error("Нельзя перенести на прошедшую дату");
        }
        
        // Проверяем, что время окончания позже времени начала
        if (input.endTime <= input.startTime) {
          throw new Error("Время окончания должно быть позже времени начала");
        }
        
        // Обновляем время бронирования
        await db.updateBookingTime(input.bookingId, input.startTime, input.endTime, userId);
        
        return { success: true };
      }),
  }),

  // Reviews - отзывы
  reviews: router({
    getByWorkspace: publicProcedure
      .input(z.object({ workspaceId: z.number() }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id || 0;
        return db.getWorkspaceReviews(input.workspaceId, userId);
      }),

    create: publicProcedure
      .input(z.object({
        workspaceId: z.number(),
        bookingId: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Не авторизован");
        const userId = ctx.user.id;
        
        const reviewId = await db.createReview({
          workspaceId: input.workspaceId,
          userId: userId,
          bookingId: input.bookingId,
          rating: input.rating,
          comment: input.comment,
        }, userId);
        return { id: reviewId };
      }),
  }),

  // Transactions - транзакции
  transactions: router({
    getUserTransactions: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Не авторизован");
      return db.getUserTransactions(ctx.user.id);
    }),

    getUserBalance: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Не авторизован");
      return db.getUserBalance(ctx.user.id);
    }),

    create: publicProcedure
      .input(z.object({
        type: z.enum(["deposit", "payment", "refund", "withdrawal"]),
        amount: z.number(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Не авторизован");
        const userId = ctx.user.id;
        
        const transactionId = await db.createTransaction({
          userId: userId,
          type: input.type,
          amount: input.amount,
          status: "completed",
          description: input.description,
        }, userId);
        return { id: transactionId };
      }),
  }),

  // Stats - статистика
  stats: router({
    getUserStats: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Не авторизован");
      return db.getUserStats(ctx.user.id);
    }),
  }),

  // Logs - логи SQL запросов
  logs: router({
    getSqlLogs: publicProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input, ctx }) => {
        return db.getSqlLogs(input.limit, ctx.user?.id);
      }),
  }),

  // Users - пользователи
  users: router({
    getProfile: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Не авторизован");
      return db.getUserProfile(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
