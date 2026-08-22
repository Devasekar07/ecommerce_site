export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AddressType = "SHIPPING" | "BILLING";

export type Address = {
  id: string;
  type: AddressType;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  countryCode: "GB";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};
