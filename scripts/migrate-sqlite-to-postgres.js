/**
 * Migreer data van SQLite (prisma/dev.db) naar PostgreSQL (Neon).
 *
 * Gebruik:
 *   1. Zet DATABASE_URL in .env op je Neon Postgres-URL
 *   2. Zorg dat prisma/dev.db bestaat met je oude data
 *   3. npm run migrate:sqlite-to-postgres
 *
 * Optioneel: CLEAR_FIRST=1 om bestaande Postgres-data eerst te verwijderen
 */

require("dotenv").config();
const Database = require("better-sqlite3");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const fs = require("fs");
const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, "..", "prisma", "dev.db");
const POSTGRES_URL = process.env.DATABASE_URL;

if (!POSTGRES_URL || !POSTGRES_URL.startsWith("postgresql://")) {
  console.error("Fout: DATABASE_URL moet een Postgres-URL zijn (postgresql://...).");
  console.error("Zet DATABASE_URL in .env op je Neon connection string.");
  process.exit(1);
}

if (!fs.existsSync(SQLITE_PATH)) {
  console.error("Fout: SQLite-bestand niet gevonden:", SQLITE_PATH);
  console.error("Zet SQLITE_PATH als je database ergens anders staat.");
  process.exit(1);
}

async function migrate() {
  console.log("SQLite bron:", SQLITE_PATH);
  console.log("Postgres doel: Neon (via DATABASE_URL)\n");

  const db = new Database(SQLITE_PATH, { readonly: true });
  const rows = db.prepare("SELECT * FROM Article ORDER BY datum, positie").all();
  db.close();

  console.log(`Gevonden: ${rows.length} artikelen in SQLite.\n`);

  if (rows.length === 0) {
    console.log("Geen data om te migreren.");
    return;
  }

  const adapter = new PrismaPg({ connectionString: POSTGRES_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    if (process.env.CLEAR_FIRST === "1") {
      const deleted = await prisma.article.deleteMany();
      console.log(`Bestaande Postgres-data verwijderd: ${deleted.count} artikelen.\n`);
    }

    const toCreate = rows.map((r) => ({
      id: r.id,
      datum: r.datum,
      onderwerp: r.onderwerp,
      url: r.url ?? null,
      naam: r.naam ?? r.wie ?? "",
      status: r.status ?? "",
      categorie: r.categorie ?? "",
      rerun: r.rerun ? Boolean(r.rerun) : false,
      opmerkingen: r.opmerkingen ?? null,
      positie: r.positie ?? 0,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
    }));

    await prisma.article.createMany({
      data: toCreate,
      skipDuplicates: true,
    });

    console.log(`✓ ${toCreate.length} artikelen gemigreerd naar Postgres.`);
  } catch (err) {
    console.error("Migratie mislukt:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
