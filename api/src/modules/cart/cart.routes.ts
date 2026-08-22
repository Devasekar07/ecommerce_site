import { Router } from "express";
import { optionalAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { getGuestCartId } from "./cart.identity.js";
import { addCartItemSchema, cartItemParamsSchema, updateCartItemSchema } from "./cart.schemas.js";
import { addCartItem, getCart, removeCartItem, resolveCartIdentity, updateCartItem } from "./cart.service.js";

export const cartRouter = Router();

cartRouter.use(optionalAuth);

cartRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const identity = resolveCartIdentity(request.auth, getGuestCartId(request));
    response.json(await getCart(identity));
  })
);

cartRouter.post(
  "/items",
  asyncHandler(async (request, response) => {
    const identity = resolveCartIdentity(request.auth, getGuestCartId(request));
    const input = addCartItemSchema.parse(request.body);
    response.status(201).json(await addCartItem(identity, input));
  })
);

cartRouter.patch(
  "/items/:itemId",
  asyncHandler(async (request, response) => {
    const identity = resolveCartIdentity(request.auth, getGuestCartId(request));
    const { itemId } = cartItemParamsSchema.parse(request.params);
    const input = updateCartItemSchema.parse(request.body);
    response.json(await updateCartItem(identity, itemId, input));
  })
);

cartRouter.delete(
  "/items/:itemId",
  asyncHandler(async (request, response) => {
    const identity = resolveCartIdentity(request.auth, getGuestCartId(request));
    const { itemId } = cartItemParamsSchema.parse(request.params);
    response.json(await removeCartItem(identity, itemId));
  })
);
