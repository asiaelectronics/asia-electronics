import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import { images } from "@/data/catalog";
import labeledElectronicComponents from "@/assets/imgs/Labeled Electronic Components on Checkerboard.png";
import type { SortKey } from "@/lib/types";
import { useCatalog } from "@/services/catalog";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { CategoryProductSection } from "@/components/site/CategoryProductSection";
import { ProductCard } from "@/components/site/ProductCard";
import { HeroVideoScroller } from "@/components/site/HeroVideoScroller";
import { useSettings } from "@/context/settings";
import { HOMEPAGE_VIDEO_ENABLED } from "@/lib/features";

const SpecialOfferBanner = lazy(() =>
  import("@/components/site/SpecialOfferBanner").then((module) => ({
    default: module.SpecialOfferBanner,
  })),
);

export const Route = createFileRoute("/")({
  head: () => {
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "ElectronicsStore",
      name: "Asia Electronics and Cellular Pvt Ltd",
      alternateName: "Asia Electronics",
      url: "https://www.asiaelectronics.lk/",
      logo: "https://www.asiaelectronics.lk/logo.png",
      image: "https://www.asiaelectronics.lk/logo.png",
      telephone: "+94 74 106 6017",
      email: "aecpvt60@gmail.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "60 1st Cross Street",
        addressLocality: "Colombo",
        postalCode: "01100",
        addressCountry: "LK",
      },
      areaServed: { "@type": "Country", name: "Sri Lanka" },
      sameAs: ["https://www.facebook.com/p/Asia-Electronics-And-Cellular-Pvt-Ltd-100067031593071/"],
    };

    return {
      meta: [
        { title: "Asia Electronics | Electronics, Components & Repair Parts in Sri Lanka" },
        {
          name: "description",
          content:
            "Shop electronic components, repair parts, lighting, solar products, mobile accessories and equipment at Asia Electronics, Sri Lanka.",
        },
        {
          property: "og:title",
          content: "Asia Electronics | Electronics, Components & Repair Parts",
        },
        {
          property: "og:description",
          content:
            "Shop electronic components, repair parts, audio, lighting, solar products, and tools with islandwide delivery across Sri Lanka.",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://www.asiaelectronics.lk/" },
        { property: "og:image", content: "https://www.asiaelectronics.lk/logo.png" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Asia Electronics | Electronics, Components & Repair Parts",
        },
        { name: "twitter:image", content: "https://www.asiaelectronics.lk/logo.png" },
      ],
      links: [{ rel: "canonical", href: "https://www.asiaelectronics.lk/" }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(localBusinessSchema) }],
    };
  },
  component: Index,
});

function Index() {
  const { categories, products: allProducts, brandLogos } = useCatalog();
  const { settings } = useSettings();
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [loadOffers, setLoadOffers] = useState(false);

  useEffect(() => {
    const schedule = window.requestIdleCallback?.(() => setLoadOffers(true), { timeout: 2500 });
    if (schedule !== undefined) return () => window.cancelIdleCallback?.(schedule);
    const timer = window.setTimeout(() => setLoadOffers(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  // Derive ONLY brands that actually exist in the current store products
  const existingBrands = useMemo(() => {
    const map = new Map<string, { name: string; count: number; logo?: string }>();
    allProducts.forEach((p) => {
      const b = (p.brand || "").trim();
      if (!b || b.toLowerCase() === "generic") return;
      if (!map.has(b)) {
        map.set(b, {
          name: b,
          count: 1,
          logo: brandLogos?.[b] || p.attributes["brandLogo"] || "",
        });
      } else {
        const item = map.get(b)!;
        item.count += 1;
        if (!item.logo && p.attributes["brandLogo"]) {
          item.logo = p.attributes["brandLogo"];
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allProducts, brandLogos]);

  const hotSellingProducts = useMemo(
    () => allProducts.filter((product) => product.featured && product.stock > 0).slice(0, 8),
    [allProducts],
  );

  return (
    <>
      {loadOffers && (
        <Suspense fallback={null}>
          <SpecialOfferBanner />
        </Suspense>
      )}
      <HeroVideoScroller />
      {HOMEPAGE_VIDEO_ENABLED && settings.homepageVideo.url && (
        <section className="container-shop pt-4 sm:pt-6" aria-label="Featured video">
          <div className="h-[240px] w-full overflow-hidden rounded-md border border-zinc-800 bg-black shadow-xl sm:h-[440px] lg:h-[500px]">
            <video
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={settings.homepageVideo.title || "Asia Electronics featured video"}
            >
              <source src={settings.homepageVideo.url} />
              Your browser does not support video playback.
            </video>
          </div>
        </section>
      )}

      {/* Promo grid — 6 tiles */}
      <section className="container-shop pt-6 lg:pt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. Electronic Equipment (large) */}
          <Link
            to="/shop"
            search={{ category: "electronic-components" }}
            className="group relative flex min-h-[220px] items-center overflow-hidden bg-tile sm:col-span-2 lg:col-span-2 lg:row-span-2"
          >
            <div className="relative z-10 max-w-[55%] p-6 sm:p-8">
              <span className="bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
                FEATURED RANGE
              </span>
              <h2 className="mt-4 font-display text-xl font-extrabold uppercase sm:text-2xl">
                Electronic Equipment
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Mobile repair parts &amp; accessories
              </p>
              <p className="mt-6 font-display font-extrabold">From Rs. 1,850</p>
            </div>
            <img
              src={labeledElectronicComponents}
              alt="Labeled electronic components"
              width={1024}
              height={768}
              loading="lazy"
              decoding="async"
              className="absolute right-0 top-0 h-full w-1/2 object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            />
          </Link>

          {/* 2. Robotics & Arduino */}
          <Link
            to="/shop"
            search={{ category: "audio" }}
            className="group flex min-h-[170px] items-center justify-between gap-2 overflow-hidden bg-tile p-6"
          >
            <div className="min-w-0">
              <h3 className="font-display text-sm font-extrabold uppercase">Robotics &amp; Arduino</h3>
              <p className="mt-2 text-xs text-muted-foreground">Boards, sensors, modules</p>
              <p className="mt-6 font-display text-sm font-extrabold">From Rs. 1,850</p>
            </div>
            <img
              src={images.catRobotics}
              alt="Arduino board, sensor and robotics car"
              width={816}
              height={816}
              loading="lazy"
              decoding="async"
              className="h-28 w-28 shrink-0 object-cover mix-blend-multiply transition-transform group-hover:scale-105 motion-reduce:transition-none"
            />
          </Link>

          {/* 3. Generic Parts */}
          <Link
            to="/shop"
            search={{ category: "appliance-spare-parts" }}
            className="group flex min-h-[170px] items-center justify-between gap-2 overflow-hidden bg-tile p-6"
          >
            <div className="min-w-0">
              <h3 className="font-display text-sm font-extrabold uppercase">Generic Parts</h3>
              <p className="mt-2 text-xs text-muted-foreground">Spare parts &amp; components</p>
              <p className="mt-6 font-display text-sm font-extrabold">From Rs. 2,400</p>
            </div>
            <img
              src={images.catSpares}
              alt=""
              width={816}
              height={816}
              loading="lazy"
              decoding="async"
              className="h-28 w-28 shrink-0 object-cover mix-blend-multiply transition-transform group-hover:scale-105 motion-reduce:transition-none"
            />
          </Link>

          {/* 4. Lab Equipment */}
          <Link
            to="/shop"
            search={{ category: "laboratory-equipment" }}
            className="group flex min-h-[170px] items-center justify-between gap-2 overflow-hidden bg-tile p-6"
          >
            <div className="min-w-0">
              <h3 className="font-display text-sm font-extrabold uppercase">Lab Equipment</h3>
              <p className="mt-2 text-xs text-muted-foreground">2.1 Soundbars &amp; Home Audio</p>
              <p className="mt-6 font-display text-sm font-extrabold">From Rs. 32,500</p>
            </div>
            <img
              src={images.catLab}
              alt=""
              width={816}
              height={816}
              loading="lazy"
              decoding="async"
              className="h-28 w-28 shrink-0 object-cover mix-blend-multiply transition-transform group-hover:scale-105 motion-reduce:transition-none"
            />
          </Link>

          {/* 5. Home Appliances */}
          <Link
            to="/shop"
            search={{ category: "home-appliances" }}
            className="group flex min-h-[170px] items-center justify-between gap-2 overflow-hidden bg-tile p-6"
          >
            <div className="min-w-0">
              <h3 className="font-display text-sm font-extrabold uppercase">Home Appliances</h3>
              <p className="mt-2 text-xs text-muted-foreground">TVs, appliances &amp; projectors</p>
              <p className="mt-6 font-display text-sm font-extrabold">From Rs. 54,900</p>
            </div>
            <img
              src={images.catHomeAppliances}
              alt=""
              width={816}
              height={816}
              loading="lazy"
              decoding="async"
              className="h-28 w-28 shrink-0 object-cover mix-blend-multiply transition-transform group-hover:scale-105 motion-reduce:transition-none"
            />
          </Link>

          {/* 6. LED Lighting */}
          <Link
            to="/shop"
            search={{ category: "lighting" }}
            className="group flex min-h-[170px] items-center justify-between gap-2 overflow-hidden bg-tile p-6"
          >
            <div className="min-w-0">
              <h3 className="font-display text-sm font-extrabold uppercase">LED Lighting</h3>
              <p className="mt-2 text-xs text-muted-foreground">Bulbs, strips, panels</p>
              <p className="mt-6 font-display text-sm font-extrabold">From Rs. 2,400</p>
            </div>
            <img
              src={images.catLighting}
              alt=""
              width={816}
              height={816}
              loading="lazy"
              decoding="async"
              className="h-28 w-28 shrink-0 object-cover mix-blend-multiply transition-transform group-hover:scale-105 motion-reduce:transition-none"
            />
          </Link>
        </div>
      </section>

      {/* Brands â€” Only Show Existing Brands with Logos */}
      {existingBrands.length > 0 && (
        <section className="container-shop mt-16">
          <div className="flex items-center justify-between gap-4">
            <h2 className="section-title">Shop by Brand</h2>
            {existingBrands.length > 3 && (
              <button
                type="button"
                aria-expanded={showAllBrands}
                aria-controls="home-brand-grid"
                onClick={() => setShowAllBrands((current) => !current)}
                className="inline-flex shrink-0 items-center gap-1.5 border-2 border-primary px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {showAllBrands ? "Show less" : "All brands"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showAllBrands ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
          <div
            id="home-brand-grid"
            className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            {(showAllBrands ? existingBrands : existingBrands.slice(0, 3)).map((b) => (
              <Link
                key={b.name}
                to="/shop"
                search={{ brands: b.name }}
                className="group relative flex flex-col items-center justify-center p-4 rounded border border-border bg-card hover:border-primary/50 hover:bg-tile transition-all duration-200 text-center shadow-2xs"
              >
                {b.logo ? (
                  <div className="h-12 w-full flex items-center justify-center mb-2 overflow-hidden px-2">
                    <img
                      src={b.logo}
                      alt={b.name}
                      loading="lazy"
                      decoding="async"
                      className="max-h-10 max-w-full object-contain filter group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
                    {b.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-display text-xs font-extrabold uppercase text-foreground group-hover:text-primary transition-colors truncate max-w-full">
                  {b.name}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {b.count} {b.count === 1 ? "product" : "products"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hot selling products are controlled by the product Featured flag in Admin. */}
      {hotSellingProducts.length > 0 && (
        <section className="container-shop mt-16">
          <SectionHead
            title="Hot Selling Products"
            to="/shop"
            cta="View all"
            search={{ sort: "featured" }}
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {hotSellingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="container-shop mt-16">
        <div className="flex items-center justify-between gap-4">
          <h2 className="section-title">Shop by Category</h2>
          {categories.length > 3 && (
            <button
              type="button"
              aria-expanded={showAllCategories}
              aria-controls="home-category-grid"
              onClick={() => setShowAllCategories((current) => !current)}
              className="inline-flex shrink-0 items-center gap-1.5 border-2 border-primary px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {showAllCategories ? "Show less" : "All categories"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showAllCategories ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
        <div id="home-category-grid" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(showAllCategories ? categories : categories.slice(0, 3)).map((c, i) => (
            <Link
              key={c.slug}
              to="/shop"
              search={{ category: c.slug }}
              className={`group flex h-28 items-center justify-between gap-3 overflow-hidden px-6 transition-colors ${i === 4 ? "bg-primary text-primary-foreground" : "bg-tile hover:bg-secondary"}`}
            >
              <span className="min-w-0 font-display text-xs font-extrabold uppercase leading-snug">
                {c.name}
              </span>
              <img
                src={c.image}
                alt=""
                width={816}
                height={816}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = "/assets/imgs/electronic-components.png";
                }}
                className={`h-20 w-20 shrink-0 object-cover transition-transform group-hover:scale-110 motion-reduce:transition-none ${i === 4 ? "" : "mix-blend-multiply"}`}
              />
            </Link>
          ))}
          {showAllCategories && (
            <Link
              to="/shop"
              className="flex h-28 items-center justify-between bg-ink px-6 text-ink-foreground"
            >
              <span className="font-display text-xs font-extrabold uppercase">
                Browse everything
              </span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* â”€â”€â”€ Category Product Carousel Sections (Matching Reference Screenshots) â”€â”€â”€ */}
      <div className="mt-10 sm:mt-12">
        {categories.map((cat) => {
          const catProducts = allProducts.filter((p) => p.category === cat.slug);
          return <CategoryProductSection key={cat.slug} category={cat} products={catProducts} />;
        })}
      </div>

      <section className="container-shop mt-16 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="section-title">About our store</h2>
          <p className="mt-5 font-semibold">
            Electronics, repair parts and accessories for homes, technicians and businesses across
            Sri Lanka.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Asia Electronics and Cellular Pvt Ltd supplies components, audio, lighting, mobile parts
            and displays. Asia Electronics and Cellular Pvt Ltd supplies components, audio
            equipment, lighting, mobile parts and displays for homes, technicians and businesses
            across Sri Lanka.
          </p>
          <Link
            to="/about"
            className="mt-5 inline-flex items-center gap-2 border-2 border-primary px-4 py-2 text-xs font-bold uppercase text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Read more <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-px bg-border">
          {[
            ["40+", "Years of experience"],
            [String(existingBrands.length || 0), "Brands in stock"],
            ["LKR", "Local pricing"],
          ].map(([n, l]) => (
            <div key={l} className="flex flex-col justify-center bg-tile p-6">
              <span className="font-display text-3xl font-black text-primary">{n}</span>
              <span className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
                {l}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function SectionHead({
  title,
  to,
  cta,
  search,
}: {
  title: string;
  to: "/shop";
  cta: string;
  search: { sort: SortKey };
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="section-title">{title}</h2>
      <Link
        to={to}
        search={search}
        className="shrink-0 border-2 border-primary px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground"
      >
        {cta}
      </Link>
    </div>
  );
}
