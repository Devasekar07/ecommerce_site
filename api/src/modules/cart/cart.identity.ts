import type { Request } from "express";
import { AppError } from "../../lib/errors.js";
import { guestCartIdSchema } from "./cart.schemas.js";

export const guestCartHeaderName = "x-guest-cart-id";

export function getGuestCartId(request: Request) {
  const rawHeader = request.header(guestCartHeaderName);

  if (!rawHeader) {
    return undefined;
  }

  const parsed = guestCartIdSchema.safeParse(rawHeader);

  if (!parsed.success) {
    throw new AppError("Guest basket id must be an opaque UUID.", 400, "INVALID_GUEST_CART_ID");
  }

  return parsed.data;
}
