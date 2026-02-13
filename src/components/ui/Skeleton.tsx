import { cn } from '@/lib/utils';

/* ─── Base Skeleton Block ─── */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-brand-border/40',
        className
      )}
      style={style}
    />
  );
}

/* ─── Skeleton Table Rows (for Leads page) ─── */
export function SkeletonTableRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0 divide-y divide-brand-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          {/* Avatar */}
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          {/* Business name + industry */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 rounded" style={{ width: `${55 + (i % 3) * 15}%` }} />
            <Skeleton className="h-2.5 w-20 rounded" />
          </div>
          {/* Contact */}
          <div className="hidden md:block space-y-2 w-32">
            <Skeleton className="h-3 rounded" style={{ width: `${60 + (i % 2) * 20}%` }} />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
          {/* Email */}
          <div className="hidden lg:block w-40">
            <Skeleton className="h-3 rounded" style={{ width: `${50 + (i % 3) * 15}%` }} />
          </div>
          {/* Status */}
          <Skeleton className="w-20 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ─── Skeleton Post Cards (for CMO page) ─── */
export function SkeletonPostCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-brand-card border border-brand-border overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row">
            {/* Image placeholder */}
            <Skeleton className="lg:w-48 h-40 lg:h-auto shrink-0 rounded-none" />
            {/* Content */}
            <div className="flex-1 p-5 space-y-3">
              {/* Badges */}
              <div className="flex items-center gap-2">
                <Skeleton className="w-16 h-6 rounded-full" />
                <Skeleton className="w-20 h-6 rounded-full" />
                <Skeleton className="w-14 h-6 rounded-full" />
              </div>
              {/* Text lines */}
              <Skeleton className="h-3.5 rounded" style={{ width: `${80 + (i % 2) * 10}%` }} />
              <Skeleton className="h-3.5 rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
              <Skeleton className="h-3.5 w-2/5 rounded" />
              {/* Hashtags */}
              <div className="flex gap-2 pt-1">
                <Skeleton className="w-16 h-4 rounded" />
                <Skeleton className="w-20 h-4 rounded" />
                <Skeleton className="w-12 h-4 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Skeleton Message Bubbles (for Chat) ─── */
export function SkeletonMessageBubbles({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => {
        const isUser = i % 2 === 1;
        return (
          <div
            key={i}
            className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
          >
            {/* Avatar */}
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            {/* Bubble */}
            <div className={cn('space-y-2 max-w-[70%]', isUser ? 'items-end' : '')}>
              <Skeleton
                className="h-3.5 rounded"
                style={{ width: isUser ? '120px' : `${180 + (i % 2) * 60}px` }}
              />
              {!isUser && (
                <>
                  <Skeleton className="h-3.5 rounded" style={{ width: `${150 + (i % 3) * 40}px` }} />
                  <Skeleton className="h-3.5 rounded" style={{ width: '100px' }} />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Skeleton Stats Cards ─── */
export function SkeletonStatsCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-xl border border-brand-border bg-brand-card">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="w-9 h-9 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-20 rounded mb-2" />
          <Skeleton className="h-7 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ─── Full page skeleton ─── */
export function SkeletonPage() {
  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      {/* Content */}
      <SkeletonStatsCards />
      <SkeletonTableRows />
    </div>
  );
}
