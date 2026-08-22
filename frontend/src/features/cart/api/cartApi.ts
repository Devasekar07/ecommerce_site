import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteJson, getJson, patchJson, postJson } from "../../../lib/apiClient";
import { getGuestCartHeaders } from "../../../lib/guestCart";
import type { CartResponse } from "../../../types/cart";

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => getJson<CartResponse>("/api/v1/cart", { headers: getGuestCartHeaders() })
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { variantId: string; quantity: number }) =>
      postJson<CartResponse>("/api/v1/cart/items", payload, { headers: getGuestCartHeaders() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      patchJson<CartResponse>(`/api/v1/cart/items/${itemId}`, { quantity }, { headers: getGuestCartHeaders() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteJson<CartResponse>(`/api/v1/cart/items/${itemId}`, { headers: getGuestCartHeaders() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });
}
