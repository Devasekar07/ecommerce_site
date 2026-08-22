export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={label}>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded border border-ink/10 bg-white">
          <div className="aspect-[4/5] animate-pulse bg-ink/10" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-ink/10" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-ink/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
