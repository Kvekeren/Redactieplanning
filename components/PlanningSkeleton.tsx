"use client";

export function PlanningSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa]">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur px-6 py-4">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] overflow-x-auto px-4 py-6">
        <div className="min-w-[900px] rounded-lg border border-gray-200/60 bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(100px,120px)_repeat(7,minmax(100px,1fr))] gap-2 border-b border-gray-200/80 bg-gray-50/80 px-2 py-2">
            <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-5 w-12 animate-pulse rounded bg-gray-200 mx-auto" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="grid min-w-[900px] grid-cols-[minmax(100px,120px)_repeat(7,minmax(100px,1fr))] gap-2 bg-white pt-6"
            >
              <div className="sticky left-0 z-10 flex flex-col gap-2 px-3 py-3 bg-gray-50/30">
                <div className="h-14 w-24 animate-pulse rounded-lg bg-gray-200" />
              </div>
              {Array.from({ length: 7 }).map((_, colIdx) => (
                <div
                  key={colIdx}
                  className="min-w-0 rounded-lg border-2 border-dashed border-gray-200/60 p-2"
                >
                  <div className="mb-2 flex flex-col items-center gap-1">
                    <div className="h-4 w-10 animate-pulse rounded bg-gray-200" />
                    <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 2 + (rowIdx + colIdx) % 2 }).map((_, cardIdx) => (
                      <div
                        key={cardIdx}
                        className="h-20 animate-pulse rounded-xl bg-gray-100"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
