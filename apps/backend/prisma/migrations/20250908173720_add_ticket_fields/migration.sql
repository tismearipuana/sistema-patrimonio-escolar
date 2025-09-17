-- AlterTable
ALTER TABLE "public"."tickets" ADD COLUMN     "accepted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "can_accept_tickets" BOOLEAN NOT NULL DEFAULT false;
