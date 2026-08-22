type EmptyStateProps = {
  title?: string;
  message?: string;
};

export function EmptyState({
  title = "No products found",
  message = "There are no products available in this section yet."
}: EmptyStateProps) {
  return (
    <div className="rounded border border-ink/10 bg-white p-6 text-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-ink/70">{message}</p>
    </div>
  );
}
