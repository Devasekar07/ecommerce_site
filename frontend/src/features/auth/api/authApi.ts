import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJson, postJson } from "../../../lib/apiClient";
import { clearGuestCartId, getGuestCartHeaders } from "../../../lib/guestCart";
import type { Customer } from "../../../types/auth";
import type { CartWarning } from "../../../types/cart";

type AuthResponse = {
  customer: Customer;
  mergeWarnings: CartWarning[];
};

type CurrentCustomerResponse = {
  customer: Customer;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export function useCurrentCustomer() {
  return useQuery({
    queryKey: ["current-customer"],
    queryFn: async () => {
      const response = await getJson<CurrentCustomerResponse>("/api/v1/auth/me");
      return response.customer;
    },
    retry: false
  });
}

export function useRegisterCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      postJson<AuthResponse>("/api/v1/auth/register", payload, { headers: getGuestCartHeaders() }),
    onSuccess: async () => {
      clearGuestCartId();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["current-customer"] }),
        queryClient.invalidateQueries({ queryKey: ["cart"] })
      ]);
    }
  });
}

export function useLoginCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      postJson<AuthResponse>("/api/v1/auth/login", payload, { headers: getGuestCartHeaders() }),
    onSuccess: async () => {
      clearGuestCartId();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["current-customer"] }),
        queryClient.invalidateQueries({ queryKey: ["cart"] })
      ]);
    }
  });
}

export function useLogoutCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postJson<void>("/api/v1/auth/logout"),
    onSuccess: async () => {
      clearGuestCartId();
      queryClient.removeQueries({ queryKey: ["current-customer"] });
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  });
}
