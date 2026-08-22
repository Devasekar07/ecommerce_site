import { z } from "zod";

const ukPostcodeSchema = z
  .string()
  .trim()
  .min(5)
  .max(10)
  .regex(/^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i, "Enter a valid UK postcode.");

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).nullable().optional()
});

export const addressCreateSchema = z.object({
  type: z.enum(["SHIPPING", "BILLING"]).default("SHIPPING"),
  label: z.string().trim().max(80).optional(),
  line1: z.string().trim().min(1).max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(1).max(80),
  county: z.string().trim().max(80).optional(),
  postcode: ukPostcodeSchema,
  countryCode: z.literal("GB").default("GB"),
  isDefault: z.boolean().optional()
});

export const addressUpdateSchema = addressCreateSchema.partial().extend({
  countryCode: z.literal("GB").optional()
});

export const addressParamsSchema = z.object({
  addressId: z.string().min(1)
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
