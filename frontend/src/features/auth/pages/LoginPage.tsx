import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { ApiClientError } from "../../../lib/apiClient";
import type { CartWarning } from "../../../types/cart";
import { BrandLockup } from "../../../components/BrandLockup";
import { useLoginCustomer } from "../api/authApi";

const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.")
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginCustomer();
  const [warnings, setWarnings] = useState<CartWarning[]>([]);
  const from = typeof location.state === "object" && location.state && "from" in location.state ? String(location.state.from) : "/account";
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  async function onSubmit(values: LoginFormValues) {
    const response = await loginMutation.mutateAsync(values);
    setWarnings(response.mergeWarnings);

    if (!response.mergeWarnings.length) {
      navigate(from, { replace: true });
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <BrandLockup imageClassName="h-12 w-24" textClassName="text-xl" />
        <p className="pt-3 text-sm font-semibold uppercase text-berry">AVE account</p>
        <h1 className="text-4xl font-semibold tracking-normal">Sign in to AVE</h1>
      </div>

      <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            autoComplete="email"
            className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3"
            {...form.register("email")}
          />
          <FieldError message={form.formState.errors.email?.message} />
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            autoComplete="current-password"
            className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3"
            {...form.register("password")}
          />
          <FieldError message={form.formState.errors.password?.message} />
        </label>

        {loginMutation.isError ? <FormError error={loginMutation.error} /> : null}
        <WarningList warnings={warnings} />

        <button
          type="submit"
          className="w-full rounded bg-ink px-4 py-3 font-semibold text-paper disabled:cursor-not-allowed disabled:bg-ink/40"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Signing in" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/70">
        New here?{" "}
        <Link to="/register" className="font-semibold text-ink underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <span className="mt-2 block text-sm font-medium text-berry">{message}</span> : null;
}

export function FormError({ error }: { error: unknown }) {
  const message = error instanceof ApiClientError ? error.message : "Something went wrong. Try again.";
  return <div className="rounded border border-berry/25 bg-berry/5 px-3 py-3 text-sm font-medium text-berry">{message}</div>;
}

export function WarningList({ warnings }: { warnings: CartWarning[] }) {
  if (!warnings.length) {
    return null;
  }

  return (
    <div className="space-y-2 rounded border border-berry/25 bg-berry/5 px-3 py-3 text-sm text-berry">
      {warnings.map((warning) => (
        <p key={`${warning.code}-${warning.message}`}>{warning.message}</p>
      ))}
      <Link to="/basket" className="inline-block font-semibold underline">
        Review basket
      </Link>
    </div>
  );
}
