import type { StockStatus } from "../../../types/catalog";

export function StockBadge({ status }: { status: StockStatus }) {
  const label = {
    in_stock: "In stock",
    low_stock: "Low stock",
    out_of_stock: "Out of stock"
  }[status];

  const className = {
    in_stock: "bg-leaf/10 text-leaf",
    low_stock: "bg-berry/10 text-berry",
    out_of_stock: "bg-ink/10 text-ink/60"
  }[status];

  return <span className={`rounded px-2 py-1 text-xs font-medium ${className}`}>{label}</span>;
}
