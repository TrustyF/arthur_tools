-- Copies now count as downloads; fold any existing copy counts in before dropping.
UPDATE "ToolStats" SET "downloads" = "downloads" + "copies";

ALTER TABLE "ToolStats" DROP COLUMN "copies";
