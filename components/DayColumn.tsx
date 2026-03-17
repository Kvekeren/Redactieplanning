"use client";

import { useDroppable } from "@dnd-kit/core";
import { ArticleCard } from "./ArticleCard";
import type { Article } from "@/lib/types";

const DAY_NAMES = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

interface DayColumnProps {
  date: string;
  articles: Article[];
  isActiveDay?: boolean;
  onCardClick: (article: Article) => void;
  onAddCard: (date: string) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const adjusted = day === 0 ? 6 : day - 1; // Ma=0, Zo=6
  return DAY_NAMES[adjusted];
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDate().toString();
}

export function DayColumn({ date, articles, isActiveDay, onCardClick, onAddCard }: DayColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: date });
  const baseBg = isActiveDay ? "border-gray-200/60 bg-amber-50/80" : "border-gray-200/60 bg-white/50";

  return (
    <div
      ref={setNodeRef}
      className={`
        group min-w-0 rounded-lg border-2 border-dashed p-2 transition-colors
        ${isOver ? "border-blue-300 bg-blue-50/60" : baseBg}
      `}
    >
      <div className="mb-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {formatDate(date)}
        </p>
        <p className="text-base font-semibold text-gray-700">{formatDateShort(date)}</p>
      </div>
      <div className="flex flex-col gap-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} onClick={() => onCardClick(article)} />
        ))}
        <button
          type="button"
          onClick={() => onAddCard(date)}
          className="group-hover:flex hidden items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300/80 py-2 text-xs font-medium text-gray-400 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nieuwe kaart
        </button>
      </div>
    </div>
  );
}
