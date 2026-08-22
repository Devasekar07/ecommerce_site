import { useProducts } from "../api/catalogApi";
import { HomeHero } from "../components/HomeHero";
import { ProductGrid } from "../components/ProductGrid";

export function HomePage() {
  const productsQuery = useProducts({ limit: 8 });

  return (
    <div>
      <HomeHero />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-leaf">Fresh in</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">Latest catalogue pieces</h2>
          </div>
        </div>
        <ProductGrid
          products={productsQuery.data?.items}
          isLoading={productsQuery.isLoading}
          isError={productsQuery.isError}
        />
      </section>
    </div>
  );
}
