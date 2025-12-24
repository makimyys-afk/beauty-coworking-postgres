import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, numeric } from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

// Existing enums
export const roleEnum = pgEnum("role", ["user", "admin", "specialist"]);
export const statusEnum = pgEnum("status", ["bronze", "silver", "gold"]);
export const workspaceTypeEnum = pgEnum("workspace_type", ["hairdresser", "makeup", "manicure", "cosmetology", "massage"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled", "completed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["payment", "refund", "deposit", "withdrawal"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed"]);
export const operationEnum = pgEnum("operation", ["SELECT", "INSERT", "UPDATE", "DELETE", "OTHER"]);

// New enums for extended tables
export const membershipStatusEnum = pgEnum("membership_status", ["active", "inactive", "suspended", "pending"]);
export const billingIncrementEnum = pgEnum("billing_increment", ["hourly", "daily", "weekly", "monthly", "quarterly", "yearly"]);
export const maintenanceStatusEnum = pgEnum("maintenance_status", ["operational", "maintenance", "broken", "retired"]);
export const contractStatusEnum = pgEnum("contract_status", ["active", "expired", "terminated", "pending"]);
export const passTypeEnum = pgEnum("pass_type", ["temporary", "permanent", "visitor"]);
export const accessLevelEnum = pgEnum("access_level", ["basic", "standard", "premium", "vip"]);
export const passStatusEnum = pgEnum("pass_status", ["active", "expired", "revoked"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["card", "cash", "transfer", "online", "qr_code"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const issueTypeEnum = pgEnum("issue_type", ["breakdown", "scheduled", "replacement", "adjustment", "cleaning"]);
export const requestStatusEnum = pgEnum("request_status", ["open", "in_progress", "resolved", "closed"]);
export const staffStatusEnum = pgEnum("staff_status", ["active", "on_leave", "terminated"]);
export const incidentSeverityEnum = pgEnum("incident_severity", ["minor", "moderate", "major", "critical"]);
export const incidentStatusEnum = pgEnum("incident_status", ["reported", "investigating", "resolved", "closed"]);
export const notificationTypeEnum = pgEnum("notification_type", ["booking", "payment", "maintenance", "promotion", "system"]);
export const notificationPriorityEnum = pgEnum("notification_priority", ["low", "normal", "high"]);
export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);
export const targetAudienceEnum = pgEnum("target_audience", ["all", "new_clients", "specialists", "vip"]);
export const dayOfWeekEnum = pgEnum("day_of_week", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
export const scheduleStatusEnum = pgEnum("schedule_status", ["active", "cancelled"]);
export const occupancyStatusEnum = pgEnum("occupancy_status", ["available", "occupied", "reserved", "maintenance"]);

// Extended admin action enum
export const adminActionEnum = pgEnum("admin_action", [
  "user_created", "user_updated", "user_deleted",
  "workspace_created", "workspace_updated", "workspace_deleted",
  "booking_created", "booking_updated", "booking_deleted",
  "review_updated", "review_deleted",
  "tariff_created", "tariff_updated", "tariff_deleted",
  "equipment_created", "equipment_updated", "equipment_deleted",
  "material_created", "material_updated", "material_deleted",
  "contract_created", "contract_updated", "contract_deleted",
  "pass_created", "pass_updated", "pass_deleted",
  "service_created", "service_updated", "service_deleted",
  "invoice_created", "invoice_updated", "invoice_deleted",
  "payment_created", "payment_updated", "payment_deleted",
  "maintenance_created", "maintenance_updated", "maintenance_deleted",
  "staff_created", "staff_updated", "staff_deleted",
  "report_created", "report_updated", "report_deleted",
  "incident_created", "incident_updated", "incident_deleted",
  "notification_created", "notification_updated", "notification_deleted",
  "promotion_created", "promotion_updated", "promotion_deleted",
  "schedule_created", "schedule_updated", "schedule_deleted",
]);

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * Users - пользователи системы (клиенты, специалисты, администраторы)
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  name: text("name"), // полное имя для обратной совместимости
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  specialization: varchar("specialization", { length: 100 }),
  birthDate: timestamp("birthDate"),
  taxID: varchar("taxID", { length: 20 }), // ИНН для специалистов
  avatar: text("avatar"),
  bio: text("bio"),
  membershipStatus: membershipStatusEnum("membershipStatus").default("pending"),
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
  identifier: varchar("identifier", { length: 50 }).unique(), // уникальный код (WP-0001)
  description: text("description"),
  type: workspaceTypeEnum("type").notNull(),
  floorLevel: integer("floorLevel"), // этаж
  maxCapacity: integer("maxCapacity").default(1), // максимальная вместимость
  pricePerHour: numeric("pricePerHour", { precision: 10, scale: 2 }).notNull(),
  pricePerDay: numeric("pricePerDay", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  amenities: text("amenities"), // JSON array of amenities
  equipment: text("equipment"), // JSON array of equipment
  isAvailable: boolean("isAvailable").default(true).notNull(),
  occupancyStatus: occupancyStatusEnum("occupancyStatus").default("available"),
  rating: numeric("rating", { precision: 3, scale: 1 }).default('0'),
  reviewCount: integer("reviewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

/**
 * Tariffs - тарифные планы для аренды
 */
export const tariffs = pgTable("tariffs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("RUB").notNull(),
  billingIncrement: billingIncrementEnum("billingIncrement").notNull(),
  validFrom: timestamp("validFrom"),
  validThrough: timestamp("validThrough"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Tariff = typeof tariffs.$inferSelect;
export type InsertTariff = typeof tariffs.$inferInsert;

/**
 * Equipment - оборудование в коворкинге
 */
export const equipment = pgTable("equipment", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 200 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serialNumber", { length: 100 }).unique(),
  category: varchar("category", { length: 100 }),
  workspaceId: integer("workspaceId"),
  purchaseDate: timestamp("purchaseDate"),
  warrantyExpiry: timestamp("warrantyExpiry"),
  maintenanceStatus: maintenanceStatusEnum("maintenanceStatus").default("operational"),
  lastMaintenanceDate: timestamp("lastMaintenanceDate"),
  location: varchar("location", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;

/**
 * Materials - расходные материалы и косметика
 */
export const materials = pgTable("materials", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 200 }).notNull(),
  sku: varchar("sku", { length: 100 }).unique(),
  category: varchar("category", { length: 100 }),
  quantityInStock: integer("quantityInStock").default(0),
  unitOfMeasurement: varchar("unitOfMeasurement", { length: 50 }),
  pricePerUnit: numeric("pricePerUnit", { precision: 10, scale: 2 }),
  supplier: varchar("supplier", { length: 200 }),
  reorderLevel: integer("reorderLevel").default(0),
  lastRestocked: timestamp("lastRestocked"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

/**
 * Bookings - бронирования рабочих мест
 */
export const bookings = pgTable("bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bookingNumber: varchar("bookingNumber", { length: 50 }).unique(),
  workspaceId: integer("workspaceId").notNull(),
  userId: integer("userId").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  totalPrice: numeric("totalPrice", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  notes: text("notes"),
  qrCode: varchar("qrCode", { length: 100 }),
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
  response: text("response"), // ответ администрации
  isVerified: boolean("isVerified").default(false),
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
  transactionNumber: varchar("transactionNumber", { length: 50 }).unique(),
  userId: integer("userId").notNull(),
  bookingId: integer("bookingId"),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("RUB").notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  paymentMethod: paymentMethodEnum("paymentMethod"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Contracts - контракты со специалистами
 */
export const contracts = pgTable("contracts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  contractNumber: varchar("contractNumber", { length: 50 }).unique().notNull(),
  specialistId: integer("specialistId").notNull(),
  tariffId: integer("tariffId"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  status: contractStatusEnum("status").default("pending").notNull(),
  monthlyFee: numeric("monthlyFee", { precision: 10, scale: 2 }),
  deposit: numeric("deposit", { precision: 10, scale: 2 }),
  terms: text("terms"),
  signedAt: timestamp("signedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * AccessPasses - пропуска для доступа в коворкинг
 */
export const accessPasses = pgTable("accessPasses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  passNumber: varchar("passNumber", { length: 50 }).unique().notNull(),
  userId: integer("userId").notNull(),
  contractId: integer("contractId"),
  passType: passTypeEnum("passType").notNull(),
  validFrom: timestamp("validFrom").notNull(),
  validThrough: timestamp("validThrough"),
  accessLevel: accessLevelEnum("accessLevel").default("basic").notNull(),
  status: passStatusEnum("status").default("active").notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AccessPass = typeof accessPasses.$inferSelect;
export type InsertAccessPass = typeof accessPasses.$inferInsert;

/**
 * ServiceRecords - записи об оказанных услугах специалистами
 */
export const serviceRecords = pgTable("serviceRecords", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  recordNumber: varchar("recordNumber", { length: 50 }).unique().notNull(),
  specialistId: integer("specialistId").notNull(),
  clientName: varchar("clientName", { length: 200 }),
  clientPhone: varchar("clientPhone", { length: 20 }),
  serviceType: varchar("serviceType", { length: 100 }).notNull(),
  workspaceId: integer("workspaceId"),
  serviceDate: timestamp("serviceDate").notNull(),
  duration: integer("duration"), // в минутах
  revenue: numeric("revenue", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ServiceRecord = typeof serviceRecords.$inferSelect;
export type InsertServiceRecord = typeof serviceRecords.$inferInsert;

/**
 * Invoices - счета на оплату
 */
export const invoices = pgTable("invoices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).unique().notNull(),
  userId: integer("userId").notNull(),
  bookingId: integer("bookingId"),
  contractId: integer("contractId"),
  issueDate: timestamp("issueDate").defaultNow().notNull(),
  dueDate: timestamp("dueDate"),
  totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric("taxAmount", { precision: 10, scale: 2 }).default('0'),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Payments - платежи по счетам
 */
export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  paymentNumber: varchar("paymentNumber", { length: 50 }).unique().notNull(),
  invoiceId: integer("invoiceId"),
  userId: integer("userId").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("RUB").notNull(),
  paymentMethod: paymentMethodEnum("paymentMethod").notNull(),
  paymentDate: timestamp("paymentDate").defaultNow().notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  transactionId: varchar("transactionId", { length: 100 }),
  receiptUrl: text("receiptUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * MaintenanceRequests - заявки на техническое обслуживание
 */
export const maintenanceRequests = pgTable("maintenanceRequests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requestNumber: varchar("requestNumber", { length: 50 }).unique().notNull(),
  equipmentId: integer("equipmentId"),
  workspaceId: integer("workspaceId"),
  reportedBy: integer("reportedBy").notNull(),
  issueType: issueTypeEnum("issueType").notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  description: text("description").notNull(),
  status: requestStatusEnum("status").default("open").notNull(),
  assignedTo: integer("assignedTo"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = typeof maintenanceRequests.$inferInsert;

/**
 * Staff - персонал коворкинга
 */
export const staff = pgTable("staff", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 20 }),
  position: varchar("position", { length: 100 }).notNull(),
  department: varchar("department", { length: 100 }),
  hireDate: timestamp("hireDate").notNull(),
  salary: numeric("salary", { precision: 10, scale: 2 }),
  status: staffStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;

/**
 * FinancialReports - финансовые отчеты
 */
export const financialReports = pgTable("financialReports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reportNumber: varchar("reportNumber", { length: 50 }).unique().notNull(),
  reportType: varchar("reportType", { length: 100 }).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  totalRevenue: numeric("totalRevenue", { precision: 12, scale: 2 }).default('0'),
  totalExpenses: numeric("totalExpenses", { precision: 12, scale: 2 }).default('0'),
  netProfit: numeric("netProfit", { precision: 12, scale: 2 }).default('0'),
  occupancyRate: numeric("occupancyRate", { precision: 5, scale: 2 }),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  generatedBy: integer("generatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = typeof financialReports.$inferInsert;

/**
 * IncidentRegistry - реестр инцидентов и происшествий
 */
export const incidentRegistry = pgTable("incidentRegistry", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  incidentNumber: varchar("incidentNumber", { length: 50 }).unique().notNull(),
  incidentType: varchar("incidentType", { length: 100 }).notNull(),
  severity: incidentSeverityEnum("severity").notNull(),
  workspaceId: integer("workspaceId"),
  reportedBy: integer("reportedBy").notNull(),
  description: text("description").notNull(),
  actionTaken: text("actionTaken"),
  status: incidentStatusEnum("status").default("reported").notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  witnesses: integer("witnesses").default(0),
  damageEstimate: numeric("damageEstimate", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type IncidentRegistry = typeof incidentRegistry.$inferSelect;
export type InsertIncidentRegistry = typeof incidentRegistry.$inferInsert;

/**
 * Notifications - уведомления для пользователей
 */
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  priority: notificationPriorityEnum("priority").default("normal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Promotions - акции и специальные предложения
 */
export const promotions = pgTable("promotions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  discountType: discountTypeEnum("discountType").notNull(),
  discountValue: numeric("discountValue", { precision: 10, scale: 2 }).notNull(),
  code: varchar("code", { length: 50 }).unique(),
  validFrom: timestamp("validFrom").notNull(),
  validThrough: timestamp("validThrough").notNull(),
  maxUses: integer("maxUses"),
  currentUses: integer("currentUses").default(0),
  targetAudience: targetAudienceEnum("targetAudience").default("all").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = typeof promotions.$inferInsert;

/**
 * WorkSchedule - график работы специалистов
 */
export const workSchedule = pgTable("workSchedule", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  specialistId: integer("specialistId").notNull(),
  workspaceId: integer("workspaceId"),
  dayOfWeek: dayOfWeekEnum("dayOfWeek").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM
  endTime: varchar("endTime", { length: 5 }).notNull(), // HH:MM
  isRecurring: boolean("isRecurring").default(true).notNull(),
  effectiveDate: timestamp("effectiveDate"),
  expiryDate: timestamp("expiryDate"),
  status: scheduleStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WorkSchedule = typeof workSchedule.$inferSelect;
export type InsertWorkSchedule = typeof workSchedule.$inferInsert;

// ============================================================================
// LOGGING TABLES
// ============================================================================

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

/**
 * Admin Activity Logs - логи действий администратора
 */
export const adminLogs = pgTable("adminLogs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  adminId: integer("adminId").notNull(), // ID администратора
  action: adminActionEnum("action").notNull(), // тип действия
  entityType: varchar("entityType", { length: 50 }).notNull(), // user, workspace, booking, review, etc.
  entityId: integer("entityId"), // ID сущности
  details: text("details"), // JSON с деталями действия
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;
