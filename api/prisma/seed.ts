import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const datasetSources = [
  { name: "approved_products.jsonl", path: resolve(process.cwd(), "prisma/data/approved_products.jsonl") },
  { name: "kids_with_images.jsonl", path: resolve(process.cwd(), "prisma/data/kids_with_images.jsonl") }
] as const;
const departmentOrder = ["Women", "Men", "Kids", "Accessories"] as const;
const imageValidationConcurrency = getPositiveIntegerEnv("IMAGE_VALIDATION_CONCURRENCY", 24);
const imageValidationTimeoutMs = getPositiveIntegerEnv("IMAGE_VALIDATION_TIMEOUT_MS", 8_000);
type DepartmentName = (typeof departmentOrder)[number];

type SourceRow = {
  sku?: unknown;
  name?: unknown;
  brand?: unknown;
  description?: unknown;
  price?: unknown;
  currency?: unknown;
  section?: unknown;
  subsection?: unknown;
  category?: unknown;
  images?: unknown;
  available_sizes?: unknown;
  stock_by_size?: unknown;
  total_stock?: unknown;
  data_source?: unknown;
};

type JsonlInput = {
  sourceName: string;
  rowNumber: number;
  row?: SourceRow;
  parseError?: string;
};

type Colour = {
  name: string;
  hex: string;
};

type ValidRow = {
  externalId: string;
  name: string;
  description: string;
  pricePence: number;
  department: DepartmentName;
  audience: DepartmentName;
  category: string;
  productType: string;
  images: string[];
  availableSizes: string[];
  stockBySize: Record<string, number>;
  colour: Colour;
  fit?: string;
  subsection?: string;
  ageRange?: string;
  usage: UsageValue;
};

type VariantInput = {
  sku: string;
  size: string;
  quantity: number;
};

type ImportSummary = {
  rowsRead: number;
  imageUrlsChecked: number;
  imageReferencesAccepted: number;
  imageReferencesRejected: number;
  productsSkippedForImages: number;
  productsCreated: number;
  productsUpdated: number;
  productsDeleted: number;
  productsCreatedByDepartment: Record<DepartmentName, number>;
  productsImportedByDepartment: Record<DepartmentName, number>;
  variantsCreated: number;
  variantsUpdated: number;
  skippedRows: Array<{ sourceName?: string; rowNumber: number; externalId?: string; reason: string }>;
};

type ParsedRow = {
  sourceName: string;
  rowNumber: number;
  row: ValidRow;
};

type ImageCheckResult = {
  valid: boolean;
  reason?: string;
  status?: number;
  contentType?: string;
};

const colourPalette: Colour[] = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#f8f8f5" },
  { name: "Navy", hex: "#17213a" },
  { name: "Grey", hex: "#777b80" },
  { name: "Beige", hex: "#d8c4a7" },
  { name: "Brown", hex: "#7a5134" },
  { name: "Blue", hex: "#2f5f9f" },
  { name: "Green", hex: "#3f7a52" },
  { name: "Red", hex: "#b02a36" },
  { name: "Pink", hex: "#e8a6b6" },
  { name: "Cream", hex: "#f3ead7" },
  { name: "Khaki", hex: "#8a845f" },
  { name: "Silver", hex: "#c0c4c7" },
  { name: "Gold", hex: "#c7a447" }
];

const colourWords: Colour[] = [
  ...colourPalette,
  { name: "Ecru", hex: "#eee4cf" },
  { name: "Burgundy", hex: "#6f263d" },
  { name: "Orange", hex: "#d9782d" },
  { name: "Purple", hex: "#6f4a8e" },
  { name: "Yellow", hex: "#e4c84d" }
];

const fitValues = ["Regular Fit", "Slim Fit", "Relaxed Fit", "Oversized Fit"] as const;
const usageValues = ["Casual", "Formal", "Sports", "Ethnic"] as const;
type UsageValue = (typeof usageValues)[number];
const fitKeywordMap: Array<{ value: (typeof fitValues)[number]; keywords: string[] }> = [
  { value: "Oversized Fit", keywords: ["oversized", "boxy"] },
  { value: "Slim Fit", keywords: ["slim", "skinny", "fitted"] },
  { value: "Relaxed Fit", keywords: ["relaxed", "loose", "wide leg", "wide-leg"] },
  { value: "Regular Fit", keywords: ["regular", "straight"] }
];

const categoryLabelOverrides: Record<string, string> = {
  "t-shirts": "T-shirts"
};

async function main() {
  const inputs = readJsonlRows();
  const summary = createSummary(inputs.length);
  const rowsNeedingImageValidation: ParsedRow[] = [];
  const validRows: ValidRow[] = [];
  const seenExternalIds = new Set<string>();

  for (const input of inputs) {
    if (!input.row) {
      summary.skippedRows.push({
        sourceName: input.sourceName,
        rowNumber: input.rowNumber,
        reason: input.parseError ?? "Invalid JSONL row"
      });
      continue;
    }

    const parsed = parseRow(input.row, input.rowNumber);

    if (!parsed.valid) {
      summary.skippedRows.push(parsed.skipped);
      continue;
    }

    if (seenExternalIds.has(parsed.row.externalId)) {
      summary.skippedRows.push({
        sourceName: input.sourceName,
        rowNumber: input.rowNumber,
        externalId: parsed.row.externalId,
        reason: "Duplicate sku"
      });
      continue;
    }

    seenExternalIds.add(parsed.row.externalId);
    rowsNeedingImageValidation.push({
      sourceName: input.sourceName,
      rowNumber: input.rowNumber,
      row: parsed.row
    });
  }

  const imageValidationResults = await validateImageUrls(
    uniqueValues(rowsNeedingImageValidation.flatMap(({ row }) => row.images))
  );
  summary.imageUrlsChecked = imageValidationResults.size;

  for (const { sourceName, rowNumber, row } of rowsNeedingImageValidation) {
    const validatedImages = row.images.filter((imageUrl) => imageValidationResults.get(imageUrl)?.valid);
    summary.imageReferencesAccepted += validatedImages.length;
    summary.imageReferencesRejected += row.images.length - validatedImages.length;

    if (!validatedImages.length) {
      summary.productsSkippedForImages += 1;
      summary.skippedRows.push({
        sourceName,
        rowNumber,
        externalId: row.externalId,
        reason: buildImageSkipReason(row.images, imageValidationResults)
      });
      continue;
    }

    validRows.push({
      ...row,
      images: validatedImages
    });
  }

  const activeExternalIds = new Set(validRows.map((row) => row.externalId));
  summary.productsDeleted = await resetDevelopmentCatalogue(activeExternalIds);

  const existingProductExternalIds = new Set(
    (
      await prisma.product.findMany({
        where: { externalId: { not: null } },
        select: { externalId: true }
      })
    )
      .map((product) => product.externalId)
      .filter((externalId): externalId is string => Boolean(externalId))
  );
  const existingVariantSkus = new Set(
    (await prisma.productVariant.findMany({ select: { sku: true } })).map((variant) => variant.sku)
  );
  const departmentIds = await upsertDepartments();
  const categoryIds = new Map<string, string>();
  const categoryDisplayOrders = new Map<DepartmentName, number>();

  for (const row of validRows) {
    const departmentId = departmentIds.get(row.department);

    if (!departmentId) {
      summary.skippedRows.push({
        rowNumber: 0,
        externalId: row.externalId,
        reason: `Unsupported department: ${row.department}`
      });
      continue;
    }

    const categoryId = await upsertCategory(row, departmentId, categoryIds, categoryDisplayOrders);
    const wasProductCreated = !existingProductExternalIds.has(row.externalId);
    const variantInputs = buildVariants(row);

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.upsert({
        where: { externalId: row.externalId },
        create: {
          externalId: row.externalId,
          slug: buildProductSlug(row),
          name: row.name,
          description: row.description,
          departmentId,
          categoryId,
          pricePence: row.pricePence,
          salePricePence: null,
          currency: "GBP",
          status: "ACTIVE"
        },
        update: {
          slug: buildProductSlug(row),
          name: row.name,
          description: row.description,
          departmentId,
          categoryId,
          subcategoryId: null,
          pricePence: row.pricePence,
          salePricePence: null,
          currency: "GBP",
          status: "ACTIVE"
        }
      });

      const attributes = buildAttributes(row);
      const attributeKeys = attributes.map((attribute) => attribute.key);

      await tx.productAttribute.deleteMany({
        where: {
          productId: product.id,
          key: { notIn: attributeKeys }
        }
      });

      for (const attribute of attributes) {
        await tx.productAttribute.upsert({
          where: {
            productId_key: {
              productId: product.id,
              key: attribute.key
            }
          },
          create: {
            productId: product.id,
            key: attribute.key,
            value: attribute.value
          },
          update: {
            value: attribute.value
          }
        });
      }

      await tx.productImage.deleteMany({ where: { productId: product.id } });
      await tx.productImage.createMany({
        data: row.images.map((imageUrl, index) => ({
          productId: product.id,
          url: imageUrl,
          altText: row.name,
          displayOrder: index,
          isPrimary: index === 0
        }))
      });

      await tx.productVariant.deleteMany({
        where: {
          productId: product.id,
          sku: { notIn: variantInputs.map((variant) => variant.sku) }
        }
      });

      for (const variantInput of variantInputs) {
        const variantWasCreated = !existingVariantSkus.has(variantInput.sku);
        const variant = await tx.productVariant.upsert({
          where: { sku: variantInput.sku },
          create: {
            productId: product.id,
            sku: variantInput.sku,
            size: variantInput.size,
            colourName: row.colour.name,
            colourHex: row.colour.hex,
            status: "ACTIVE"
          },
          update: {
            productId: product.id,
            size: variantInput.size,
            colourName: row.colour.name,
            colourHex: row.colour.hex,
            status: "ACTIVE"
          }
        });

        await tx.inventory.upsert({
          where: { variantId: variant.id },
          create: {
            variantId: variant.id,
            quantity: variantInput.quantity,
            reservedQuantity: 0
          },
          update: {
            quantity: variantInput.quantity,
            reservedQuantity: 0
          }
        });

        if (variantWasCreated) {
          summary.variantsCreated += 1;
          existingVariantSkus.add(variantInput.sku);
        } else {
          summary.variantsUpdated += 1;
        }
      }
    });

    summary.productsImportedByDepartment[row.department] += 1;

    if (wasProductCreated) {
      summary.productsCreated += 1;
      summary.productsCreatedByDepartment[row.department] += 1;
      existingProductExternalIds.add(row.externalId);
    } else {
      summary.productsUpdated += 1;
    }
  }

  await removeEmptyCatalogueGroups();
  printSummary(summary);
}

function readJsonlRows(): JsonlInput[] {
  return datasetSources.flatMap((source) =>
    readFileSync(source.path, "utf8")
      .split(/\r?\n/)
      .map((line, index) => ({ line, rowNumber: index + 1 }))
      .filter(({ line }) => line.trim())
      .map(({ line, rowNumber }) => {
        try {
          return {
            sourceName: source.name,
            rowNumber,
            row: JSON.parse(line) as SourceRow
          };
        } catch (error) {
          return {
            sourceName: source.name,
            rowNumber,
            parseError: error instanceof Error ? error.message : "Invalid JSON"
          };
        }
      })
  );
}

function createSummary(rowsRead: number): ImportSummary {
  return {
    rowsRead,
    imageUrlsChecked: 0,
    imageReferencesAccepted: 0,
    imageReferencesRejected: 0,
    productsSkippedForImages: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsDeleted: 0,
    productsCreatedByDepartment: zeroDepartmentCounts(),
    productsImportedByDepartment: zeroDepartmentCounts(),
    variantsCreated: 0,
    variantsUpdated: 0,
    skippedRows: []
  };
}

function zeroDepartmentCounts(): Record<DepartmentName, number> {
  return {
    Women: 0,
    Men: 0,
    Kids: 0,
    Accessories: 0
  };
}

async function resetDevelopmentCatalogue(activeExternalIds: Set<string>) {
  await prisma.cartItem.deleteMany();
  const result = await prisma.product.deleteMany({
    where: {
      OR: [
        { externalId: null },
        {
          externalId: {
            notIn: [...activeExternalIds]
          }
        }
      ]
    }
  });

  await prisma.subcategory.deleteMany();
  return result.count;
}

async function removeEmptyCatalogueGroups() {
  await prisma.category.deleteMany({ where: { products: { none: {} } } });
  await prisma.department.deleteMany({
    where: {
      products: { none: {} },
      categories: { none: {} }
    }
  });
}

async function upsertDepartments() {
  const ids = new Map<DepartmentName, string>();

  for (const [index, department] of departmentOrder.entries()) {
    const created = await prisma.department.upsert({
      where: { slug: slugify(department) },
      create: {
        slug: slugify(department),
        name: department,
        description: getDepartmentDescription(department),
        displayOrder: index + 1
      },
      update: {
        name: department,
        description: getDepartmentDescription(department),
        displayOrder: index + 1
      }
    });
    ids.set(department, created.id);
  }

  return ids;
}

async function upsertCategory(
  row: ValidRow,
  departmentId: string,
  categoryIds: Map<string, string>,
  categoryDisplayOrders: Map<DepartmentName, number>
) {
  const key = `${row.department}:${row.category}`;
  const existingId = categoryIds.get(key);

  if (existingId) {
    return existingId;
  }

  const displayOrder = (categoryDisplayOrders.get(row.department) ?? 0) + 1;
  categoryDisplayOrders.set(row.department, displayOrder);

  const category = await prisma.category.upsert({
    where: {
      departmentId_slug: {
        departmentId,
        slug: slugify(row.category)
      }
    },
    create: {
      departmentId,
      slug: slugify(row.category),
      name: row.category,
      description: `${row.category} from the ${row.department} edit.`,
      displayOrder
    },
    update: {
      name: row.category,
      description: `${row.category} from the ${row.department} edit.`,
      displayOrder
    }
  });

  categoryIds.set(key, category.id);
  return category.id;
}

function parseRow(rawRow: SourceRow, rowNumber: number) {
  const externalId = stringValue(rawRow.sku);
  const rawName = requiredString(rawRow.name);
  const rawDescription = requiredString(rawRow.description);
  const rawCategory = requiredString(rawRow.category);
  const section = stringValue(rawRow.section).toUpperCase();
  const images = parseImages(rawRow.images);
  const availableSizes = parseStringArray(rawRow.available_sizes);
  const pricePence = parsePricePence(rawRow.price);
  const sourceDepartment = isAllowedSection(section) ? getDepartmentFromSection(section) : undefined;
  const name = sanitizeCustomerFacingText(rawName);
  const categorySource = sanitizeCustomerFacingText(rawCategory);
  const reasons: string[] = [];

  if (!externalId) reasons.push("missing sku");
  if (!rawName) reasons.push("missing name");
  if (rawName && !name) reasons.push("invalid name after sanitization");
  if (!rawDescription && sourceDepartment !== "Kids") reasons.push("missing description");
  if (rawDescription && !sanitizeCustomerFacingText(rawDescription)) reasons.push("invalid description after sanitization");
  if (!rawCategory) reasons.push("missing category");
  if (rawCategory && !categorySource) reasons.push("invalid category after sanitization");
  if (!images.length) reasons.push("missing images");
  if (!availableSizes.length) reasons.push("missing available_sizes");
  if (!isAllowedSection(section)) reasons.push(`unsupported section: ${section || "blank"}`);
  if (stringValue(rawRow.currency) !== "GBP") reasons.push(`unsupported currency: ${stringValue(rawRow.currency) || "blank"}`);
  if (pricePence === null) reasons.push("invalid price");

  const stockBySize = parseStockBySize(rawRow.stock_by_size, availableSizes);

  if (!stockBySize.valid) {
    reasons.push(stockBySize.reason);
  }

  const invalidImages = images.filter((imageUrl) => !isApprovedStaticImageUrl(imageUrl));

  if (invalidImages.length) {
    reasons.push(`invalid image host: ${invalidImages.slice(0, 3).join(", ")}`);
  }

  if (reasons.length) {
    return {
      valid: false as const,
      skipped: {
        rowNumber,
        externalId: externalId || undefined,
        reason: reasons.join("; ")
      }
    };
  }

  if (!sourceDepartment) {
    throw new Error(`Validated row has no department for section ${section}.`);
  }

  const sourceCategory = getCategoryLabel(categorySource, sourceDepartment, name);
  const sourceProductType = getProductTypeLabel(categorySource, sourceCategory, sourceDepartment, name);
  const merchandising = buildMerchandisingAssignment(sourceDepartment, sourceCategory, sourceProductType, name);
  const description =
    sourceDepartment === "Kids" && !rawDescription
      ? buildKidsDescription(name, merchandising.category, stringValue(rawRow.subsection), availableSizes)
      : sanitizeCustomerFacingText(rawDescription);
  const textForGeneratedAttributes = `${name} ${description} ${categorySource} ${sourceProductType}`;
  const colour = buildColour(externalId, textForGeneratedAttributes);
  const usage = buildUsage(externalId, merchandising.category, textForGeneratedAttributes);
  const subsection = sourceDepartment === "Kids" ? buildKidsSubsection(stringValue(rawRow.subsection)) : undefined;

  return {
    valid: true as const,
    row: {
      externalId,
      name,
      description,
      pricePence: pricePence ?? 0,
      department: merchandising.department,
      audience: sourceDepartment,
      category: merchandising.category,
      productType: merchandising.productType,
      images: uniqueValues(images),
      availableSizes,
      stockBySize: stockBySize.stockBySize,
      colour,
      fit: buildFit(externalId, merchandising.category, textForGeneratedAttributes),
      subsection,
      ageRange: sourceDepartment === "Kids" ? buildAgeRange(availableSizes) : undefined,
      usage
    }
  };
}

async function validateImageUrls(imageUrls: string[]) {
  const results = new Map<string, ImageCheckResult>();

  if (!imageUrls.length) {
    return results;
  }

  console.info(`Validating ${imageUrls.length} unique product image URLs...`);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < imageUrls.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const imageUrl = imageUrls[currentIndex];

      if (!imageUrl) {
        continue;
      }

      results.set(imageUrl, await validateImageUrl(imageUrl));
      completed += 1;

      if (completed % 1_000 === 0 || completed === imageUrls.length) {
        console.info(`Validated product images: ${completed}/${imageUrls.length}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(imageValidationConcurrency, imageUrls.length) }, () => worker())
  );

  return results;
}

async function validateImageUrl(imageUrl: string): Promise<ImageCheckResult> {
  if (!isApprovedStaticImageUrl(imageUrl)) {
    return { valid: false, reason: "invalid image host" };
  }

  const headResult = await requestImageUrl(imageUrl, "HEAD");

  if (headResult.valid || !shouldRetryImageValidationWithGet(headResult)) {
    return headResult;
  }

  return requestImageUrl(imageUrl, "GET");
}

async function requestImageUrl(imageUrl: string, method: "HEAD" | "GET"): Promise<ImageCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), imageValidationTimeoutMs);

  try {
    const response = await fetch(imageUrl, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        ...(method === "GET" ? { Range: "bytes=0-0" } : {})
      }
    });
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);

    await response.body?.cancel();

    if (!response.ok) {
      return {
        valid: false,
        reason: `${method} ${response.status}`,
        status: response.status,
        contentType
      };
    }

    if (!contentType.startsWith("image/")) {
      return {
        valid: false,
        reason: `${method} non-image content-type`,
        status: response.status,
        contentType
      };
    }

    if (Number.isFinite(contentLength) && contentLength <= 0) {
      return {
        valid: false,
        reason: `${method} empty image response`,
        status: response.status,
        contentType
      };
    }

    return {
      valid: true,
      status: response.status,
      contentType
    };
  } catch (error) {
    return {
      valid: false,
      reason: error instanceof Error && error.name === "AbortError" ? `${method} timeout` : `${method} request failed`
    };
  } finally {
    clearTimeout(timeout);
  }
}

function shouldRetryImageValidationWithGet(result: ImageCheckResult) {
  return result.status !== undefined && [403, 405, 406, 501].includes(result.status);
}

function buildImageSkipReason(imageUrls: string[], results: Map<string, ImageCheckResult>) {
  const reasonCounts = new Map<string, number>();

  for (const imageUrl of imageUrls) {
    const result = results.get(imageUrl);
    const reason = formatImageCheckReason(result);
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }

  const reasons = [...reasonCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 4)
    .map(([reason, count]) => `${reason} (${count})`)
    .join("; ");

  return `no valid image urls${reasons ? `: ${reasons}` : ""}`;
}

function formatImageCheckReason(result: ImageCheckResult | undefined) {
  if (!result) {
    return "not checked";
  }

  if (result.valid) {
    return "valid";
  }

  const detail = result.contentType ? ` ${result.contentType}` : "";
  return `${result.reason ?? "invalid image"}${detail}`;
}

function buildAttributes(row: ValidRow) {
  const attributes = [
    { key: "productType", value: row.productType },
    { key: "gender", value: row.audience },
    { key: "colour", value: row.colour.name },
    { key: "usage", value: row.usage }
  ];

  if (row.fit) {
    attributes.push({ key: "fit", value: row.fit });
  }

  if (row.subsection) {
    attributes.push({ key: "kidsSubsection", value: row.subsection });
  }

  if (row.ageRange) {
    attributes.push({ key: "ageRange", value: row.ageRange });
  }

  return attributes;
}

function buildVariants(row: ValidRow): VariantInput[] {
  return row.availableSizes.map((size) => ({
    sku: `AVE-${stableSkuToken(row.externalId)}-${slugify(size).toUpperCase()}`,
    size,
    quantity: row.stockBySize[size] ?? 0
  }));
}

function buildProductSlug(row: ValidRow) {
  return slugify(`${row.department}-${row.category}-${row.name}-${stableSkuToken(row.externalId)}`);
}

function buildColour(externalId: string, text: string): Colour {
  const normalized = normalizeText(text);
  const detected = colourWords.find((colour) => normalized.includes(` ${normalizeText(colour.name).trim()} `));

  if (detected) {
    return detected;
  }

  return colourPalette[hashString(`${externalId}:colour`) % colourPalette.length] ?? colourPalette[0]!;
}

function buildFit(externalId: string, category: string, text: string) {
  if (!isFitApplicable(category)) {
    return undefined;
  }

  const normalized = normalizeText(text);
  const detected = fitKeywordMap.find((fit) => fit.keywords.some((keyword) => normalized.includes(` ${keyword} `)));

  if (detected) {
    return detected.value;
  }

  return fitValues[hashString(`${externalId}:fit`) % fitValues.length];
}

function buildMerchandisingAssignment(
  sourceDepartment: DepartmentName,
  category: string,
  productType: string,
  name: string
) {
  if (!isAccessoryProduct(category, productType, name)) {
    return {
      department: sourceDepartment,
      category,
      productType
    };
  }

  const accessoryText = `${name} ${category} ${productType}`;
  const accessoryCategory = inferAccessoryCategory(accessoryText);

  return {
    department: "Accessories" as const,
    category: accessoryCategory,
    productType: inferAccessoryProductType(accessoryText, productType, accessoryCategory)
  };
}

function isAccessoryProduct(category: string, productType: string, name: string) {
  const normalized = normalizeText(`${category} ${productType} ${name}`);

  return matchesAny(normalized, [
    " accessory ",
    " accessories ",
    " bag ",
    " bags ",
    " backpack ",
    " backpacks ",
    " crossbody ",
    " clutch ",
    " wallet ",
    " wallets ",
    " purse ",
    " purses ",
    " card holder ",
    " cardholder ",
    " keychain ",
    " keychains ",
    " keyring ",
    " keyrings ",
    " sock ",
    " socks ",
    " beanie ",
    " beanies ",
    " cap ",
    " caps ",
    " hat ",
    " hats ",
    " scarf ",
    " scarves ",
    " belt ",
    " belts ",
    " jewellery ",
    " jewelry ",
    " necklace ",
    " necklaces ",
    " bracelet ",
    " bracelets ",
    " earring ",
    " earrings ",
    " sunglasses "
  ]);
}

function inferAccessoryCategory(text: string) {
  const normalized = normalizeText(text);

  if (matchesAny(normalized, [" card holder ", " cardholder ", " wallet ", " wallets ", " purse ", " purses "])) {
    return "Wallets & Purses";
  }

  if (matchesAny(normalized, [" keychain ", " keychains ", " keyring ", " keyrings "])) return "Keyrings";
  if (matchesAny(normalized, [" backpack ", " backpacks "])) return "Backpacks";
  if (matchesAny(normalized, [" bag ", " bags ", " crossbody ", " clutch "])) return "Bags";
  if (matchesAny(normalized, [" sock ", " socks "])) return "Socks";
  if (matchesAny(normalized, [" beanie ", " beanies "])) return "Beanies";
  if (matchesAny(normalized, [" cap ", " caps ", " hat ", " hats "])) return "Hats";
  if (matchesAny(normalized, [" scarf ", " scarves "])) return "Scarves";
  if (matchesAny(normalized, [" belt ", " belts "])) return "Belts";

  if (
    matchesAny(normalized, [
      " jewellery ",
      " jewelry ",
      " ring ",
      " rings ",
      " necklace ",
      " necklaces ",
      " bracelet ",
      " bracelets ",
      " earring ",
      " earrings "
    ])
  ) {
    return "Jewellery";
  }

  if (normalized.includes(" sunglasses ")) return "Sunglasses";

  return "Accessories";
}

function inferAccessoryProductType(text: string, fallbackProductType: string, fallbackCategory: string) {
  const normalized = normalizeText(text);

  if (matchesAny(normalized, [" card holder ", " cardholder "])) return "Card Holders";
  if (matchesAny(normalized, [" wallet ", " wallets "])) return "Wallets";
  if (matchesAny(normalized, [" purse ", " purses "])) return "Purses";
  if (matchesAny(normalized, [" keychain ", " keychains "])) return "Keychains";
  if (matchesAny(normalized, [" keyring ", " keyrings "])) return "Keyrings";
  if (matchesAny(normalized, [" crossbody ", " cross body "])) return "Crossbody Bags";
  if (normalized.includes(" clutch ")) return "Clutches";
  if (matchesAny(normalized, [" backpack ", " backpacks "])) return "Backpacks";
  if (matchesAny(normalized, [" bag ", " bags "])) return "Bags";
  if (matchesAny(normalized, [" sock ", " socks "])) return "Socks";
  if (matchesAny(normalized, [" beanie ", " beanies "])) return "Beanies";
  if (matchesAny(normalized, [" cap ", " caps "])) return "Caps";
  if (matchesAny(normalized, [" hat ", " hats "])) return "Hats";
  if (matchesAny(normalized, [" scarf ", " scarves "])) return "Scarves";
  if (matchesAny(normalized, [" belt ", " belts "])) return "Belts";
  if (normalized.includes(" sunglasses ")) return "Sunglasses";

  if (
    matchesAny(normalized, [
      " jewellery ",
      " jewelry ",
      " ring ",
      " rings ",
      " necklace ",
      " necklaces ",
      " bracelet ",
      " bracelets ",
      " earring ",
      " earrings "
    ])
  ) {
    return "Jewellery";
  }

  return fallbackProductType || fallbackCategory;
}

function buildUsage(externalId: string, category: string, text: string): UsageValue {
  const normalizedCategory = category.toLowerCase();
  const normalizedText = normalizeText(text);

  if (
    ["hoodies", "sweatshirts", "tracksuits"].includes(normalizedCategory) ||
    normalizedCategory.includes("hood") ||
    normalizedCategory.includes("sweatshirt") ||
    normalizedText.includes(" ski ") ||
    normalizedText.includes(" running ") ||
    normalizedText.includes(" athletic ")
  ) {
    return "Sports";
  }

  if (
    ["blazers", "suits"].includes(normalizedCategory) ||
    normalizedText.includes(" tailored ") ||
    normalizedText.includes(" formal ") ||
    normalizedText.includes(" suit ")
  ) {
    return "Formal";
  }

  if (
    ["dresses", "skirts"].includes(normalizedCategory) &&
    hashString(`${externalId}:usage-occasion`) % 100 < 24
  ) {
    return "Ethnic";
  }

  const roll = hashString(`${externalId}:usage`) % 100;

  if (roll < 10) return "Ethnic";
  if (roll < 26) return "Formal";
  if (roll < 40) return "Sports";
  return "Casual";
}

function isFitApplicable(category: string) {
  return ![
    "Accessories",
    "Backpacks",
    "Bags",
    "Beanies",
    "Belts",
    "Hats",
    "Jewellery",
    "Keyrings",
    "Scarves",
    "Shoes",
    "Socks",
    "Sunglasses",
    "Wallets & Purses"
  ].includes(category);
}

function getDepartmentDescription(department: DepartmentName) {
  const descriptions: Record<DepartmentName, string> = {
    Women: "AVE womenswear with clear GBP pricing, imagery, sizes, and availability.",
    Men: "AVE menswear with clear GBP pricing, imagery, sizes, and availability.",
    Kids: "AVE kidswear with age sizes, clear GBP pricing, imagery, and availability.",
    Accessories: "AVE accessories including bags, hats, socks, and finishing touches with clear GBP pricing, imagery, and availability."
  };

  return descriptions[department];
}

function getCategoryLabel(category: string, department?: DepartmentName, name = "") {
  if (department === "Kids") {
    return inferKidsCategory(`${name} ${category}`);
  }

  const normalized = category.toLowerCase();
  return categoryLabelOverrides[normalized] ?? toTitleCase(category);
}

function getProductTypeLabel(category: string, fallbackCategory: string, department?: DepartmentName, name = "") {
  if (department === "Kids") {
    return inferKidsProductType(`${name} ${category}`, fallbackCategory);
  }

  return fallbackCategory;
}

function getDepartmentFromSection(section: "MAN" | "WOMAN" | "KIDS"): DepartmentName {
  if (section === "WOMAN") {
    return "Women";
  }

  if (section === "KIDS") {
    return "Kids";
  }

  return "Men";
}

function inferKidsCategory(text: string) {
  const normalized = normalizeText(text);

  if (matchesAny(normalized, [" shoe ", " shoes ", " trainer ", " trainers ", " derby ", " deck "])) return "Shoes";
  if (matchesAny(normalized, [" sock ", " socks "])) return "Socks";
  if (matchesAny(normalized, [" beanie ", " cap ", " backpack ", " bag "])) return "Accessories";
  if (normalized.includes(" blazer ")) return "Blazers";
  if (matchesAny(normalized, [" jacket ", " puffer ", " water repellent "])) return "Jackets";
  if (matchesAny(normalized, [" trouser ", " trousers ", " jogger ", " joggers ", " denim ", " jeans ", " baggy "])) return "Trousers";
  if (matchesAny(normalized, [" short ", " shorts ", " bermuda "])) return "Shorts";
  if (matchesAny(normalized, [" t shirt ", " t-shirt "])) return "T-shirts";
  if (matchesAny(normalized, [" polo ", " shirt ", " overshirt ", " oxford ", " linen "])) return "Shirts";
  if (matchesAny(normalized, [" hoodie ", " sweatshirt "])) return "Hoodies & Sweatshirts";

  return "Kidswear";
}

function inferKidsProductType(text: string, fallbackCategory: string) {
  const normalized = normalizeText(text);

  if (matchesAny(normalized, [" sock ", " socks "])) return "Socks";
  if (normalized.includes(" beanie ")) return "Beanies";
  if (normalized.includes(" cap ")) return "Caps";
  if (normalized.includes(" backpack ")) return "Backpacks";
  if (matchesAny(normalized, [" trainer ", " trainers "])) return "Trainers";
  if (normalized.includes(" derby ")) return "Derby Shoes";
  if (normalized.includes(" deck ")) return "Deck Shoes";
  if (matchesAny(normalized, [" shoe ", " shoes "])) return "Shoes";
  if (normalized.includes(" blazer ")) return "Blazers";
  if (normalized.includes(" puffer ")) return "Puffer Jackets";
  if (normalized.includes(" jacket ")) return "Jackets";
  if (normalized.includes(" hoodie ")) return "Hoodies";
  if (normalized.includes(" sweatshirt ")) return "Sweatshirts";
  if (matchesAny(normalized, [" jogger ", " joggers "])) return "Joggers";
  if (matchesAny(normalized, [" trouser ", " trousers "])) return "Trousers";
  if (matchesAny(normalized, [" denim ", " jeans "])) return "Jeans";
  if (matchesAny(normalized, [" short ", " shorts ", " bermuda "])) return "Shorts";
  if (matchesAny(normalized, [" t shirt ", " t-shirt "])) return "T-shirts";
  if (normalized.includes(" polo ")) return "Polo Shirts";
  if (matchesAny(normalized, [" shirt ", " oxford ", " linen "])) return "Shirts";

  return fallbackCategory;
}

function buildKidsDescription(name: string, category: string, subsection: string, availableSizes: string[]) {
  const subsectionLabel = buildKidsSubsection(subsection)?.toLowerCase() ?? "kids";
  const ageRange = buildAgeRange(availableSizes);
  return `${name} from the AVE ${subsectionLabel} ${category.toLowerCase()} edit, available across ${ageRange ?? "selected kids sizes"}.`;
}

function buildKidsSubsection(subsection: string) {
  const normalized = subsection.trim().toUpperCase();

  if (normalized === "BOY") return "Boys";
  if (normalized === "GIRL") return "Girls";
  if (normalized === "BABY") return "Baby";

  return undefined;
}

function buildAgeRange(sizes: string[]) {
  const parsed = sizes
    .map((size) => {
      const match = size.match(/^(\d+)(?:-(\d+))?Y$/i);

      if (!match) {
        return undefined;
      }

      return {
        min: Number.parseInt(match[1] ?? "", 10),
        max: Number.parseInt(match[2] ?? match[1] ?? "", 10)
      };
    })
    .filter((range): range is { min: number; max: number } => Boolean(range));

  if (!parsed.length) {
    return undefined;
  }

  const min = Math.min(...parsed.map((range) => range.min));
  const max = Math.max(...parsed.map((range) => range.max));
  return `${min}-${max} years`;
}

function parseImages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => stringValue(item)).filter(Boolean);
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueValues(value.map((item) => stringValue(item)).filter(Boolean));
}

function parseStockBySize(value: unknown, sizes: string[]) {
  if (!isRecord(value)) {
    return {
      valid: false as const,
      stockBySize: {},
      reason: "missing stock_by_size"
    };
  }

  const stockBySize: Record<string, number> = {};
  const invalidSizes: string[] = [];

  for (const size of sizes) {
    const rawQuantity = value[size];
    const quantity = typeof rawQuantity === "number" ? rawQuantity : Number.parseInt(String(rawQuantity ?? ""), 10);

    if (!Number.isFinite(quantity) || quantity < 0) {
      invalidSizes.push(size);
      continue;
    }

    stockBySize[size] = Math.floor(quantity);
  }

  if (invalidSizes.length) {
    return {
      valid: false as const,
      stockBySize,
      reason: `invalid stock_by_size for size(s): ${invalidSizes.join(", ")}`
    };
  }

  return {
    valid: true as const,
    stockBySize,
    reason: ""
  };
}

function parsePricePence(value: unknown) {
  const price = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  return Math.round(price * 100);
}

function isAllowedSection(value: string): value is "MAN" | "WOMAN" | "KIDS" {
  return value === "MAN" || value === "WOMAN" || value === "KIDS";
}

function isApprovedStaticImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "static.zara.net";
  } catch {
    return false;
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeCustomerFacingText(value: string) {
  return value
    .replace(/created by caramel london x zara/gi, "")
    .replace(/caramel london x zara/gi, "")
    .replace(/cars lightning mcqueen/gi, "RACING GRAPHIC")
    .replace(/rc deportivo de a coru(?:ñ|n)a/gi, "SPORTS CLUB")
    .replace(/disney\/pixar/gi, "")
    .replace(/disney/gi, "")
    .replace(/pixar/gi, "")
    .replace(/zara/gi, "")
    .replace(/[©®™]/g, "")
    .replace(/\s+\/\s+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueValues(values: string[]) {
  return [...new Set(values)];
}

function toTitleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value: string) {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()} `;
}

function matchesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function stableSkuToken(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12).toUpperCase();
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function printSummary(summary: ImportSummary) {
  console.info("Approved JSONL catalogue import complete.");
  console.info("Imported inventory is development/demo data only.");
  console.info(`Rows read: ${summary.rowsRead}`);
  console.info(`Unique image URLs checked: ${summary.imageUrlsChecked}`);
  console.info(`Image references accepted: ${summary.imageReferencesAccepted}`);
  console.info(`Image references rejected: ${summary.imageReferencesRejected}`);
  console.info(`Products skipped for unavailable images: ${summary.productsSkippedForImages}`);
  console.info(`Products deleted before import: ${summary.productsDeleted}`);
  console.info(`Products created: ${summary.productsCreated}`);
  console.info(`Products updated: ${summary.productsUpdated}`);
  console.info(`Variants created: ${summary.variantsCreated}`);
  console.info(`Variants updated: ${summary.variantsUpdated}`);
  console.info("Products created by department:");

  for (const department of departmentOrder) {
    console.info(`  ${department}: ${summary.productsCreatedByDepartment[department]}`);
  }

  console.info("Products imported by department:");

  for (const department of departmentOrder) {
    console.info(`  ${department}: ${summary.productsImportedByDepartment[department]}`);
  }

  if (summary.skippedRows.length) {
    console.warn(`Skipped rows: ${summary.skippedRows.length}`);

    for (const skipped of summary.skippedRows) {
      const sourceLabel = skipped.sourceName ? `${skipped.sourceName} ` : "";
      console.warn(`  ${sourceLabel}row ${skipped.rowNumber}${skipped.externalId ? ` (${skipped.externalId})` : ""}: ${skipped.reason}`);
    }
  } else {
    console.info("Skipped rows: 0");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
