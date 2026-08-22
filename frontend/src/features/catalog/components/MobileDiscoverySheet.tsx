import { X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { ProductFilterOptions } from "../../../types/catalog";
import type { DiscoveryValues } from "./HeroDiscoveryBar";
import { getOccasionLabel } from "../lib/productFilters";

type MobileDiscoverySheetProps = {
  values: DiscoveryValues;
  options?: ProductFilterOptions;
  isLoading: boolean;
  onChange: (patch: Partial<DiscoveryValues>) => void;
  onSubmit: () => void;
};

export function MobileDiscoverySheet({ values, options, isLoading, onChange, onSubmit }: MobileDiscoverySheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsOpen(false);
    onSubmit();
  }

  return (
    <>
      <button
        type="button"
        className="w-[min(420px,calc(100vw-2rem))] rounded-full bg-paper px-6 py-4 text-base font-semibold text-ink shadow-[0_18px_70px_rgba(0,0,0,0.28)] transition active:scale-[0.98] md:hidden"
        onClick={() => setIsOpen(true)}
      >
        Find your style
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] bg-ink/45 md:hidden" role="dialog" aria-modal="true" aria-label="Find your style">
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-paper p-4 text-ink shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Find your style</h2>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15"
                aria-label="Close style search"
                onClick={() => setIsOpen(false)}
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              <label className="block text-sm font-medium">
                Search fashion
                <input
                  value={values.q}
                  onChange={(event) => onChange({ q: event.target.value })}
                  className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
                  placeholder="Search fashion"
                />
              </label>

              <SheetSelect
                label="Occasion"
                value={values.usage}
                disabled={isLoading || !options?.usages.length}
                options={(options?.usages ?? []).map((option) => ({ value: option.value, label: getOccasionLabel(option.value) }))}
                onChange={(value) => onChange({ usage: value })}
              />
              <SheetSelect
                label="Colour"
                value={values.colour}
                disabled={isLoading || !options?.colours.length}
                options={(options?.colours ?? []).map((option) => ({ value: option.name, label: option.name }))}
                onChange={(value) => onChange({ colour: value })}
              />
              <SheetSelect
                label="Size"
                value={values.size}
                disabled={isLoading || !options?.sizes.length}
                options={(options?.sizes ?? []).map((option) => ({ value: option.value, label: option.value }))}
                onChange={(value) => onChange({ size: value })}
              />

              <button type="submit" className="w-full rounded-full bg-ink px-5 py-4 font-semibold text-paper">
                Explore
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SheetSelect({
  label,
  value,
  disabled,
  options,
  onChange
}: {
  label: string;
  value: string;
  disabled: boolean;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ink/25"
      >
        <option value="">Any {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
