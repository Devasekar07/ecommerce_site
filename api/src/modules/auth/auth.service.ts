import argon2 from "argon2";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { createSessionToken } from "../../lib/session.js";
import { mergeGuestCartIntoCustomer } from "../cart/cart.service.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

export async function registerCustomer(input: RegisterInput, guestId?: string) {
  const email = normalizeEmail(input.email);
  const existingCustomer = await prisma.customer.findUnique({ where: { email } });

  if (existingCustomer) {
    throw new AppError("An account already exists for this email address.", 409, "EMAIL_ALREADY_REGISTERED");
  }

  const customer = await prisma.customer.create({
    data: {
      email,
      passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: normalizeOptional(input.phone)
    }
  });
  const mergeWarnings = await mergeGuestCartIntoCustomer(customer.id, guestId);

  return {
    customer: mapCustomer(customer),
    token: createSessionToken({ customerId: customer.id, email: customer.email }),
    mergeWarnings
  };
}

export async function loginCustomer(input: LoginInput, guestId?: string) {
  const email = normalizeEmail(input.email);
  const customer = await prisma.customer.findUnique({ where: { email } });

  if (!customer || !(await argon2.verify(customer.passwordHash, input.password))) {
    throw new AppError("Email or password is incorrect.", 401, "INVALID_CREDENTIALS");
  }

  const mergeWarnings = await mergeGuestCartIntoCustomer(customer.id, guestId);

  return {
    customer: mapCustomer(customer),
    token: createSessionToken({ customerId: customer.id, email: customer.email }),
    mergeWarnings
  };
}

export async function getCurrentCustomer(customerId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });

  if (!customer) {
    throw new AppError("Customer account not found.", 404, "CUSTOMER_NOT_FOUND");
  }

  return mapCustomer(customer);
}

function mapCustomer(customer: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString()
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
