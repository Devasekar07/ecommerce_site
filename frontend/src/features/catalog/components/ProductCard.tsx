import { Link } from "react-router-dom";
import { productImageFallback } from "../../../lib/imageFallback";
import type { Product } from "../../../types/catalog";
import { PriceDisplay } from "./PriceDisplay";
import { StockBadge } from "./StockBadge";

export function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images[0];

  return (
    <article className="group overflow-hidden rounded border border-ink/10 bg-white transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="aspect-[4/5] overflow-hidden bg-mist">
          <img
            src={primaryImage?.url ?? productImageFallback}
            alt={primaryImage?.altText ?? product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = productImageFallback;
            }}
          />
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-words text-base font-semibold text-ink">{product.name}</h2>
              <p className="mt-1 text-sm text-ink/60">{product.category.name}</p>
            </div>
            <StockBadge status={product.stockStatus} />
          </div>

          <PriceDisplay
            pricePence={product.pricePence}
            salePricePence={product.salePricePence}
            currency={product.currency}
          />

          <div className="flex items-center justify-between gap-3 text-xs text-ink/60">
            <span>{product.availableSizes.slice(0, 4).join(", ") || "No sizes"}</span>
            <span className="flex items-center gap-1" aria-label={`${product.colours.length} colours`}>
              {product.colours.slice(0, 4).map((colour) => (
                <span
                  key={colour.name}
                  className="h-4 w-4 rounded-full border border-ink/15"
                  title={colour.name}
                  style={{ backgroundColor: colour.hex ?? "#eef0f2" }}
                />
              ))}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
