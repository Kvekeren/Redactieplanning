"use client";

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
  onCardClick: (article: Article) => void;
  onAddCard: (date: string) => void;
}

export function WeekRow({ id, weekStart, isActiveWeek, todayStr, articlesByDate, onCardClick, onAddCard }: WeekRowProps) {
  const weekDates: string[] = [];
  const start = new Date(weekStart + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  const weekNum = getISOWeek(weekStart);

  return (
    <div
      id={id}
      className="grid min-w-[900px] grid-cols-[minmax(100px,120px)_repeat(7,minmax(100px,1fr))] gap-2 border-b border-gray-200/80 bg-white pt-6 last:border-b-0"
    >
      <div
        className={`sticky left-0 z-10 flex flex-col justify-center border-r border-gray-200/60 px-3 py-3 ${
          isActiveWeek ? "bg-emerald-100" : "bg-gray-50/30"
        }`}
      >
        <p className="text-sm font-semibold text-gray-800">Wk {weekNum}</p>
        <p className="text-xs text-gray-500">{formatWeekRange(weekStart)}</p>
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
