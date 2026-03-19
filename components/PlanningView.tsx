"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ArticleDetailPanel } from "./ArticleDetailPanel";
import { DayColumn } from "./DayColumn";
import { MeldingPanel } from "./MeldingPanel";
import { PlanningSkeleton } from "./PlanningSkeleton";
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
  const dates = articles.filter((a) => a.datum != null).map((a) => a.datum!);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCategorie, setFilterCategorie] = useState<string>("");
  const [filterNaam, setFilterNaam] = useState<string>("");
  const [filterRerun, setFilterRerun] = useState<string>(""); // "" = alle, "ja" = alleen rerun, "nee" = geen rerun
  const [filterNieuwsbrief, setFilterNieuwsbrief] = useState<string>(""); // "" = alle, "ja" = alleen nieuwsbrief
  const [showFilters, setShowFilters] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  type UndoState = { articles: Article[]; meldingen: Melding[] };
  const [undoStack, setUndoStack] = useState<UndoState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoState[]>([]);
  const isUndoRedoRef = useRef(false);
  const MAX_UNDO = 50;

  const pushUndo = useCallback(() => {
    if (isUndoRedoRef.current) return;
    setUndoStack((prev) => {
      const next = [...prev, { articles: [...articles], meldingen: [...meldingen] }];
      return next.slice(-MAX_UNDO);
    });
    setRedoStack([]);
  }, [articles, meldingen]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    isUndoRedoRef.current = true;
    const state = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, { articles: [...articles], meldingen: [...meldingen] }]);
    setUndoStack((prev) => prev.slice(0, -1));
    setArticles(state.articles);
    setMeldingen(state.meldingen);
    setHasUnsavedChanges(true);
    requestAnimationFrame(() => {
      isUndoRedoRef.current = false;
    });
  }, [undoStack, articles, meldingen]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    isUndoRedoRef.current = true;
    const state = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, { articles: [...articles], meldingen: [...meldingen] }]);
    setRedoStack((prev) => prev.slice(0, -1));
    setArticles(state.articles);
    setMeldingen(state.meldingen);
    setHasUnsavedChanges(true);
    requestAnimationFrame(() => {
      isUndoRedoRef.current = false;
    });
  }, [redoStack, articles, meldingen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "z") return;
      const target = e.target as HTMLElement;
      const tag = target.tagName?.toLowerCase();
      const isEditable = tag === "input" || tag === "textarea" || target.isContentEditable;
      if (isEditable) return; // Laat browser Cmd+Z afhandelen voor tekstvelden
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

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

    const article = articles.find((a) => a.id === active.id);
    if (!article || !article.datum) return;

    const overId = over.id as string;
    const isDateDroppable = typeof overId === "string" && /^\d{4}-\d{2}-\d{2}$/.test(overId);

    if (isDateDroppable) {
      if (article.datum === overId) return;
      pushUndo();
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, datum: overId } : a))
      );
      setHasUnsavedChanges(true);
      return;
    }

    const targetArticle = articles.find((a) => a.id === overId);
    if (!targetArticle) return;

    if (article.datum === targetArticle.datum) {
      const sameDay = articles
        .filter((a) => a.datum === article.datum)
        .sort((a, b) => a.positie - b.positie);
      const oldIndex = sameDay.findIndex((a) => a.id === article.id);
      const newIndex = sameDay.findIndex((a) => a.id === targetArticle.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      pushUndo();
      const reordered = arrayMove(sameDay, oldIndex, newIndex);
      setArticles((prev) => {
        const others = prev.filter((a) => a.datum !== article.datum);
        const withNewPositie = reordered.map((a, i) => ({ ...a, positie: i }));
        return [...others, ...withNewPositie];
      });
      setHasUnsavedChanges(true);
    } else {
      pushUndo();
      const sameDate = articles.filter((a) => a.datum === targetArticle.datum);
      const maxPositie = sameDate.length ? Math.max(...sameDate.map((a) => a.positie)) : -1;
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id
            ? { ...a, datum: targetArticle.datum, positie: maxPositie + 1 }
            : a
        )
      );
      setHasUnsavedChanges(true);
    }
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
      nieuwsbrief: false,
      opmerkingen: "",
      positie: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedArticle(newArticle);
  };

  const handleDetailSave = (updated: Article) => {
    pushUndo();
    setArticles((prev) => {
      const exists = prev.some((a) => a.id === updated.id);
      if (exists) {
        return prev.map((a) => (a.id === updated.id ? updated : a));
      }
      const sameDate = prev.filter((a) => a.datum === updated.datum);
      const maxPositie = sameDate.length ? Math.max(...sameDate.map((a) => a.positie)) : -1;
      return [...prev, { ...updated, positie: maxPositie + 1 }];
    });
    setSelectedArticle(null);
    setHasUnsavedChanges(true);
  };

  const handleDetailDelete = (article: Article) => {
    pushUndo();
    setArticles((prev) => prev.filter((a) => a.id !== article.id));
    setSelectedArticle(null);
    setHasUnsavedChanges(true);
  };

  const handleMoveToBacklog = (article: Article) => {
    pushUndo();
    setArticles((prev) =>
      prev.map((a) => (a.id === article.id ? { ...a, datum: null } : a))
    );
    setSelectedArticle(null);
    setHasUnsavedChanges(true);
  };

  const handleDuplicate = (article: Article, targetDate: string) => {
    pushUndo();
    const sameDate = articles.filter((a) => a.datum === targetDate);
    const maxPositie = sameDate.length ? Math.max(...sameDate.map((a) => a.positie)) : -1;
    const duplicate: Article = {
      ...article,
      id: `new-${Date.now()}`,
      datum: targetDate,
      positie: maxPositie + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setArticles((prev) => [...prev, duplicate]);
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
    pushUndo();
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
      setUndoStack([]);
      setRedoStack([]);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showFilters]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const q = searchQuery.trim().toLowerCase();
      if (q && !a.onderwerp.toLowerCase().includes(q) && !(a.opmerkingen ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterCategorie && a.categorie !== filterCategorie) return false;
      if (filterNaam && a.naam !== filterNaam) return false;
      if (filterRerun === "ja" && !a.rerun) return false;
      if (filterRerun === "nee" && a.rerun) return false;
      if (filterNieuwsbrief === "ja" && !a.nieuwsbrief) return false;
      return true;
    });
  }, [articles, searchQuery, filterStatus, filterCategorie, filterNaam, filterRerun, filterNieuwsbrief]);

  const uniqueStatuses = useMemo(() => [...new Set(articles.map((a) => a.status).filter(Boolean))].sort(), [articles]);
  const uniqueCategories = useMemo(() => [...new Set(articles.map((a) => a.categorie).filter(Boolean))].sort(), [articles]);
  const uniqueNamen = useMemo(() => [...new Set(articles.map((a) => a.naam).filter(Boolean))].sort(), [articles]);

  const getArticlesByDateForWeek = useCallback(
    (weekStartStr: string) => {
      const weekDates = getWeekDates(weekStartStr);
      return weekDates.reduce<Record<string, Article[]>>((acc, d) => {
        acc[d] = filteredArticles
          .filter((a) => a.datum != null && a.datum === d)
          .sort((a, b) => a.positie - b.positie);
        return acc;
      }, {});
    },
    [filteredArticles]
  );

  if (loading) {
    return <PlanningSkeleton />;
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8f9fa] p-6">
        <p className="text-center text-red-600">{loadError}</p>
        <p className="text-center text-base text-gray-500">
          Controleer of <code className="rounded bg-gray-200 px-1">DATABASE_URL</code> in .env een geldige Postgres-URL is (bijv. Neon).
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchArticles();
          }}
          className="rounded-lg bg-gray-800 px-4 py-2 text-base text-white hover:bg-gray-700"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa] pb-24">
      <header className="sticky top-0 z-30 border-b border-white/20 bg-[#4C8336] px-6 py-4">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <a
              href="https://www.gardenersworldmagazine.nl/"
              target="_blank"
              rel="noopener noreferrer"
              className="justify-self-start"
            >
              <img
                src="/GW-logo-transparant.webp"
                alt="Gardeners' World"
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </a>
            <h1 className="text-center text-2xl font-semibold capitalize text-[#ffffff]">
              {(visibleMonth || getMonthFromWeekStart(allWeeks[0] ?? new Date().toISOString().slice(0, 10)))}{" "}
              {visibleMonth ? visibleYear : getYearFromWeekStart(allWeeks[0] ?? new Date().toISOString().slice(0, 10))}
            </h1>
            <div className="relative flex justify-end items-center gap-2" ref={filterPanelRef}>
              <Link
                href="/backlog"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#ffffff]/90 hover:bg-white/20 hover:text-white transition-colors"
              >
                Backlog
              </Link>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  showFilters || searchQuery || filterStatus || filterCategorie || filterNaam || filterRerun || filterNieuwsbrief
                    ? "bg-white/30 text-[#ffffff] hover:bg-white/40"
                    : "bg-white/15 text-[#ffffff] hover:bg-white/25"
                }`}
                aria-expanded={showFilters}
                aria-haspopup="true"
                aria-label="Filter"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="#ffffff" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {(searchQuery || filterStatus || filterCategorie || filterNaam || filterRerun || filterNieuwsbrief) && (
                  <span className="flex h-2 w-2 rounded-full bg-[#ffffff]" aria-hidden />
                )}
              </button>
              {showFilters && (
                <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                  <div className="flex flex-col gap-3">
                    <input
                      type="search"
                      placeholder="Zoeken…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#4C8336] focus:outline-none focus:ring-1 focus:ring-[#4C8336]/30"
                    />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#4C8336] focus:outline-none"
                    >
                      <option value="">Alle statussen</option>
                      {uniqueStatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      value={filterCategorie}
                      onChange={(e) => setFilterCategorie(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#4C8336] focus:outline-none"
                    >
                      <option value="">Alle categorieën</option>
                      {uniqueCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={filterNaam}
                      onChange={(e) => setFilterNaam(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#4C8336] focus:outline-none"
                    >
                      <option value="">Alle namen</option>
                      {uniqueNamen.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <select
                      value={filterRerun}
                      onChange={(e) => setFilterRerun(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#4C8336] focus:outline-none"
                    >
                      <option value="">Rerun: alle</option>
                      <option value="ja">Alleen rerun</option>
                      <option value="nee">Geen rerun</option>
                    </select>
                    <select
                      value={filterNieuwsbrief}
                      onChange={(e) => setFilterNieuwsbrief(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#4C8336] focus:outline-none"
                    >
                      <option value="">Nieuwsbrief: alle</option>
                      <option value="ja">Alleen nieuwsbrief</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterStatus("");
                        setFilterCategorie("");
                        setFilterNaam("");
                        setFilterRerun("");
                        setFilterNieuwsbrief("");
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        searchQuery || filterStatus || filterCategorie || filterNaam || filterRerun || filterNieuwsbrief
                          ? "bg-[#4C8336] text-white hover:bg-[#3d6a2b]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      Filters wissen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
                <div className="px-3 py-2 text-base font-semibold text-gray-600">Week</div>
                {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((dag) => (
                  <div key={dag} className="px-2 py-2 text-center text-base font-semibold text-gray-600">
                    {dag}
                  </div>
                ))}
              </div>
              {allWeeks.map((ws) => {
                const weekEnd = new Date(ws + "T12:00:00");
                weekEnd.setDate(weekEnd.getDate() + 6);
                const weekEndStr = weekEnd.toISOString().slice(0, 10);
                const isPastWeek = weekEndStr < todayStr;
                return (
                  <WeekRow
                    key={ws}
                    id={`week-${ws}`}
                    weekStart={ws}
                    isActiveWeek={ws === currentWeekStart}
                    isPastWeek={isPastWeek}
                    articlesByDate={getArticlesByDateForWeek(ws)}
                    melding={getMeldingForWeek(ws)}
                    todayStr={todayStr}
                    onCardClick={handleCardClick}
                    onAddCard={handleAddCard}
                    onMeldingClick={setMeldingEditWeek}
                  />
                );
              })}
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
                            className="rounded px-1.5 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                          >
                            {activeArticle.categorie}
                          </span>
                        )}
                        {activeArticle.rerun && (
                          <span
                            className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: "#7B2E83" }}
                          >
                            Rerun
                          </span>
                        )}
                      </div>
                      <p className="min-w-0 font-medium line-clamp-3 text-sm leading-snug">
                        {activeArticle.onderwerp}
                      </p>
                    </div>
                    {activeArticle.naam && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
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

      <footer className="mt-auto flex justify-center border-t border-gray-200/60 bg-[#f8f9fa]/50 py-3">
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
            onDuplicate={handleDuplicate}
            onMoveToBacklog={handleMoveToBacklog}
          />
        </>
      )}

      {meldingEditWeek && (
        <MeldingPanel
          weekStart={meldingEditWeek}
          weekLabel={`Week ${getISOWeek(meldingEditWeek)}`}
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
          className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-base font-medium shadow-lg ${
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
