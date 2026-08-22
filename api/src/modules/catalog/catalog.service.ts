import type { Prisma } from "@prisma/client";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { ProductFilterOptionsQuery, ProductListQuery } from "./catalog.schemas.js";

const visibleProductWhere = {
  status: "ACTIVE",
  images: { some: {} }
} satisfies Prisma.ProductWhereInput;

const categoryInclude = {
  subcategories: {
    orderBy: { displayOrder: "asc" }
  },
  _count: {
    select: {
      products: {
        where: visibleProductWhere
      }
    }
  }
} satisfies Prisma.CategoryInclude;

const productInclude = {
  department: {
    select: { id: true, slug: true, name: true }
  },
  category: {
    select: { id: true, slug: true, name: true }
  },
  subcategory: {
    select: { id: true, slug: true, name: true }
  },
  images: {
    orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }]
  },
  attributes: {
    orderBy: { key: "asc" }
  },
  variants: {
    where: { status: "ACTIVE" },
    include: { inventory: true },
    orderBy: [{ colourName: "asc" }, { size: "asc" }]
  }
} satisfies Prisma.ProductInclude;

type CategoryWithChildren = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>;
type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export async function getDepartments() {
  const departments = await prisma.department.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      categories: {
        where: {
          products: {
            some: visibleProductWhere
          }
        },
        orderBy: { displayOrder: "asc" },
        include: categoryInclude
      }
    }
  });

  return departments.map((department) => ({
    id: department.id,
    slug: department.slug,
    name: department.name,
    description: department.description,
    displayOrder: department.displayOrder,
    categories: department.categories.map(mapCategory)
  }));
}

export async function getDepartmentBySlug(departmentSlug: string) {
  const department = await prisma.department.findUnique({
    where: { slug: departmentSlug },
    include: {
      categories: {
        where: {
          products: {
            some: visibleProductWhere
          }
        },
        orderBy: { displayOrder: "asc" },
        include: categoryInclude
      }
    }
  });

  if (!department) {
    throw new AppError("Department not found.", 404, "DEPARTMENT_NOT_FOUND");
  }

  return {
    id: department.id,
    slug: department.slug,
    name: department.name,
    description: department.description,
    displayOrder: department.displayOrder,
    categories: department.categories.map(mapCategory)
  };
}

export async function getDepartmentCategories(departmentSlug: string) {
  const department = await getDepartmentBySlug(departmentSlug);
  return department.categories;
}

export async function listProducts(query: ProductListQuery) {
  const candidates = await prisma.product.findMany({
    where: buildProductWhere(query),
    include: productInclude
  });
  const filteredProducts = candidates.filter((product) => matchesProductFilters(product, query));
  const sortedProducts = sortProducts(filteredProducts, query);
  const total = sortedProducts.length;
  const skip = (query.page - 1) * query.limit;
  const items = sortedProducts.slice(skip, skip + query.limit);

  return {
    items: items.map(mapProduct),
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit)
  };
}

export async function getProductFilterOptions(query: ProductFilterOptionsQuery) {
  const candidates = await prisma.product.findMany({
    where: buildProductWhere(query),
    include: productInclude
  });
  const products = candidates.filter((product) => matchesProductFilters(product, query));
  const departments = new Map<string, { slug: string; name: string; count: number }>();
  const categories = new Map<
    string,
    { slug: string; name: string; departmentSlug: string; departmentName: string; count: number }
  >();
  const colours = new Map<string, { name: string; hex: string | null; count: number }>();
  const sizes = new Map<string, { value: string; count: number }>();
  const fits = new Map<string, { value: string; count: number }>();
  const usages = new Map<string, { value: string; count: number }>();
  const productTypes = new Map<string, { value: string; count: number }>();
  const prices = products.map(getEffectivePricePence);

  for (const product of products) {
    incrementOption(departments, product.department.slug, {
      slug: product.department.slug,
      name: product.department.name,
      count: 0
    });
    incrementOption(categories, `${product.department.slug}:${product.category.slug}`, {
      slug: product.category.slug,
      name: product.category.name,
      departmentSlug: product.department.slug,
      departmentName: product.department.name,
      count: 0
    });

    const fit = getAttributeValue(product, "fit");
    const usage = getAttributeValue(product, "usage");
    const productType = getAttributeValue(product, "productType");

    if (fit) {
      incrementOption(fits, fit, { value: fit, count: 0 });
    }

    if (usage) {
      incrementOption(usages, usage, { value: usage, count: 0 });
    }

    if (productType) {
      incrementOption(productTypes, productType, { value: productType, count: 0 });
    }

    for (const variant of product.variants) {
      incrementOption(sizes, variant.size, { value: variant.size, count: 0 });
      incrementOption(colours, variant.colourName, {
        name: variant.colourName,
        hex: variant.colourHex,
        count: 0
      });
    }
  }

  return {
    departments: sortByLabel([...departments.values()], "name"),
    categories: sortByLabel([...categories.values()], "name"),
    sizes: [...sizes.values()].sort((left, right) => compareSizes(left.value, right.value)),
    colours: sortByLabel([...colours.values()], "name"),
    fits: sortByLabel([...fits.values()], "value"),
    usages: sortByLabel([...usages.values()], "value"),
    productTypes: sortByLabel([...productTypes.values()], "value"),
    priceRange: {
      minPricePence: prices.length ? Math.min(...prices) : 0,
      maxPricePence: prices.length ? Math.max(...prices) : 0
    }
  };
}

export async function getProductBySlug(productSlug: string) {
  const product = await prisma.product.findFirst({
    where: {
      slug: productSlug,
      ...visibleProductWhere
    },
    include: productInclude
  });

  if (!product) {
    throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");
  }

  return mapProduct(product);
}

function mapCategory(category: CategoryWithChildren) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    displayOrder: category.displayOrder,
    productCount: category._count.products,
    subcategories: category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      slug: subcategory.slug,
      name: subcategory.name,
      description: subcategory.description,
      displayOrder: subcategory.displayOrder
    }))
  };
}

function mapProduct(product: ProductWithRelations) {
  const variants = product.variants.map((variant) => {
    const availableQuantity = Math.max(
      (variant.inventory?.quantity ?? 0) - (variant.inventory?.reservedQuantity ?? 0),
      0
    );

    return {
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      colourName: variant.colourName,
      colourHex: variant.colourHex,
      availableQuantity,
      stockStatus: getStockStatus(availableQuantity)
    };
  });

  const totalAvailable = variants.reduce((sum, variant) => sum + variant.availableQuantity, 0);
  const coloursByName = new Map<string, { name: string; hex: string | null }>();

  for (const variant of variants) {
    if (!coloursByName.has(variant.colourName)) {
      coloursByName.set(variant.colourName, { name: variant.colourName, hex: variant.colourHex });
    }
  }

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    pricePence: product.pricePence,
    salePricePence: product.salePricePence,
    currency: product.currency,
    department: product.department,
    category: product.category,
    subcategory: product.subcategory,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
      isPrimary: image.isPrimary
    })),
    attributes: product.attributes.map((attribute) => ({
      key: attribute.key,
      value: attribute.value
    })),
    variants,
    availableSizes: [...new Set(variants.filter((variant) => variant.availableQuantity > 0).map((variant) => variant.size))],
    colours: [...coloursByName.values()],
    stockStatus: getStockStatus(totalAvailable),
    createdAt: product.createdAt.toISOString()
  };
}

function buildProductWhere(query: Pick<ProductListQuery, "department" | "category" | "subcategory">): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    ...visibleProductWhere
  };

  if (query.department) {
    where.department = { slug: query.department };
  }

  if (query.category) {
    where.category = { slug: query.category };
  }

  if (query.subcategory) {
    where.subcategory = { slug: query.subcategory };
  }

  return where;
}

function matchesProductFilters(product: ProductWithRelations, query: ProductListQuery | ProductFilterOptionsQuery) {
  if (query.q && !matchesKeywordQuery(product, query.q)) {
    return false;
  }

  const currentPrice = getEffectivePricePence(product);

  if (query.minPrice !== undefined && currentPrice < query.minPrice) {
    return false;
  }

  if (query.maxPrice !== undefined && currentPrice > query.maxPrice) {
    return false;
  }

  if (query.size?.length && !hasMatchingValue(product.variants.map((variant) => variant.size), query.size)) {
    return false;
  }

  if (query.colour?.length && !hasMatchingValue(product.variants.map((variant) => variant.colourName), query.colour)) {
    return false;
  }

  if (query.fit?.length && !hasMatchingValue([getAttributeValue(product, "fit")], query.fit)) {
    return false;
  }

  if (query.usage?.length && !hasMatchingValue([getAttributeValue(product, "usage")], query.usage)) {
    return false;
  }

  if (query.productType?.length && !hasMatchingValue([getAttributeValue(product, "productType")], query.productType)) {
    return false;
  }

  return true;
}

function sortProducts(products: ProductWithRelations[], query: ProductListQuery) {
  const scoredProducts = products.map((product) => ({
    product,
    relevance: query.q ? scoreProductRelevance(product, query.q) : 0
  }));

  scoredProducts.sort((left, right) => {
    if (query.sort === "price_asc") {
      return getEffectivePricePence(left.product) - getEffectivePricePence(right.product);
    }

    if (query.sort === "price_desc") {
      return getEffectivePricePence(right.product) - getEffectivePricePence(left.product);
    }

    if (query.sort === "relevance" && query.q) {
      return right.relevance - left.relevance || compareNewest(right.product, left.product);
    }

    return compareNewest(right.product, left.product);
  });

  return scoredProducts.map((item) => item.product);
}

function matchesKeywordQuery(product: ProductWithRelations, query: string) {
  const tokens = tokenize(query);

  if (!tokens.length) {
    return true;
  }

  const searchableText = normalizeSearchText([
    product.name,
    product.category.name,
    getAttributeValue(product, "productType"),
    ...product.variants.map((variant) => variant.colourName)
  ]);

  return tokens.every((token) => searchableText.includes(token));
}

function scoreProductRelevance(product: ProductWithRelations, query: string) {
  const normalizedQuery = normalizeSearchText([query]);
  const tokens = tokenize(query);
  let score = 0;
  const name = normalizeSearchText([product.name]);
  const category = normalizeSearchText([product.category.name]);
  const productType = normalizeSearchText([getAttributeValue(product, "productType")]);
  const colours = normalizeSearchText(product.variants.map((variant) => variant.colourName));

  if (name === normalizedQuery) score += 50;
  if (name.includes(normalizedQuery)) score += 25;
  if (name.startsWith(normalizedQuery)) score += 10;

  for (const token of tokens) {
    if (name.includes(token)) score += 8;
    if (productType.includes(token)) score += 6;
    if (category.includes(token)) score += 4;
    if (colours.includes(token)) score += 3;
  }

  return score;
}

function getEffectivePricePence(product: ProductWithRelations) {
  return product.salePricePence ?? product.pricePence;
}

function compareNewest(left: ProductWithRelations, right: ProductWithRelations) {
  const leftYear = getNumericAttribute(left, "year");
  const rightYear = getNumericAttribute(right, "year");
  return (leftYear ?? 0) - (rightYear ?? 0) || left.createdAt.getTime() - right.createdAt.getTime();
}

function getAttributeValue(product: ProductWithRelations, key: string) {
  return product.attributes.find((attribute) => attribute.key === key)?.value;
}

function getNumericAttribute(product: ProductWithRelations, key: string) {
  const value = getAttributeValue(product, key);
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasMatchingValue(values: Array<string | undefined>, selectedValues: string[]) {
  const selected = new Set(selectedValues.map(normalizeOptionValue));
  return values.some((value) => value && selected.has(normalizeOptionValue(value)));
}

function normalizeOptionValue(value: string) {
  return value.trim().toLowerCase();
}

function tokenize(value: string) {
  return normalizeSearchText([value])
    .split(" ")
    .filter(Boolean);
}

function normalizeSearchText(values: Array<string | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function incrementOption<T extends { count: number }>(map: Map<string, T>, key: string, initialValue: T) {
  const existing = map.get(key);

  if (existing) {
    existing.count += 1;
    return;
  }

  initialValue.count = 1;
  map.set(key, initialValue);
}

function sortByLabel<T extends Record<K, string>, K extends keyof T>(items: T[], key: K) {
  return items.sort((left, right) => left[key].localeCompare(right[key]));
}

function compareSizes(left: string, right: string) {
  const order = ["One Size", "XS", "S", "M", "L", "XL", "XXL", "6", "7", "8", "9", "10", "11"];
  const leftIndex = order.indexOf(left);
  const rightIndex = order.indexOf(right);

  if (leftIndex !== -1 || rightIndex !== -1) {
    return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
  }

  return left.localeCompare(right);
}

function getStockStatus(availableQuantity: number) {
  if (availableQuantity <= 0) {
    return "out_of_stock";
  }

  if (availableQuantity <= 5) {
    return "low_stock";
  }

  return "in_stock";
}
