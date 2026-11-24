-- DropIndex
DROP INDEX "tickets_assigneeId_idx";

-- DropIndex
DROP INDEX "tickets_createdAt_idx";

-- DropIndex
DROP INDEX "tickets_status_category_priority_idx";

-- CreateIndex
CREATE INDEX "tickets_created_at_id_idx" ON "tickets"("createdAt" DESC, "id" ASC);
