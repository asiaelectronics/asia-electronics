import { useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/cart";
import { formatLKR } from "@/lib/format";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Inline WhatsApp SVG icon                                          */
/* ------------------------------------------------------------------ */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

import { useSettings } from "@/context/settings";

function buildWhatsAppUrl(product: Product, quantity: number, phoneDigits: string): string {
  const message = [
    "Hello AEC Team!",
    "",
    "I'm interested in purchasing the following product:",
    "",
    `Product: ${product.name}`,
    `Quantity: ${quantity} ${quantity === 1 ? "Unit" : "Units"}`,
    `Product link: https://www.asiaelectronics.lk/product/${product.slug}`,
    `Code: ${product.sku}`,
    "Please let me know if this item is currently available and share your best price.",
    "",
    "Thank you! Looking forward to your response.",
  ].join("\n");

  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

interface CategoryProductCardProps {
  product: Product;
}

export function CategoryProductCard({ product }: CategoryProductCardProps) {
  const cart = useCart();
  const { whatsappDigits } = useSettings();
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cart.add(product.id, quantity);
    toast.success(`${product.name} added to cart`);
  };

  const isOutOfStock = product.stock <= 0;
  const isLimitedStock = product.stock > 0 && product.stock <= 5;
  const showAvail = product.showAvailability !== false;
  const showQty = product.showQuantity !== false;
  const showPrice = product.showPrice !== false;

  return (
    <article className="group relative flex h-full flex-col bg-card p-2.5 transition-all hover:bg-tile/20 hover:shadow-sm sm:p-4">
      {/* ─── Image Area with Circular Discount Badge ─── */}
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block relative overflow-hidden focus:outline-none"
      >
        <div className="relative flex aspect-square w-full items-center justify-center rounded-xs bg-white p-1.5 sm:p-2">
          {imageError ? (
            <div className="flex h-full w-full items-center justify-center bg-tile text-muted-foreground text-xs font-semibold">
              No image
            </div>
          ) : (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>

        {/* ─── Product Name ─── */}
        <h3
          title={product.name}
          className="mt-2 line-clamp-2 min-h-[2.25rem] text-[11px] font-semibold leading-[1.15rem] text-foreground transition-colors group-hover:text-primary sm:mt-2.5 sm:min-h-[2.4rem] sm:text-xs sm:leading-tight"
        >
          {product.name}
        </h3>
      </Link>

      {/* ─── Pricing Presentation ─── */}
      <div className="mt-1 flex min-h-6 items-baseline leading-none">
        {showPrice ? (
          <span className="font-display text-[13px] font-extrabold text-foreground sm:text-base">
            {formatLKR(product.priceCents)}
          </span>
        ) : (
          <span className="font-display text-xs font-bold text-orange-500 uppercase tracking-wide">
            Price on Request
          </span>
        )}
      </div>

      {/* ─── Product Labels / Badges ─── */}
      <div className="mt-1 flex min-h-5 flex-wrap items-center gap-1 sm:mt-1.5">
        {product.isNew && (
          <span className="border border-cyan-600/80 text-cyan-700 bg-cyan-50/70 px-1 py-0.2 text-[9px] font-extrabold uppercase rounded-2xs">
            New
          </span>
        )}
        {showAvail && showQty && isLimitedStock && (
          <span className="border border-amber-600/80 text-amber-700 bg-amber-50/70 px-1 py-0.2 text-[9px] font-extrabold uppercase rounded-2xs">
            Limited Stock
          </span>
        )}
        {showAvail && isOutOfStock && (
          <span className="border border-zinc-300 text-zinc-500 bg-zinc-50 px-1 py-0.2 text-[9px] font-bold uppercase rounded-2xs">
            Out of Stock
          </span>
        )}
      </div>

      {/* ─── Action Controls: Quantity, WhatsApp, Add to Cart ─── */}
      <div
        className="mt-auto hidden flex-wrap items-center justify-between gap-x-1 gap-y-1.5 pt-2 sm:flex sm:gap-1.5 sm:pt-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Quantity Selector */}
        <div
          className="flex items-center border border-border bg-white rounded-xs"
          role="group"
          aria-label="Quantity"
        >
          <button
            type="button"
            disabled={quantity <= 1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuantity(Math.max(1, quantity - 1));
            }}
            aria-label="Decrease quantity"
            className="grid h-8 w-6 cursor-pointer place-items-center text-foreground hover:bg-tile disabled:text-muted-foreground sm:h-7"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
          <span className="w-6 select-none text-center text-[11px] font-bold text-foreground">
            {quantity}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuantity(quantity + 1);
            }}
            aria-label="Increase quantity"
            className="grid h-8 w-6 cursor-pointer place-items-center text-foreground hover:bg-tile sm:h-7"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* WhatsApp Action Button */}
          <a
            href={buildWhatsAppUrl(product, quantity, whatsappDigits)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Request ${product.name} on WhatsApp`}
            aria-label={`Request ${product.name} on WhatsApp`}
            onClick={(e) => e.stopPropagation()}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-xs bg-[#25D366] text-white shadow-2xs transition-colors hover:bg-[#20ba5a] sm:h-7 sm:w-7"
          >
            <WhatsAppIcon className="h-4 w-4" />
          </a>

          {/* Add to Cart Button */}
          <button
            type="button"
            disabled={showAvail && isOutOfStock}
            onClick={handleAddToCart}
            title={showAvail && isOutOfStock ? "Out of stock" : "Add to Cart"}
            aria-label={`Add ${product.name} to cart`}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-xs border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent sm:h-7 sm:w-7"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function CategoryProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse bg-card p-2.5 sm:p-4">
      <div className="aspect-square w-full rounded-xs bg-tile" />
      <div className="mt-2.5 h-3.5 w-3/4 rounded bg-tile" />
      <div className="mt-1 h-3.5 w-1/2 rounded bg-tile" />
      <div className="mt-2 h-4 w-1/3 rounded bg-tile" />
      <div className="mt-auto hidden items-center justify-between pt-3 sm:flex">
        <div className="h-6 w-14 rounded bg-tile" />
        <div className="h-6 w-14 rounded bg-tile" />
      </div>
    </div>
  );
}
