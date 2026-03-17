-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datum" TEXT NOT NULL,
    "onderwerp" TEXT NOT NULL,
    "wie" TEXT NOT NULL DEFAULT '',
    "categorie" TEXT NOT NULL DEFAULT '',
    "opmerkingen" TEXT DEFAULT '',
    "positie" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
