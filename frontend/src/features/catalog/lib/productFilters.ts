import type { ProductQueryFilters, ProductSort } from "../../../types/catalog";

export const sortOptions: Array<{ value: ProductSort; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price low to high" },
  { value: "price_desc", label: "Price high to low" }
];

export const occasionLabels: Record<string, string> = {
  Casual: "Everyday",
  Formal: "Work",
  Sports: "Active",
  Ethnic: "Occasion"
};

const arrayKeys = ["size", "colour", "fit", "usage", "productType"] as const;
type ArrayKey = (typeof arrayKeys)[number];

export function parseProductFilters(params: URLSearchParams, base: ProductQueryFilters = {}): ProductQueryFilters {
  const filters: ProductQueryFilters = {
    ...base,
    department: base.department ?? getStringParam(params, "department"),
    category: base.category ?? getStringParam(params, "category"),
    subcategory: base.subcategory ?? getStringParam(params, "subcategory"),
    q: getStringParam(params, "q") ?? base.q,
    sort: getSortParam(params) ?? base.sort ?? "newest",
    page: getNumberParam(params, "page") ?? 1,
    limit: base.limit ?? 24,
    minPrice: getPenceParam(params, "minPrice"),
    maxPrice: getPenceParam(params, "maxPrice")
  };

  for (const key of arrayKeys) {
    const values = getArrayParam(params, key);

    if (values.length) {
      filters[key] = values;
    }
  }

  return filters;
}

export function updateFilterParams(params: URLSearchParams, patch: ProductQueryFilters) {
  const next = new URLSearchParams(params);

  for (const [key, value] of Object.entries(patch)) {
    next.delete(key);

    if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        next.append(key, item);
      }
      continue;
    }

    next.set(key, String(value));
  }

  if (!("page" in patch)) {
    next.delete("page");
  }

  return next;
}

export function toggleArrayFilter(filters: ProductQueryFilters, key: ArrayKey, value: string): string[] {
  const values = new Set(filters[key] ?? []);

  if (values.has(value)) {
    values.delete(value);
  } else {
    values.add(value);
  }

  return [...values];
}

export function getOccasionLabel(value: string) {
  return occasionLabels[value] ?? value;
}

function getStringParam(params: URLSearchParams, key: string) {
  const value = params.get(key)?.trim();
  return value || undefined;
}

function getArrayParam(params: URLSearchParams, key: string) {
  return params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function getNumberParam(params: URLSearchParams, key: string) {
  const value = Number.parseInt(params.get(key) ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function getPenceParam(params: URLSearchParams, key: string) {
  const value = Number.parseInt(params.get(key) ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function getSortParam(params: URLSearchParams) {
  const value = params.get("sort") as ProductSort | null;
  return sortOptions.some((option) => option.value === value) ? value ?? undefined : undefined;
}
