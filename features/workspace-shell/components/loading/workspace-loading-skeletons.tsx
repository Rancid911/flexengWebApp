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

function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <PulseBlock key={`card-skeleton-${index}`} className="h-32 rounded-[1.5rem]" />
      ))}
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

export function WorkspaceNeutralLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame>
        <PulseBlock className="h-16 rounded-[1.5rem]" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            <PulseBlock className="h-28 rounded-[1.5rem]" />
            <ListSkeleton count={3} rowClassName="h-16 rounded-2xl" />
          </div>
          <PulseBlock className="hidden h-56 rounded-[1.5rem] lg:block" />
        </div>
      </PageFrame>
    </div>
  );
}

export function WorkspaceDashboardLoadingSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame>
        <PageHeaderSkeleton />
        <CardGridSkeleton count={4} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <ListSkeleton count={3} rowClassName="h-24 rounded-[1.5rem]" />
          <PulseBlock className="h-80 rounded-[1.5rem]" />
        </div>
      </PageFrame>
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
  return (
    <div className="px-4 py-6 sm:px-6">
      <PageFrame>
        <PageHeaderSkeleton />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <PulseBlock key={`student-dashboard-summary-${index}`} className="h-28 rounded-[1.5rem]" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <PulseBlock className="h-36 rounded-[1.5rem]" />
            <div className="grid gap-4 md:grid-cols-2">
              <PulseBlock className="h-44 rounded-[1.5rem]" />
              <PulseBlock className="h-44 rounded-[1.5rem]" />
            </div>
            <ListSkeleton count={3} rowClassName="h-20 rounded-[1.25rem]" />
          </div>
          <div className="space-y-4">
            <PulseBlock className="h-32 rounded-[1.5rem]" />
            <PulseBlock className="h-52 rounded-[1.5rem]" />
          </div>
        </div>
      </PageFrame>
    </div>
  );
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
