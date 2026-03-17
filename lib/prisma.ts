import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
// Resolve relative paths for SQLite
const dbUrl = url.startsWith("file:./") ? `file:${path.join(process.cwd(), url.replace("file:./", ""))}` : url;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
export const prisma = new PrismaClient({ adapter });
