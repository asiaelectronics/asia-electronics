import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/context/cart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BUSINESS_WHATSAPP_NUMBER } from "@/lib/config";
import { formatLKR, stockLabel } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useSettings } from "@/context/settings";

/* ------------------------------------------------------------------ */
/*  Inline WhatsApp SVG icon (brand logo — not available in lucide)   */
/* ------------------------------------------------------------------ */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Build a WhatsApp click-to-chat URL                                */
/* ------------------------------------------------------------------ */
function buildWhatsAppUrl(productName: string, quantity: number, phoneDigits: string): string {
  const message = [
    "Hello, I would like to request this product.",
    `Product Name: ${productName}`,
    `Quantity: ${quantity}`,
    "Please confirm availability and price.",
  ].join("\n");

  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

/* ------------------------------------------------------------------ */
/*  Stock badge with optional quantity visibility                     */
/* ------------------------------------------------------------------ */
export function StockBadge({
  stock,
  showQuantity = true,
}: {
  stock: number;
  showQuantity?: boolean;
}) {
  const s = stockLabel(stock);
  // If showQuantity is false, do not reveal the exact remaining stock count ("Only X left" -> "In stock")
  const displayText = !showQuantity && stock <= 5 && stock > 0 ? "In stock" : s.text;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold",
        s.tone === "in" && "text-success",
        s.tone === "low" && (showQuantity ? "text-warning" : "text-success"),
        s.tone === "out" && "text-muted-foreground",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {displayText}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Quantity selector (local per card)                                 */
/* ------------------------------------------------------------------ */
function QuantitySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div
      className="flex items-center"
      role="group"
      aria-label="Quantity selector"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(Math.max(1, value - 1));
        }}
        className="grid h-7 w-7 shrink-0 place-items-center border border-border text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        type="number"
        min={1}
        step={1}
        value={value}
        onChange={(e) => {
          const n = Math.max(1, Math.floor(Number(e.target.value) || 1));
          onChange(n);
        }}
        aria-label="Quantity"
        className="h-7 w-9 border-y border-border bg-transparent text-center text-xs font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange(value + 1);
        }}
        className="grid h-7 w-7 shrink-0 place-items-center border border-border text-foreground transition-colors hover:bg-accent"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product card                                                      */
/* ------------------------------------------------------------------ */
export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const { whatsappDigits } = useSettings();
  const remaining = cart.remainingFor(product.id);
  const isOutOfStock = product.stock <= 0;
  const disabled =
    (product.showAvailability !== false && isOutOfStock) ||
    (remaining <= 0 && product.stock > 0);
  const needsVariant = !!product.variants?.length;

  const [quantity, setQuantity] = useState(1);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col border border-border bg-card p-2.5 transition-colors hover:border-foreground/30 sm:p-4"
    >
      <div className="flex items-center justify-between min-h-[1.5rem]">
        {product.showAvailability !== false ? (
          <StockBadge stock={product.stock} showQuantity={product.showQuantity !== false} />
        ) : (
          <span />
        )}
      </div>
      <Link to="/product/$slug" params={{ slug: product.slug }} className="mt-2 block sm:mt-3">
        <div className="relative aspect-square overflow-hidden bg-tile">
          <img
            src={product.images[0] || "/assets/imgs/electronic-components.png"}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={816}
            height={816}
            onError={(e) => {
              e.currentTarget.src = "/assets/imgs/electronic-components.png";
            }}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none",
              isOutOfStock && "grayscale contrast-75 opacity-70",
            )}
          />
          {isOutOfStock && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[0.5px]">
              <span className="rotate-[-12deg] rounded-sm border-2 border-red-500 bg-red-600/95 px-2.5 py-1 font-display text-[11px] font-black uppercase tracking-widest text-white shadow-xl sm:px-3 sm:text-xs">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-[2.25rem] text-[13px] font-bold leading-[1.1rem] text-foreground sm:mt-3 sm:min-h-[2.5rem] sm:text-sm sm:leading-tight">
          {product.name}
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {product.brand} · {product.model}
        </p>
      </Link>
      <div className="mt-auto flex flex-col gap-2 pt-2 sm:pt-3">
        {/* Price + cart button row */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            {product.showPrice !== false ? (
              <p className="font-display text-base font-extrabold">
                {formatLKR(product.priceCents)}
              </p>
            ) : (
              <p className="font-display text-xs font-bold text-orange-500 uppercase tracking-wide">
                Price on Request
              </p>
            )}
          </div>
          {needsVariant ? (
            <Link
              to="/product/$slug"
              params={{ slug: product.slug }}
              aria-label={`Choose options for ${product.name}`}
              className="hidden h-10 w-10 shrink-0 place-items-center border-2 border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:grid"
            >
              <ShoppingCart className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                cart.add(product.id, 1);
                toast.success(`${product.name} added to quotation cart`);
              }}
              aria-label={disabled ? `${product.name} unavailable` : `Add ${product.name} to cart`}
              className="hidden h-10 w-10 shrink-0 place-items-center border-2 border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent sm:grid"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quantity selector + WhatsApp button row */}
        <div className="hidden items-center justify-between gap-2 sm:flex">
          <QuantitySelector value={quantity} onChange={setQuantity} />
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={buildWhatsAppUrl(product.name, quantity, whatsappDigits)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Request ${product.name} on WhatsApp`}
                  onClick={(e) => e.stopPropagation()}
                  className="grid h-10 w-10 shrink-0 place-items-center border-2 border-[#25D366] text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-white"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Request on WhatsApp</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border p-4">
          <div className="aspect-square animate-pulse bg-tile" />
          <div className="mt-3 h-4 w-3/4 animate-pulse bg-tile" />
          <div className="mt-2 h-3 w-1/2 animate-pulse bg-tile" />
        </div>
      ))}
    </div>
  );
}
