function SearchPulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-white/80 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ${className}`} />;
}

export function SearchPageLoadingSkeleton() {
  return (
    <main
      id="main-content"
      data-testid="search-page-loading-skeleton"
      className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-10 sm:px-6 lg:px-8"
    >
      <section className="overflow-hidden rounded-[2rem] border border-[#5F578E] bg-[linear-gradient(135deg,#2D284A_0%,#3E3762_46%,#4A4476_100%)] px-6 py-5 text-white shadow-[0_20px_48px_rgba(25,18,46,0.28)] sm:px-8 sm:py-6">
        <div className="space-y-5">
          <div className="space-y-3">
            <SearchPulseBlock className="h-10 w-full max-w-2xl rounded-2xl bg-white/25 shadow-none" />
            <SearchPulseBlock className="h-4 w-full max-w-md rounded-full bg-white/20 shadow-none" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchPulseBlock className="h-12 flex-1 rounded-2xl shadow-none" />
            <SearchPulseBlock className="h-12 w-full rounded-2xl bg-[#ffd84d]/80 shadow-none sm:w-28" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <SearchPulseBlock key={`search-section-chip-${index}`} className="h-9 w-24 rounded-xl bg-white/20 shadow-none" />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-[2rem] border border-[#e5e9f0] bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchPulseBlock className="h-6 w-40 rounded-xl shadow-none" />
          <SearchPulseBlock className="h-4 w-28 rounded-full shadow-none" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`search-result-row-${index}`} className="space-y-3 rounded-[1.25rem] border border-[#edf2fb] bg-[#fbfdff] p-4">
              <div className="flex flex-wrap gap-2">
                <SearchPulseBlock className="h-6 w-20 rounded-full shadow-none" />
                <SearchPulseBlock className="h-6 w-28 rounded-full shadow-none" />
              </div>
              <SearchPulseBlock className="h-5 w-full max-w-lg rounded-xl shadow-none" />
              <SearchPulseBlock className="h-4 w-full rounded-full shadow-none" />
              <SearchPulseBlock className="h-4 w-2/3 rounded-full shadow-none" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
