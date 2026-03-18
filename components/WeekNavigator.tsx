"use client";

interface WeekNavigatorProps {
  weekStart: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
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

export function WeekNavigator({ weekStart, onPrev, onNext, onToday }: WeekNavigatorProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onPrev}
        className="rounded-lg border border-stone-200 px-3 py-2 text-stone-600 hover:bg-stone-50 hover:text-stone-800"
        aria-label="Vorige week"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="min-w-[220px] text-center">
        <p className="font-semibold text-stone-900">{formatWeekRange(weekStart)}</p>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="rounded-lg border border-stone-200 px-3 py-2 text-stone-600 hover:bg-stone-50 hover:text-stone-800"
        aria-label="Volgende week"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onToday}
        className="rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200"
      >
        Vandaag
      </button>
    </div>
  );
}
