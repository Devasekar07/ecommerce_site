import type { Prisma } from "@prisma/client";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { maxBasketQuantity, type AddCartItemInput, type UpdateCartItemInput } from "./cart.schemas.js";

const guestCartDurationMs = 30 * 24 * 60 * 60 * 1000;

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        include: {
          inventory: true,
          product: {
            include: {
              department: {
                select: { id: true, slug: true, name: true }
              },
              category: {
                select: { id: true, slug: true, name: true }
              },
              images: {
                orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
                take: 1
              }
            }
          }
        }
      }
    }
  }
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;
type CartIdentity = {
  customerId?: string;
  guestId?: string;
};
type Client = typeof prisma | Prisma.TransactionClient;

export type CartWarning = {
  code: "QUANTITY_CAPPED" | "OUT_OF_STOCK" | "MERGED_WITH_CAP";
  message: string;
};

export function resolveCartIdentity(auth: Express.Request["auth"], guestId?: string): CartIdentity {
  if (auth?.customerId) {
    return { customerId: auth.customerId, guestId };
  }

  if (guestId) {
    return { guestId };
  }

  throw new AppError("Guest basket id is required.", 400, "GUEST_CART_REQUIRED");
}

export async function getCart(identity: CartIdentity, warnings: CartWarning[] = []) {
  const cart = await getOrCreateActiveCart(identity, prisma);
  return mapCart(cart, warnings);
}

export async function addCartItem(identity: CartIdentity, input: AddCartItemInput) {
  const warnings: CartWarning[] = [];

  await prisma.$transaction(async (tx) => {
    const cart = await getOrCreateActiveCart(identity, tx);
    const variant = await getSellableVariant(input.variantId, tx);
    const availableQuantity = getAvailableQuantity(variant.inventory);

    if (availableQuantity <= 0) {
      throw new AppError("This variant is out of stock.", 409, "OUT_OF_STOCK");
    }

    const existingItem = await tx.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variant.id
        }
      }
    });
    const desiredQuantity = (existingItem?.quantity ?? 0) + input.quantity;
    const cappedQuantity = capQuantity(desiredQuantity, availableQuantity);

    if (cappedQuantity < desiredQuantity) {
      warnings.push(quantityCapWarning(variant.product.name, cappedQuantity, availableQuantity));
    }

    if (existingItem) {
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: cappedQuantity }
      });
      return;
    }

    await tx.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: variant.id,
        quantity: cappedQuantity
      }
    });
  });

  return getCart(identity, warnings);
}

export async function updateCartItem(identity: CartIdentity, itemId: string, input: UpdateCartItemInput) {
  const warnings: CartWarning[] = [];

  await prisma.$transaction(async (tx) => {
    const cart = await getOwnedCart(identity, tx);
    const item = cart.items.find((cartItem) => cartItem.id === itemId);

    if (!item) {
      throw new AppError("Basket item not found.", 404, "CART_ITEM_NOT_FOUND");
    }

    const availableQuantity = getAvailableQuantity(item.variant.inventory);

    if (availableQuantity <= 0) {
      await tx.cartItem.delete({ where: { id: item.id } });
      warnings.push({
        code: "OUT_OF_STOCK",
        message: `${item.variant.product.name} is now out of stock and was removed from your basket.`
      });
      return;
    }

    const cappedQuantity = capQuantity(input.quantity, availableQuantity);

    if (cappedQuantity < input.quantity) {
      warnings.push(quantityCapWarning(item.variant.product.name, cappedQuantity, availableQuantity));
    }

    await tx.cartItem.update({
      where: { id: item.id },
      data: { quantity: cappedQuantity }
    });
  });

  return getCart(identity, warnings);
}

export async function removeCartItem(identity: CartIdentity, itemId: string) {
  await prisma.$transaction(async (tx) => {
    const cart = await getOwnedCart(identity, tx);
    const item = cart.items.find((cartItem) => cartItem.id === itemId);

    if (!item) {
      throw new AppError("Basket item not found.", 404, "CART_ITEM_NOT_FOUND");
    }

    await tx.cartItem.delete({ where: { id: item.id } });
  });

  return getCart(identity);
}

export async function mergeGuestCartIntoCustomer(customerId: string, guestId?: string) {
  if (!guestId) {
    return [] satisfies CartWarning[];
  }

  const warnings: CartWarning[] = [];

  await prisma.$transaction(async (tx) => {
    const guestCart = await findActiveGuestCart(guestId, tx);

    if (!guestCart || !guestCart.items.length) {
      return;
    }

    const customerCart = await getOrCreateActiveCart({ customerId }, tx);

    for (const guestItem of guestCart.items) {
      const availableQuantity = getAvailableQuantity(guestItem.variant.inventory);

      if (availableQuantity <= 0) {
        warnings.push({
          code: "OUT_OF_STOCK",
          message: `${guestItem.variant.product.name} is out of stock and was not moved into your basket.`
        });
        continue;
      }

      const customerItem = customerCart.items.find((item) => item.variantId === guestItem.variantId);
      const desiredQuantity = (customerItem?.quantity ?? 0) + guestItem.quantity;
      const cappedQuantity = capQuantity(desiredQuantity, availableQuantity);

      if (cappedQuantity < desiredQuantity) {
        warnings.push({
          code: "MERGED_WITH_CAP",
          message: `${guestItem.variant.product.name} was capped at ${cappedQuantity} due to live stock.`
        });
      }

      if (customerItem) {
        await tx.cartItem.update({
          where: { id: customerItem.id },
          data: { quantity: cappedQuantity }
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: customerCart.id,
            variantId: guestItem.variantId,
            quantity: cappedQuantity
          }
        });
      }
    }

    await tx.cart.update({
      where: { id: guestCart.id },
      data: { status: "ABANDONED" }
    });
  });

  return warnings;
}

async function getOwnedCart(identity: CartIdentity, client: Client) {
  const cart = await findActiveCart(identity, client);

  if (!cart) {
    throw new AppError("Basket not found.", 404, "CART_NOT_FOUND");
  }

  return cart;
}

async function getOrCreateActiveCart(identity: CartIdentity, client: Client) {
  const existing = await findActiveCart(identity, client);

  if (existing) {
    return existing;
  }

  return client.cart.create({
    data: {
      customerId: identity.customerId,
      guestId: identity.customerId ? undefined : identity.guestId,
      expiresAt: identity.customerId ? null : getGuestCartExpiry()
    },
    include: cartInclude
  });
}

async function findActiveCart(identity: CartIdentity, client: Client) {
  if (identity.customerId) {
    return client.cart.findFirst({
      where: {
        customerId: identity.customerId,
        status: "ACTIVE"
      },
      include: cartInclude,
      orderBy: { updatedAt: "desc" }
    });
  }

  if (!identity.guestId) {
    return null;
  }

  const cart = await findActiveGuestCart(identity.guestId, client);

  if (!cart) {
    return null;
  }

  if (cart.expiresAt && cart.expiresAt.getTime() < Date.now()) {
    await client.cart.update({
      where: { id: cart.id },
      data: { status: "ABANDONED" }
    });
    return null;
  }

  return cart;
}

async function findActiveGuestCart(guestId: string, client: Client) {
  return client.cart.findFirst({
    where: {
      guestId,
      status: "ACTIVE"
    },
    include: cartInclude,
    orderBy: { updatedAt: "desc" }
  });
}

async function getSellableVariant(variantId: string, client: Client) {
  const variant = await client.productVariant.findUnique({
    where: { id: variantId },
    include: {
      inventory: true,
      product: {
        include: {
          images: {
            orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
            take: 1
          }
        }
      }
    }
  });

  if (!variant || variant.status !== "ACTIVE" || variant.product.status !== "ACTIVE" || !variant.product.images.length) {
    throw new AppError("Product variant not found.", 404, "VARIANT_NOT_FOUND");
  }

  return variant;
}

function mapCart(cart: CartWithItems, warnings: CartWarning[]) {
  const items = cart.items
    .filter((item) => item.variant.product.status === "ACTIVE" && item.variant.status === "ACTIVE" && item.variant.product.images.length > 0)
    .map((item) => {
      const product = item.variant.product;
      const availableQuantity = getAvailableQuantity(item.variant.inventory);
      const unitPricePence = product.salePricePence ?? product.pricePence;
      const maxAllowedQuantity = capQuantity(maxBasketQuantity, availableQuantity);

      return {
        id: item.id,
        quantity: item.quantity,
        unitPricePence,
        lineTotalPence: unitPricePence * item.quantity,
        maxAllowedQuantity,
        product: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          pricePence: product.pricePence,
          salePricePence: product.salePricePence,
          currency: product.currency,
          department: product.department,
          category: product.category,
          image: product.images[0]
            ? {
                id: product.images[0].id,
                url: product.images[0].url,
                altText: product.images[0].altText
              }
            : null
        },
        variant: {
          id: item.variant.id,
          sku: item.variant.sku,
          size: item.variant.size,
          colourName: item.variant.colourName,
          colourHex: item.variant.colourHex,
          availableQuantity,
          stockStatus: getStockStatus(availableQuantity)
        }
      };
    });

  const subtotalPence = items.reduce((sum, item) => sum + item.product.pricePence * item.quantity, 0);
  const totalPence = items.reduce((sum, item) => sum + item.lineTotalPence, 0);

  return {
    cart: {
      id: cart.id,
      status: cart.status,
      currency: cart.currency,
      isGuest: !cart.customerId,
      expiresAt: cart.expiresAt?.toISOString() ?? null,
      items,
      summary: {
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotalPence,
        discountPence: subtotalPence - totalPence,
        totalPence
      }
    },
    warnings
  };
}

function getGuestCartExpiry() {
  return new Date(Date.now() + guestCartDurationMs);
}

function getAvailableQuantity(inventory: { quantity: number; reservedQuantity: number } | null) {
  return Math.max((inventory?.quantity ?? 0) - (inventory?.reservedQuantity ?? 0), 0);
}

function capQuantity(quantity: number, availableQuantity: number) {
  return Math.min(quantity, maxBasketQuantity, availableQuantity);
}

function quantityCapWarning(productName: string, cappedQuantity: number, availableQuantity: number): CartWarning {
  return {
    code: "QUANTITY_CAPPED",
    message: `${productName} was capped at ${cappedQuantity} because only ${availableQuantity} are available.`
  };
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
