import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const departmentParamsSchema = z.object({
  departmentSlug: slugSchema
});

export const productParamsSchema = z.object({
  productSlug: slugSchema
});

const productListQueryBaseSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),
  department: slugSchema.optional(),
  category: slugSchema.optional(),
  subcategory: slugSchema.optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  size: queryListSchema(),
  colour: queryListSchema(),
  fit: queryListSchema(),
  usage: queryListSchema(),
  productType: queryListSchema(),
  sort: z.enum(["relevance", "newest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24)
});

export const productListQuerySchema = productListQueryBaseSchema.refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
  message: "minPrice must be less than or equal to maxPrice.",
  path: ["minPrice"]
});

export const productFilterOptionsQuerySchema = productListQueryBaseSchema.omit({
  page: true,
  limit: true,
  sort: true
}).refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
  message: "minPrice must be less than or equal to maxPrice.",
  path: ["minPrice"]
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type ProductFilterOptionsQuery = z.infer<typeof productFilterOptionsQuerySchema>;

function queryListSchema() {
  return z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }

    const rawValues = Array.isArray(value) ? value : [value];

    return rawValues
      .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
      .map((item) => item.trim())
      .filter(Boolean);
  }, z.array(z.string().min(1).max(80)).max(30).optional());
}
