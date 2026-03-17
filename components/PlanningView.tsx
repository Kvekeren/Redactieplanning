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
import { SaveBar } from "./SaveBar";
import { WeekRow } from "./WeekRow";
import { getCategoryStyle } from "@/lib/categoryColors";
import { getStatusColor } from "@/lib/statusColors";
import type { Article } from "@/lib/types";

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

export function PlanningView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [saveMessage, setSaveMessage] = useState<"success" | "error" | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<string>("");

  const fetchArticles = useCallback(async () => {
    const res = await fetch("/api/articles");
    const data = await res.json();
    setArticles(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles }),
      });
      if (!res.ok) throw new Error("Save failed");
      setHasUnsavedChanges(false);
      await fetchArticles();
      setSaveMessage("success");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage("error");
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
        const month = getMonthFromWeekStart(topmostWeekStart);
        setVisibleMonth(month);
      } else if (allWeeks.length > 0) {
        setVisibleMonth(getMonthFromWeekStart(allWeeks[0]));
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center px-4">
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {visibleMonth || getMonthFromWeekStart(allWeeks[0] ?? new Date().toISOString().slice(0, 10))}
          </h1>
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
                  todayStr={todayStr}
                  onCardClick={handleCardClick}
                  onAddCard={handleAddCard}
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
                    {activeArticle.categorie && categoryStyle && (
                      <span
                        className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                      >
                        {activeArticle.categorie}
                      </span>
                    )}
                    <p className="pr-10 font-medium line-clamp-3 text-xs leading-snug">
                      {activeArticle.onderwerp}
                    </p>
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
          />
        </>
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
          {saveMessage === "success" ? "Wijzigingen opgeslagen" : "Opslaan mislukt"}
        </div>
      )}
    </div>
  );
}
