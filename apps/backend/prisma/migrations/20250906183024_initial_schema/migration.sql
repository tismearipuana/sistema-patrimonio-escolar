-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'GESTOR_ESCOLAR', 'SOLICITANTE');

-- CreateEnum
CREATE TYPE "public"."TenantType" AS ENUM ('SECRETARIA', 'REGIONAL', 'ESCOLA');

-- CreateEnum
CREATE TYPE "public"."AssetStatus" AS ENUM ('ATIVO', 'INATIVO', 'MANUTENCAO', 'BAIXADO');

-- CreateEnum
CREATE TYPE "public"."AssetCondition" AS ENUM ('OTIMO', 'BOM', 'REGULAR', 'RUIM');

-- CreateEnum
CREATE TYPE "public"."DisposalStatus" AS ENUM ('ATIVO', 'SOLICITADO_BAIXA', 'BAIXADO');

-- CreateEnum
CREATE TYPE "public"."DisposalReason" AS ENUM ('QUEBRA', 'OBSOLESCENCIA', 'PERDA', 'ROUBO', 'FIM_VIDA_UTIL', 'OUTROS');

-- CreateEnum
CREATE TYPE "public"."DisposalRequestStatus" AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'EFETIVADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO', 'RESOLVIDO', 'FECHADO');

-- CreateEnum
CREATE TYPE "public"."TicketPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('CREATED', 'UPDATED', 'MOVED', 'MAINTENANCE', 'STATUS_CHANGED', 'DISPOSAL_REQUEST', 'DISPOSED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('DISPOSAL_REQUESTED', 'DISPOSAL_APPROVED', 'DISPOSAL_REJECTED', 'TICKET_ASSIGNED', 'TICKET_RESOLVED', 'ASSET_MAINTENANCE', 'SYSTEM_ALERT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'SOLICITANTE',
    "tenant_id" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."TenantType" NOT NULL DEFAULT 'ESCOLA',
    "parent_id" TEXT,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "cnpj" TEXT,
    "director" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "serial_number" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "purchase_date" TIMESTAMP(3),
    "purchase_value" DECIMAL(10,2),
    "current_value" DECIMAL(10,2),
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'ATIVO',
    "condition" "public"."AssetCondition",
    "image_url" TEXT,
    "location" TEXT,
    "responsible" TEXT,
    "notes" TEXT,
    "warranty_until" TIMESTAMP(3),
    "last_maintenance" TIMESTAMP(3),
    "disposal_status" "public"."DisposalStatus" NOT NULL DEFAULT 'ATIVO',
    "disposal_date" TIMESTAMP(3),
    "disposal_reason" TEXT,
    "disposal_value" DECIMAL(10,2),
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asset_events" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "event_type" "public"."EventType" NOT NULL,
    "description" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asset_disposal_requests" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reason" "public"."DisposalReason" NOT NULL,
    "description" TEXT NOT NULL,
    "occurrence_date" TIMESTAMP(3) NOT NULL,
    "photos" JSONB,
    "technical_report" TEXT,
    "estimated_repair_cost" DECIMAL(10,2),
    "status" "public"."DisposalRequestStatus" NOT NULL DEFAULT 'PENDENTE',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "admin_notes" TEXT,
    "approval_document" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_disposal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tickets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'ABERTO',
    "priority" "public"."TicketPriority" NOT NULL DEFAULT 'MEDIA',
    "category" TEXT NOT NULL,
    "asset_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "tenant_id" TEXT NOT NULL,
    "attachments" JSONB,
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_id" TEXT,
    "related_type" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "public"."tenants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "assets_code_key" ON "public"."assets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "public"."system_configs"("key");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenants" ADD CONSTRAINT "tenants_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assets" ADD CONSTRAINT "assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_events" ADD CONSTRAINT "asset_events_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_disposal_requests" ADD CONSTRAINT "asset_disposal_requests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_disposal_requests" ADD CONSTRAINT "asset_disposal_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_disposal_requests" ADD CONSTRAINT "asset_disposal_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_disposal_requests" ADD CONSTRAINT "asset_disposal_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
