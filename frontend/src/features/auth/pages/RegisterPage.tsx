import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { BrandLockup } from "../../../components/BrandLockup";
import type { CartWarning } from "../../../types/cart";
import { useRegisterCustomer } from "../api/authApi";
import { FieldError, FormError, WarningList } from "./LoginPage";

const registerFormSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Password must include at least one letter.")
    .regex(/[0-9]/, "Password must include at least one number."),
  phone: z.string().trim().optional()
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterCustomer();
  const [warnings, setWarnings] = useState<CartWarning[]>([]);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: ""
    }
  });

  async function onSubmit(values: RegisterFormValues) {
    const response = await registerMutation.mutateAsync({
      ...values,
      phone: values.phone || undefined
    });
    setWarnings(response.mergeWarnings);

    if (!response.mergeWarnings.length) {
      navigate("/account", { replace: true });
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <BrandLockup imageClassName="h-12 w-24" textClassName="text-xl" />
        <p className="pt-3 text-sm font-semibold uppercase text-berry">AVE account</p>
        <h1 className="text-4xl font-semibold tracking-normal">Create your AVE account</h1>
      </div>

      <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="block text-sm font-medium">
          First name
          <input className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...form.register("firstName")} />
          <FieldError message={form.formState.errors.firstName?.message} />
        </label>

        <label className="block text-sm font-medium">
          Last name
          <input className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3" {...form.register("lastName")} />
          <FieldError message={form.formState.errors.lastName?.message} />
        </label>

        <label className="block text-sm font-medium sm:col-span-2">
          Email
          <input
            type="email"
            autoComplete="email"
            className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3"
            {...form.register("email")}
          />
          <FieldError message={form.formState.errors.email?.message} />
        </label>

        <label className="block text-sm font-medium sm:col-span-2">
          Password
          <input
            type="password"
            autoComplete="new-password"
            className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3"
            {...form.register("password")}
          />
          <span className="mt-2 block text-xs text-ink/60">Minimum 8 characters, with at least one letter and one number.</span>
          <FieldError message={form.formState.errors.password?.message} />
        </label>

        <label className="block text-sm font-medium sm:col-span-2">
          Phone
          <input
            type="tel"
            autoComplete="tel"
            className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3"
            {...form.register("phone")}
          />
          <FieldError message={form.formState.errors.phone?.message} />
        </label>

        <div className="sm:col-span-2">
          {registerMutation.isError ? <FormError error={registerMutation.error} /> : null}
          <WarningList warnings={warnings} />
        </div>

        <button
          type="submit"
          className="rounded bg-ink px-4 py-3 font-semibold text-paper disabled:cursor-not-allowed disabled:bg-ink/40 sm:col-span-2"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating account" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/70">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-ink underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
