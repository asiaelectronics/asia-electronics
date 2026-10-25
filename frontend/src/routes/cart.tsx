import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, FREE_DELIVERY_OVER_CENTS } from "@/context/cart";
import { formatLKR } from "@/lib/format";
import { PageHeading } from "@/components/site/PageHeading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart - Asia Electronics" },
      { name: "description", content: "Review the items in your shopping cart." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CartPage,
});

export function OrderSummary({ children }: { children?: React.ReactNode }) {
  const cart = useCart();
  const hasHiddenPrice = cart.lines.some((l) => l.product.showPrice === false);
  return (
    <div className="h-fit w-full min-w-0 border border-border bg-tile p-4 min-[375px]:p-5 sm:p-6">
      <h2 className="font-display text-base font-extrabold uppercase">Order summary</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="min-w-0">Subtotal ({cart.count} items)</dt>
          <dd className="text-right">{hasHiddenPrice ? "Pending Quote" : formatLKR(cart.subtotal)}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="min-w-0">Delivery</dt>
          <dd className="text-right">{cart.delivery ? formatLKR(cart.delivery) : "Free"}</dd>
        </div>
        <div className="flex items-start justify-between gap-3 border-t border-border pt-4 text-base font-extrabold sm:text-lg">
          <dt className="min-w-0">Total</dt>
          <dd className="text-right">{hasHiddenPrice ? "Price on Request" : formatLKR(cart.total)}</dd>
        </div>
      </dl>
      {hasHiddenPrice ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Contains items requiring official quotation. AEC will confirm pricing via WhatsApp.
        </p>
      ) : cart.subtotal > 0 && cart.subtotal < FREE_DELIVERY_OVER_CENTS ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Add {formatLKR(FREE_DELIVERY_OVER_CENTS - cart.subtotal)} more for free demo delivery.
        </p>
      ) : null}
      {children}
    </div>
  );
}

function CartPage() {
  const cart = useCart();
  return (
    <>
      <PageHeading title="Shopping Cart" />
      <div className="container-shop">
        {cart.lines.length === 0 ? (
          <div className="border border-border p-12 text-center">
            <p className="font-display text-lg font-extrabold">Your cart is empty</p>
            <Button asChild className="mt-5 rounded-none">
              <Link to="/shop">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <ul className="min-w-0 divide-y border border-border">
              {cart.lines.map((l) => (
                <li
                  key={l.key}
                  className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 p-3 min-[375px]:grid-cols-[80px_minmax(0,1fr)] min-[375px]:gap-4 min-[375px]:p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
                >
                  <img
                    src={l.product.images[0]}
                    alt=""
                    className="aspect-square w-full bg-tile object-cover"
                  />
                  <div className="min-w-0">
                    <Link
                      to="/product/$slug"
                      params={{ slug: l.product.slug }}
                      className="font-bold leading-snug [overflow-wrap:anywhere] hover:text-primary"
                    >
                      {l.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                      {l.product.brand} · {l.product.sku}
                    </p>
                    {l.variant && <p className="text-xs text-muted-foreground">{l.variant}</p>}
                    {l.product.showPrice !== false ? (
                      <p className="mt-1 text-sm">{formatLKR(l.product.priceCents)} each</p>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-primary">Price on Request</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div
                        className="flex h-10 items-center border border-input"
                        role="group"
                        aria-label={`Quantity for ${l.product.name}`}
                      >
                        <button
                          type="button"
                          aria-label="Decrease"
                          disabled={l.qty <= 1}
                          onClick={() => cart.setQty(l.key, l.qty - 1)}
                          className="grid h-full w-10 place-items-center disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{l.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase"
                          disabled={cart.remainingFor(l.productId) <= 0}
                          onClick={() => cart.setQty(l.key, l.qty + 1)}
                          className="grid h-full w-10 place-items-center disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => cart.remove(l.key)}
                        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                    {cart.remainingFor(l.productId) <= 0 && (
                      <p className="mt-1 text-xs text-warning">Maximum available stock reached</p>
                    )}
                  </div>
                  <p className="col-start-2 font-display font-extrabold sm:col-start-3 sm:text-right">
                    {l.product.showPrice !== false ? formatLKR(l.lineTotal) : "Price on Request"}
                  </p>
                </li>
              ))}
            </ul>
            <OrderSummary>
              <Button asChild className="mt-5 h-12 w-full rounded-none font-bold uppercase">
                <Link to="/checkout">Request Quotation</Link>
              </Button>
              <Link
                to="/shop"
                className="mt-3 block text-center text-sm font-semibold hover:text-primary"
              >
                Continue shopping
              </Link>
            </OrderSummary>
          </div>
        )}
      </div>
    </>
  );
}
