function BlogPulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-white/80 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ${className}`} />;
}

function PublicPageFrame({ children, width = "max-w-6xl" }: { children: React.ReactNode; width?: string }) {
  return <div className={`mx-auto w-full ${width} space-y-6 px-4 py-10 sm:px-6 lg:py-14`}>{children}</div>;
}

function PublicArticleHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <BlogPulseBlock className="h-5 w-32 rounded-full" />
      <BlogPulseBlock className="h-12 w-full max-w-2xl rounded-2xl" />
      <BlogPulseBlock className="h-4 w-full max-w-xl rounded-full" />
    </div>
  );
}

export function PublicArticlesListLoadingSkeleton() {
  return (
    <PublicPageFrame>
      <PublicArticleHeaderSkeleton />
      <div className="grid gap-3 rounded-[1.5rem] bg-white/70 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)] md:grid-cols-[minmax(0,1fr)_12rem]">
        <BlogPulseBlock className="h-12 rounded-2xl shadow-none" />
        <BlogPulseBlock className="h-12 rounded-2xl shadow-none" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`article-card-${index}`} className="space-y-4 rounded-[1.5rem] bg-white/75 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
            <BlogPulseBlock className="h-40 rounded-[1.25rem] shadow-none" />
            <BlogPulseBlock className="h-4 w-24 rounded-full shadow-none" />
            <BlogPulseBlock className="h-8 rounded-xl shadow-none" />
            <BlogPulseBlock className="h-4 rounded-full shadow-none" />
            <BlogPulseBlock className="h-4 w-2/3 rounded-full shadow-none" />
          </div>
        ))}
      </div>
    </PublicPageFrame>
  );
}

export function PublicArticleDetailLoadingSkeleton() {
  return (
    <PublicPageFrame width="max-w-4xl">
      <PublicArticleHeaderSkeleton />
      <BlogPulseBlock className="h-72 rounded-[1.75rem]" />
      <div className="space-y-3 rounded-[1.5rem] bg-white/70 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
        {Array.from({ length: 7 }).map((_, index) => (
          <BlogPulseBlock
            key={`article-paragraph-${index}`}
            className={`h-4 rounded-full shadow-none ${index % 3 === 2 ? "w-3/4" : "w-full"}`}
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <BlogPulseBlock className="h-32 rounded-[1.25rem]" />
        <BlogPulseBlock className="h-32 rounded-[1.25rem]" />
      </div>
    </PublicPageFrame>
  );
}
