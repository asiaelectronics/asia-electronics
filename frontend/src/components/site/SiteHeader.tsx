import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  Globe,
  MapPin,
  Menu,
  Package,
  Phone,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import logoImg from "@/assets/imgs/logopng.png";
import { useCatalog } from "@/services/catalog";
import { useCart } from "@/context/cart";
import { useAuth } from "@/context/auth";
import { useSettings } from "@/context/settings";
import type { Product } from "@/lib/types";
import { CategoryMegaMenu, CATEGORY_ICONS } from "./CategoryMegaMenu";

import { BrandsMegaMenu } from "./BrandsMegaMenu";
import { TOP_BRANDS } from "./brandLogos";
import { MobileBottomNav } from "./MobileBottomNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Logo({ className = "" }: { className?: string }) {
  const { settings } = useSettings();
  return (
    <Link
      to="/"
      className={`flex shrink-0 items-center ${className}`}
      aria-label={`${settings.storeName} Home`}
    >
      <img
        src={logoImg}
        alt={settings.storeName}
        className="h-10 sm:h-12 w-auto rounded-lg object-contain transition-transform duration-200 hover:opacity-95"
      />
    </Link>
  );
}

function ProductSuggestions({
  products,
  query,
  onSelect,
}: {
  products: Product[];
  query: string;
  onSelect?: () => void;
}) {
  const suggestions = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return products
      .filter((product) => {
        const searchable =
          `${product.name} ${product.sku} ${product.brand} ${product.model} ${product.category}`.toLowerCase();
        return terms.every((term) => searchable.includes(term));
      })
      .slice(0, 6);
  }, [products, query]);

  if (!query.trim()) return null;
  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xl">
      {suggestions.length > 0 ? (
        <>
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Product suggestions
          </p>
          {suggestions.map((product) => (
            <Link
              key={product.id}
              to="/product/$slug"
              params={{ slug: product.slug }}
              onClick={onSelect}
              className="flex items-center gap-3 border-t border-zinc-100 px-3 py-2.5 hover:bg-zinc-50"
            >
              <img
                src={product.images[0] || "/assets/imgs/electronic-components.png"}
                alt=""
                className="h-10 w-10 shrink-0 rounded border border-zinc-100 object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-zinc-900">
                  {product.name}
                </span>
                <span className="block truncate text-[11px] text-zinc-500">
                  {product.brand} · {product.sku}
                </span>
              </span>
            </Link>
          ))}
          <Link
            to="/shop"
            search={{ q: query.trim() }}
            onClick={onSelect}
            className="block border-t border-zinc-100 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/5"
          >
            View all results for “{query.trim()}”
          </Link>
        </>
      ) : (
        <Link
          to="/shop"
          search={{ q: query.trim() }}
          onClick={onSelect}
          className="block px-3 py-3 text-xs text-zinc-600 hover:bg-zinc-50"
        >
          No matching products. Search the full catalogue for “{query.trim()}”.
        </Link>
      )}
    </div>
  );
}

function SearchForm({ className = "", onClose }: { className?: string; onClose?: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { products } = useCatalog();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (onClose) onClose();
    navigate({ to: "/shop", search: { q: q.trim() || undefined } });
  };
  return (
    <div className={`relative ${className}`}>
      <form
        onSubmit={submit}
        role="search"
        className="flex h-10 items-center overflow-hidden rounded border border-zinc-300 bg-white shadow-xs transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary sm:h-11"
      >
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <input
          id="site-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for products, categories and more"
          className="min-w-0 flex-1 bg-transparent px-3.5 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 sm:px-4 sm:text-sm"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex h-full shrink-0 cursor-pointer items-center justify-center bg-primary px-4 text-primary-foreground transition-colors hover:bg-primary/90 sm:px-5"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>
      <ProductSuggestions products={products} query={q} onSelect={onClose} />
    </div>
  );
}

/** Full-screen search overlay shown when tapping the search icon on mobile */
function MobileSearchOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { products } = useCatalog();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onClose();
    navigate({ to: "/shop", search: { q: q.trim() || undefined } });
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex flex-col lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Search overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white px-4 pt-3 pb-4 shadow-xl">
        <div className="relative flex items-center gap-2">
          <form
            onSubmit={submit}
            role="search"
            className="flex flex-1 items-center h-11 border border-zinc-300 rounded overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-white"
          >
            <label htmlFor="mobile-overlay-search" className="sr-only">
              Search products
            </label>
            <input
              ref={inputRef}
              id="mobile-overlay-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for products, categories and more"
              className="min-w-0 flex-1 bg-transparent px-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              aria-label="Search"
              className="bg-primary text-primary-foreground px-4 h-full flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
          <ProductSuggestions products={products} query={q} onSelect={onClose} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const { count } = useCart();
  const { categories, products, brandLogos } = useCatalog();
  const { user, logout, isAdmin } = useAuth();
  const [activeMenu, setActiveMenu] = useState<"categories" | "brands" | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const existingBrands = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.brand?.trim())
            .filter(
              (brand): brand is string => Boolean(brand) && brand.toLowerCase() !== "generic",
            ),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  // Refs for the brands drawer (opened from bottom nav)
  const [brandsDrawerOpen, setBrandsDrawerOpen] = useState(false);

  // Case-insensitive lookups for uploaded logo images and built-in SVG logos
  const logoByName = useMemo(
    () =>
      new Map(Object.entries(brandLogos).map(([name, url]) => [name.toLowerCase(), url] as const)),
    [brandLogos],
  );
  const svgByName = useMemo(
    () => new Map(TOP_BRANDS.map((b) => [b.name.toLowerCase(), b.component] as const)),
    [],
  );

  const headerRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close menus on route navigation
  const location = useRouterState({ select: (s) => s.location });
  useEffect(() => {
    setActiveMenu(null);
    setMobileOpen(false);
    setBrandsDrawerOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  // Handle outside click & escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
        setMobileOpen(false);
        setBrandsDrawerOpen(false);
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 180);
  };

  const handleMenuEnter = (menu: "categories" | "brands") => {
    cancelClose();
    setActiveMenu(menu);
  };

  const handleMenuToggle = (menu: "categories" | "brands") => {
    cancelClose();
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  // Mobile drawer for brands (triggered from bottom nav)
  const BrandsDrawer = (
    <Sheet open={brandsDrawerOpen} onOpenChange={setBrandsDrawerOpen}>
      <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-zinc-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Logo className="max-w-[160px]" />
            <SheetTitle className="sr-only">Brands</SheetTitle>
          </div>
        </SheetHeader>
        <div className="p-4 flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">All Brands</p>
            <span className="text-xs text-zinc-400 font-medium">
              {existingBrands.length} {existingBrands.length === 1 ? "brand" : "brands"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {existingBrands.map((b) => {
              const logoUrl = logoByName.get(b.toLowerCase());
              const SvgLogo = svgByName.get(b.toLowerCase());
              return (
                <Link
                  key={b}
                  to="/shop"
                  search={{ brands: b }}
                  onClick={() => setBrandsDrawerOpen(false)}
                  title={b}
                  aria-label={`Shop ${b}`}
                  className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-white p-2 transition-all hover:border-primary hover:shadow-sm active:scale-95"
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={b}
                      loading="lazy"
                      className="h-full w-full rounded object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : SvgLogo ? (
                    <SvgLogo className="h-auto w-full max-h-full object-contain transition-transform duration-200 group-hover:scale-105" />
                  ) : (
                    <span className="line-clamp-2 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-zinc-700 transition-colors group-hover:text-primary">
                      {b}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {/* â”€â”€â”€ Mobile search overlay â”€â”€â”€ */}
      {mobileSearchOpen && <MobileSearchOverlay onClose={() => setMobileSearchOpen(false)} />}

      {/* â”€â”€â”€ Brands drawer (triggered from bottom nav) â”€â”€â”€ */}
      {BrandsDrawer}

      <header ref={headerRef} className="relative z-40 w-full max-w-full bg-white border-b border-zinc-200">
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            MOBILE TOP HEADER  (hidden on lg+)
            Hamburger | Logo | Search icon | Cart | Account | Lang
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="lg:hidden w-full bg-white">
          <div className="flex h-14 w-full min-w-0 items-center gap-1 px-2 sm:gap-2 sm:px-3">
            {/* Hamburger â†’ opens categories drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open mobile menu"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>

              {/* â”€â”€â”€ Left Slide-in Drawer â”€â”€â”€ */}
              <SheetContent
                side="left"
                className="w-[85vw] max-w-sm overflow-y-auto p-0 flex flex-col"
              >
                <SheetHeader className="p-4 border-b border-zinc-200 bg-white sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <Logo className="max-w-[160px]" />
                    <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
                  </div>
                </SheetHeader>

                <div className="p-4 flex-1 space-y-6">
                  {/* Inline search in drawer */}
                  <SearchForm onClose={() => setMobileOpen(false)} />

                  {/* Categories Accordion */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary px-2 mb-2">
                      Categories
                    </p>
                    {categories.map((c) => {
                      const isExpanded = expandedMobileCategory === c.slug;
                      const CatIcon = CATEGORY_ICONS[c.slug] ?? Package;
                      return (
                        <div key={c.slug} className="border-b border-zinc-100 pb-1">
                          <button
                            type="button"
                            onClick={() => setExpandedMobileCategory(isExpanded ? null : c.slug)}
                            className="flex items-center justify-between w-full px-2 py-2.5 text-sm font-semibold text-zinc-800 text-left hover:text-primary"
                          >
                            <span className="flex items-center gap-2">
                              <CatIcon className="h-4 w-4 shrink-0 text-primary" />
                              {c.name}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180 text-primary" : ""}`}
                            />
                          </button>
                          {isExpanded && (
                            <div className="pl-4 pb-2 space-y-1.5">
                              <Link
                                to="/shop"
                                search={{ category: c.slug }}
                                onClick={() => setMobileOpen(false)}
                                className="block py-1 text-xs font-bold text-primary hover:underline"
                              >
                                View all {c.short} â†’
                              </Link>
                              <Link
                                to="/shop"
                                search={{ category: c.slug, attr: "featured" }}
                                onClick={() => setMobileOpen(false)}
                                className="block py-1 text-xs text-zinc-600 hover:text-primary"
                              >
                                Popular Items
                              </Link>
                              <Link
                                to="/shop"
                                search={{ category: c.slug, inStock: true }}
                                onClick={() => setMobileOpen(false)}
                                className="block py-1 text-xs text-zinc-600 hover:text-primary"
                              >
                                In-Stock Only
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Top Brands */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary px-2">
                      Top Brands
                    </p>
                    <div className="grid grid-cols-3 gap-2 px-2">
                      {existingBrands.slice(0, 9).map((b) => {
                        const logoUrl = logoByName.get(b.toLowerCase());
                        const SvgLogo = svgByName.get(b.toLowerCase());
                        return (
                          <Link
                            key={b}
                            to="/shop"
                            search={{ brands: b }}
                            onClick={() => setMobileOpen(false)}
                            title={b}
                            aria-label={`Shop ${b}`}
                            className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-white p-2 transition-all hover:border-primary hover:shadow-sm active:scale-95"
                          >
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={b}
                                loading="lazy"
                                className="h-full w-full rounded object-contain transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : SvgLogo ? (
                              <SvgLogo className="h-auto w-full max-h-full object-contain transition-transform duration-200 group-hover:scale-105" />
                            ) : (
                              <span className="line-clamp-2 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-zinc-700 transition-colors group-hover:text-primary">
                                {b}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1 border-t border-zinc-100 pt-3">
                    <Link
                      to="/shop"
                      onClick={() => setMobileOpen(false)}
                      className="block px-2 py-2 text-sm font-semibold text-zinc-800 hover:text-primary"
                    >
                      All Products
                    </Link>
                    <Link
                      to="/about"
                      onClick={() => setMobileOpen(false)}
                      className="block px-2 py-2 text-sm font-semibold text-zinc-800 hover:text-primary"
                    >
                      About Us
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setMobileOpen(false)}
                      className="block px-2 py-2 text-sm font-semibold text-zinc-800 hover:text-primary"
                    >
                      Contact
                    </Link>
                    <Link
                      to="/account"
                      onClick={() => setMobileOpen(false)}
                      className="block px-2 py-2 text-sm font-semibold text-zinc-800 hover:text-primary"
                    >
                      My Account / Orders
                    </Link>
                  </div>

                  {/* Contact info */}
                  <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 space-y-1.5">
                    <p className="font-bold text-zinc-800">Support & Orders</p>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      <a href="tel:+94112222888" className="hover:underline font-medium">
                        +94 112 222 888
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <Link
                        to="/policy/$slug"
                        params={{ slug: "delivery" }}
                        onClick={() => setMobileOpen(false)}
                      >
                        Island-wide delivery
                      </Link>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo â€” aligned to the left side */}
            <div className="flex min-w-0 flex-1 items-center justify-start">
              <Logo className="max-w-[86px] sm:max-w-none" />
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Search icon */}
              <button
                type="button"
                aria-label="Open search"
                onClick={() => setMobileSearchOpen(true)}
                className="grid h-10 w-10 place-items-center text-zinc-700 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Cart with badge */}
              <Link
                to="/cart"
                aria-label={`Cart, ${count} item${count !== 1 ? "s" : ""}`}
                className="relative grid h-10 w-10 place-items-center text-zinc-700 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center leading-none">
                  {count > 99 ? "99+" : count}
                </span>
              </Link>

              {/* Account */}
              <Link
                to="/account"
                aria-label="My account"
                className="grid h-10 w-10 place-items-center text-zinc-700 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
              >
                <User className="h-5 w-5" />
              </Link>

              {/* Language/Currency */}
              <div className="hidden items-center gap-0.5 pl-1 text-[10px] leading-none text-zinc-600 min-[420px]:flex">
                <Globe className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-zinc-800">EN</span>
                  <span className="text-zinc-400">LKR</span>
                </div>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            DESKTOP TOP ROW  (hidden on mobile)
            Logo | Search | Account/Cart Controls
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="hidden lg:block">
          <div className="w-full max-w-[1920px] mx-auto px-6 xl:px-8 py-3.5">
            <div className="flex items-center justify-between gap-4 xl:gap-6">
              {/* Logo on the left */}
              <Logo />

              {/* Wide search field expanding into available space beside logo */}
              <div className="flex-1 min-w-[220px]">
                <SearchForm className="w-full" />
              </div>

              {/* Compact account/cart controls grouped on the right */}
              <div className="flex items-center gap-3 xl:gap-4 shrink-0">
                {/* Cart with red count badge */}
                <Link
                  to="/cart"
                  aria-label={`Cart with ${count} items`}
                  className="flex items-center gap-1.5 text-zinc-800 hover:text-primary transition-colors py-1 focus:outline-none"
                >
                  <div className="relative flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-zinc-700 hover:text-primary" />
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-xs">
                      {count}
                    </span>
                  </div>
                  <span className="text-xs font-bold tracking-tight text-zinc-800 ml-1">Cart</span>
                </Link>

                {/* Account / User Profile / Login */}
                {user ? (
                  <div className="flex items-center gap-2 pl-3 border-l border-zinc-200">
                    <Link
                      to="/account"
                      className="flex items-center gap-1.5 text-xs text-zinc-800 hover:text-primary transition-colors font-bold"
                    >
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="max-w-[120px] truncate">Hi, {user.name.split(" ")[0]}</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="px-1.5 py-0.5 rounded bg-primary text-white text-[10px] font-bold hover:bg-primary/90"
                      >
                        Admin
                      </Link>
                    )}
                    <span className="text-zinc-300 font-light">|</span>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="text-xs text-zinc-500 hover:text-red-600 transition-colors font-semibold cursor-pointer"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pl-3 border-l border-zinc-200">
                    <User className="h-5 w-5 text-zinc-600 shrink-0" />
                    <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                      <Link
                        to="/login"
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        Login
                      </Link>
                      <span className="text-zinc-300 font-light">|</span>
                      <Link
                        to="/register"
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}

                {/* Language / Currency Selector */}
                <div className="flex items-center gap-1 pl-3 border-l border-zinc-200 text-xs text-zinc-700">
                  <Globe className="h-4 w-4 text-zinc-500" />
                  <div className="flex flex-col leading-none">
                    <span className="font-bold text-[11px] text-zinc-800">EN /</span>
                    <span className="text-[10px] text-zinc-500">LKR</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-zinc-400 ml-0.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            DESKTOP SECOND ROW: Black Nav Bar  (hidden on mobile)
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <nav
          className="hidden lg:block bg-ink text-ink-foreground border-t border-zinc-800 shadow-md"
          aria-label="Main Store Navigation"
        >
          <div className="w-full max-w-[1920px] mx-auto px-6 xl:px-8 relative">
            <div className="flex h-11 items-stretch justify-between">
              {/* Left navigation elements: All Categories, Brands, All Products, About Us, Contact, New Arrivals */}
              <div className="flex items-stretch shrink-0">
                {/* All Categories Button */}
                <div
                  className="relative flex items-stretch shrink-0"
                  onMouseEnter={() => handleMenuEnter("categories")}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={activeMenu === "categories"}
                    onClick={() => handleMenuToggle("categories")}
                    className={`flex items-center gap-2 px-3.5 xl:px-4 text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-colors outline-none cursor-pointer ${
                      activeMenu === "categories"
                        ? "bg-white text-primary shadow-md font-extrabold"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    <Menu className="h-4 w-4 shrink-0" />
                    <span>All Categories</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                        activeMenu === "categories" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Brands Button */}
                <div
                  className="relative flex items-stretch shrink-0"
                  onMouseEnter={() => handleMenuEnter("brands")}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={activeMenu === "brands"}
                    onClick={() => handleMenuToggle("brands")}
                    className={`flex items-center px-3.5 xl:px-4 text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-colors outline-none cursor-pointer ${
                      activeMenu === "brands"
                        ? "bg-white text-primary shadow-md font-extrabold"
                        : "text-zinc-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>Brands</span>
                  </button>
                </div>

                {/* Standard Nav Links */}
                <Link
                  to="/shop"
                  className="flex items-center px-3 xl:px-4 text-[11px] xl:text-xs font-bold uppercase tracking-wider text-zinc-200 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                  activeProps={{ className: "border-b-2 border-primary text-white bg-white/5" }}
                >
                  All Products
                </Link>
                <Link
                  to="/about"
                  className="flex items-center px-3 xl:px-4 text-[11px] xl:text-xs font-bold uppercase tracking-wider text-zinc-200 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                  activeProps={{ className: "border-b-2 border-primary text-white bg-white/5" }}
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center px-3 xl:px-4 text-[11px] xl:text-xs font-bold uppercase tracking-wider text-zinc-200 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                  activeProps={{ className: "border-b-2 border-primary text-white bg-white/5" }}
                >
                  Contact
                </Link>
                <Link
                  to="/wholesale"
                  className="flex items-center px-3 xl:px-4 text-[11px] xl:text-xs font-bold uppercase tracking-wider text-zinc-200 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                  activeProps={{ className: "border-b-2 border-primary text-white bg-white/5" }}
                >
                  Wholesale
                </Link>
                <Link
                  to="/shop"
                  search={{ sort: "newest" }}
                  className="flex items-center px-3 xl:px-4 text-[11px] xl:text-xs font-bold uppercase tracking-wider text-zinc-200 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                >
                  New Arrivals
                </Link>
              </div>

              {/* Right side contact & track info */}
              <div className="flex items-center gap-3.5 xl:gap-5 text-[11px] xl:text-xs font-medium shrink-0 ml-auto">
                <Link
                  to="/policy/$slug"
                  params={{ slug: "delivery" }}
                  className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors whitespace-nowrap"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Track your order</span>
                </Link>
                <a
                  href="tel:+94112222888"
                  className="flex items-center gap-1.5 text-white font-bold hover:text-primary transition-colors whitespace-nowrap"
                >
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>+94 112 222 888</span>
                </a>
              </div>
            </div>

            {/* â”€â”€â”€ Mega Menus Overlay â”€â”€â”€ */}
            {activeMenu === "categories" && (
              <div
                className="absolute left-6 xl:left-8 top-full z-50 pt-0 max-w-[calc(100vw-3rem)]"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                <CategoryMegaMenu categories={categories} onClose={() => setActiveMenu(null)} />
              </div>
            )}

            {activeMenu === "brands" && (
              <div
                className="absolute left-6 xl:left-8 right-6 xl:right-8 top-full z-50 pt-0"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                <BrandsMegaMenu
                  allBrands={existingBrands}
                  brandLogos={brandLogos}
                  onClose={() => setActiveMenu(null)}
                />
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MOBILE BOTTOM NAVIGATION BAR
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <MobileBottomNav
        onCategoryDrawerOpen={() => setMobileOpen(true)}
        onBrandsDrawerOpen={() => setBrandsDrawerOpen(true)}
      />
    </>
  );
}
