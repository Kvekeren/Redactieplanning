import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const meldingen = await prisma.melding.findMany({
      orderBy: { weekStart: "asc" },
    });
    return NextResponse.json(meldingen);
  } catch (error) {
    console.error("GET /api/meldingen:", error);
    return NextResponse.json({ error: "Failed to fetch meldingen" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { meldingen } = body as {
      meldingen: Array<{ id: string; weekStart: string; tekst: string }>;
    };

    if (!Array.isArray(meldingen)) {
      return NextResponse.json({ error: "Invalid request: meldingen array required" }, { status: 400 });
    }

    const incomingWeekStarts = new Set(meldingen.map((m) => m.weekStart));

    const existing = await prisma.melding.findMany({ select: { id: true, weekStart: true } });
    const toDelete = existing.filter((e) => !incomingWeekStarts.has(e.weekStart));
    if (toDelete.length > 0) {
      await prisma.melding.deleteMany({ where: { id: { in: toDelete.map((d) => d.id) } } });
    }

    for (const m of meldingen) {
      await prisma.melding.upsert({
        where: { weekStart: m.weekStart },
        create: { weekStart: m.weekStart, tekst: m.tekst },
        update: { tekst: m.tekst },
      });
    }

    return NextResponse.json({ success: true, count: meldingen.length });
  } catch (error) {
    console.error("POST /api/meldingen:", error);
    const message = error instanceof Error ? error.message : "Failed to save meldingen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
