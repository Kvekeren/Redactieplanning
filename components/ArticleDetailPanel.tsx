"use client";

import { useEffect, useState } from "react";
import { getCategoryStyle } from "@/lib/categoryColors";
import { MarkdownEditor } from "./MarkdownEditor";
import type { Article } from "@/lib/types";

interface ArticleDetailPanelProps {
  article: Article | null;
  onClose: () => void;
  onSave: (article: Article) => void;
}

export function ArticleDetailPanel({ article, onClose, onSave }: ArticleDetailPanelProps) {
  const [form, setForm] = useState<Partial<Article>>({});

  const NAAM_OPTIES = ["Lizanne", "Govert", "Iona", "Helga", "Koen"] as const;
  const STATUS_OPTIES = ["Mee bezig", "Gepubliceerd", "Ingepland"] as const;
  const CATEGORIE_OPTIES = [
    "Hub",
    "Moestuin",
    "Tuinklussen",
    "Kweken",
    "Biodiversiteit",
    "Inspiratie",
    "Kamerplanten",
    "Snoeien",
    "Pagina",
  ] as const;

  useEffect(() => {
    if (article) {
      setForm({
        id: article.id,
        datum: article.datum,
        onderwerp: article.onderwerp,
        url: article.url ?? "",
        naam: article.naam ?? "",
        status: article.status ?? "",
        categorie: article.categorie ?? "",
        opmerkingen: article.opmerkingen ?? "",
      });
    }
  }, [article]);

  if (!article) return null;

  const isNew = article.id.startsWith("new-");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.datum && form.onderwerp !== undefined && form.onderwerp.trim()) {
      onSave({
        ...article,
        datum: form.datum,
        onderwerp: form.onderwerp.trim(),
        url: form.url?.trim() || null,
        naam: form.naam ?? "",
        status: form.status ?? "",
        categorie: form.categorie ?? "",
        opmerkingen: form.opmerkingen ?? "",
      });
      onClose();
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-gray-200/80 px-3 py-2 text-gray-800 bg-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30";

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-gray-200/80 bg-white shadow-xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200/80 bg-white/90 backdrop-blur px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {isNew ? "Nieuw artikel" : "Artikel bewerken"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Sluiten"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto bg-[#f8f9fa] p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">Status</label>
              <div className="flex gap-2">
                {STATUS_OPTIES.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: opt }))}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                      form.status === opt
                        ? "bg-gray-800 text-white"
                        : "border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">Naam</label>
              <div className="flex flex-wrap gap-3">
                {NAAM_OPTIES.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, naam: form.naam === opt ? "" : opt }))}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        form.naam === opt
                          ? "bg-gray-800 text-white"
                          : "border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      {opt}
                    </span>
                    {form.naam === opt && (
                      <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Onderwerp</label>
              <input
                type="text"
                value={form.onderwerp ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, onderwerp: e.target.value }))}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Datum</label>
              <input
                type="date"
                value={form.datum ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Url</label>
              <input
                type="url"
                value={form.url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                className={inputClasses}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">Categorie</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIE_OPTIES.map((opt) => {
                  const style = getCategoryStyle(opt);
                  const isSelected = form.categorie === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, categorie: form.categorie === opt ? "" : opt }))}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-all ${
                        isSelected ? "ring-2 ring-offset-2 ring-gray-500 shadow-md" : "hover:opacity-90"
                      }`}
                      style={
                        style
                          ? { backgroundColor: style.bg, color: style.text }
                          : { backgroundColor: "#e8e8e8", color: "#5a5a5a" }
                      }
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Opmerkingen</label>
              <MarkdownEditor
                value={form.opmerkingen ?? ""}
                onChange={(val) => setForm((f) => ({ ...f, opmerkingen: val }))}
                placeholder="Notities, deadlines, etc. Gebruik markdown: **vet**, *cursief*, # kop, - bullet"
                minRows={4}
              />
            </div>
          </div>
          <div className="mt-auto flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200/80 px-4 py-2 font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              {isNew ? "Kaart toevoegen" : "Wijzigingen toepassen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
