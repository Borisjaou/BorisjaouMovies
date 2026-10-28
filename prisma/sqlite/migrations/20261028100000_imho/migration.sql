-- AlterTable
ALTER TABLE "Film" ADD COLUMN "verdict" TEXT;
ALTER TABLE "Film" ADD COLUMN "imho" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Film" ADD COLUMN "imhoAt" DATETIME;

-- CreateIndex
CREATE INDEX "Film_status_verdict_idx" ON "Film"("status", "verdict");
