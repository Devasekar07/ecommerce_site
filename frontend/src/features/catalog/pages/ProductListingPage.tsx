import { useParams, useSearchParams } from "react-router-dom";
import { ErrorState } from "../../../components/ErrorState";
import { LoadingState } from "../../../components/LoadingState";
import { NotFoundPage } from "./NotFoundPage";
import { useDepartment, useProductFilterOptions, useProducts } from "../api/catalogApi";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CatalogFilterPanel } from "../components/CatalogFilterPanel";
import { ProductGrid } from "../components/ProductGrid";
import { isCustomerHiddenDepartmentSlug } from "../lib/customerDepartments";
import { parseProductFilters, updateFilterParams } from "../lib/productFilters";

export function ProductListingPage() {
  const { departmentSlug, categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseProductFilters(searchParams, { department: departmentSlug, category: categorySlug, limit: 24 });
  const isHiddenDepartment = isCustomerHiddenDepartmentSlug(departmentSlug);
  const shouldFetchRoute = Boolean(departmentSlug && categorySlug && !isHiddenDepartment);
  const departmentQuery = useDepartment(shouldFetchRoute ? departmentSlug : undefined);
  const productsQuery = useProducts(filters, { enabled: shouldFetchRoute });
  const filterOptionsQuery = useProductFilterOptions(filters, { enabled: shouldFetchRoute });

  if (!departmentSlug || !categorySlug || isHiddenDepartment) {
    return <NotFoundPage />;
  }

  if (departmentQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState label="Loading category" />
      </div>
    );
  }

  if (departmentQuery.isError || !departmentQuery.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState title="Department not found" message="We could not load this department." />
      </div>
    );
  }

  const department = departmentQuery.data;
  const category = department.categories.find((item) => item.slug === categorySlug);

  if (!category) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState title="Category not found" message="We could not load this category." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="border-b border-ink/10 pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: department.name, href: `/departments/${department.slug}` },
            { label: category.name }
          ]}
        />
        <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">{category.name}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70">{category.description}</p>

        {category.subcategories.length ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {category.subcategories.map((subcategory) => (
              <span
                key={subcategory.id}
                className="rounded border border-ink/10 bg-white px-4 py-3 text-sm font-medium text-ink/75"
              >
                {subcategory.name}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="py-10">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase text-leaf">Catalogue</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">{category.name} products</h2>
          <div className="mt-3 text-sm text-ink/60">
            {productsQuery.data ? `${productsQuery.data.total} products` : null}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <CatalogFilterPanel
            filters={filters}
            options={filterOptionsQuery.data}
            isLoading={filterOptionsQuery.isLoading}
            onChange={(patch) => setSearchParams(updateFilterParams(searchParams, patch))}
            onClear={() => setSearchParams(new URLSearchParams())}
          />
          <ProductGrid
            products={productsQuery.data?.items}
            isLoading={productsQuery.isLoading}
            isError={productsQuery.isError}
            emptyMessage="No products match those filters."
          />
        </div>
      </section>
    </div>
  );
}
