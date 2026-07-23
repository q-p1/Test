import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-2xl', className)} />;
}

/** Product card skeleton used during lazy loading. */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-3xl border border-ink-950/5 bg-white p-3">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-3 p-3">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-2/3 rounded-full" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
