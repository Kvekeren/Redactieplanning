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
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString("nl-NL", { month: "long" });
  const endMonth = end.toLocaleDateString("nl-NL", { month: "long" });
  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}

interface WeekRowProps {
  id?: string;
  weekStart: string;
  isActiveWeek?: boolean;
  isPastWeek?: boolean;
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
  isPastWeek,
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
      className={`grid min-w-[900px] grid-cols-[minmax(100px,120px)_repeat(7,minmax(100px,1fr))] gap-2 pt-6 transition-colors ${
        isPastWeek ? "bg-gray-100/80" : "bg-white"
      }`}
    >
      <div
        className={`sticky left-0 z-10 flex flex-col gap-2 px-3 py-3 transition-colors ${
          isPastWeek ? "bg-gray-200/40" : "bg-gray-50/30"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`inline-flex w-fit flex-col rounded-lg px-2.5 py-1.5 ${
            isActiveWeek ? "bg-emerald-100/90" : isPastWeek ? "bg-gray-200/60" : ""
          }`}
        >
          <p className={`text-base font-semibold ${isPastWeek ? "text-gray-600" : "text-gray-800"}`}>
            Week {weekNum}
          </p>
          <p className={`text-sm ${isPastWeek ? "text-gray-500" : "text-gray-500"}`}>
            {formatWeekRange(weekStart)}
          </p>
        </div>
        {melding ? (
          <button
            type="button"
            onClick={() => onMeldingClick(weekStart)}
            className="inline-flex w-fit max-w-full flex-col rounded-lg px-2.5 py-1.5 text-left transition-opacity hover:opacity-95"
            style={{ backgroundColor: "#FFF8DC" }}
          >
            <p className="text-sm text-amber-900/90">{melding}</p>
          </button>
        ) : showPlus ? (
          <button
            type="button"
            onClick={() => onMeldingClick(weekStart)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: "#FFF8DC" }}
            aria-label="Melding toevoegen"
          >
            <svg className="h-4 w-4 text-amber-800/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          isPastWeek={isPastWeek}
          onCardClick={onCardClick}
          onAddCard={onAddCard}
        />
      ))}
    </div>
  );
}
