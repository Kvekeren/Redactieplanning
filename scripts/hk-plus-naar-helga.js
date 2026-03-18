/**
 * Zet alle artikelen met naam "HK+" om naar "Helga".
 * Gebruikt DATABASE_URL uit .env (Postgres).
 *
 * Run: npm run normalize:hk-plus
 */
try { require("dotenv/config"); } catch (_) {}

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL ontbreekt in .env");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.article.updateMany({
    where: { naam: "HK+" },
    data: { naam: "Helga" },
  });
  console.log(`HK+ → Helga: ${result.count} artikelen bijgewerkt`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
