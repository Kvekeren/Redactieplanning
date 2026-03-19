"use client";

import { getCategoryStyle } from "@/lib/categoryColors";
import { getStatusColor } from "@/lib/statusColors";
import type { Article } from "@/lib/types";

interface BacklogCardProps {
  article: Article;
  onClick: () => void;
}

export function BacklogCard({ article, onClick }: BacklogCardProps) {
  const categoryStyle = getCategoryStyle(article.categorie);

  return (
    <div
      onClick={onClick}
      className="
        relative cursor-pointer p-3
        rounded-xl border border-gray-200/80 bg-white shadow-sm
        transition-shadow hover:shadow-md hover:border-gray-300
      "
    >
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 self-start">
          {article.categorie && categoryStyle && (
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
            >
              {article.categorie}
            </span>
          )}
          {article.rerun && (
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: "#7B2E83" }}
            >
              Rerun
            </span>
          )}
        </div>
        <p className="min-w-0 font-medium text-gray-800 line-clamp-3 text-sm leading-snug">
          {article.onderwerp}
        </p>
      </div>
      {(article.naam || article.url?.trim()) && (
        <div className="mt-1 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            {article.naam && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500">
                {getStatusColor(article.status) && (
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${getStatusColor(article.status)}`}
                    aria-hidden
                  />
                )}
                {article.naam}
              </p>
            )}
          </div>
          {article.url?.trim() && (
            <a
              href={article.url.startsWith("http") ? article.url : `https://${article.url}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              title="Open webpagina"
              aria-label="Open webpagina"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
