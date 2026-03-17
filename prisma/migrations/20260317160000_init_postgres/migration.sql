-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "datum" TEXT NOT NULL,
    "onderwerp" TEXT NOT NULL,
    "url" TEXT,
    "naam" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "categorie" TEXT NOT NULL DEFAULT '',
    "rerun" BOOLEAN NOT NULL DEFAULT false,
    "opmerkingen" TEXT,
    "positie" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);
