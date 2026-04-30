export default function PublicLoading() {
  return (
    <main className="min-h-screen px-4 py-8 text-[#322F55] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-72 animate-pulse rounded-[2.5rem] bg-white/70" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-40 animate-pulse rounded-[2rem] bg-white/70" />
          <div className="h-40 animate-pulse rounded-[2rem] bg-white/70" />
          <div className="h-40 animate-pulse rounded-[2rem] bg-white/70" />
        </div>
      </div>
    </main>
  );
}
