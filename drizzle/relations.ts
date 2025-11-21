import { relations } from "drizzle-orm";
import {
  users,
  workspaces,
  bookings,
  reviews,
  transactions,
  tariffs,
  equipment,
  materials,
  contracts,
  accessPasses,
  serviceRecords,
  invoices,
  payments,
  maintenanceRequests,
  staff,
  financialReports,
  incidentRegistry,
  notifications,
  promotions,
  workSchedule,
  sqlLogs,
  adminLogs,
} from "./schema";

// ============================================================================
// USER RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
  transactions: many(transactions),
  contracts: many(contracts),
  accessPasses: many(accessPasses),
  serviceRecords: many(serviceRecords),
  invoices: many(invoices),
  payments: many(payments),
  maintenanceRequests: many(maintenanceRequests),
  notifications: many(notifications),
  workSchedule: many(workSchedule),
  reportedIncidents: many(incidentRegistry),
  generatedReports: many(financialReports),
  adminLogs: many(adminLogs),
  sqlLogs: many(sqlLogs),
}));

// ============================================================================
// WORKSPACE RELATIONS
// ============================================================================

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
  equipment: many(equipment),
  serviceRecords: many(serviceRecords),
  maintenanceRequests: many(maintenanceRequests),
  incidents: many(incidentRegistry),
  workSchedule: many(workSchedule),
}));

// ============================================================================
// BOOKING RELATIONS
// ============================================================================

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [bookings.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  reviews: many(reviews),
  transactions: many(transactions),
  invoices: many(invoices),
}));

// ============================================================================
// REVIEW RELATIONS
// ============================================================================

export const reviewsRelations = relations(reviews, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [reviews.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
}));

// ============================================================================
// TRANSACTION RELATIONS
// ============================================================================

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [transactions.bookingId],
    references: [bookings.id],
  }),
}));

// ============================================================================
// TARIFF RELATIONS
// ============================================================================

export const tariffsRelations = relations(tariffs, ({ many }) => ({
  contracts: many(contracts),
}));

// ============================================================================
// EQUIPMENT RELATIONS
// ============================================================================

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [equipment.workspaceId],
    references: [workspaces.id],
  }),
  maintenanceRequests: many(maintenanceRequests),
}));

// ============================================================================
// CONTRACT RELATIONS
// ============================================================================

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  specialist: one(users, {
    fields: [contracts.specialistId],
    references: [users.id],
  }),
  tariff: one(tariffs, {
    fields: [contracts.tariffId],
    references: [tariffs.id],
  }),
  accessPasses: many(accessPasses),
  invoices: many(invoices),
}));

// ============================================================================
// ACCESS PASS RELATIONS
// ============================================================================

export const accessPassesRelations = relations(accessPasses, ({ one }) => ({
  user: one(users, {
    fields: [accessPasses.userId],
    references: [users.id],
  }),
  contract: one(contracts, {
    fields: [accessPasses.contractId],
    references: [contracts.id],
  }),
}));

// ============================================================================
// SERVICE RECORD RELATIONS
// ============================================================================

export const serviceRecordsRelations = relations(serviceRecords, ({ one }) => ({
  specialist: one(users, {
    fields: [serviceRecords.specialistId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [serviceRecords.workspaceId],
    references: [workspaces.id],
  }),
}));

// ============================================================================
// INVOICE RELATIONS
// ============================================================================

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [invoices.bookingId],
    references: [bookings.id],
  }),
  contract: one(contracts, {
    fields: [invoices.contractId],
    references: [contracts.id],
  }),
  payments: many(payments),
}));

// ============================================================================
// PAYMENT RELATIONS
// ============================================================================

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// MAINTENANCE REQUEST RELATIONS
// ============================================================================

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  equipment: one(equipment, {
    fields: [maintenanceRequests.equipmentId],
    references: [equipment.id],
  }),
  workspace: one(workspaces, {
    fields: [maintenanceRequests.workspaceId],
    references: [workspaces.id],
  }),
  reporter: one(users, {
    fields: [maintenanceRequests.reportedBy],
    references: [users.id],
  }),
  assignee: one(staff, {
    fields: [maintenanceRequests.assignedTo],
    references: [staff.id],
  }),
}));

// ============================================================================
// STAFF RELATIONS
// ============================================================================

export const staffRelations = relations(staff, ({ many }) => ({
  assignedMaintenanceRequests: many(maintenanceRequests),
}));

// ============================================================================
// FINANCIAL REPORT RELATIONS
// ============================================================================

export const financialReportsRelations = relations(financialReports, ({ one }) => ({
  generator: one(users, {
    fields: [financialReports.generatedBy],
    references: [users.id],
  }),
}));

// ============================================================================
// INCIDENT REGISTRY RELATIONS
// ============================================================================

export const incidentRegistryRelations = relations(incidentRegistry, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [incidentRegistry.workspaceId],
    references: [workspaces.id],
  }),
  reporter: one(users, {
    fields: [incidentRegistry.reportedBy],
    references: [users.id],
  }),
}));

// ============================================================================
// NOTIFICATION RELATIONS
// ============================================================================

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// WORK SCHEDULE RELATIONS
// ============================================================================

export const workScheduleRelations = relations(workSchedule, ({ one }) => ({
  specialist: one(users, {
    fields: [workSchedule.specialistId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [workSchedule.workspaceId],
    references: [workspaces.id],
  }),
}));

// ============================================================================
// SQL LOG RELATIONS
// ============================================================================

export const sqlLogsRelations = relations(sqlLogs, ({ one }) => ({
  user: one(users, {
    fields: [sqlLogs.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// ADMIN LOG RELATIONS
// ============================================================================

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  admin: one(users, {
    fields: [adminLogs.adminId],
    references: [users.id],
  }),
}));
