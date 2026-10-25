-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "customIcon" BYTEA,
ADD COLUMN     "customIconDate" TIMESTAMP(3),
ADD COLUMN     "houdiniIcon" TEXT NOT NULL DEFAULT '';
