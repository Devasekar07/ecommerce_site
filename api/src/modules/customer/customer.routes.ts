import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { getCurrentCustomer } from "../auth/auth.service.js";
import {
  addressCreateSchema,
  addressParamsSchema,
  addressUpdateSchema,
  profileUpdateSchema
} from "./customer.schemas.js";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  listCustomerAddresses,
  updateCustomerAddress,
  updateCustomerProfile
} from "./customer.service.js";

export const customerRouter = Router();

customerRouter.use(optionalAuth, requireAuth);

customerRouter.get(
  "/profile",
  asyncHandler(async (request, response) => {
    response.json({ customer: await getCurrentCustomer(request.auth!.customerId) });
  })
);

customerRouter.patch(
  "/profile",
  asyncHandler(async (request, response) => {
    const input = profileUpdateSchema.parse(request.body);
    response.json({ customer: await updateCustomerProfile(request.auth!.customerId, input) });
  })
);

customerRouter.get(
  "/addresses",
  asyncHandler(async (request, response) => {
    response.json({ addresses: await listCustomerAddresses(request.auth!.customerId) });
  })
);

customerRouter.post(
  "/addresses",
  asyncHandler(async (request, response) => {
    const input = addressCreateSchema.parse(request.body);
    response.status(201).json({ address: await createCustomerAddress(request.auth!.customerId, input) });
  })
);

customerRouter.patch(
  "/addresses/:addressId",
  asyncHandler(async (request, response) => {
    const { addressId } = addressParamsSchema.parse(request.params);
    const input = addressUpdateSchema.parse(request.body);
    response.json({ address: await updateCustomerAddress(request.auth!.customerId, addressId, input) });
  })
);

customerRouter.delete(
  "/addresses/:addressId",
  asyncHandler(async (request, response) => {
    const { addressId } = addressParamsSchema.parse(request.params);
    await deleteCustomerAddress(request.auth!.customerId, addressId);
    response.status(204).send();
  })
);
