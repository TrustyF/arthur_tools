-- CreateTable
CREATE TABLE "ToolVersion" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ToolVersion_toolId_number_key" ON "ToolVersion"("toolId", "number");

-- AddForeignKey
ALTER TABLE "ToolVersion" ADD CONSTRAINT "ToolVersion_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: each existing tool starts its history with its current code as v1.
-- gen_random_uuid() stands in for cuid(), which only exists client-side.
INSERT INTO "ToolVersion" ("id", "toolId", "number", "code", "note", "createDate")
SELECT gen_random_uuid()::text, "id", 1, "code", 'Initial version', "createDate"
FROM "Tool";
