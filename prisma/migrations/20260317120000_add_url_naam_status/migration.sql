-- AlterTable: add url, naam, status; migrate wie -> naam; drop wie
ALTER TABLE "Article" ADD COLUMN "url" TEXT;
ALTER TABLE "Article" ADD COLUMN "naam" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Article" ADD COLUMN "status" TEXT NOT NULL DEFAULT '';

-- Copy wie to naam for existing records
UPDATE "Article" SET "naam" = "wie" WHERE "wie" IS NOT NULL AND "wie" != '';

-- Drop wie column (SQLite 3.35+)
ALTER TABLE "Article" DROP COLUMN "wie";
