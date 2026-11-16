-- AlterEnum
ALTER TYPE "ToolLanguage" ADD VALUE 'HDA';

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "assetFileName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "assetKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "assetSize" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ToolVersion" ADD COLUMN     "assetFileName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "assetKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "assetSize" INTEGER NOT NULL DEFAULT 0;
