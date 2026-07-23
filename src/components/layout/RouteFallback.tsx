/** Full-page loading state shown while a lazy route chunk loads. */
export function RouteFallback() {
  return (
    <div className="grid min-h-[70vh] place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid h-12 w-12 place-items-center">
          <span className="absolute inset-0 animate-spin-slow rounded-full border-2 border-ink-200 border-t-accent-500" />
          <span className="h-2 w-2 rounded-full bg-accent-500" />
        </span>
        <span className="text-sm text-ink-400">جاري التحميل…</span>
      </div>
    </div>
  );
}
