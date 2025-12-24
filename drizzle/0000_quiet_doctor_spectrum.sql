CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."operation" AS ENUM('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'specialist');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('bronze', 'silver', 'gold');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('payment', 'refund', 'deposit', 'withdrawal');--> statement-breakpoint
CREATE TYPE "public"."workspace_type" AS ENUM('hairdresser', 'makeup', 'manicure', 'cosmetology', 'massage');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bookings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workspaceId" integer NOT NULL,
	"userId" integer NOT NULL,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"totalPrice" integer NOT NULL,
	"paymentStatus" "payment_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workspaceId" integer NOT NULL,
	"userId" integer NOT NULL,
	"bookingId" integer,
	"rating" integer NOT NULL,
	"comment" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sqlLogs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sqlLogs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"query" text NOT NULL,
	"operation" "operation" NOT NULL,
	"executionTime" integer,
	"userId" integer,
	"endpoint" varchar(255),
	"params" text,
	"error" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"bookingId" integer,
	"type" "transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"phone" varchar(20),
	"avatar" text,
	"bio" text,
	"specialization" varchar(100),
	"points" integer DEFAULT 0,
	"status" "status" DEFAULT 'bronze',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "workspaces_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(200) NOT NULL,
	"description" text,
	"type" "workspace_type" NOT NULL,
	"pricePerHour" integer NOT NULL,
	"pricePerDay" integer NOT NULL,
	"imageUrl" text,
	"amenities" text,
	"isAvailable" boolean DEFAULT true NOT NULL,
	"rating" integer DEFAULT 0,
	"reviewCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
