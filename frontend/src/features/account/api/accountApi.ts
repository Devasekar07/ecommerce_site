import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteJson, getJson, patchJson, postJson } from "../../../lib/apiClient";
import type { Address, AddressType, Customer } from "../../../types/auth";

type ProfileResponse = {
  customer: Customer;
};

type AddressesResponse = {
  addresses: Address[];
};

type AddressResponse = {
  address: Address;
};

export type ProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
};

export type AddressPayload = {
  type: AddressType;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  countryCode: "GB";
  isDefault?: boolean;
};

export function useAccountProfile() {
  return useQuery({
    queryKey: ["account-profile"],
    queryFn: async () => {
      const response = await getJson<ProfileResponse>("/api/v1/account/profile");
      return response.customer;
    },
    retry: false
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfilePayload) => patchJson<ProfileResponse>("/api/v1/account/profile", payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["account-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["current-customer"] })
      ]);
    }
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const response = await getJson<AddressesResponse>("/api/v1/account/addresses");
      return response.addresses;
    },
    retry: false
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddressPayload) => postJson<AddressResponse>("/api/v1/account/addresses", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
    }
  });
}

export function useMakeDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) =>
      patchJson<AddressResponse>(`/api/v1/account/addresses/${addressId}`, { isDefault: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
    }
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => deleteJson<void>(`/api/v1/account/addresses/${addressId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
    }
  });
}
