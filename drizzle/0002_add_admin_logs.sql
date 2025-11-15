CREATE TYPE "public"."admin_action" AS ENUM('user_created', 'user_updated', 'user_deleted', 'workspace_created', 'workspace_updated', 'workspace_deleted', 'booking_updated', 'review_deleted');--> statement-breakpoint
CREATE TABLE "adminLogs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "adminLogs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"adminId" integer NOT NULL,
	"action" "admin_action" NOT NULL,
	"entityType" varchar(50) NOT NULL,
	"entityId" integer,
	"details" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
