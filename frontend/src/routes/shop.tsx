import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FlaskConical,
  Lightbulb,
  Monitor,
  Package,
  Radio,
  Smartphone,
  SlidersHorizontal,
  Sun,
  Tv,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { attributeOptions, productsQuery, useCatalog } from "@/services/catalog";
import type { Category, CategorySlug, SortKey } from "@/lib/types";
import { ProductGrid, ProductGridSkeleton } from "@/components/site/ProductCard";
import { PageHeading } from "@/components/site/PageHeading";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export interface ShopSearch {
  q?: string | undefined;
  category?: CategorySlug | undefined;
  subcategory?: string | undefined;
  brands?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  inStock?: boolean | undefined;
  attr?: string | undefined;
  sort?: SortKey | undefined;
  page?: number | undefined;
}

const SHOP_SUBCATEGORIES: Record<string, Array<{ label: string; query: string }>> = {
  lighting: [
    { label: "LED panel & tube lights", query: "panel light tube light" },
    { label: "Strip, track & spot lights", query: "strip light track light spot light" },
    { label: "Solar & outdoor lighting", query: "solar light outdoor light" },
    { label: "Chandeliers & bulbs", query: "chandelier bulb" },
  ],
  "home-appliances": [
    { label: "TVs & projectors", query: "tv projector" },
    { label: "Consumer appliances", query: "appliance" },
  ],
  "kitchen-appliances": [
    { label: "Blenders", query: "blender" },
    { label: "Cookers", query: "cooker" },
  ],
  "appliance-spare-parts": [
    { label: "Washing machine parts", query: "washing machine" },
    { label: "AC & microwave parts", query: "air conditioning microwave" },
    { label: "Vacuum, blender & kettle parts", query: "vacuum blender kettle" },
  ],
  "electronic-components": [
    { label: "ICs & IGBTs", query: "ic igbt" },
    { label: "Resistors & capacitors", query: "resistor capacitor" },
    { label: "Arduino, sensors & modules", query: "arduino sensor module" },
  ],
  "power-solar-batteries": [
    { label: "Solar panels & controllers", query: "solar panel controller" },
    { label: "Inverters & MPPT controllers", query: "inverter mppt" },
    { label: "UPS & lithium batteries", query: "ups lithium battery" },
    { label: "Generator spares", query: "generator" },
  ],
  audio: [
    { label: "Speakers", query: "speaker" },
    { label: "Microphones & mixers", query: "microphone mixer" },
    { label: "Amplifiers & Bluetooth modules", query: "amplifier bluetooth" },
  ],
  mobile: [
    { label: "Displays & repair parts", query: "display repair" },
    { label: "Cables, chargers & power banks", query: "cable charger powerbank" },
    { label: "Phone repair tools", query: "phone repair tool" },
  ],
  "tools-installation": [{ label: "Tools & installation supplies", query: "tool installation" }],
  "laboratory-equipment": [
    { label: "Oscilloscopes & multimeters", query: "oscilloscope multimeter" },
    { label: "Microscopes & signal generators", query: "microscope signal generator" },
  ],
  "tv-repair-parts": [
    { label: "LED backlights", query: "led backlight" },
    { label: "TV LCD panels", query: "tv lcd" },
    { label: "TV boards", query: "tv board" },
  ],
  "test-repair-equipment": [
    { label: "Soldering stations", query: "solder station" },
    { label: "Repair lamps & thermal mats", query: "repair lamp thermal mat" },
  ],
  "electrical-control-boxes": [
    { label: "Enclosure boxes", query: "enclosure box" },
    { label: "Distribution & control boxes", query: "distribution control box" },
  ],
  "led-displays-signage": [
    { label: "P10 LED modules", query: "p10 led module" },
    { label: "Indoor & outdoor LED displays", query: "led display" },
    { label: "Name boards", query: "name board" },
  ],
};

const SHOP_CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  lighting: Lightbulb,
  "home-appliances": Tv,
  "kitchen-appliances": Package,
  "appliance-spare-parts": Wrench,
  "electronic-components": Cpu,
  "power-solar-batteries": Sun,
  audio: Radio,
  mobile: Smartphone,
  "tools-installation": Wrench,
  "laboratory-equipment": FlaskConical,
  "tv-repair-parts": Monitor,
  "test-repair-equipment": FlaskConical,
  "electrical-control-boxes": Boxes,
  "led-displays-signage": Zap,
  "name-boards": Monitor,
  "magnet-bars": Package,
  equipment: Package,
};

const SORTS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

const num = (v: unknown) => {
  const n = Number(v);
  return v === undefined || v === "" || Number.isNaN(n) ? undefined : n;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Partial<Record<keyof ShopSearch, unknown>>): ShopSearch => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
    category:
      typeof s.category === "string" && s.category ? (s.category as CategorySlug) : undefined,
    subcategory: typeof s.subcategory === "string" && s.subcategory ? s.subcategory : undefined,
    brands: typeof s.brands === "string" && s.brands ? s.brands : undefined,
    min: num(s.min),
    max: num(s.max),
    inStock: s.inStock === true || s.inStock === "true" ? true : undefined,
    attr: typeof s.attr === "string" && s.attr ? s.attr : undefined,
    sort: SORTS.some((o) => o.value === s.sort) ? (s.sort as SortKey) : undefined,
    page: num(s.page),
  }),
  head: () => ({
    meta: [
      { title: "Shop Electronics, Components & Parts — Asiaelectronics" },
      {
        name: "description",
        content:
          "Browse electronic components, audio, lighting, solar products, mobile repair parts and equipment in Sri Lanka, priced in LKR.",
      },
      { property: "og:title", content: "Shop Electronics & Parts — Asiaelectronics" },
      {
        property: "og:description",
        content: "Filter electronics, components, repair parts, and tools by category, brand, and price.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.asiaelectronics.lk/shop" },
      { property: "og:image", content: "https://www.asiaelectronics.lk/logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Shop Electronics & Parts — Asiaelectronics" },
      { name: "twitter:image", content: "https://www.asiaelectronics.lk/logo.png" },
    ],
    links: [{ rel: "canonical", href: "https://www.asiaelectronics.lk/shop" }],
  }),
  component: ShopPage,
  errorComponent: () => (
    <div className="container-shop py-20 text-center">
      <h1 className="font-display text-xl font-extrabold">Couldn't load products</h1>
      <p className="mt-2 text-sm text-muted-foreground">Please refresh the page and try again.</p>
    </div>
  ),
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { categories, brands, brandLogos } = useCatalog();
  const brandList = search.brands?.split(",").filter(Boolean) ?? [];
  const query = { ...search, brands: brandList, page: search.page ?? 1 };
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    ...productsQuery(query),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const handleUpdate = () => {
      void refetch();
    };
    window.addEventListener("ae-catalog-updated", handleUpdate);
    return () => window.removeEventListener("ae-catalog-updated", handleUpdate);
  }, [refetch]);

  const cat = categories.find((c) => c.slug === search.category);

  const update = (patch: Partial<ShopSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: patch.page ?? undefined }) });
  const clearAll = () => navigate({ search: search.q ? { q: search.q } : {} });
  const activeCount = [
    search.category,
    search.brands,
    search.min,
    search.max,
    search.inStock,
    search.attr,
  ].filter((v) => v !== undefined).length;

  const filters = (
    <Filters
      search={search}
      brandList={brandList}
      update={update}
      clearAll={clearAll}
      activeCount={activeCount}
      categories={categories}
      brands={brands}
      brandLogos={brandLogos}
    />
  );

  return (
    <>
      <PageHeading
        title={cat?.name ?? (search.q ? `Results for “${search.q}”` : "All Products")}
        crumb={cat?.short ?? "Shop"}
      >
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {data ? `${data.total} product${data.total === 1 ? "" : "s"}` : "Loading…"}
          </p>
          <label className="hidden items-center gap-2 text-sm lg:flex">
            <span className="text-muted-foreground">Sort by</span>
            <select
              value={search.sort ?? "featured"}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
              className="h-10 border border-input bg-background px-3 text-sm"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </PageHeading>
      <div className="container-shop grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filters">
          {filters}
        </aside>
        <div className="min-w-0">
          <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-none lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                  {activeCount ? ` (${activeCount})` : ""}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-left font-display">Filters</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-6">{filters}</div>
              </SheetContent>
            </Sheet>
            <label className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">Sort by</span>
              <select
                value={search.sort ?? "featured"}
                onChange={(e) => update({ sort: e.target.value as SortKey })}
                className="h-10 border border-input bg-background px-3 text-sm"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <ProductGridSkeleton />
          ) : isError ? (
            <div className="border border-border p-10 text-center">
              <p className="font-semibold">Something went wrong loading products.</p>
              <Button className="mt-4 rounded-none" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : data && data.items.length === 0 ? (
            <div className="border border-border p-10 text-center">
              <p className="font-display text-lg font-extrabold">No products match</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try removing a filter or searching for a different term.
              </p>
              <Button className="mt-5 rounded-none" onClick={() => navigate({ search: {} })}>
                Clear search & filters
              </Button>
            </div>
          ) : data ? (
            <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
              <ProductGrid products={data.items} />
              {data.pages > 1 && (
                <nav
                  className="mt-8 flex items-center justify-center gap-1"
                  aria-label="Pagination"
                >
                  <PageBtn
                    disabled={data.page <= 1}
                    onClick={() => update({ page: data.page - 1 })}
                    label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </PageBtn>
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                    <PageBtn
                      key={n}
                      active={n === data.page}
                      onClick={() => update({ page: n })}
                      label={`Page ${n}`}
                    >
                      {n}
                    </PageBtn>
                  ))}
                  <PageBtn
                    disabled={data.page >= data.pages}
                    onClick={() => update({ page: data.page + 1 })}
                    label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </PageBtn>
                </nav>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`grid h-10 min-w-10 place-items-center border text-sm font-bold disabled:opacity-40 ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground"}`}
    >
      {children}
    </button>
  );
}

function Filters({
  search,
  brandList,
  update,
  clearAll,
  activeCount,
  categories,
  brands,
  brandLogos,
}: {
  search: ShopSearch;
  brandList: string[];
  update: (p: Partial<ShopSearch>) => void;
  clearAll: () => void;
  activeCount: number;
  categories: Category[];
  brands: string[];
  brandLogos?: Record<string, string>;
}) {
  const [min, setMin] = useState(search.min?.toString() ?? "");
  const [max, setMax] = useState(search.max?.toString() ?? "");
  const [expandedCategory, setExpandedCategory] = useState<string | undefined>(search.category);
  useEffect(() => {
    setMin(search.min?.toString() ?? "");
    setMax(search.max?.toString() ?? "");
  }, [search.min, search.max]);
  const attrs = search.category ? attributeOptions(search.category) : null;

  const toggleBrand = (b: string) => {
    const next = brandList.includes(b) ? brandList.filter((x) => x !== b) : [...brandList, b];
    update({ brands: next.length ? next.join(",") : undefined });
  };

  return (
    <div className="space-y-7 text-sm">
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1 text-xs font-bold uppercase text-primary hover:underline"
        >
          <X className="h-3.5 w-3.5" /> Clear all filters
        </button>
      )}
      <FilterGroup title="Category">
        <ul className="space-y-1">
          <li>
            <Link
              to="/shop"
              search={(p) => ({
                ...p,
                category: undefined,
                subcategory: undefined,
                attr: undefined,
                page: undefined,
              })}
              className={!search.category ? "font-bold text-primary" : "hover:text-primary"}
            >
              All categories
            </Link>
          </li>
          {categories.map((c) => {
            const subcategories = c.subcategories?.length
              ? c.subcategories.map((label) => ({ label, subcategory: label }))
              : (SHOP_SUBCATEGORIES[c.slug] ?? []).map(({ label }) => ({
                  label,
                  subcategory: undefined,
                }));
            const isExpanded = expandedCategory === c.slug;
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedCategory(isExpanded ? undefined : c.slug);
                    update({
                      category: c.slug,
                      subcategory: undefined,
                      q: undefined,
                      attr: undefined,
                    });
                  }}
                  aria-expanded={isExpanded}
                  className={`flex w-full items-center justify-between gap-2 text-left ${search.category === c.slug ? "font-bold text-primary" : "hover:text-primary"}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CategoryIcon slug={c.slug} />
                    <span>{c.name}</span>
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                {isExpanded && subcategories.length > 0 && (
                  <ul className="mt-1 space-y-1 border-l border-border pl-3 text-xs text-muted-foreground">
                    {subcategories.map((subcategory) => (
                      <li key={subcategory.label}>
                        <Link
                          to="/shop"
                          search={(p) => ({
                            ...p,
                            category: c.slug,
                            subcategory: subcategory.subcategory,
                            q: undefined,
                            attr: undefined,
                            page: undefined,
                          })}
                          className="block py-0.5 hover:text-primary"
                        >
                          {subcategory.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </FilterGroup>
      {attrs?.key && attrs.options.length > 0 && (
        <FilterGroup title={attrs.key}>
          {attrs.options.map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 py-1">
              <input
                type="radio"
                name="attr"
                checked={search.attr === o}
                onChange={() => update({ attr: o })}
                className="accent-primary"
              />{" "}
              {o}
            </label>
          ))}
          {search.attr && (
            <button
              type="button"
              onClick={() => update({ attr: undefined })}
              className="mt-1 text-xs text-primary hover:underline"
            >
              Any {attrs.key.toLowerCase()}
            </button>
          )}
        </FilterGroup>
      )}
      <FilterGroup title="Availability">
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={!!search.inStock}
            onCheckedChange={(v) => update({ inStock: v ? true : undefined })}
          />{" "}
          In stock only
        </label>
      </FilterGroup>
      <FilterGroup title="Price (LKR)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: num(min), max: num(max) });
          }}
        >
          <input
            aria-label="Minimum price"
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
            placeholder="Min"
            className="h-9 w-full min-w-0 border border-input px-2"
          />
          <span aria-hidden>–</span>
          <input
            aria-label="Maximum price"
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
            placeholder="Max"
            className="h-9 w-full min-w-0 border border-input px-2"
          />
          <button
            type="submit"
            className="h-9 shrink-0 bg-ink px-3 text-xs font-bold text-ink-foreground"
          >
            Go
          </button>
        </form>
      </FilterGroup>
      <FilterGroup title="Brand">
        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
          {brands.map((b) => {
            const logo = brandLogos?.[b];
            return (
              <label
                key={b}
                className="flex cursor-pointer items-center gap-2 py-1 hover:text-primary transition-colors text-xs"
              >
                <Checkbox checked={brandList.includes(b)} onCheckedChange={() => toggleBrand(b)} />
                {logo ? (
                  <img
                    src={logo}
                    alt={b}
                    className="h-4 w-4 object-contain rounded shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                    {b.charAt(0).toUpperCase()}
                  </span>
                )}
                <span>{b}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>
    </div>
  );
}

function CategoryIcon({ slug }: { slug: string }) {
  const Icon = SHOP_CATEGORY_ICONS[slug] ?? Package;
  return <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-display text-xs font-extrabold uppercase tracking-wider">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
