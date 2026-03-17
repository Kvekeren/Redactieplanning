/**
 * Seed database from Excel file.
 * Run: node scripts/seed-from-excel.js
 */
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");
const XLSX = require("xlsx");

const dbPath = path.join(__dirname, "..", "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const articleCols = [
  [4, 5, 7],   // Artikel 1: Naam, Categorie, Onderwerp
  [15, 17, 19], // Artikel 2
  [27, 29, 31], // Artikel 3
];

function excelDateToISOString(num) {
  if (typeof num !== "number") return null;
  const date = new Date((num - 25569) * 86400 * 1000); // Excel epoch 1900-01-01
  return date.toISOString().slice(0, 10);
}

async function main() {
  const workbook = XLSX.readFile(path.join(__dirname, "..", "redactieplanning.xlsx"));
  const sheet = workbook.Sheets["Website 2026"];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const articles = [];
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const datumVal = row[0];
    const datumStr = datumVal instanceof Date
      ? datumVal.toISOString().slice(0, 10)
      : excelDateToISOString(datumVal);
    if (!datumStr) continue;

    for (const [naamCol, catCol, onderwerpCol] of articleCols) {
      const naam = row[naamCol];
      const cat = row[catCol];
      const onderwerp = row[onderwerpCol];

      if (onderwerp && String(onderwerp).trim() && String(onderwerp) !== "None") {
        articles.push({
          datum: datumStr,
          onderwerp: String(onderwerp).trim(),
          naam: naam ? String(naam).trim() : "",
          status: "",
          categorie: cat ? String(cat).trim() : "",
          opmerkingen: "",
          positie: articles.filter((a) => a.datum === datumStr).length,
        });
      }
    }
  }

  const existing = await prisma.article.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} articles. Clearing first...`);
    await prisma.article.deleteMany();
  }

  const result = await prisma.article.createMany({ data: articles });
  console.log(`Seeded ${result.count} articles from Excel.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
