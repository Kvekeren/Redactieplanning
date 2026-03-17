"use client";

import { useState } from "react";
import { DayColumn } from "./DayColumn";
import type { Article } from "@/lib/types";

function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const dayNum = d.getDay() || 7; // Zo = 7
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatWeekRange(dateStr: string) {
  const start = new Date(dateStr + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

interface WeekRowProps {
  id?: string;
  weekStart: string;
  isActiveWeek?: boolean;
  todayStr: string;
  articlesByDate: Record<string, Article[]>;
  melding: string | null;
  onCardClick: (article: Article) => void;
  onAddCard: (date: string) => void;
  onMeldingClick: (weekStart: string) => void;
}

export function WeekRow({
  id,
  weekStart,
  isActiveWeek,
  todayStr,
  articlesByDate,
  melding,
  onCardClick,
  onAddCard,
  onMeldingClick,
}: WeekRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const weekDates: string[] = [];
  const start = new Date(weekStart + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  const weekNum = getISOWeek(weekStart);
  const showPlus = !melding && isHovered;

  return (
    <div
      id={id}
      className="grid min-w-[900px] grid-cols-[minmax(100px,120px)_repeat(7,minmax(100px,1fr))] gap-2 border-b border-gray-200/80 bg-white pt-6 last:border-b-0"
    >
      <div
        className="sticky left-0 z-10 flex flex-col gap-2 border-r border-gray-200/60 px-3 py-3 bg-gray-50/30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`inline-flex w-fit flex-col rounded-lg px-2.5 py-1.5 ${
            isActiveWeek ? "bg-emerald-100/90" : ""
          }`}
        >
          <p className="text-sm font-semibold text-gray-800">Wk {weekNum}</p>
          <p className="text-xs text-gray-500">{formatWeekRange(weekStart)}</p>
        </div>
        {melding ? (
          <button
            type="button"
            onClick={() => onMeldingClick(weekStart)}
            className="inline-flex w-fit max-w-full flex-col rounded-lg px-2.5 py-1.5 text-left transition-opacity hover:opacity-95"
            style={{ backgroundColor: "#FFF8DC" }}
          >
            <p className="text-xs text-amber-900/90">{melding}</p>
          </button>
        ) : showPlus ? (
          <button
            type="button"
            onClick={() => onMeldingClick(weekStart)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: "#FFF8DC" }}
            aria-label="Melding toevoegen"
          >
            <svg className="h-3.5 w-3.5 text-amber-800/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ) : null}
      </div>
      {weekDates.map((date) => (
        <DayColumn
          key={date}
          date={date}
          articles={articlesByDate[date] ?? []}
          isActiveDay={date === todayStr}
          onCardClick={onCardClick}
          onAddCard={onAddCard}
        />
      ))}
    </div>
  );
}
