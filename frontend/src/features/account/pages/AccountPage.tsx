import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { LoadingState } from "../../../components/LoadingState";
import { useLogoutCustomer } from "../../auth/api/authApi";
import { FieldError, FormError } from "../../auth/pages/LoginPage";
import {
  useAccountProfile,
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useMakeDefaultAddress,
  useUpdateProfile
} from "../api/accountApi";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  phone: z.string().trim().optional()
});

const addressSchema = z.object({
  type: z.enum(["SHIPPING", "BILLING"]),
  label: z.string().trim().optional(),
  line1: z.string().trim().min(1, "Enter address line 1."),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "Enter a town or city."),
  county: z.string().trim().optional(),
  postcode: z
    .string()
    .trim()
    .regex(/^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i, "Enter a valid UK postcode."),
  isDefault: z.boolean()
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;

export function AccountPage() {
  const navigate = useNavigate();
  const profileQuery = useAccountProfile();
  const addressesQuery = useAddresses();
  const updateProfileMutation = useUpdateProfile();
  const createAddressMutation = useCreateAddress();
  const makeDefaultMutation = useMakeDefaultAddress();
  const deleteAddressMutation = useDeleteAddress();
  const logoutMutation = useLogoutCustomer();
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: ""
    }
  });
  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: "SHIPPING",
      label: "",
      line1: "",
      line2: "",
      city: "",
      county: "",
      postcode: "",
      isDefault: false
    }
  });

  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({
        firstName: profileQuery.data.firstName,
        lastName: profileQuery.data.lastName,
        phone: profileQuery.data.phone ?? ""
      });
    }
  }, [profileForm, profileQuery.data]);

  async function submitProfile(values: ProfileFormValues) {
    await updateProfileMutation.mutateAsync({
      ...values,
      phone: values.phone || null
    });
  }

  async function submitAddress(values: AddressFormValues) {
    await createAddressMutation.mutateAsync({
      ...values,
      label: values.label || undefined,
      line2: values.line2 || undefined,
      county: values.county || undefined,
      countryCode: "GB"
    });
    addressForm.reset({
      type: "SHIPPING",
      label: "",
      line1: "",
      line2: "",
      city: "",
      county: "",
      postcode: "",
      isDefault: false
    });
  }

  async function logout() {
    await logoutMutation.mutateAsync();
    navigate("/", { replace: true });
  }

  if (profileQuery.isLoading || addressesQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState label="Loading account" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState title="Account unavailable" message="We could not load your account." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 border-b border-ink/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-berry">Account</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
            {profileQuery.data.firstName} {profileQuery.data.lastName}
          </h1>
          <p className="mt-3 text-sm text-ink/65">{profileQuery.data.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded border border-ink/15 bg-white px-4 py-3 text-sm font-semibold"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </section>

      <div className="grid gap-10 py-10 lg:grid-cols-[0.75fr_1.25fr]">
        <section>
          <h2 className="text-2xl font-semibold tracking-normal">Profile</h2>
          <form className="mt-5 space-y-4" onSubmit={profileForm.handleSubmit(submitProfile)}>
            <label className="block text-sm font-medium">
              First name
              <input className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...profileForm.register("firstName")} />
              <FieldError message={profileForm.formState.errors.firstName?.message} />
            </label>

            <label className="block text-sm font-medium">
              Last name
              <input className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...profileForm.register("lastName")} />
              <FieldError message={profileForm.formState.errors.lastName?.message} />
            </label>

            <label className="block text-sm font-medium">
              Phone
              <input type="tel" className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...profileForm.register("phone")} />
              <FieldError message={profileForm.formState.errors.phone?.message} />
            </label>

            {updateProfileMutation.isError ? <FormError error={updateProfileMutation.error} /> : null}

            <button
              type="submit"
              className="rounded bg-ink px-4 py-3 font-semibold text-paper disabled:cursor-not-allowed disabled:bg-ink/40"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving" : "Save profile"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-normal">Saved addresses</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {addressesQuery.isError ? (
              <ErrorState title="Addresses unavailable" />
            ) : addressesQuery.data?.length ? (
              addressesQuery.data.map((address) => (
                <article key={address.id} className="rounded border border-ink/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{address.label || (address.type === "SHIPPING" ? "Shipping address" : "Billing address")}</h3>
                      <p className="mt-1 text-xs font-semibold uppercase text-ink/50">{address.type.toLowerCase()}</p>
                    </div>
                    {address.isDefault ? <span className="rounded bg-leaf/10 px-2 py-1 text-xs font-semibold text-leaf">Default</span> : null}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink/70">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.city}
                    {address.county ? `, ${address.county}` : ""}
                    <br />
                    {address.postcode}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!address.isDefault ? (
                      <button
                        type="button"
                        className="rounded border border-ink/15 px-3 py-2 text-sm font-semibold"
                        onClick={() => makeDefaultMutation.mutate(address.id)}
                      >
                        Make default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded border border-berry/25 px-3 py-2 text-sm font-semibold text-berry"
                      onClick={() => deleteAddressMutation.mutate(address.id)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="No saved addresses" message="Add a UK address for delivery details." />
            )}
          </div>

          <form className="mt-8 grid gap-4 rounded border border-ink/10 bg-white p-4 sm:grid-cols-2" onSubmit={addressForm.handleSubmit(submitAddress)}>
            <h3 className="text-lg font-semibold sm:col-span-2">Add address</h3>
            <label className="block text-sm font-medium">
              Type
              <select className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...addressForm.register("type")}>
                <option value="SHIPPING">Shipping</option>
                <option value="BILLING">Billing</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Label
              <input className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...addressForm.register("label")} />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Address line 1
              <input className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...addressForm.register("line1")} />
              <FieldError message={addressForm.formState.errors.line1?.message} />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Address line 2
              <input className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...addressForm.register("line2")} />
            </label>
            <label className="block text-sm font-medium">
              Town or city
              <input className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...addressForm.register("city")} />
              <FieldError message={addressForm.formState.errors.city?.message} />
            </label>
            <label className="block text-sm font-medium">
              County
              <input className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...addressForm.register("county")} />
            </label>
            <label className="block text-sm font-medium">
              Postcode
              <input className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3 uppercase" {...addressForm.register("postcode")} />
              <FieldError message={addressForm.formState.errors.postcode?.message} />
            </label>
            <label className="mt-8 flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4" {...addressForm.register("isDefault")} />
              Use as default
            </label>
            <div className="sm:col-span-2">
              {createAddressMutation.isError ? <FormError error={createAddressMutation.error} /> : null}
              <button
                type="submit"
                className="mt-3 rounded bg-ink px-4 py-3 font-semibold text-paper disabled:cursor-not-allowed disabled:bg-ink/40"
                disabled={createAddressMutation.isPending}
              >
                {createAddressMutation.isPending ? "Adding" : "Add address"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
