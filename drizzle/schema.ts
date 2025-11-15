import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, numeric } from "drizzle-orm/pg-core";

// Define enums for PostgreSQL
export const roleEnum = pgEnum("role", ["user", "admin", "specialist"]);
export const statusEnum = pgEnum("status", ["bronze", "silver", "gold"]);
export const workspaceTypeEnum = pgEnum("workspace_type", ["hairdresser", "makeup", "manicure", "cosmetology", "massage"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled", "completed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["payment", "refund", "deposit", "withdrawal"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed"]);
export const operationEnum = pgEnum("operation", ["SELECT", "INSERT", "UPDATE", "DELETE", "OTHER"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  phone: varchar("phone", { length: 20 }),
  avatar: text("avatar"),
  bio: text("bio"),
  specialization: varchar("specialization", { length: 100 }),
  points: integer("points").default(0),
  status: statusEnum("status").default("bronze"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Workspaces - рабочие места в коворкинге
 */
export const workspaces = pgTable("workspaces", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: workspaceTypeEnum("type").notNull(),
  pricePerHour: integer("pricePerHour").notNull(), // цена в рублях
  pricePerDay: integer("pricePerDay").notNull(), // цена в рублях
  imageUrl: text("imageUrl"),
  amenities: text("amenities"), // JSON array of amenities
  isAvailable: boolean("isAvailable").default(true).notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).default('0'), // рейтинг от 0 до 5 с одним знаком после запятой
  reviewCount: integer("reviewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

/**
 * Bookings - бронирования рабочих мест
 */
export const bookings = pgTable("bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  workspaceId: integer("workspaceId").notNull(),
  userId: integer("userId").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  totalPrice: integer("totalPrice").notNull(), // цена в рублях
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Reviews - отзывы о рабочих местах
 */
export const reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  workspaceId: integer("workspaceId").notNull(),
  userId: integer("userId").notNull(),
  bookingId: integer("bookingId"),
  rating: integer("rating").notNull(), // 1-5 звезд
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Transactions - финансовые транзакции
 */
export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  bookingId: integer("bookingId"),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(), // сумма в рублях
  status: transactionStatusEnum("status").default("pending").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * SQL Query Logs - логи SQL запросов
 */
export const sqlLogs = pgTable("sqlLogs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  query: text("query").notNull(),
  operation: operationEnum("operation").notNull(),
  executionTime: integer("executionTime"), // время выполнения в миллисекундах
  userId: integer("userId"),
  endpoint: varchar("endpoint", { length: 255 }),
  params: text("params"), // JSON string of parameters
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SqlLog = typeof sqlLogs.$inferSelect;
export type InsertSqlLog = typeof sqlLogs.$inferInsert;
