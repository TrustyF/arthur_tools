-- CreateTable
CREATE TABLE "ToolStats" (
    "toolId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "copies" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ToolStats_pkey" PRIMARY KEY ("toolId")
);

-- AddForeignKey
ALTER TABLE "ToolStats" ADD CONSTRAINT "ToolStats_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
