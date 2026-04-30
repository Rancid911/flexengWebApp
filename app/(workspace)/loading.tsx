export default function WorkspaceLoading() {
  return (
    <main className="min-h-[calc(100vh-4rem)] p-4 text-foreground sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-4">
        <div className="h-24 animate-pulse rounded-[2rem] bg-card/80" />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-[2rem] bg-card/80" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="h-32 animate-pulse rounded-[1.5rem] bg-card/80" />
              <div className="h-32 animate-pulse rounded-[1.5rem] bg-card/80" />
              <div className="h-32 animate-pulse rounded-[1.5rem] bg-card/80" />
            </div>
          </div>
          <div className="h-80 animate-pulse rounded-[2rem] bg-card/80" />
        </div>
      </div>
    </main>
  );
}
