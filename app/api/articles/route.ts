import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: [{ datum: "asc" }, { positie: "asc" }],
    });
    return NextResponse.json(articles);
  } catch (error) {
    console.error("GET /api/articles:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articles } = body as { articles: Array<{
      id: string;
      datum: string;
      onderwerp: string;
      url?: string | null;
      naam: string;
      status: string;
      categorie: string;
      rerun?: boolean;
      opmerkingen?: string;
      positie: number;
    }> };

    if (!Array.isArray(articles)) {
      return NextResponse.json({ error: "Invalid request: articles array required" }, { status: 400 });
    }

    const toCreate = articles.filter((a) => a.id.startsWith("new-"));
    const toUpdate = articles.filter((a) => !a.id.startsWith("new-"));
    const incomingIds = new Set(toUpdate.map((a) => a.id));

    await prisma.$transaction(
      async (tx) => {
        // Verwijder artikelen die niet meer in de planning staan
        const toDelete = await tx.article.findMany({
          select: { id: true },
        });
        const idsToDelete = toDelete
          .map((a) => a.id)
          .filter((id) => !incomingIds.has(id));
        if (idsToDelete.length > 0) {
          await tx.article.deleteMany({ where: { id: { in: idsToDelete } } });
        }

        await Promise.all([
          ...toCreate.map((a) =>
            tx.article.create({
              data: {
                datum: a.datum,
                onderwerp: a.onderwerp,
                url: a.url ?? null,
                naam: a.naam ?? "",
                status: a.status ?? "",
                categorie: a.categorie,
                rerun: a.rerun ?? false,
                opmerkingen: a.opmerkingen ?? "",
                positie: a.positie,
              },
            })
          ),
          ...toUpdate.map((a) =>
            tx.article.update({
              where: { id: a.id },
              data: {
                datum: a.datum,
                onderwerp: a.onderwerp,
                url: a.url ?? null,
                naam: a.naam ?? "",
                status: a.status ?? "",
                categorie: a.categorie,
                rerun: a.rerun ?? false,
                opmerkingen: a.opmerkingen ?? "",
                positie: a.positie,
              },
            })
          ),
        ]);
      },
      { timeout: 15000 }
    );
    return NextResponse.json({ success: true, count: articles.length });
  } catch (error) {
    console.error("POST /api/articles:", error);
    const message = error instanceof Error ? error.message : "Failed to save articles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
