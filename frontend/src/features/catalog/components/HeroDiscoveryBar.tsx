import type { FormEvent, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { ProductFilterOptions } from "../../../types/catalog";
import { getOccasionLabel } from "../lib/productFilters";

export type DiscoveryValues = {
  q: string;
  usage: string;
  colour: string;
  size: string;
};

type DiscoveryControlProps = {
  values: DiscoveryValues;
  options?: ProductFilterOptions;
  isLoading: boolean;
  onChange: (patch: Partial<DiscoveryValues>) => void;
  onSubmit: () => void;
};

type OvalState = {
  left: number;
  width: number;
  opacity: number;
  scale: number;
};

export function HeroDiscoveryBar({ values, options, isLoading, onChange, onSubmit }: DiscoveryControlProps) {
  const barRef = useRef<HTMLFormElement>(null);
  const [isOvalEnabled, setIsOvalEnabled] = useState(false);
  const [oval, setOval] = useState<OvalState>({ left: 0, width: 120, opacity: 0, scale: 1 });
  const [isExploreActive, setIsExploreActive] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function updateEnabled() {
      setIsOvalEnabled(pointerQuery.matches && !motionQuery.matches);
    }

    updateEnabled();
    pointerQuery.addEventListener("change", updateEnabled);
    motionQuery.addEventListener("change", updateEnabled);

    return () => {
      pointerQuery.removeEventListener("change", updateEnabled);
      motionQuery.removeEventListener("change", updateEnabled);
    };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function moveOval(event: PointerEvent<HTMLFormElement>) {
    if (!isOvalEnabled || !barRef.current) {
      return;
    }

    const rect = barRef.current.getBoundingClientRect();
    const width = 150;
    setOval({
      left: event.clientX - rect.left - width / 2,
      width,
      opacity: 1,
      scale: 1
    });
  }

  function snapOvalToElement(element: HTMLElement, scale = 1) {
    if (!isOvalEnabled || !barRef.current) {
      return;
    }

    const barRect = barRef.current.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    setOval({
      left: rect.left - barRect.left + 4,
      width: Math.max(rect.width - 8, 96),
      opacity: 1,
      scale
    });
  }

  function hideOval() {
    if (isOvalEnabled) {
      setIsExploreActive(false);
      setOval((current) => ({ ...current, opacity: 0, scale: 1 }));
    }
  }

  function snapFieldOval(element: HTMLElement) {
    setIsExploreActive(false);
    snapOvalToElement(element);
  }

  function snapExploreOval(element: HTMLElement, scale = 1) {
    if (isOvalEnabled) {
      setIsExploreActive(true);
    }
    snapOvalToElement(element, scale);
  }

  return (
    <form
      ref={barRef}
      className="relative hidden w-[min(1040px,calc(100vw-3rem))] items-center gap-2 overflow-hidden rounded-full border border-white/35 bg-paper/90 p-2 text-ink shadow-[0_22px_80px_rgba(0,0,0,0.22)] backdrop-blur md:flex"
      onSubmit={submit}
      onPointerMove={moveOval}
      onPointerLeave={hideOval}
    >
      <span
        aria-hidden="true"
        className="discovery-oval pointer-events-none absolute left-0 top-1/2 z-0 h-12 rounded-full bg-[#4264ff]/15 blur-sm transition-[opacity,transform,width] duration-150 ease-out"
        style={{
          width: `${oval.width}px`,
          opacity: oval.opacity,
          transform: `translate3d(${oval.left}px, -50%, 0) scale(${oval.scale})`
        }}
      />

      <label className="relative z-10 min-w-0 flex-[1.5] px-4" onPointerEnter={(event) => snapFieldOval(event.currentTarget)}>
        <span className="sr-only">Search fashion</span>
        <input
          value={values.q}
          onChange={(event) => onChange({ q: event.target.value })}
          className="w-full bg-transparent py-3 text-sm font-medium outline-none placeholder:text-ink/45 focus-visible:ring-2 focus-visible:ring-ink/30"
          placeholder="Search fashion"
        />
      </label>

      <DiscoverySelect
        label="Occasion"
        value={values.usage}
        disabled={isLoading || !options?.usages.length}
        options={(options?.usages ?? []).map((option) => ({ value: option.value, label: getOccasionLabel(option.value) }))}
        onChange={(value) => onChange({ usage: value })}
        onPointerEnter={(event) => snapFieldOval(event.currentTarget)}
      />
      <DiscoverySelect
        label="Colour"
        value={values.colour}
        disabled={isLoading || !options?.colours.length}
        options={(options?.colours ?? []).map((option) => ({ value: option.name, label: option.name }))}
        onChange={(value) => onChange({ colour: value })}
        onPointerEnter={(event) => snapFieldOval(event.currentTarget)}
      />
      <DiscoverySelect
        label="Size"
        value={values.size}
        disabled={isLoading || !options?.sizes.length}
        options={(options?.sizes ?? []).map((option) => ({ value: option.value, label: option.value }))}
        onChange={(value) => onChange({ size: value })}
        onPointerEnter={(event) => snapFieldOval(event.currentTarget)}
      />

      <button
        type="submit"
        className={[
          "relative z-10 rounded-full px-7 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-ink/30 active:scale-[0.96]",
          isExploreActive ? "bg-transparent text-ink" : "bg-ink text-paper"
        ].join(" ")}
        onPointerEnter={(event) => snapExploreOval(event.currentTarget)}
        onPointerDown={(event) => snapExploreOval(event.currentTarget, 0.96)}
        onPointerUp={(event) => snapExploreOval(event.currentTarget)}
      >
        Explore
      </button>
    </form>
  );
}

function DiscoverySelect({
  label,
  value,
  options,
  disabled,
  onChange,
  onPointerEnter
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled: boolean;
  onChange: (value: string) => void;
  onPointerEnter: (event: PointerEvent<HTMLLabelElement>) => void;
}) {
  return (
    <label className="relative z-10 min-w-[128px] rounded-full px-3" onPointerEnter={onPointerEnter}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full bg-transparent py-3 text-sm font-medium outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ink/30"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
