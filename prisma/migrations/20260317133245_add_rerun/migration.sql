-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datum" TEXT NOT NULL,
    "onderwerp" TEXT NOT NULL,
    "url" TEXT,
    "naam" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "categorie" TEXT NOT NULL DEFAULT '',
    "rerun" BOOLEAN NOT NULL DEFAULT false,
    "opmerkingen" TEXT DEFAULT '',
    "positie" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Article" ("categorie", "createdAt", "datum", "id", "naam", "onderwerp", "opmerkingen", "positie", "status", "updatedAt", "url") SELECT "categorie", "createdAt", "datum", "id", "naam", "onderwerp", "opmerkingen", "positie", "status", "updatedAt", "url" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
