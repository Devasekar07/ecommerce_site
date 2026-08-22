import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { AddressCreateInput, AddressUpdateInput, ProfileUpdateInput } from "./customer.schemas.js";

export async function updateCustomerProfile(customerId: string, input: ProfileUpdateInput) {
  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      phone: input.phone === undefined ? undefined : normalizeOptional(input.phone)
    }
  });

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

export async function listCustomerAddresses(customerId: string) {
  const addresses = await prisma.address.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });

  return addresses.map(mapAddress);
}

export async function createCustomerAddress(customerId: string, input: AddressCreateInput) {
  const address = await prisma.$transaction(async (tx) => {
    const addressCount = await tx.address.count({ where: { customerId } });
    const shouldBeDefault = input.isDefault ?? addressCount === 0;

    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { customerId },
        data: { isDefault: false }
      });
    }

    return tx.address.create({
      data: {
        customerId,
        type: input.type,
        label: normalizeOptional(input.label),
        line1: input.line1.trim(),
        line2: normalizeOptional(input.line2),
        city: input.city.trim(),
        county: normalizeOptional(input.county),
        postcode: normalizePostcode(input.postcode),
        countryCode: "GB",
        isDefault: shouldBeDefault
      }
    });
  });

  return mapAddress(address);
}

export async function updateCustomerAddress(customerId: string, addressId: string, input: AddressUpdateInput) {
  const address = await prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({
      where: { id: addressId, customerId }
    });

    if (!existing) {
      throw new AppError("Address not found.", 404, "ADDRESS_NOT_FOUND");
    }

    if (input.isDefault === true) {
      await tx.address.updateMany({
        where: {
          customerId,
          id: { not: addressId }
        },
        data: { isDefault: false }
      });
    }

    return tx.address.update({
      where: { id: addressId },
      data: {
        type: input.type,
        label: input.label === undefined ? undefined : normalizeOptional(input.label),
        line1: input.line1?.trim(),
        line2: input.line2 === undefined ? undefined : normalizeOptional(input.line2),
        city: input.city?.trim(),
        county: input.county === undefined ? undefined : normalizeOptional(input.county),
        postcode: input.postcode ? normalizePostcode(input.postcode) : undefined,
        countryCode: "GB",
        isDefault: input.isDefault
      }
    });
  });

  return mapAddress(address);
}

export async function deleteCustomerAddress(customerId: string, addressId: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({
      where: { id: addressId, customerId }
    });

    if (!existing) {
      throw new AppError("Address not found.", 404, "ADDRESS_NOT_FOUND");
    }

    await tx.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const nextAddress = await tx.address.findFirst({
        where: { customerId },
        orderBy: { createdAt: "asc" }
      });

      if (nextAddress) {
        await tx.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true }
        });
      }
    }
  });
}

function mapAddress(address: {
  id: string;
  type: "SHIPPING" | "BILLING";
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  countryCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: address.id,
    type: address.type,
    label: address.label,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    county: address.county,
    postcode: address.postcode,
    countryCode: address.countryCode,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString()
  };
}

function normalizePostcode(postcode: string) {
  return postcode.trim().toUpperCase().replace(/\s+/, " ");
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
