import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import {
  departmentParamsSchema,
  productFilterOptionsQuerySchema,
  productListQuerySchema,
  productParamsSchema
} from "./catalog.schemas.js";
import {
  getDepartmentBySlug,
  getDepartmentCategories,
  getDepartments,
  getProductFilterOptions,
  getProductBySlug,
  listProducts
} from "./catalog.service.js";

export const catalogRouter = Router();

catalogRouter.get(
  "/departments",
  asyncHandler(async (_request, response) => {
    response.json({ departments: await getDepartments() });
  })
);

catalogRouter.get(
  "/departments/:departmentSlug",
  asyncHandler(async (request, response) => {
    const { departmentSlug } = departmentParamsSchema.parse(request.params);
    response.json({ department: await getDepartmentBySlug(departmentSlug) });
  })
);

catalogRouter.get(
  "/departments/:departmentSlug/categories",
  asyncHandler(async (request, response) => {
    const { departmentSlug } = departmentParamsSchema.parse(request.params);
    response.json({ categories: await getDepartmentCategories(departmentSlug) });
  })
);

catalogRouter.get(
  "/products",
  asyncHandler(async (request, response) => {
    const query = productListQuerySchema.parse(request.query);
    response.json(await listProducts(query));
  })
);

catalogRouter.get(
  "/products/filters",
  asyncHandler(async (request, response) => {
    const query = productFilterOptionsQuerySchema.parse(request.query);
    response.json(await getProductFilterOptions(query));
  })
);

catalogRouter.get(
  "/products/:productSlug",
  asyncHandler(async (request, response) => {
    const { productSlug } = productParamsSchema.parse(request.params);
    response.json({ product: await getProductBySlug(productSlug) });
  })
);
