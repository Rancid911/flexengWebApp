function PulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-white/80 shadow-[0_14px_30px_rgba(15,23,42,0.04)] ${className}`} />;
}

function PageFrame({ children, width = "max-w-7xl" }: { children: React.ReactNode; width?: string }) {
  return <div className={`mx-auto w-full ${width} space-y-5`}>{children}</div>;
}

function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <PulseBlock className="h-5 w-36 rounded-full" />
      <PulseBlock className="h-12 w-full max-w-xl rounded-2xl" />
      <PulseBlock className="h-4 w-full max-w-md rounded-full" />
    </div>
  );
}

function ListSkeleton({ count = 4, rowClassName = "h-20 rounded-[1.25rem]" }: { count?: number; rowClassName?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <PulseBlock key={`list-skeleton-${index}`} className={rowClassName} />
      ))}
    </div>
  );
}

function DashboardWidgetSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-4 rounded-[1.6rem] border border-[#dfe9fb] bg-white p-5 shadow-[0_16px_42px_rgba(27,73,155,0.08)] ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PulseBlock className="h-11 w-11 shrink-0 rounded-2xl bg-[#eef5ff] shadow-none" />
          <PulseBlock className="h-6 w-36 max-w-full rounded-xl bg-[#e8eef7] shadow-none" />
        </div>
        <PulseBlock className="h-8 w-20 shrink-0 rounded-full bg-[#eef4fb] shadow-none" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`dashboard-widget-row-${index}`} className="flex items-center justify-between gap-4 rounded-[1.15rem] border border-[#dfe9fb] bg-white px-4 py-4">
            <div className="min-w-0 flex-1 space-y-2">
              <PulseBlock className="h-4 w-4/5 rounded-full bg-[#e7edf6] shadow-none" />
              <PulseBlock className="h-3 w-1/2 rounded-full bg-[#edf2f8] shadow-none" />
            </div>
            <PulseBlock className="h-9 w-9 shrink-0 rounded-2xl bg-[#f3f7fc] shadow-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSummaryCardSkeleton() {
  return (
    <div className="rounded-[1.45rem] border border-[#dfe9fb] bg-white p-5 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PulseBlock className="h-10 w-10 shrink-0 rounded-2xl bg-[#f0f6ff] shadow-none" />
          <PulseBlock className="h-4 w-28 rounded-full bg-[#e7edf6] shadow-none" />
        </div>
        <PulseBlock className="h-8 w-20 shrink-0 rounded-full bg-[#f5f9ff] shadow-none" />
      </div>
      <PulseBlock className="mt-4 h-10 w-24 rounded-2xl bg-[#dfe7f2] shadow-none" />
    </div>
  );
}

const BOOTSTRAP_SPINNER_SEGMENTS = Array.from({ length: 12 });

export function BootstrapSpinnerLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7f9] px-4 text-slate-700" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12" aria-hidden="true">
          {BOOTSTRAP_SPINNER_SEGMENTS.map((_, index) => (
            <span
              key={`bootstrap-spinner-segment-${index}`}
              className="absolute left-1/2 top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-slate-500"
              style={{
                animationDelay: `${index * 80}ms`,
                animationDuration: "960ms",
                opacity: 0.18 + index * 0.055,
                transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-1rem)`
              }}
            />
          ))}
        </div>
        <p className="text-sm font-medium text-slate-500">Загружаем рабочую область…</p>
      </div>
    </div>
  );
}

export function WorkspaceBootstrapLoadingSkeleton() {
  return <BootstrapSpinnerLoading />;
}

export function WorkspaceNeutralLoadingSkeleton() {
  return <BootstrapSpinnerLoading />;
}

export function WorkspaceDashboardLoadingSkeleton() {
  return (
    <div className="space-y-4 pb-8">
      <section className="overflow-hidden rounded-[1.75rem] border border-[#d6e2f3] bg-[linear-gradient(135deg,#eaf3ff_0%,#f8fbff_48%,#ffffff_100%)] shadow-[0_22px_52px_rgba(37,86,216,0.1)]">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.78fr] lg:items-center lg:p-7">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <PulseBlock className="h-9 w-28 rounded-full bg-white shadow-[0_10px_24px_rgba(18,32,59,0.08)]" />
              <PulseBlock className="h-9 w-20 rounded-full bg-white/80 shadow-none" />
            </div>
            <div className="space-y-3">
              <PulseBlock className="h-10 w-full max-w-[34rem] rounded-2xl bg-white shadow-none sm:h-12 lg:h-14" />
              <PulseBlock className="h-4 w-full max-w-xl rounded-full bg-white/80 shadow-none" />
              <PulseBlock className="h-4 w-4/5 max-w-lg rounded-full bg-white/70 shadow-none" />
            </div>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <PulseBlock key={`dashboard-overview-pill-${index}`} className="h-10 w-32 rounded-xl bg-white/80 shadow-none" />
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PulseBlock className="h-12 w-full rounded-[1.1rem] bg-white shadow-none sm:w-40" />
              <PulseBlock className="h-12 w-full rounded-[1.1rem] bg-white/70 shadow-none sm:w-44" />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/80 bg-white/95 p-5 shadow-[0_24px_56px_rgba(18,32,59,0.12)] sm:p-6">
            <div className="space-y-5">
              <div className="space-y-3">
                <PulseBlock className="h-4 w-32 rounded-full bg-[#e7edf6] shadow-none" />
                <PulseBlock className="h-12 w-28 rounded-2xl bg-[#dde7f4] shadow-none" />
                <div className="h-2.5 overflow-hidden rounded-full bg-[#e9eef7]">
                  <PulseBlock className="h-full w-2/3 rounded-full bg-[#cbd9ed] shadow-none" />
                </div>
                <PulseBlock className="h-4 w-4/5 rounded-full bg-[#e7edf6] shadow-none" />
              </div>
              <div className="space-y-3 border-t border-[#e7edf8] pt-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`dashboard-status-row-${index}`} className="flex items-center justify-between gap-3 rounded-[1rem] py-1.5">
                    <PulseBlock className="h-4 w-28 rounded-full bg-[#edf2f8] shadow-none" />
                    <PulseBlock className="h-6 w-16 rounded-xl bg-[#e1e9f4] shadow-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.12fr_1.04fr_0.82fr]">
        <div className="rounded-[1.6rem] border border-[#cfe0f8] bg-white p-4 shadow-[0_16px_42px_rgba(27,73,155,0.08)] sm:p-5 lg:col-span-2 xl:col-span-3">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <PulseBlock className="h-14 w-14 rounded-2xl bg-[#eaf4ff] shadow-none" />
            <div className="min-w-0 space-y-2">
              <PulseBlock className="h-4 w-32 rounded-full bg-[#edf2f8] shadow-none" />
              <PulseBlock className="h-6 w-full max-w-lg rounded-xl bg-[#e4ebf5] shadow-none" />
              <PulseBlock className="h-4 w-full max-w-3xl rounded-full bg-[#edf2f8] shadow-none" />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:w-[250px] lg:flex-col">
              <PulseBlock className="h-11 w-full rounded-[1rem] bg-[#e2eaf6] shadow-none" />
              <PulseBlock className="h-11 w-full rounded-[1rem] bg-[#f0f5fb] shadow-none" />
            </div>
          </div>
        </div>

        <DashboardWidgetSkeleton />
        <DashboardWidgetSkeleton />
        <DashboardWidgetSkeleton className="lg:col-span-2 xl:col-span-1" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.12fr_1.04fr_0.82fr]">
        {Array.from({ length: 3 }).map((_, index) => (
          <DashboardSummaryCardSkeleton key={`dashboard-summary-card-${index}`} />
        ))}
      </section>
    </div>
  );
}

export function WorkspaceScheduleLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame>
        <PageHeaderSkeleton />
        <div className="grid gap-3 rounded-[1.75rem] bg-white/70 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)] lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <PulseBlock key={`schedule-filter-${index}`} className="h-11 rounded-2xl shadow-none" />
          ))}
        </div>
        <ListSkeleton count={4} rowClassName="h-28 rounded-[1.5rem]" />
      </PageFrame>
    </div>
  );
}

export function WorkspaceStudentDirectoryLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame>
        <PageHeaderSkeleton />
        <PulseBlock className="h-12 rounded-2xl" />
        <ListSkeleton count={5} rowClassName="h-24 rounded-[1.5rem]" />
      </PageFrame>
    </div>
  );
}

export function WorkspaceStudentProfileLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame>
        <PulseBlock className="h-36 rounded-[1.75rem]" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <ListSkeleton count={3} rowClassName="h-28 rounded-[1.5rem]" />
          <div className="space-y-4">
            <PulseBlock className="h-32 rounded-[1.5rem]" />
            <PulseBlock className="h-44 rounded-[1.5rem]" />
          </div>
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceAdminLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame>
        <PageHeaderSkeleton />
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <PulseBlock key={`admin-tab-${index}`} className="h-11 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <PulseBlock className="h-96 rounded-[1.5rem]" />
          <ListSkeleton count={5} rowClassName="h-20 rounded-[1.25rem]" />
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceAdminDirectoryLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-6xl">
        <PulseBlock className="h-44 rounded-[2rem]" />
        <div className="space-y-5 rounded-[2rem] bg-white/75 p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <PulseBlock className="h-7 w-48 rounded-xl shadow-none" />
              <PulseBlock className="h-4 w-80 max-w-full rounded-full shadow-none" />
            </div>
            <PulseBlock className="h-11 w-full max-w-md rounded-2xl shadow-none" />
          </div>
          <ListSkeleton count={5} rowClassName="h-24 rounded-[1.35rem]" />
          <div className="flex flex-col gap-3 border-t border-[#edf2fb] pt-3 sm:flex-row sm:items-center sm:justify-between">
            <PulseBlock className="h-4 w-32 rounded-full shadow-none" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <PulseBlock key={`admin-directory-page-${index}`} className="h-9 w-9 rounded-xl shadow-none" />
              ))}
            </div>
          </div>
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceAdminProfileLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-6xl">
        <PulseBlock className="h-40 rounded-[2rem]" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <PulseBlock key={`admin-profile-tab-${index}`} className="h-10 w-28 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <PulseBlock className="h-36 rounded-[1.5rem]" />
            <div className="grid gap-4 md:grid-cols-2">
              <PulseBlock className="h-44 rounded-[1.5rem]" />
              <PulseBlock className="h-44 rounded-[1.5rem]" />
            </div>
            <ListSkeleton count={3} rowClassName="h-24 rounded-[1.25rem]" />
          </div>
          <div className="space-y-4">
            <PulseBlock className="h-32 rounded-[1.5rem]" />
            <PulseBlock className="h-56 rounded-[1.5rem]" />
          </div>
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceAdminPaymentsLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-7xl">
        <PulseBlock className="h-44 rounded-[2rem]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <PulseBlock key={`admin-payment-metric-${index}`} className="h-28 rounded-[1.5rem]" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.9fr)]">
          <div className="space-y-5 rounded-[2rem] bg-white/75 p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <PulseBlock className="h-7 w-44 rounded-xl shadow-none" />
                <PulseBlock className="h-4 w-80 max-w-full rounded-full shadow-none" />
              </div>
              <PulseBlock className="h-11 w-full max-w-sm rounded-2xl shadow-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <PulseBlock key={`admin-payment-filter-${index}`} className="h-9 w-28 rounded-full shadow-none" />
              ))}
            </div>
            <ListSkeleton count={4} rowClassName="h-28 rounded-[1.4rem]" />
          </div>
          <div className="space-y-4">
            <PulseBlock className="h-64 rounded-[2rem]" />
            <PulseBlock className="h-36 rounded-[1.5rem]" />
          </div>
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceCrmLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-none">
        <PageHeaderSkeleton />
        <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`crm-column-${index}`} className="space-y-3 rounded-[1.5rem] bg-white/70 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
              <PulseBlock className="h-8 rounded-xl shadow-none" />
              <ListSkeleton count={3} rowClassName="h-24 rounded-[1.25rem]" />
            </div>
          ))}
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceSettingsLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-5xl">
        <PageHeaderSkeleton />
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <PulseBlock className="h-56 rounded-[1.5rem]" />
          <div className="space-y-4 rounded-[1.5rem] bg-white/70 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
            <PulseBlock className="h-12 rounded-2xl shadow-none" />
            <PulseBlock className="h-12 rounded-2xl shadow-none" />
            <PulseBlock className="h-12 rounded-2xl shadow-none" />
            <PulseBlock className="h-24 rounded-2xl shadow-none" />
          </div>
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceStudentDashboardLoadingSkeleton() {
  return <WorkspaceDashboardLoadingSkeleton />;
}

export function WorkspaceStudentPaymentsLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-5xl">
        <PageHeaderSkeleton />
        <PulseBlock className="h-36 rounded-[1.75rem]" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <PulseBlock key={`student-payment-plan-${index}`} className="h-40 rounded-[1.5rem]" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <ListSkeleton count={4} rowClassName="h-16 rounded-2xl" />
          <PulseBlock className="h-56 rounded-[1.5rem]" />
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceHomeworkListLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-6xl">
        <PageHeaderSkeleton />
        <div className="flex flex-wrap gap-3 rounded-[1.5rem] bg-white/70 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
          {Array.from({ length: 4 }).map((_, index) => (
            <PulseBlock key={`homework-tab-${index}`} className="h-10 w-28 rounded-full shadow-none" />
          ))}
        </div>
        <ListSkeleton count={4} rowClassName="h-28 rounded-[1.5rem]" />
      </PageFrame>
    </div>
  );
}

export function WorkspaceHomeworkDetailLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-6xl">
        <PulseBlock className="h-36 rounded-[1.75rem]" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <PulseBlock className="h-24 rounded-[1.5rem]" />
            <ListSkeleton count={4} rowClassName="h-20 rounded-[1.25rem]" />
          </div>
          <div className="space-y-4">
            <PulseBlock className="h-32 rounded-[1.5rem]" />
            <PulseBlock className="h-48 rounded-[1.5rem]" />
          </div>
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceWordsLibraryLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-6xl">
        <PageHeaderSkeleton />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <PulseBlock key={`words-filter-${index}`} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <PulseBlock className="h-72 rounded-[1.5rem]" />
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <PulseBlock key={`words-counter-${index}`} className="h-20 rounded-[1.25rem]" />
              ))}
            </div>
            <ListSkeleton count={5} rowClassName="h-16 rounded-2xl" />
          </div>
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceWordsTrainerLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-4xl">
        <PageHeaderSkeleton />
        <PulseBlock className="h-3 rounded-full" />
        <div className="mx-auto w-full max-w-2xl space-y-5">
          <PulseBlock className="h-80 rounded-[2rem]" />
          <div className="grid gap-3 sm:grid-cols-2">
            <PulseBlock className="h-14 rounded-2xl" />
            <PulseBlock className="h-14 rounded-2xl" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <PulseBlock key={`words-trainer-action-${index}`} className="h-12 rounded-2xl" />
            ))}
          </div>
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspacePracticeOverviewLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-6xl">
        <PageHeaderSkeleton />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <PulseBlock key={`practice-overview-tab-${index}`} className="h-10 w-28 rounded-full" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`practice-overview-card-${index}`} className="space-y-4 rounded-[2rem] bg-white/75 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <PulseBlock className="h-7 w-32 rounded-full shadow-none" />
              <PulseBlock className="h-8 rounded-xl shadow-none" />
              <PulseBlock className="h-28 rounded-[1.5rem] shadow-none" />
              <PulseBlock className="h-11 w-36 rounded-full shadow-none" />
            </div>
          ))}
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspacePracticeLibraryLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-6xl">
        <PageHeaderSkeleton />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <PulseBlock key={`practice-library-nav-${index}`} className="h-10 w-28 rounded-full" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <PulseBlock key={`practice-library-filter-${index}`} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`practice-library-card-${index}`} className="space-y-4 rounded-[1.8rem] bg-white/75 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <div className="flex gap-2">
                <PulseBlock className="h-7 w-24 rounded-full shadow-none" />
                <PulseBlock className="h-7 w-16 rounded-full shadow-none" />
              </div>
              <PulseBlock className="h-8 rounded-xl shadow-none" />
              <PulseBlock className="h-4 rounded-full shadow-none" />
              <div className="flex items-center justify-between gap-3">
                <PulseBlock className="h-4 w-28 rounded-full shadow-none" />
                <PulseBlock className="h-10 w-24 rounded-full shadow-none" />
              </div>
            </div>
          ))}
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspacePracticeTopicLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-6xl">
        <PageHeaderSkeleton />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <PulseBlock key={`practice-topic-nav-${index}`} className="h-10 w-28 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`practice-topic-card-${index}`} className="space-y-5 rounded-[1.8rem] bg-white/75 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <PulseBlock className="h-7 w-24 rounded-full shadow-none" />
              <PulseBlock className="h-9 rounded-xl shadow-none" />
              <PulseBlock className="h-4 rounded-full shadow-none" />
              <div className="grid grid-cols-2 gap-3">
                <PulseBlock className="h-16 rounded-2xl shadow-none" />
                <PulseBlock className="h-16 rounded-2xl shadow-none" />
              </div>
            </div>
          ))}
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspacePracticeActivityLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame width="max-w-5xl">
        <PageHeaderSkeleton />
        <div className="space-y-6 rounded-[2rem] bg-white/75 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PulseBlock className="h-7 w-28 rounded-full shadow-none" />
            <PulseBlock className="h-4 w-36 rounded-full shadow-none" />
          </div>
          <PulseBlock className="h-56 rounded-[1.5rem] shadow-none" />
          <div className="grid gap-3 md:grid-cols-2">
            <PulseBlock className="h-14 rounded-2xl shadow-none" />
            <PulseBlock className="h-14 rounded-2xl shadow-none" />
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <PulseBlock className="h-11 w-28 rounded-full shadow-none" />
            <PulseBlock className="h-11 w-36 rounded-full shadow-none" />
          </div>
        </div>
      </PageFrame>
    </div>
  );
}
