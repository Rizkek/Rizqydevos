-- DropIndex
DROP INDEX "Secret_userId_key_key";

-- AlterTable
ALTER TABLE "Secret" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "url" TEXT,
ADD COLUMN     "username" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Secret_userId_key_username_key" ON "Secret"("userId", "key", "username");

