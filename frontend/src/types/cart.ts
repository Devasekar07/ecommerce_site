import type { StockStatus } from "./catalog";

export type CartWarning = {
  code: "QUANTITY_CAPPED" | "OUT_OF_STOCK" | "MERGED_WITH_CAP";
  message: string;
};

export type CartItem = {
  id: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
  maxAllowedQuantity: number;
  product: {
    id: string;
    slug: string;
    name: string;
    pricePence: number;
    salePricePence: number | null;
    currency: string;
    department: { id: string; slug: string; name: string };
    category: { id: string; slug: string; name: string };
    image: { id: string; url: string; altText: string } | null;
  };
  variant: {
    id: string;
    sku: string;
    size: string;
    colourName: string;
    colourHex: string | null;
    availableQuantity: number;
    stockStatus: StockStatus;
  };
};

export type Cart = {
  id: string;
  status: "ACTIVE" | "CHECKED_OUT" | "ABANDONED";
  currency: string;
  isGuest: boolean;
  expiresAt: string | null;
  items: CartItem[];
  summary: {
    itemCount: number;
    subtotalPence: number;
    discountPence: number;
    totalPence: number;
  };
};

export type CartResponse = {
  cart: Cart;
  warnings: CartWarning[];
};
