-- Migration: Add Extended Tables for Beauty Coworking
-- Date: 2024-11-21
-- Description: Adds 13 new tables and extends existing tables with additional fields

-- ============================================================================
-- CREATE NEW ENUMS
-- ============================================================================

CREATE TYPE "membership_status" AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE "billing_increment" AS ENUM ('hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE "maintenance_status" AS ENUM ('operational', 'maintenance', 'broken', 'retired');
CREATE TYPE "contract_status" AS ENUM ('active', 'expired', 'terminated', 'pending');
CREATE TYPE "pass_type" AS ENUM ('temporary', 'permanent', 'visitor');
CREATE TYPE "access_level" AS ENUM ('basic', 'standard', 'premium', 'vip');
CREATE TYPE "pass_status" AS ENUM ('active', 'expired', 'revoked');
CREATE TYPE "invoice_status" AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE "payment_method" AS ENUM ('card', 'cash', 'transfer', 'online', 'qr_code');
CREATE TYPE "priority" AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE "issue_type" AS ENUM ('breakdown', 'scheduled', 'replacement', 'adjustment', 'cleaning');
CREATE TYPE "request_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE "staff_status" AS ENUM ('active', 'on_leave', 'terminated');
CREATE TYPE "incident_severity" AS ENUM ('minor', 'moderate', 'major', 'critical');
CREATE TYPE "incident_status" AS ENUM ('reported', 'investigating', 'resolved', 'closed');
CREATE TYPE "notification_type" AS ENUM ('booking', 'payment', 'maintenance', 'promotion', 'system');
CREATE TYPE "notification_priority" AS ENUM ('low', 'normal', 'high');
CREATE TYPE "discount_type" AS ENUM ('percentage', 'fixed');
CREATE TYPE "target_audience" AS ENUM ('all', 'new_clients', 'specialists', 'vip');
CREATE TYPE "day_of_week" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
CREATE TYPE "schedule_status" AS ENUM ('active', 'cancelled');
CREATE TYPE "occupancy_status" AS ENUM ('available', 'occupied', 'reserved', 'maintenance');

-- ============================================================================
-- ALTER EXISTING TABLES
-- ============================================================================

-- Extend users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firstName" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastName" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "taxID" VARCHAR(20);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "membershipStatus" "membership_status" DEFAULT 'pending';

-- Extend workspaces table
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "identifier" VARCHAR(50) UNIQUE;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "floorLevel" INTEGER;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "maxCapacity" INTEGER DEFAULT 1;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "occupancyStatus" "occupancy_status" DEFAULT 'available';
ALTER TABLE "workspaces" ALTER COLUMN "pricePerHour" TYPE NUMERIC(10,2);
ALTER TABLE "workspaces" ALTER COLUMN "pricePerDay" TYPE NUMERIC(10,2);

-- Extend bookings table
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "bookingNumber" VARCHAR(50) UNIQUE;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "qrCode" VARCHAR(100);
ALTER TABLE "bookings" ALTER COLUMN "totalPrice" TYPE NUMERIC(10,2);

-- Extend reviews table
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "response" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false;

-- Extend transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "transactionNumber" VARCHAR(50) UNIQUE;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) DEFAULT 'RUB';
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "paymentMethod" "payment_method";
ALTER TABLE "transactions" ALTER COLUMN "amount" TYPE NUMERIC(10,2);

-- ============================================================================
-- CREATE NEW TABLES
-- ============================================================================

-- Tariffs
CREATE TABLE IF NOT EXISTS "tariffs" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "price" NUMERIC(10,2) NOT NULL,
  "currency" VARCHAR(3) DEFAULT 'RUB' NOT NULL,
  "billingIncrement" "billing_increment" NOT NULL,
  "validFrom" TIMESTAMP,
  "validThrough" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Equipment
CREATE TABLE IF NOT EXISTS "equipment" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" VARCHAR(200) NOT NULL,
  "brand" VARCHAR(100),
  "model" VARCHAR(100),
  "serialNumber" VARCHAR(100) UNIQUE,
  "category" VARCHAR(100),
  "workspaceId" INTEGER,
  "purchaseDate" TIMESTAMP,
  "warrantyExpiry" TIMESTAMP,
  "maintenanceStatus" "maintenance_status" DEFAULT 'operational',
  "lastMaintenanceDate" TIMESTAMP,
  "location" VARCHAR(200),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL
);

-- Materials
CREATE TABLE IF NOT EXISTS "materials" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" VARCHAR(200) NOT NULL,
  "sku" VARCHAR(100) UNIQUE,
  "category" VARCHAR(100),
  "quantityInStock" INTEGER DEFAULT 0,
  "unitOfMeasurement" VARCHAR(50),
  "pricePerUnit" NUMERIC(10,2),
  "supplier" VARCHAR(200),
  "reorderLevel" INTEGER DEFAULT 0,
  "lastRestocked" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Contracts
CREATE TABLE IF NOT EXISTS "contracts" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "contractNumber" VARCHAR(50) UNIQUE NOT NULL,
  "specialistId" INTEGER NOT NULL,
  "tariffId" INTEGER,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP,
  "status" "contract_status" DEFAULT 'pending' NOT NULL,
  "monthlyFee" NUMERIC(10,2),
  "deposit" NUMERIC(10,2),
  "terms" TEXT,
  "signedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("specialistId") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("tariffId") REFERENCES "tariffs"("id") ON DELETE SET NULL
);

-- Access Passes
CREATE TABLE IF NOT EXISTS "accessPasses" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "passNumber" VARCHAR(50) UNIQUE NOT NULL,
  "userId" INTEGER NOT NULL,
  "contractId" INTEGER,
  "passType" "pass_type" NOT NULL,
  "validFrom" TIMESTAMP NOT NULL,
  "validThrough" TIMESTAMP,
  "accessLevel" "access_level" DEFAULT 'basic' NOT NULL,
  "status" "pass_status" DEFAULT 'active' NOT NULL,
  "issuedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL
);

-- Service Records
CREATE TABLE IF NOT EXISTS "serviceRecords" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "recordNumber" VARCHAR(50) UNIQUE NOT NULL,
  "specialistId" INTEGER NOT NULL,
  "clientName" VARCHAR(200),
  "clientPhone" VARCHAR(20),
  "serviceType" VARCHAR(100) NOT NULL,
  "workspaceId" INTEGER,
  "serviceDate" TIMESTAMP NOT NULL,
  "duration" INTEGER,
  "revenue" NUMERIC(10,2),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("specialistId") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
  "userId" INTEGER NOT NULL,
  "bookingId" INTEGER,
  "contractId" INTEGER,
  "issueDate" TIMESTAMP DEFAULT NOW() NOT NULL,
  "dueDate" TIMESTAMP,
  "totalAmount" NUMERIC(10,2) NOT NULL,
  "taxAmount" NUMERIC(10,2) DEFAULT 0,
  "status" "invoice_status" DEFAULT 'draft' NOT NULL,
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL,
  FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL
);

-- Payments
CREATE TABLE IF NOT EXISTS "payments" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "paymentNumber" VARCHAR(50) UNIQUE NOT NULL,
  "invoiceId" INTEGER,
  "userId" INTEGER NOT NULL,
  "amount" NUMERIC(10,2) NOT NULL,
  "currency" VARCHAR(3) DEFAULT 'RUB' NOT NULL,
  "paymentMethod" "payment_method" NOT NULL,
  "paymentDate" TIMESTAMP DEFAULT NOW() NOT NULL,
  "status" "transaction_status" DEFAULT 'pending' NOT NULL,
  "transactionId" VARCHAR(100),
  "receiptUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Maintenance Requests
CREATE TABLE IF NOT EXISTS "maintenanceRequests" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "requestNumber" VARCHAR(50) UNIQUE NOT NULL,
  "equipmentId" INTEGER,
  "workspaceId" INTEGER,
  "reportedBy" INTEGER NOT NULL,
  "issueType" "issue_type" NOT NULL,
  "priority" "priority" DEFAULT 'medium' NOT NULL,
  "description" TEXT NOT NULL,
  "status" "request_status" DEFAULT 'open' NOT NULL,
  "assignedTo" INTEGER,
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE SET NULL,
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL,
  FOREIGN KEY ("reportedBy") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Staff
CREATE TABLE IF NOT EXISTS "staff" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "email" VARCHAR(320) UNIQUE,
  "phone" VARCHAR(20),
  "position" VARCHAR(100) NOT NULL,
  "department" VARCHAR(100),
  "hireDate" TIMESTAMP NOT NULL,
  "salary" NUMERIC(10,2),
  "status" "staff_status" DEFAULT 'active' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Financial Reports
CREATE TABLE IF NOT EXISTS "financialReports" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "reportNumber" VARCHAR(50) UNIQUE NOT NULL,
  "reportType" VARCHAR(100) NOT NULL,
  "periodStart" TIMESTAMP NOT NULL,
  "periodEnd" TIMESTAMP NOT NULL,
  "totalRevenue" NUMERIC(12,2) DEFAULT 0,
  "totalExpenses" NUMERIC(12,2) DEFAULT 0,
  "netProfit" NUMERIC(12,2) DEFAULT 0,
  "occupancyRate" NUMERIC(5,2),
  "generatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "generatedBy" INTEGER,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("generatedBy") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Incident Registry
CREATE TABLE IF NOT EXISTS "incidentRegistry" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "incidentNumber" VARCHAR(50) UNIQUE NOT NULL,
  "incidentType" VARCHAR(100) NOT NULL,
  "severity" "incident_severity" NOT NULL,
  "workspaceId" INTEGER,
  "reportedBy" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "actionTaken" TEXT,
  "status" "incident_status" DEFAULT 'reported' NOT NULL,
  "occurredAt" TIMESTAMP NOT NULL,
  "resolvedAt" TIMESTAMP,
  "witnesses" INTEGER DEFAULT 0,
  "damageEstimate" NUMERIC(10,2),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL,
  FOREIGN KEY ("reportedBy") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" INTEGER NOT NULL,
  "type" "notification_type" NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false NOT NULL,
  "priority" "notification_priority" DEFAULT 'normal' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "readAt" TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Promotions
CREATE TABLE IF NOT EXISTS "promotions" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "discountType" "discount_type" NOT NULL,
  "discountValue" NUMERIC(10,2) NOT NULL,
  "code" VARCHAR(50) UNIQUE,
  "validFrom" TIMESTAMP NOT NULL,
  "validThrough" TIMESTAMP NOT NULL,
  "maxUses" INTEGER,
  "currentUses" INTEGER DEFAULT 0,
  "targetAudience" "target_audience" DEFAULT 'all' NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Work Schedule
CREATE TABLE IF NOT EXISTS "workSchedule" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "specialistId" INTEGER NOT NULL,
  "workspaceId" INTEGER,
  "dayOfWeek" "day_of_week" NOT NULL,
  "startTime" VARCHAR(5) NOT NULL,
  "endTime" VARCHAR(5) NOT NULL,
  "isRecurring" BOOLEAN DEFAULT true NOT NULL,
  "effectiveDate" TIMESTAMP,
  "expiryDate" TIMESTAMP,
  "status" "schedule_status" DEFAULT 'active' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("specialistId") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_equipment_workspace" ON "equipment"("workspaceId");
CREATE INDEX IF NOT EXISTS "idx_contracts_specialist" ON "contracts"("specialistId");
CREATE INDEX IF NOT EXISTS "idx_contracts_tariff" ON "contracts"("tariffId");
CREATE INDEX IF NOT EXISTS "idx_accessPasses_user" ON "accessPasses"("userId");
CREATE INDEX IF NOT EXISTS "idx_serviceRecords_specialist" ON "serviceRecords"("specialistId");
CREATE INDEX IF NOT EXISTS "idx_serviceRecords_workspace" ON "serviceRecords"("workspaceId");
CREATE INDEX IF NOT EXISTS "idx_invoices_user" ON "invoices"("userId");
CREATE INDEX IF NOT EXISTS "idx_payments_invoice" ON "payments"("invoiceId");
CREATE INDEX IF NOT EXISTS "idx_maintenanceRequests_equipment" ON "maintenanceRequests"("equipmentId");
CREATE INDEX IF NOT EXISTS "idx_incidentRegistry_workspace" ON "incidentRegistry"("workspaceId");
CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "idx_workSchedule_specialist" ON "workSchedule"("specialistId");

-- ============================================================================
-- UPDATE ADMIN ACTION ENUM
-- ============================================================================

-- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in a transaction
-- These should be run separately or the enum should be recreated
-- For now, we'll document the new values needed:

-- New admin_action values to add:
-- 'tariff_created', 'tariff_updated', 'tariff_deleted',
-- 'equipment_created', 'equipment_updated', 'equipment_deleted',
-- 'material_created', 'material_updated', 'material_deleted',
-- 'contract_created', 'contract_updated', 'contract_deleted',
-- 'pass_created', 'pass_updated', 'pass_deleted',
-- 'service_created', 'service_updated', 'service_deleted',
-- 'invoice_created', 'invoice_updated', 'invoice_deleted',
-- 'payment_created', 'payment_updated', 'payment_deleted',
-- 'maintenance_created', 'maintenance_updated', 'maintenance_deleted',
-- 'staff_created', 'staff_updated', 'staff_deleted',
-- 'report_created', 'report_updated', 'report_deleted',
-- 'incident_created', 'incident_updated', 'incident_deleted',
-- 'notification_created', 'notification_updated', 'notification_deleted',
-- 'promotion_created', 'promotion_updated', 'promotion_deleted',
-- 'schedule_created', 'schedule_updated', 'schedule_deleted'
