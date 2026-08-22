import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { LoadingState } from "../../../components/LoadingState";
import type { Product } from "../../../types/catalog";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products?: Product[];
  isLoading: boolean;
  isError: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
};

export function ProductGrid({ products, isLoading, isError, emptyTitle, emptyMessage }: ProductGridProps) {
  if (isLoading) {
    return <LoadingState label="Loading products" />;
  }

  if (isError) {
    return <ErrorState />;
  }

  if (!products?.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
