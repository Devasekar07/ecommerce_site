import { useParams } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "../../../components/ErrorState";
import { LoadingState } from "../../../components/LoadingState";
import { ApiClientError } from "../../../lib/apiClient";
import type { CartWarning } from "../../../types/cart";
import { useAddCartItem } from "../../cart/api/cartApi";
import { useProduct } from "../api/catalogApi";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { PriceDisplay } from "../components/PriceDisplay";
import { ProductImageGallery } from "../components/ProductImageGallery";
import { StockBadge } from "../components/StockBadge";

export function ProductDetailPage() {
  const { productSlug } = useParams();
  const productQuery = useProduct(productSlug);
  const addCartItemMutation = useAddCartItem();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [warnings, setWarnings] = useState<CartWarning[]>([]);
  const product = productQuery.data;
  const availableVariants = useMemo(() => product?.variants.filter((variant) => variant.availableQuantity > 0) ?? [], [product?.variants]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const selectedStillExists = product.variants.some((variant) => variant.id === selectedVariantId);

    if (!selectedVariantId || !selectedStillExists) {
      setSelectedVariantId(availableVariants[0]?.id ?? product.variants[0]?.id ?? null);
      setQuantity(1);
    }
  }, [availableVariants, product, selectedVariantId]);

  if (!productSlug) {
    return <ErrorState title="Product unavailable" message="This product route is not valid." />;
  }

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState label="Loading product" />
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState title="Product not found" message="We could not load this product." />
      </div>
    );
  }

  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const canAddToBasket = Boolean(selectedVariant && selectedVariant.availableQuantity > 0 && product.stockStatus !== "out_of_stock");

  async function addToBasket() {
    if (!selectedVariant) {
      return;
    }

    const response = await addCartItemMutation.mutateAsync({
      variantId: selectedVariant.id,
      quantity
    });
    setWarnings(response.warnings);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: product.department.name, href: `/departments/${product.department.slug}` },
          { label: product.category.name, href: `/departments/${product.department.slug}/${product.category.slug}` },
          { label: product.name }
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)]">
        <ProductImageGallery images={product.images} productName={product.name} />

        <section className="space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-ink/60">{product.category.name}</span>
              <StockBadge status={product.stockStatus} />
            </div>
            <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">{product.name}</h1>
            <div className="text-xl">
              <PriceDisplay
                pricePence={product.pricePence}
                salePricePence={product.salePricePence}
                currency={product.currency}
              />
            </div>
            <p className="max-w-2xl text-base leading-7 text-ink/70">{product.description}</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Colours</h2>
            <div className="flex flex-wrap gap-3">
              {product.colours.map((colour) => (
                <span
                  key={colour.name}
                  className="flex items-center gap-2 rounded border border-ink/10 bg-white px-3 py-2 text-sm"
                >
                  <span
                    className="h-4 w-4 rounded-full border border-ink/15"
                    style={{ backgroundColor: colour.hex ?? "#eef0f2" }}
                    aria-hidden="true"
                  />
                  {colour.name}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Sizes and availability</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {product.variants.map((variant) => (
                <button
                  type="button"
                  key={variant.id}
                  className={[
                    "flex items-center justify-between gap-3 rounded border px-3 py-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50",
                    selectedVariantId === variant.id ? "border-ink bg-ink text-paper" : "border-ink/10 bg-white"
                  ].join(" ")}
                  disabled={variant.availableQuantity <= 0}
                  onClick={() => {
                    setSelectedVariantId(variant.id);
                    setQuantity(1);
                  }}
                >
                  <span className="font-medium">
                    {variant.size} / {variant.colourName}
                  </span>
                  <span className={selectedVariantId === variant.id ? "text-paper/75" : "text-ink/65"}>
                    {variant.availableQuantity > 0 ? `${variant.availableQuantity} available` : "Out of stock"}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded border border-ink/10 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="block text-sm font-medium">
                Quantity
                <select
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="mt-2 w-full rounded border border-ink/15 bg-white px-3 py-3 sm:w-28"
                  disabled={!canAddToBasket}
                >
                  {Array.from({ length: Math.min(selectedVariant?.availableQuantity ?? 1, 10) }).map((_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={addToBasket}
                disabled={!canAddToBasket || addCartItemMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded bg-ink px-5 py-3 font-semibold text-paper disabled:cursor-not-allowed disabled:bg-ink/40"
              >
                <ShoppingBag size={18} aria-hidden="true" />
                {product.stockStatus === "out_of_stock" ? "Out of stock" : addCartItemMutation.isPending ? "Adding" : "Add to basket"}
              </button>
            </div>
            {addCartItemMutation.isError ? <p className="text-sm font-medium text-berry">{getMutationError(addCartItemMutation.error)}</p> : null}
            {warnings.map((warning) => (
              <p key={`${warning.code}-${warning.message}`} className="text-sm font-medium text-berry">
                {warning.message}
              </p>
            ))}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Product details</h2>
            <dl className="grid gap-2 sm:grid-cols-2">
              {product.attributes.map((attribute) => (
                <div key={attribute.key} className="rounded border border-ink/10 bg-white p-3">
                  <dt className="text-xs font-semibold uppercase text-ink/50">{formatAttributeKey(attribute.key)}</dt>
                  <dd className="mt-1 text-sm text-ink">{attribute.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded border border-ink/10 bg-white p-4 text-sm leading-6 text-ink/70">
            <h2 className="text-base font-semibold text-ink">Delivery and returns</h2>
            <p className="mt-2">UK delivery options and returns information are confirmed before payment.</p>
          </section>
        </section>
      </div>
    </div>
  );
}

function getMutationError(error: unknown) {
  return error instanceof ApiClientError ? error.message : "Could not update your basket.";
}

function formatAttributeKey(key: string) {
  const withSpaces = key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
