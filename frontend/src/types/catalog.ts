export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type Subcategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
  productCount: number;
  subcategories: Subcategory[];
};

export type Department = {
  id: string;
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
  categories: Category[];
};

export type ProductImage = {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
};

export type ProductAttribute = {
  key: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  sku: string;
  size: string;
  colourName: string;
  colourHex: string | null;
  availableQuantity: number;
  stockStatus: StockStatus;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pricePence: number;
  salePricePence: number | null;
  currency: string;
  department: Pick<Department, "id" | "slug" | "name">;
  category: Pick<Category, "id" | "slug" | "name">;
  subcategory: Pick<Subcategory, "id" | "slug" | "name"> | null;
  images: ProductImage[];
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  availableSizes: string[];
  colours: Array<{ name: string; hex: string | null }>;
  stockStatus: StockStatus;
  createdAt: string;
};

export type ProductListResponse = {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductSort = "relevance" | "newest" | "price_asc" | "price_desc";

export type ProductQueryFilters = {
  q?: string;
  department?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string[];
  colour?: string[];
  fit?: string[];
  usage?: string[];
  productType?: string[];
  sort?: ProductSort;
  page?: number;
  limit?: number;
};

export type ProductFilterOptions = {
  departments: Array<{ slug: string; name: string; count: number }>;
  categories: Array<{ slug: string; name: string; departmentSlug: string; departmentName: string; count: number }>;
  sizes: Array<{ value: string; count: number }>;
  colours: Array<{ name: string; hex: string | null; count: number }>;
  fits: Array<{ value: string; count: number }>;
  usages: Array<{ value: string; count: number }>;
  productTypes: Array<{ value: string; count: number }>;
  priceRange: {
    minPricePence: number;
    maxPricePence: number;
  };
};
