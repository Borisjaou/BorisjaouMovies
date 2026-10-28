-- CreateTable
CREATE TABLE "WatchItem" (
    "userId" TEXT NOT NULL,
    "filmId" INTEGER NOT NULL,
    "list" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchItem_pkey" PRIMARY KEY ("userId","filmId")
);

-- CreateIndex
CREATE INDEX "WatchItem_filmId_idx" ON "WatchItem"("filmId");

-- CreateIndex
CREATE INDEX "WatchItem_userId_list_idx" ON "WatchItem"("userId", "list");

-- AddForeignKey
ALTER TABLE "WatchItem" ADD CONSTRAINT "WatchItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchItem" ADD CONSTRAINT "WatchItem_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Как у остальных таблиц в Supabase: RLS включён без политик (Prisma ходит как владелец таблиц)
ALTER TABLE "WatchItem" ENABLE ROW LEVEL SECURITY;
