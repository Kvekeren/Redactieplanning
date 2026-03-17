"use client";

import { useState } from "react";

interface MeldingCellProps {
  weekStart: string;
  melding: string | null;
  onMeldingClick: (weekStart: string) => void;
}

export function MeldingCell({ weekStart, melding, onMeldingClick }: MeldingCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const showPlus = !melding && isHovered;

  return (
    <div
      className="flex min-h-[60px] flex-col justify-center px-2 py-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {melding ? (
        <button
          type="button"
          onClick={() => onMeldingClick(weekStart)}
          className="w-full text-left text-xs font-medium text-gray-700 hover:text-gray-900"
        >
          {melding}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onMeldingClick(weekStart)}
          className={`flex min-h-[44px] w-full items-center justify-center rounded-lg border-2 border-dashed transition-all ${
            showPlus ? "border-amber-400/70" : "border-transparent"
          }`}
          aria-label="Melding toevoegen"
        >
          {showPlus && (
            <span className="flex h-8 w-8 items-center justify-center text-amber-600">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </span>
          )}
        </button>
      )}
    </div>
  );
}
