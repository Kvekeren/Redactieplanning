"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { getCategoryStyle } from "@/lib/categoryColors";
import { getStatusColor } from "@/lib/statusColors";
import type { Article } from "@/lib/types";

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: article.id,
    data: { article },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const categoryStyle = getCategoryStyle(article.categorie);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        relative cursor-grab active:cursor-grabbing p-2
        rounded-xl border border-gray-200/80 bg-white shadow-sm
        transition-shadow hover:shadow-md hover:border-gray-300
        ${isDragging ? "opacity-60 shadow-lg ring-2 ring-blue-300" : ""}
      `}
    >
      {article.categorie && categoryStyle && (
        <span
          className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
        >
          {article.categorie}
        </span>
      )}
      <p className="pr-10 font-medium text-gray-800 line-clamp-3 text-xs leading-snug">
        {article.url?.trim() ? (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-800 hover:underline cursor-pointer"
          >
            {article.onderwerp}
          </a>
        ) : (
          article.onderwerp
        )}
      </p>
      {article.naam && (
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500">
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
  );
}
