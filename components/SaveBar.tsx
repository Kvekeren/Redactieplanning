"use client";

interface SaveBarProps {
  onSave: () => void;
  isSaving: boolean;
}

export function SaveBar({ onSave, isSaving }: SaveBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <p className="text-sm text-amber-700">
          <span className="font-medium">Niet-opgeslagen wijzigingen</span> – klik op Opslaan om te bewaren
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSaving ? "Bezig met opslaan…" : "Wijzigingen opslaan"}
        </button>
      </div>
    </div>
  );
}
