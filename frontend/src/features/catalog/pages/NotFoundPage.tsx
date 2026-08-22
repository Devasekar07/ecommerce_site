import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-xl">
        <p className="text-sm font-semibold uppercase text-berry">Not found</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal">This page is not available.</h1>
        <p className="mt-4 text-base leading-7 text-ink/70">
          The page may have moved, or the catalogue item may no longer be active.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded bg-ink px-4 py-3 text-sm font-semibold text-paper transition hover:bg-ink/85"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
