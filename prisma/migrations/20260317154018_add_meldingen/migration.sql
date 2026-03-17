-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "opmerkingen" SET DEFAULT '';

-- CreateTable
CREATE TABLE "Melding" (
    "id" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Melding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Melding_weekStart_key" ON "Melding"("weekStart");
