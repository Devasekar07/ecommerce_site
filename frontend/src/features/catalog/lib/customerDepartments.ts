const hiddenCustomerDepartmentSlugs = new Set(["kids"]);

export function isCustomerHiddenDepartmentSlug(slug?: string) {
  return Boolean(slug && hiddenCustomerDepartmentSlugs.has(slug));
}

export function visibleCustomerDepartments<T extends { slug: string }>(departments: T[]) {
  return departments.filter((department) => !isCustomerHiddenDepartmentSlug(department.slug));
}

export function visibleCustomerCategories<T extends { departmentSlug?: string }>(categories: T[]) {
  return categories.filter((category) => !isCustomerHiddenDepartmentSlug(category.departmentSlug));
}
