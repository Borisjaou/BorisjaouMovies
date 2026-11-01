-- AlterTable
ALTER TABLE "Film" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE INDEX "Film_externalId_idx" ON "Film"("externalId");
