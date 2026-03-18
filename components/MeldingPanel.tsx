"use client";

import { useState, useEffect, useRef } from "react";

interface MeldingPanelProps {
  weekStart: string;
  weekLabel: string;
  initialTekst: string;
  onSave: (tekst: string) => void;
  onClose: () => void;
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
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

export function MeldingPanel({
  weekStart,
  weekLabel,
  initialTekst,
  onSave,
  onClose,
}: MeldingPanelProps) {
  const [tekst, setTekst] = useState(initialTekst);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tekst.trim());
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-gray-800">Melding voor {weekLabel}</h3>
        <p className="mb-4 text-sm text-gray-500">{formatWeekRange(weekStart)}</p>
        <form onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            placeholder="Bijv. Start branding campagne op 19 maart"
            className="mb-4 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
