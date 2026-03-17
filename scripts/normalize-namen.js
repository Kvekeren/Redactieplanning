/**
 * Normaliseer naam-afkortingen naar volledige namen en status.
 * GJ/GJ* → Govert, Gepubliceerd
 * LC/LC* → Lizanne, KE/KE* → Koen, HK/HK* → Helga, ID/ID* → Iona
 *
 * Run: node scripts/normalize-namen.js
 */
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  // GJ of GJ* → status Gepubliceerd, naam Govert
  const gj = await prisma.article.updateMany({
    where: {
      OR: [{ naam: "GJ" }, { naam: "GJ*" }],
    },
    data: { naam: "Govert", status: "Gepubliceerd" },
  });
  console.log(`GJ/GJ* → Govert, Gepubliceerd: ${gj.count} artikelen bijgewerkt`);

  // LC / LC* → Lizanne
  const lc = await prisma.article.updateMany({
    where: { OR: [{ naam: "LC" }, { naam: "LC*" }] },
    data: { naam: "Lizanne" },
  });
  console.log(`LC/LC* → Lizanne: ${lc.count} artikelen bijgewerkt`);

  // KE / KE* → Koen
  const ke = await prisma.article.updateMany({
    where: { OR: [{ naam: "KE" }, { naam: "KE*" }] },
    data: { naam: "Koen" },
  });
  console.log(`KE/KE* → Koen: ${ke.count} artikelen bijgewerkt`);

  // HK / HK* → Helga
  const hk = await prisma.article.updateMany({
    where: { OR: [{ naam: "HK" }, { naam: "HK*" }] },
    data: { naam: "Helga" },
  });
  console.log(`HK/HK* → Helga: ${hk.count} artikelen bijgewerkt`);

  // ID / ID* → Iona
  const id = await prisma.article.updateMany({
    where: { OR: [{ naam: "ID" }, { naam: "ID*" }] },
    data: { naam: "Iona" },
  });
  console.log(`ID/ID* → Iona: ${id.count} artikelen bijgewerkt`);

  console.log("Klaar.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
