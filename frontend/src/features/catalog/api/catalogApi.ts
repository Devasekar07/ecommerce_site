import { useQuery } from "@tanstack/react-query";
import { getJson } from "../../../lib/apiClient";
import type { Department, Product, ProductFilterOptions, ProductListResponse, ProductQueryFilters } from "../../../types/catalog";

type DepartmentsResponse = {
  departments: Department[];
};

type DepartmentResponse = {
  department: Department;
};

type ProductResponse = {
  product: Product;
};

type VersionResponse = {
  currentVersion: string;
  latest: {
    version: string;
    releasedAt: string | null;
    message: string;
  };
};

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await getJson<DepartmentsResponse>("/api/v1/departments");
      return response.departments;
    }
  });
}

export function useDepartment(departmentSlug?: string) {
  return useQuery({
    queryKey: ["department", departmentSlug],
    enabled: Boolean(departmentSlug),
    queryFn: async () => {
      const response = await getJson<DepartmentResponse>(`/api/v1/departments/${departmentSlug}`);
      return response.department;
    }
  });
}

export function useProducts(filters: ProductQueryFilters, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["products", filters],
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const query = buildProductQuery(filters);
      return getJson<ProductListResponse>(`/api/v1/products${query ? `?${query}` : ""}`);
    }
  });
}

export function useProductFilterOptions(filters: ProductQueryFilters, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["product-filter-options", filters],
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const query = buildProductQuery({
        ...filters,
        page: undefined,
        limit: undefined,
        sort: undefined
      });
      return getJson<ProductFilterOptions>(`/api/v1/products/filters${query ? `?${query}` : ""}`);
    }
  });
}

export function useProduct(productSlug?: string) {
  return useQuery({
    queryKey: ["product", productSlug],
    enabled: Boolean(productSlug),
    queryFn: async () => {
      const response = await getJson<ProductResponse>(`/api/v1/products/${productSlug}`);
      return response.product;
    }
  });
}

export function useVersionMetadata() {
  return useQuery({
    queryKey: ["version"],
    queryFn: () => getJson<VersionResponse>("/api/v1/version"),
    staleTime: 5 * 60_000
  });
}

function buildProductQuery(filters: ProductQueryFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}
