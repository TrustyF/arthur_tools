-- Image bytes move to media storage (R2 in production); the row keeps the key.
-- No deployed environment has Media rows yet, so nothing needs copying out.
ALTER TABLE "Media" DROP COLUMN "data",
ADD COLUMN "key" TEXT NOT NULL;

CREATE UNIQUE INDEX "Media_key_key" ON "Media"("key");
