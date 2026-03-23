export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-5">
      <div className="grid gap-4">
        <div className="h-20 animate-pulse rounded-2xl bg-card" />
        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-2xl bg-card" />
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              <div className="h-36 animate-pulse rounded-2xl bg-card" />
              <div className="h-36 animate-pulse rounded-2xl bg-card" />
              <div className="h-36 animate-pulse rounded-2xl bg-card" />
            </div>
            <div className="h-40 animate-pulse rounded-2xl bg-card" />
          </div>
          <div className="h-[320px] animate-pulse rounded-2xl bg-card" />
        </div>
      </div>
    </main>
  );
}
