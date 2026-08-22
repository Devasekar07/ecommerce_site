import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { LoadingState } from "../../../components/LoadingState";
import { productImageFallback } from "../../../lib/imageFallback";
import { formatMoney } from "../../../lib/money";
import type { CartWarning } from "../../../types/cart";
import { useAddCartItem, useCart, useRemoveCartItem, useUpdateCartItem } from "../api/cartApi";
import { useState } from "react";

export function BasketPage() {
  const cartQuery = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const addMutation = useAddCartItem();
  const [warnings, setWarnings] = useState<CartWarning[]>([]);

  if (cartQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState label="Loading basket" />
      </div>
    );
  }

  if (cartQuery.isError || !cartQuery.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState title="Basket unavailable" message="We could not load your basket." />
      </div>
    );
  }

  const cart = cartQuery.data.cart;

  async function setQuantity(itemId: string, quantity: number) {
    const response = await updateMutation.mutateAsync({ itemId, quantity });
    setWarnings(response.warnings);
  }

  async function removeItem(itemId: string) {
    const response = await removeMutation.mutateAsync(itemId);
    setWarnings(response.warnings);
  }

  async function addOne(variantId: string) {
    const response = await addMutation.mutateAsync({ variantId, quantity: 1 });
    setWarnings(response.warnings);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="border-b border-ink/10 pb-8">
        <p className="text-sm font-semibold uppercase text-berry">Basket</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">Your basket</h1>
      </section>

      <WarningPanel warnings={[...cartQuery.data.warnings, ...warnings]} />

      {!cart.items.length ? (
        <div className="py-10">
          <EmptyState title="Your basket is empty" message="Browse the latest catalogue and add a size and colour." />
        </div>
      ) : (
        <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {cart.items.map((item) => {
              const isOutOfStock = item.variant.availableQuantity <= 0;
              const canAdd = item.quantity < item.maxAllowedQuantity;

              return (
                <article key={item.id} className="grid gap-4 rounded border border-ink/10 bg-white p-4 sm:grid-cols-[120px_1fr]">
                  <Link to={`/products/${item.product.slug}`} className="aspect-[4/5] overflow-hidden rounded bg-mist">
                    <img
                      src={item.product.image?.url ?? productImageFallback}
                      alt={item.product.image?.altText ?? item.product.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = productImageFallback;
                      }}
                    />
                  </Link>
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link to={`/products/${item.product.slug}`} className="font-semibold hover:underline">
                        {item.product.name}
                      </Link>
                      <p className="mt-2 text-sm text-ink/65">
                        {item.variant.size} / {item.variant.colourName}
                      </p>
                      <p className={`mt-2 text-sm font-semibold ${isOutOfStock ? "text-berry" : "text-leaf"}`}>
                        {isOutOfStock ? "Out of stock" : `${item.variant.availableQuantity} available`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:items-end">
                      <p className="font-semibold">{formatMoney(item.lineTotalPence, item.product.currency)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded border border-ink/15 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Decrease quantity"
                          disabled={item.quantity <= 1 || updateMutation.isPending}
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={16} aria-hidden="true" />
                        </button>
                        <span className="flex h-9 min-w-10 items-center justify-center rounded bg-mist px-3 text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded border border-ink/15 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Increase quantity"
                          disabled={!canAdd || addMutation.isPending || isOutOfStock}
                          onClick={() => addOne(item.variant.id)}
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded border border-berry/25 text-berry"
                          aria-label="Remove item"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded border border-ink/10 bg-white p-5">
            <h2 className="text-xl font-semibold tracking-normal">Summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt>Items</dt>
                <dd>{cart.summary.itemCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Subtotal</dt>
                <dd>{formatMoney(cart.summary.subtotalPence, cart.currency)}</dd>
              </div>
              {cart.summary.discountPence > 0 ? (
                <div className="flex justify-between gap-4 text-leaf">
                  <dt>Discount</dt>
                  <dd>-{formatMoney(cart.summary.discountPence, cart.currency)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-t border-ink/10 pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(cart.summary.totalPence, cart.currency)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      )}
    </div>
  );
}

function WarningPanel({ warnings }: { warnings: CartWarning[] }) {
  const uniqueWarnings = [...new Map(warnings.map((warning) => [`${warning.code}-${warning.message}`, warning])).values()];

  if (!uniqueWarnings.length) {
    return null;
  }

  return (
    <div className="mt-6 space-y-2 rounded border border-berry/25 bg-berry/5 px-4 py-3 text-sm font-medium text-berry">
      {uniqueWarnings.map((warning) => (
        <p key={`${warning.code}-${warning.message}`}>{warning.message}</p>
      ))}
    </div>
  );
}
