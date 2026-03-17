"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ArticleDetailPanel } from "./ArticleDetailPanel";
import { DayColumn } from "./DayColumn";
import { MeldingPanel } from "./MeldingPanel";
import { SaveBar } from "./SaveBar";
import { WeekRow } from "./WeekRow";
import { getCategoryStyle } from "@/lib/categoryColors";
import { getStatusColor } from "@/lib/statusColors";
import type { Article, Melding } from "@/lib/types";

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Ma = 1
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function getAllWeeks(articles: Article[]): string[] {
  const dates = articles.map((a) => a.datum);
  if (dates.length === 0) {
    const today = new Date();
    const start = getWeekStart(today);
    return [start];
  }
  const minDate = dates.reduce((a, b) => (a < b ? a : b));
  const maxDate = dates.reduce((a, b) => (a > b ? a : b));
  const start = getWeekStart(new Date(minDate + "T12:00:00"));
  const end = getWeekStart(new Date(maxDate + "T12:00:00"));
  const weeks: string[] = [];
  let current = new Date(start + "T12:00:00");
  const endD = new Date(end + "T12:00:00");
  while (current <= endD) {
    weeks.push(current.toISOString().slice(0, 10));
    current = new Date(current);
    current.setDate(current.getDate() + 7);
  }
  // Voeg weken toe voor de data
  for (let i = 1; i <= 4; i++) {
    const prev = new Date(weeks[0] + "T12:00:00");
    prev.setDate(prev.getDate() - 7);
    weeks.unshift(prev.toISOString().slice(0, 10));
  }
  // Voeg weken toe na de data
  for (let i = 1; i <= 12; i++) {
    const next = new Date(weeks[weeks.length - 1] + "T12:00:00");
    next.setDate(next.getDate() + 7);
    weeks.push(next.toISOString().slice(0, 10));
  }
  // Zorg dat de actuele week altijd in de lijst zit
  const todayWeek = getWeekStart(new Date());
  if (!weeks.includes(todayWeek)) {
    weeks.push(todayWeek);
    weeks.sort();
  }
  return weeks;
}

function getMonthFromWeekStart(weekStart: string): string {
  const d = new Date(weekStart + "T12:00:00");
  return d.toLocaleDateString("nl-NL", { month: "long" });
}

function getYearFromWeekStart(weekStart: string): number {
  const d = new Date(weekStart + "T12:00:00");
  return d.getFullYear();
}

function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function PlanningView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [saveMessage, setSaveMessage] = useState<"success" | { error: string } | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<string>("");
  const [visibleYear, setVisibleYear] = useState<number>(new Date().getFullYear());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [meldingen, setMeldingen] = useState<Melding[]>([]);
  const [meldingEditWeek, setMeldingEditWeek] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/articles");
      const text = await res.text();
      if (text.trim().startsWith("<")) {
        throw new Error(
          "Server gaf een foutpagina (HTML). Bekijk de terminal waar 'npm run dev' draait voor de echte foutmelding."
        );
      }
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server antwoordde met ongeldige data");
      }
      if (!res.ok) {
        const msg = (data as { error?: string })?.error ?? `Fout bij laden (${res.status})`;
        throw new Error(msg);
      }
      if (!Array.isArray(data)) {
        throw new Error("Ongeldige data van server");
      }
      setArticles(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Kon planning niet laden");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMeldingen = useCallback(async () => {
    try {
      const res = await fetch("/api/meldingen");
      const text = await res.text();
      if (text.trim().startsWith("<")) return;
      const data = JSON.parse(text);
      if (Array.isArray(data)) setMeldingen(data);
    } catch {
      setMeldingen([]);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    if (!loading) fetchMeldingen();
  }, [loading, fetchMeldingen]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const article = articles.find((a) => a.id === active.id);
    if (article) setActiveArticle(article);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveArticle(null);
    if (!over) return;

    const targetDate = over.id as string;
    if (typeof targetDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return;

    const article = articles.find((a) => a.id === active.id);
    if (!article || article.datum === targetDate) return;

    setArticles((prev) =>
      prev.map((a) =>
        a.id === article.id ? { ...a, datum: targetDate } : a
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleCardClick = (article: Article) => {
    setSelectedArticle(article);
  };

  const handleAddCard = (date: string) => {
    const newArticle: Article = {
      id: `new-${Date.now()}`,
      datum: date,
      onderwerp: "",
      url: null,
      naam: "",
      status: "",
      categorie: "",
      rerun: false,
      opmerkingen: "",
      positie: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedArticle(newArticle);
  };

  const handleDetailSave = (updated: Article) => {
    const isNew = updated.id.startsWith("new-");
    setArticles((prev) => {
      if (isNew) {
        const sameDate = prev.filter((a) => a.datum === updated.datum);
        const maxPositie = sameDate.length ? Math.max(...sameDate.map((a) => a.positie)) : -1;
        return [...prev, { ...updated, positie: maxPositie + 1 }];
      }
      return prev.map((a) => (a.id === updated.id ? updated : a));
    });
    setSelectedArticle(null);
    setHasUnsavedChanges(true);
  };

  const handleDetailDelete = (article: Article) => {
    setArticles((prev) => prev.filter((a) => a.id !== article.id));
    setSelectedArticle(null);
    setHasUnsavedChanges(true);
  };

  const getMeldingForWeek = useCallback(
    (weekStart: string): string | null => {
      const m = meldingen.find((x) => x.weekStart === weekStart);
      return m?.tekst ?? null;
    },
    [meldingen]
  );

  const handleMeldingSave = (weekStart: string, tekst: string) => {
    setMeldingen((prev) => {
      const existing = prev.find((m) => m.weekStart === weekStart);
      if (tekst === "") {
        return prev.filter((m) => m.weekStart !== weekStart);
      }
      if (existing) {
        return prev.map((m) => (m.weekStart === weekStart ? { ...m, tekst } : m));
      }
      return [
        ...prev,
        {
          id: `new-${Date.now()}`,
          weekStart,
          tekst,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    });
    setMeldingEditWeek(null);
    setHasUnsavedChanges(true);
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      articles,
      meldingen,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redactieplanning-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const [articlesRes, meldingenRes] = await Promise.all([
        fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articles }),
        }),
        fetch("/api/meldingen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meldingen }),
        }),
      ]);
      if (!articlesRes.ok) {
        const errBody = await articlesRes.json().catch(() => ({}));
        const msg = (errBody as { error?: string })?.error ?? `Save failed (${articlesRes.status})`;
        throw new Error(msg);
      }
      if (!meldingenRes.ok) {
        const errBody = await meldingenRes.json().catch(() => ({}));
        const msg = (errBody as { error?: string })?.error ?? "Meldingen opslaan mislukt";
        throw new Error(msg);
      }
      setHasUnsavedChanges(false);
      await Promise.all([fetchArticles(), fetchMeldingen()]);
      setSaveMessage("success");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage({ error: err instanceof Error ? err.message : "Opslaan mislukt" });
    } finally {
      setIsSaving(false);
    }
  };

  const allWeeks = useMemo(() => getAllWeeks(articles), [articles]);
  const currentWeekStart = useMemo(() => getWeekStart(new Date()), []);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (loading || allWeeks.length === 0) return;
    const el = document.getElementById(`week-${currentWeekStart}`);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }
  }, [loading, allWeeks.length, currentWeekStart]);

  useEffect(() => {
    if (allWeeks.length === 0) return;

    const headerHeight = 64;

    const updateVisibleMonth = () => {
      let topmostWeekStart: string | null = null;
      let topmostTop = Infinity;

      for (const ws of allWeeks) {
        const el = document.getElementById(`week-${ws}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.bottom > headerHeight && rect.top < window.innerHeight) {
          if (rect.top < topmostTop) {
            topmostTop = rect.top;
            topmostWeekStart = ws;
          }
        }
      }

      if (topmostWeekStart) {
        setVisibleMonth(getMonthFromWeekStart(topmostWeekStart));
        setVisibleYear(getYearFromWeekStart(topmostWeekStart));
      } else if (allWeeks.length > 0) {
        setVisibleMonth(getMonthFromWeekStart(allWeeks[0]));
        setVisibleYear(getYearFromWeekStart(allWeeks[0]));
      }
    };

    updateVisibleMonth();
    window.addEventListener("scroll", updateVisibleMonth, { passive: true });
    window.addEventListener("resize", updateVisibleMonth);
    return () => {
      window.removeEventListener("scroll", updateVisibleMonth);
      window.removeEventListener("resize", updateVisibleMonth);
    };
  }, [allWeeks]);

  const getArticlesByDateForWeek = useCallback(
    (weekStartStr: string) => {
      const weekDates = getWeekDates(weekStartStr);
      return weekDates.reduce<Record<string, Article[]>>((acc, d) => {
        acc[d] = articles
          .filter((a) => a.datum === d)
          .sort((a, b) => a.positie - b.positie);
        return acc;
      }, {});
    },
    [articles]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <p className="text-gray-500">Planning laden…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8f9fa] p-6">
        <p className="text-center text-red-600">{loadError}</p>
        <p className="text-center text-sm text-gray-500">
          Controleer of <code className="rounded bg-gray-200 px-1">DATABASE_URL</code> in .env een geldige Postgres-URL is (bijv. Neon).
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchArticles();
          }}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa] pb-24">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur px-6 py-4">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
          <a
            href="https://www.gardenersworldmagazine.nl/"
            target="_blank"
            rel="noopener noreferrer"
            className="justify-self-start"
          >
            <img
              src="/GW-logo-transparant.webp"
              alt="Gardeners' World"
              className="h-10 w-auto object-contain"
            />
          </a>
          <h1 className="text-center text-xl font-semibold text-gray-800 capitalize">
            {(visibleMonth || getMonthFromWeekStart(allWeeks[0] ?? new Date().toISOString().slice(0, 10)))}{" "}
            {visibleMonth ? visibleYear : getYearFromWeekStart(allWeeks[0] ?? new Date().toISOString().slice(0, 10))}
          </h1>
          <div />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] overflow-x-auto px-4 py-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-y-auto">
            <div className="min-w-[900px] rounded-lg border border-gray-200/60 bg-white shadow-sm">
              <div className="grid grid-cols-[minmax(100px,120px)_repeat(7,minmax(100px,1fr))] gap-2 border-b border-gray-200/80 bg-gray-50/80 px-2 py-2">
                <div className="px-3 py-2 text-sm font-semibold text-gray-600">Week</div>
                {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((dag) => (
                  <div key={dag} className="px-2 py-2 text-center text-sm font-semibold text-gray-600">
                    {dag}
                  </div>
                ))}
              </div>
              {allWeeks.map((ws) => (
                <WeekRow
                  key={ws}
                  id={`week-${ws}`}
                  weekStart={ws}
                  isActiveWeek={ws === currentWeekStart}
                  articlesByDate={getArticlesByDateForWeek(ws)}
                  melding={getMeldingForWeek(ws)}
                  todayStr={todayStr}
                  onCardClick={handleCardClick}
                  onAddCard={handleAddCard}
                  onMeldingClick={setMeldingEditWeek}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeArticle ? (
              (() => {
                const categoryStyle = getCategoryStyle(activeArticle.categorie);
                return (
                  <div className="relative min-w-[140px] max-w-[180px] cursor-grabbing rounded-xl border border-gray-200 bg-white p-2 shadow-lg text-gray-800">
                    <div className="flex min-h-0 flex-1 flex-col gap-1">
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5 self-start">
                        {activeArticle.categorie && categoryStyle && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                          >
                            {activeArticle.categorie}
                          </span>
                        )}
                        {activeArticle.rerun && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: "#7B2E83" }}
                          >
                            Rerun
                          </span>
                        )}
                      </div>
                      <p className="min-w-0 font-medium line-clamp-3 text-xs leading-snug">
                        {activeArticle.onderwerp}
                      </p>
                    </div>
                    {activeArticle.naam && (
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500">
                        {getStatusColor(activeArticle.status) && (
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${getStatusColor(activeArticle.status)}`}
                            aria-hidden
                          />
                        )}
                        {activeArticle.naam}
                      </p>
                    )}
                  </div>
                );
              })()
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <footer className="mt-auto flex justify-center border-t border-gray-200/60 bg-white/50 py-3">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Planning exporteren als back-up"
          title="Planning exporteren"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </footer>

      {selectedArticle && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSelectedArticle(null)}
            aria-hidden="true"
          />
          <ArticleDetailPanel
            article={selectedArticle}
            onClose={() => setSelectedArticle(null)}
            onSave={handleDetailSave}
            onDelete={handleDetailDelete}
          />
        </>
      )}

      {meldingEditWeek && (
        <MeldingPanel
          weekStart={meldingEditWeek}
          weekLabel={`Wk ${getISOWeek(meldingEditWeek)}`}
          initialTekst={getMeldingForWeek(meldingEditWeek) ?? ""}
          onSave={(tekst) => handleMeldingSave(meldingEditWeek, tekst)}
          onClose={() => setMeldingEditWeek(null)}
        />
      )}

      {hasUnsavedChanges && (
        <SaveBar onSave={handleSave} isSaving={isSaving} />
      )}

      {saveMessage && (
        <div
          className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
            saveMessage === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {saveMessage === "success" ? "Wijzigingen opgeslagen" : (typeof saveMessage === "object" ? saveMessage.error : "Opslaan mislukt")}
        </div>
      )}
    </div>
  );
}
