import { SlidersHorizontal, X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { ProductFilterOptions, ProductQueryFilters, ProductSort } from "../../../types/catalog";
import { formatMoney } from "../../../lib/money";
import { visibleCustomerCategories, visibleCustomerDepartments } from "../lib/customerDepartments";
import { getOccasionLabel, sortOptions, toggleArrayFilter } from "../lib/productFilters";

type CatalogFilterPanelProps = {
  filters: ProductQueryFilters;
  options?: ProductFilterOptions;
  isLoading: boolean;
  showDepartments?: boolean;
  showCategories?: boolean;
  onChange: (patch: ProductQueryFilters) => void;
  onClear: () => void;
};

export function CatalogFilterPanel({
  filters,
  options,
  isLoading,
  showDepartments = false,
  showCategories = false,
  onChange,
  onClear
}: CatalogFilterPanelProps) {
  const [keyword, setKeyword] = useState(filters.q ?? "");
  const [minPounds, setMinPounds] = useState(filters.minPrice ? String(Math.floor(filters.minPrice / 100)) : "");
  const [maxPounds, setMaxPounds] = useState(filters.maxPrice ? String(Math.ceil(filters.maxPrice / 100)) : "");
  const departmentOptions = options ? visibleCustomerDepartments(options.departments) : [];
  const categoryOptions = options ? visibleCustomerCategories(options.categories) : [];

  useEffect(() => {
    setKeyword(filters.q ?? "");
    setMinPounds(filters.minPrice ? String(Math.floor(filters.minPrice / 100)) : "");
    setMaxPounds(filters.maxPrice ? String(Math.ceil(filters.maxPrice / 100)) : "");
  }, [filters.maxPrice, filters.minPrice, filters.q]);

  function applySearchAndPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({
      q: keyword.trim() || undefined,
      minPrice: poundsToPence(minPounds),
      maxPrice: poundsToPence(maxPounds)
    });
  }

  return (
    <aside className="space-y-5 rounded border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
          <SlidersHorizontal size={18} aria-hidden="true" />
          Refine
        </h2>
        <button type="button" className="flex h-9 w-9 items-center justify-center rounded border border-ink/15" onClick={onClear} aria-label="Clear filters">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <form className="space-y-3" onSubmit={applySearchAndPrice}>
        <label className="block text-sm font-medium">
          Search
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-2"
            placeholder="Black dress"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Min £
            <input
              inputMode="numeric"
              value={minPounds}
              onChange={(event) => setMinPounds(event.target.value)}
              className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Max £
            <input
              inputMode="numeric"
              value={maxPounds}
              onChange={(event) => setMaxPounds(event.target.value)}
              className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-2"
            />
          </label>
        </div>
        <button type="submit" className="w-full rounded bg-ink px-3 py-2 text-sm font-semibold text-paper">
          Apply
        </button>
      </form>

      <label className="block text-sm font-medium">
        Sort
        <select
          value={filters.sort ?? "newest"}
          onChange={(event) => onChange({ sort: event.target.value as ProductSort })}
          className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-2"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {options ? (
        <div className="space-y-5">
          {showDepartments ? (
            <OptionLinks
              title="Department"
              options={departmentOptions.map((option) => ({
                value: option.slug,
                label: option.name,
                count: option.count,
                checked: filters.department === option.slug
              }))}
              onSelect={(value) => onChange({ department: filters.department === value ? undefined : value, category: undefined })}
            />
          ) : null}

          {showCategories ? (
            <OptionLinks
              title="Category"
              options={categoryOptions.map((option) => ({
                value: option.slug,
                label: option.name,
                count: option.count,
                checked: filters.category === option.slug
              }))}
              onSelect={(value) => onChange({ category: filters.category === value ? undefined : value })}
            />
          ) : null}

          <CheckboxOptions
            title="Size"
            values={options.sizes.map((option) => ({ value: option.value, label: option.value, count: option.count }))}
            selected={filters.size ?? []}
            onToggle={(value) => onChange({ size: toggleArrayFilter(filters, "size", value) })}
          />
          <ColourOptions
            values={options.colours.map((option) => ({ value: option.name, label: option.name, hex: option.hex, count: option.count }))}
            selected={filters.colour ?? []}
            onToggle={(value) => onChange({ colour: toggleArrayFilter(filters, "colour", value) })}
          />
          <CheckboxOptions
            title="Fit"
            values={options.fits.map((option) => ({ value: option.value, label: option.value, count: option.count }))}
            selected={filters.fit ?? []}
            onToggle={(value) => onChange({ fit: toggleArrayFilter(filters, "fit", value) })}
          />
          <CheckboxOptions
            title="Occasion"
            values={options.usages.map((option) => ({ value: option.value, label: getOccasionLabel(option.value), count: option.count }))}
            selected={filters.usage ?? []}
            onToggle={(value) => onChange({ usage: toggleArrayFilter(filters, "usage", value) })}
          />
          <CheckboxOptions
            title="Type"
            values={options.productTypes.slice(0, 18).map((option) => ({ value: option.value, label: option.value, count: option.count }))}
            selected={filters.productType ?? []}
            onToggle={(value) => onChange({ productType: toggleArrayFilter(filters, "productType", value) })}
          />
          <p className="text-xs text-ink/50">
            {formatMoney(options.priceRange.minPricePence, "GBP")} to {formatMoney(options.priceRange.maxPricePence, "GBP")}
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-8 animate-pulse rounded bg-mist" />
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function OptionLinks({
  title,
  options,
  onSelect
}: {
  title: string;
  options: Array<{ value: string; label: string; count: number; checked: boolean }>;
  onSelect: (value: string) => void;
}) {
  if (!options.length) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`rounded border px-3 py-2 text-sm ${option.checked ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white text-ink"}`}
            onClick={() => onSelect(option.value)}
          >
            {option.label} <span className="text-xs opacity-70">({option.count})</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function CheckboxOptions({
  title,
  values,
  selected,
  onToggle
}: {
  title: string;
  values: Array<{ value: string; label: string; count: number }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (!values.length) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 max-h-44 space-y-2 overflow-auto pr-1">
        {values.map((option) => (
          <label key={option.value} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} />
              {option.label}
            </span>
            <span className="text-xs text-ink/45">{option.count}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function ColourOptions({
  values,
  selected,
  onToggle
}: {
  values: Array<{ value: string; label: string; hex: string | null; count: number }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (!values.length) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold">Colour</h3>
      <div className="mt-2 max-h-44 space-y-2 overflow-auto pr-1">
        {values.map((option) => (
          <label key={option.value} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} />
              <span className="h-4 w-4 rounded-full border border-ink/15" style={{ backgroundColor: option.hex ?? "#eef0f2" }} />
              {option.label}
            </span>
            <span className="text-xs text-ink/45">{option.count}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function poundsToPence(value: string) {
  const pounds = Number.parseInt(value, 10);
  return Number.isFinite(pounds) && pounds >= 0 ? pounds * 100 : undefined;
}
