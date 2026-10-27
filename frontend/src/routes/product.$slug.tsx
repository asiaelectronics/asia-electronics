import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Store,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { productQuery, relatedQuery, categories } from "@/services/catalog";
import { useCart } from "@/context/cart";
import { useSettings } from "@/context/settings";
import { formatLKR } from "@/lib/format";
import { ProductGrid, StockBadge } from "@/components/site/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function buildWhatsAppUrl(productName: string, quantity: number, phoneDigits: string): string {
  const message = [
    "Hello, I would like to inquire about the following product:",
    "",
    `Product: ${productName}`,
    `Requested Quantity: ${quantity}`,
    "",
    "Could you please confirm availability and pricing for this quantity?",
    "Thank you.",
  ].join("\n");
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) {
      // On the server (fresh page load, e.g. a link opened from WhatsApp) there is no
      // localStorage cache and the backend may be unreachable from the SSR runtime.
      // Don't hard-fail with notFound — defer the lookup to the browser instead.
      if (typeof window === "undefined") {
        context.queryClient.removeQueries({ queryKey: productQuery(params.slug).queryKey });
        return { pending: true as const, slug: params.slug };
      }
      throw notFound();
    }
    context.queryClient.ensureQueryData(relatedQuery(params.slug));
    const firstImg = p.images?.[0] || "/assets/imgs/electronic-components.png";
    const imageUrl = firstImg.startsWith("http")
      ? firstImg
      : `https://www.asiaelectronics.lk${firstImg.startsWith("/") ? "" : "/"}${firstImg}`;
    return {
      name: p.name,
      description: p.description,
      image: imageUrl,
      price: (p.priceCents / 100).toFixed(2),
      brand: p.brand || "Asiaelectronics",
      sku: p.sku,
      inStock: p.stock > 0,
      slug: params.slug,
      pending: false as const,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — Asiaelectronics" }, { name: "robots", content: "noindex" }] };
    }
    if (loaderData.pending) {
      return {
        meta: [{ title: "Product — Asiaelectronics" }],
        links: [
          { rel: "canonical", href: `https://www.asiaelectronics.lk/product/${loaderData.slug}` },
        ],
      };
    }

    const canonicalUrl = `https://www.asiaelectronics.lk/product/${loaderData.slug}`;
    const productSchema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: loaderData.name,
      image: [loaderData.image],
      description: loaderData.description,
      sku: loaderData.sku,
      brand: {
        "@type": "Brand",
        name: loaderData.brand,
      },
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "LKR",
        price: loaderData.price,
        availability: loaderData.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    };

    return {
      meta: [
        { title: `${loaderData.name} — Asiaelectronics` },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: `${loaderData.name} — Asiaelectronics` },
        { property: "og:description", content: loaderData.description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: loaderData.image },
        { property: "product:price:amount", content: loaderData.price },
        { property: "product:price:currency", content: "LKR" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${loaderData.name} — Asiaelectronics` },
        { name: "twitter:description", content: loaderData.description },
        { name: "twitter:image", content: loaderData.image },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(productSchema),
        },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <div className="container-shop py-20 text-center">
      <h1 className="font-display text-2xl font-extrabold">Product not found</h1>
      <Link to="/shop" className="mt-4 inline-block font-bold text-primary hover:underline">
        Back to shop
      </Link>
    </div>
  );
}

function ProductPage() {
  const loaderData = Route.useLoaderData();
  if (loaderData.pending) return <DeferredProductPage />;
  return <ProductDetails />;
}

/** Resolves the product in the browser when the server-side lookup missed. */
function DeferredProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isPending } = useQuery(productQuery(slug));

  if (isPending) {
    return (
      <div className="container-shop py-20 flex justify-center" aria-busy="true">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!product) return <ProductNotFound />;
  return <ProductDetails />;
}

function ProductDetails() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { data: related } = useSuspenseQuery(relatedQuery(slug));
  const cart = useCart();
  const { whatsappDigits } = useSettings();
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<Record<string, string>>({});
  if (!product) return <ProductNotFound />;

  const cat = categories.find((c) => c.slug === product.category);
  const showPrice = product.showPrice !== false;
  const showQty = product.showQuantity !== false;
  const showAvail = product.showAvailability !== false;

  const remaining = cart.remainingFor(product.id);
  const missing = (product.variants ?? []).filter((v) => !variant[v.name]);
  const isOutOfStock = showAvail && product.stock <= 0;
  const isMaxInCart = remaining <= 0;
  const canAdd = (!showAvail || product.stock > 0) && remaining > 0 && missing.length === 0;
  const variantLabel = product.variants?.map((v) => `${v.name}: ${variant[v.name]}`).join(", ");

  const add = () => {
    if (missing.length)
      return toast.error(`Please choose ${missing.map((m) => m.name.toLowerCase()).join(" and ")}`);
    const q = Math.min(qty, remaining);
    cart.add(product.id, q, variantLabel || undefined);
    toast.success(`Added ${q} × ${product.name}`);
    setQty(1);
  };

  const handleBuyNow = () => {
    if (missing.length)
      return toast.error(`Please choose ${missing.map((m) => m.name.toLowerCase()).join(" and ")}`);
    const q = Math.min(qty, remaining);
    cart.add(product.id, q, variantLabel || undefined);
    navigate({ to: "/checkout" });
  };

  return (
    <div className="container-shop pt-1 sm:pt-4 lg:pt-6 pb-12 lg:pb-14 w-full">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-2 sm:mb-4 lg:mb-5">
        <Link to="/" className="hover:text-primary">
          Home
        </Link>{" "}
        /{" "}
        <Link to="/shop" search={{ category: product.category }} className="hover:text-primary">
          {cat?.short || product.category}
        </Link>{" "}
        / <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      {/* Main 3-Column Layout Filling Full Width */}
      <div className="grid gap-8 lg:grid-cols-12 items-start w-full">
        {/* Column 1: Product Image Gallery (Increased size, 5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center sm:items-start w-full">
          {/* Main Display Image */}
          <div className="relative h-[380px] sm:h-[460px] lg:h-[500px] w-full rounded-2xl border border-border bg-white dark:bg-zinc-900/60 p-4 sm:p-8 flex items-center justify-center group shadow-xs overflow-hidden">
            <img
              src={product.images[img] || product.images[0]}
              alt={product.name}
              className={cn(
                "h-full w-full object-contain max-h-[360px] sm:max-h-[430px] lg:max-h-[470px] transition-transform duration-300 group-hover:scale-105 drop-shadow-sm",
                product.stock <= 0 && "grayscale contrast-75 opacity-70",
              )}
            />

            {/* Out of Stock Watermark Overlay */}
            {product.stock <= 0 && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/35 backdrop-blur-[0.5px]">
                <span className="rotate-[-12deg] rounded-md border-2 border-red-500 bg-red-600/95 px-6 py-2.5 font-display text-base sm:text-xl font-black uppercase tracking-widest text-white shadow-2xl">
                  OUT OF STOCK
                </span>
              </div>
            )}

            {/* Previous / Next Arrow Buttons */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setImg((prev) => (prev - 1 + product.images.length) % product.images.length)
                  }
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-md border border-border/80 flex items-center justify-center text-foreground hover:bg-white dark:hover:bg-zinc-700 hover:scale-110 transition-all opacity-80 group-hover:opacity-100 focus:outline-hidden"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setImg((prev) => (prev + 1) % product.images.length)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-md border border-border/80 flex items-center justify-center text-foreground hover:bg-white dark:hover:bg-zinc-700 hover:scale-110 transition-all opacity-80 group-hover:opacity-100 focus:outline-hidden"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 text-white text-[11px] font-mono backdrop-blur-xs">
                  {img + 1} / {product.images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails Row Aligned under the Main Image */}
          {product.images.length > 1 && (
            <div className="mt-4 flex items-center gap-2.5 overflow-x-auto w-full py-1">
              {product.images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setImg(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-pressed={img === i}
                  className={`h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 p-1.5 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 transition-all ${
                    img === i
                      ? "border-primary ring-2 ring-primary/25 shadow-xs scale-105"
                      : "border-border/70 hover:border-foreground/50 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Core Product Info, Pricing & Actions (4 cols) */}
        <div className="lg:col-span-4 min-w-0 space-y-4">
          <div>
            {showAvail && <StockBadge stock={product.stock} showQuantity={showQty} />}
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
              {product.name}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {product.brand} · Model {product.model} · SKU {product.sku}
            </p>
          </div>

          {/* Price display matching sample */}
          <div className="flex items-baseline gap-3 pt-1">
            {showPrice ? (
              <>
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-500">
                  {formatLKR(product.priceCents)}
                </span>
                {product.compareAtCents && product.compareAtCents > product.priceCents && (
                  <span className="text-sm font-medium text-muted-foreground line-through">
                    {formatLKR(product.compareAtCents)}
                  </span>
                )}
              </>
            ) : (
              <span className="font-display text-xl font-black text-primary uppercase tracking-wide">
                Price on Request
              </span>
            )}
          </div>

          {showPrice && (
            <p className="text-[11px] text-muted-foreground -mt-2">
              Inclusive of standard warranties · Fast island-wide delivery
            </p>
          )}

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          {/* Variants */}
          {product.variants?.map((v) => (
            <fieldset key={v.name} className="mt-3">
              <legend className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {v.name}
              </legend>
              <div className="flex flex-wrap gap-2">
                {v.options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={variant[v.name] === o}
                    onClick={() => setVariant((s) => ({ ...s, [v.name]: o }))}
                    className={`min-h-9 rounded-md border-2 px-3 text-xs font-semibold transition-all ${
                      variant[v.name] === o
                        ? "border-primary text-primary bg-primary/5"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          {/* Quantity and Action Buttons Row */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <div
              className="flex h-11 items-center border border-input rounded-md bg-background"
              role="group"
              aria-label="Quantity"
            >
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-full w-10 place-items-center hover:bg-muted/50 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-9 text-center font-bold text-xs" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={qty >= remaining}
                onClick={() => setQty((q) => Math.min(remaining, q + 1))}
                className="grid h-full w-10 place-items-center hover:bg-muted/50 transition-colors disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ADD TO CART */}
            <Button
              onClick={add}
              disabled={isOutOfStock || isMaxInCart}
              className="h-11 px-5 rounded-md text-xs font-extrabold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              <ShoppingCart className="h-4 w-4 mr-1.5" />{" "}
              {isOutOfStock ? "Out of stock" : isMaxInCart ? "Max in cart" : "Add to Cart"}
            </Button>

            {/* BUY NOW */}
            <Button
              onClick={handleBuyNow}
              disabled={isOutOfStock || isMaxInCart}
              className="h-11 px-5 rounded-md text-xs font-extrabold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              Buy Now
            </Button>

            {/* WhatsApp */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={buildWhatsAppUrl(product.name, qty, whatsappDigits)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Inquire about ${product.name} on WhatsApp`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-md border-2 border-[#25D366] text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-white"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Inquire on WhatsApp</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {showAvail && product.stock > 0 && remaining < product.stock && (
            <p className="text-[11px] text-muted-foreground">
              {product.stock - remaining} already in your cart{" "}
              {showQty ? `· ${remaining} more available` : ""}
            </p>
          )}
        </div>

        {/* Column 3: Brand, Warranty, Delivery Info Card (3 cols) Matching Sample */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card/60 p-4 space-y-4 shadow-xs">
          {/* Brand Header */}
          <div className="border border-border/80 rounded-lg p-3 bg-muted/20 text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
              Brand
            </span>
            <span className="text-base font-black tracking-wider text-foreground uppercase">
              {product.brand}
            </span>
          </div>

          {/* Key Identifiers */}
          <div className="space-y-2 text-xs divide-y divide-border/60">
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Model Number</span>
              <span className="font-semibold text-foreground font-mono">
                {product.model || "Standard"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">SKU Code</span>
              <span className="font-semibold text-foreground font-mono">{product.sku}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Warranty</span>
              <span className="font-semibold text-foreground">12 Month(s)</span>
            </div>
          </div>

          {/* Delivery & Store Pickup Badges */}
          <div className="pt-2 border-t border-border/80 space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Truck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Standard Delivery</p>
                <p className="text-[11px] text-muted-foreground">
                  3 - 5 Working Days ·{" "}
                  <span className="text-emerald-500 font-semibold">Available</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Store className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Pickup In-Store</p>
                <p className="text-[11px] text-muted-foreground">
                  Available Today ·{" "}
                  <span className="text-blue-500 font-semibold">Ready in 2 hrs</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Genuine Quality</p>
                <p className="text-[11px] text-muted-foreground">100% Authentic electronic parts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="specs" className="mt-14">
        <TabsList className="h-auto rounded-none bg-transparent p-0">
          <TabsTrigger
            value="specs"
            className="rounded-none border-b-2 border-transparent px-5 py-3 font-bold data-[state=active]:border-primary data-[state=active]:shadow-none"
          >
            Specifications
          </TabsTrigger>
          <TabsTrigger
            value="compat"
            className="rounded-none border-b-2 border-transparent px-5 py-3 font-bold data-[state=active]:border-primary data-[state=active]:shadow-none"
          >
            Compatibility
          </TabsTrigger>
        </TabsList>
        <TabsContent value="specs" className="mt-4">
          <dl className="divide-y divide-border border border-border text-sm">
            {Object.entries({
              Brand: product.brand,
              Model: product.model,
              SKU: product.sku,
              ...product.specs,
            }).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 px-4 py-3">
                <dt className="font-semibold text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>
        <TabsContent value="compat" className="mt-4 text-sm">
          {product.compatibility?.length ? (
            <ul className="list-inside list-disc space-y-1">
              {product.compatibility.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              No specific compatibility notes. Contact us to confirm fit for your device.
            </p>
          )}
        </TabsContent>
      </Tabs>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title">Related Products</h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
