import { useSearchParams } from "react-router-dom";
import { useProductFilterOptions, useProducts } from "../api/catalogApi";
import { CatalogFilterPanel } from "../components/CatalogFilterPanel";
import { ProductGrid } from "../components/ProductGrid";
import { isCustomerHiddenDepartmentSlug } from "../lib/customerDepartments";
import { parseProductFilters, updateFilterParams } from "../lib/productFilters";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedFilters = parseProductFilters(searchParams, { limit: 24, sort: searchParams.get("q") ? "relevance" : "newest" });
  const filters = isCustomerHiddenDepartmentSlug(parsedFilters.department)
    ? { ...parsedFilters, department: undefined, category: undefined }
    : parsedFilters;
  const productsQuery = useProducts(filters);
  const filterOptionsQuery = useProductFilterOptions(filters);
  const heading = filters.q ? `Search results for "${filters.q}"` : "Search catalogue";

  function updateSearchFilters(patch: Parameters<typeof updateFilterParams>[1]) {
    const nextParams = new URLSearchParams(searchParams);

    if (isCustomerHiddenDepartmentSlug(nextParams.get("department") ?? undefined)) {
      nextParams.delete("department");
      nextParams.delete("category");
    }

    setSearchParams(updateFilterParams(nextParams, patch));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="border-b border-ink/10 pb-8">
        <p className="text-sm font-semibold uppercase text-berry">Search</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">{heading}</h1>
        <p className="mt-4 text-sm text-ink/60">{productsQuery.data ? `${productsQuery.data.total} products` : null}</p>
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-[280px_1fr]">
        <CatalogFilterPanel
          filters={filters}
          options={filterOptionsQuery.data}
          isLoading={filterOptionsQuery.isLoading}
          showDepartments
          showCategories
          onChange={updateSearchFilters}
          onClear={() => setSearchParams(new URLSearchParams())}
        />
        <ProductGrid
          products={productsQuery.data?.items}
          isLoading={productsQuery.isLoading}
          isError={productsQuery.isError}
          emptyTitle="No matching products"
          emptyMessage="Try a different keyword, size, colour, fit or price."
        />
      </section>
    </div>
  );
}
