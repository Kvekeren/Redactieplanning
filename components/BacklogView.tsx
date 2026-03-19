"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArticleDetailPanel } from "./ArticleDetailPanel";
import { BacklogCard } from "./BacklogCard";
import { SaveBar } from "./SaveBar";
import type { Article } from "@/lib/types";

export function BacklogView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [saveMessage, setSaveMessage] = useState<"success" | { error: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      setLoadError(err instanceof Error ? err.message : "Kon backlog niet laden");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const backlogArticles = articles
    .filter((a) => a.datum == null)
    .sort((a, b) => a.positie - b.positie);

  const handleAddCard = () => {
    const newArticle: Article = {
      id: `new-${Date.now()}`,
      datum: null,
      onderwerp: "",
      url: null,
      naam: "",
      status: "",
      categorie: "",
      rerun: false,
      nieuwsbrief: false,
      opmerkingen: "",
      positie: backlogArticles.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedArticle(newArticle);
  };

  const handleDetailSave = (updated: Article) => {
    setArticles((prev) => {
      const exists = prev.some((a) => a.id === updated.id);
      if (exists) {
        return prev.map((a) => (a.id === updated.id ? updated : a));
      }
      return [...prev, { ...updated, positie: backlogArticles.length }];
    });
    setSelectedArticle(null);
    setHasUnsavedChanges(true);
  };

  const handleDetailDelete = (article: Article) => {
    setArticles((prev) => prev.filter((a) => a.id !== article.id));
    setSelectedArticle(null);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = (errBody as { error?: string })?.error ?? `Save failed (${res.status})`;
        throw new Error(msg);
      }
      setHasUnsavedChanges(false);
      await fetchArticles();
      setSaveMessage("success");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage({ error: err instanceof Error ? err.message : "Opslaan mislukt" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4C8336] border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8f9fa] p-6">
        <p className="text-center text-red-600">{loadError}</p>
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
        <div className="mx-auto flex max-w-[800px] items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              onClick={(e) => {
                if (hasUnsavedChanges && !window.confirm("Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je wilt weg? De wijzigingen gaan verloren.")) {
                  e.preventDefault();
                }
              }}
              className="text-[#ffffff]/90 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-[#ffffff]">Backlog</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[800px] px-4 py-6">
        <div className="flex flex-col gap-3">
          {backlogArticles.map((article) => (
            <BacklogCard
              key={article.id}
              article={article}
              onClick={() => setSelectedArticle(article)}
            />
          ))}
          <button
            type="button"
            onClick={handleAddCard}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-6 text-gray-500 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nieuwe kaart
          </button>
        </div>
      </main>

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
            isBacklog
            isExistingInBacklog={backlogArticles.some((a) => a.id === selectedArticle.id)}
          />
        </>
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
