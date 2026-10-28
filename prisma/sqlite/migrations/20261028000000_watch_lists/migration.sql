-- CreateTable
CREATE TABLE "WatchItem" (
    "userId" TEXT NOT NULL,
    "filmId" INTEGER NOT NULL,
    "list" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "filmId"),
    CONSTRAINT "WatchItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchItem_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WatchItem_filmId_idx" ON "WatchItem"("filmId");

-- CreateIndex
CREATE INDEX "WatchItem_userId_list_idx" ON "WatchItem"("userId", "list");
