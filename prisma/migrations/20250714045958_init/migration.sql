-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "canvasData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasHistory" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanvasHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Board_orgId_idx" ON "Board"("orgId");

-- CreateIndex
CREATE INDEX "Board_authorId_idx" ON "Board"("authorId");

-- CreateIndex
CREATE INDEX "Board_title_idx" ON "Board"("title");

-- CreateIndex
CREATE INDEX "UserFavorite_userId_orgId_idx" ON "UserFavorite"("userId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_boardId_key" ON "UserFavorite"("userId", "boardId");

-- CreateIndex
CREATE INDEX "CanvasHistory_boardId_idx" ON "CanvasHistory"("boardId");

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
