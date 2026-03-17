/**
 * Zet status 'Gepubliceerd' voor alle artikelen vóór 17 maart.
 * Run: node scripts/set-status-voor-17-maart.js
 */
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.article.updateMany({
    where: { datum: { lt: "2026-03-17" } },
    data: { status: "Gepubliceerd" },
  });
  console.log(`${result.count} artikelen vóór 17 maart → status Gepubliceerd`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
