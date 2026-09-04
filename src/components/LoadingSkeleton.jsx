export function SkeletonBlock({ className = '' }) {
  return <span aria-hidden="true" className={`bp-skeleton block ${className}`} />
}

export function EventCardSkeletons({ compact = false, count = 3 }) {
  return (
    <div
      aria-label="Loading events"
      aria-live="polite"
      className={compact ? 'bp-panel-outline mt-8 bg-[var(--bp-surface)]' : 'mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),24rem))] justify-start gap-7'}
      role="status"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className={compact ? 'flex items-center gap-4 border-b border-[var(--bp-border)] p-5 last:border-b-0' : 'bp-event-card bg-[var(--bp-surface)] p-6'} key={index}>
          <SkeletonBlock className={compact ? 'h-20 w-32 shrink-0' : 'aspect-video w-full'} />
          <div className={compact ? 'min-w-0 flex-1' : 'mt-5'}>
            <SkeletonBlock className="h-5 w-2/3" />
            <SkeletonBlock className="mt-3 h-4 w-5/6" />
            {!compact && <SkeletonBlock className="mt-2 h-4 w-1/2" />}
          </div>
        </div>
      ))}
      <span className="sr-only">Loading events...</span>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div aria-label="Loading your event activity" aria-live="polite" className="mt-6" role="status">
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="border border-[var(--bp-border)] bg-[var(--bp-surface)] p-5" key={index}>
            <SkeletonBlock className="h-3 w-2/3" />
            <SkeletonBlock className="mt-4 h-9 w-1/3" />
          </div>
        ))}
      </div>
      <div className="mt-6 border border-[var(--bp-border)] bg-[var(--bp-surface)] p-6">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-5 h-6 w-1/2" />
        <SkeletonBlock className="mt-4 h-4 w-3/4" />
      </div>
      <span className="sr-only">Loading your event activity...</span>
    </div>
  )
}

export function EventDetailSkeleton() {
  return (
    <section aria-label="Loading event" aria-live="polite" className="mx-auto max-w-5xl px-6 py-12 sm:py-20 lg:px-10" role="status">
      <SkeletonBlock className="h-5 w-32" />
      <div className="bp-panel-outline mt-8 bg-[var(--bp-surface)] p-6 sm:p-10">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="mt-5 h-10 w-2/3" />
        <SkeletonBlock className="mt-8 aspect-video w-full" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-16 w-full" />
        </div>
      </div>
      <span className="sr-only">Loading event...</span>
    </section>
  )
}
