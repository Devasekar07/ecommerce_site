import { z } from "zod";

export const maxBasketQuantity = 10;

export const guestCartIdSchema = z.string().uuid();

export const addCartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(maxBasketQuantity).default(1)
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(maxBasketQuantity)
});

export const cartItemParamsSchema = z.object({
  itemId: z.string().min(1)
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
