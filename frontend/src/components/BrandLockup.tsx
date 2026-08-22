type BrandLockupProps = {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
};

export function BrandLockup({ className = "", imageClassName = "h-10 w-20", textClassName = "text-lg text-ink" }: BrandLockupProps) {
  return (
    <span className={["inline-flex min-w-0 items-center gap-3", className].join(" ")}>
      <span className="flex shrink-0 items-center overflow-hidden rounded-sm bg-white">
        <img
          src="/brand/ave-logo.png"
          alt=""
          className={["object-contain mix-blend-multiply", imageClassName].join(" ")}
          aria-hidden="true"
        />
      </span>
      <span className={["truncate font-semibold tracking-normal", textClassName].join(" ")}>AVE</span>
    </span>
  );
}
