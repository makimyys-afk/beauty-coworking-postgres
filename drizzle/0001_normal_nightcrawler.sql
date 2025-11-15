ALTER TABLE "workspaces" ALTER COLUMN "rating" SET DATA TYPE numeric(3, 1);--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "rating" SET DEFAULT '0';