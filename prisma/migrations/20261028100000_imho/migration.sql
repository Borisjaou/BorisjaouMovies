-- AlterTable
ALTER TABLE "Film" ADD COLUMN "verdict" TEXT,
ADD COLUMN "imho" TEXT NOT NULL DEFAULT '',
ADD COLUMN "imhoAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Film_status_verdict_idx" ON "Film"("status", "verdict");
