import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { clearSessionCookie, setSessionCookie } from "../../lib/session.js";
import { getGuestCartId } from "../cart/cart.identity.js";
import { getCurrentCustomer, loginCustomer, registerCustomer } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.use(optionalAuth);

authRouter.post(
  "/register",
  asyncHandler(async (request, response) => {
    const input = registerSchema.parse(request.body);
    const result = await registerCustomer(input, getGuestCartId(request));
    setSessionCookie(response, result.token);
    response.status(201).json({
      customer: result.customer,
      mergeWarnings: result.mergeWarnings
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (request, response) => {
    const input = loginSchema.parse(request.body);
    const result = await loginCustomer(input, getGuestCartId(request));
    setSessionCookie(response, result.token);
    response.json({
      customer: result.customer,
      mergeWarnings: result.mergeWarnings
    });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    response.json({ customer: await getCurrentCustomer(request.auth!.customerId) });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (_request, response) => {
    clearSessionCookie(response);
    response.status(204).send();
  })
);
