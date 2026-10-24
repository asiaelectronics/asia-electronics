/**
 * Mock & Persistent catalogue service.
 * Supports persistent storage in localStorage with fallback to initial catalog seeds.
 * Allows store owner to add/edit/delete products and categories, import/export,
 * and support 800+ SKUs with instantaneous query and filtering.
 */
import { useEffect, useState } from "react";
import { queryOptions } from "@tanstack/react-query";
import {
  brands as defaultBrands,
  categories as defaultCategories,
  products as defaultProducts,
  images,
} from "@/data/catalog";
import type { Brand, Category, Product, ProductPage, ProductQuery } from "@/lib/types";
import {
  createProductApi,
  updateProductApi,
  deleteProductApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  fetchProductsApi,
  fetchProductApi,
  fetchCategoriesApi,
  clearAllProductsApi,
  fetchBrandsApi,
  upsertBrandApi,
} from "./api";

const PRODUCTS_STORAGE_KEY = "ae_products_catalog_v6";
const CATEGORIES_STORAGE_KEY = "ae_categories_catalog_v8";
const CATALOG_UPDATED_EVENT = "ae-catalog-updated";

export function sanitizeAssetPath(
  path?: string,
  defaultFallback = "/assets/imgs/electronic-components.png",
): string {
  if (!path) return defaultFallback;
  const p = path.trim();
  if (p.includes("cat-components") || p.includes("electronic-components")) {
    return "/assets/imgs/electronic-components.png";
  }
  if (p.includes("cat-audio") || p.includes("audio-music")) {
    return "/assets/imgs/audio-music.png";
  }
  if (p.includes("cat-lighting") || p.includes("lighting")) {
    return "/assets/imgs/lighting.png";
  }
  if (p.includes("cat-mobile") || p.includes("mobile-parts")) {
    return "/assets/imgs/mobile-parts-accessories.png";
  }
  if (p.includes("cat-tv") || p.includes("home-appliances")) {
    return "/assets/imgs/home-appliances.png";
  }
  if (p.includes("kitchen-appliances")) {
    return "/assets/imgs/kitchen-appliances.png";
  }
  if (p.includes("appliance-spare-parts") || p.includes("cat-spares")) {
    return "/assets/imgs/appliance-spare-parts.png";
  }
  if (p.includes("power-solar") || p.includes("cat-power")) {
    return "/assets/imgs/power-solar-batteries.png";
  }
  if (p.includes("laboratory-equipment") || p.includes("cat-lab")) {
    return "/assets/imgs/laboratory-equipment.png";
  }
  if (p.includes("tools-installation") || p.includes("cat-tools")) {
    return "/assets/imgs/tools-installation-supplies.png";
  }
  if (p.includes("name-boards")) {
    return "/assets/imgs/name-boards.png";
  }
  if (p.includes("magnet-bars")) {
    return "/assets/imgs/magnet-bars.png";
  }
  if (p.includes("other-equipment") || p.includes("cat-equipment")) {
    return "/assets/imgs/other-equipment.png";
  }
  if (p.startsWith("/src/assets/")) {
    return p.replace(/^\/src\/assets\//, "/assets/");
  }
  return p;
}

let initialSyncPromise: Promise<void> | null = null;
export async function syncCatalogWithBackend() {
  if (typeof window === "undefined") return;
  if (initialSyncPromise) return initialSyncPromise;

  initialSyncPromise = (async () => {
    try {
      const [prodRes, cats, brandRecords] = await Promise.all([
        fetchProductsApi({ limit: 1000 }),
        fetchCategoriesApi(),
        fetchBrandsApi(),
      ]);

      if (prodRes && Array.isArray(prodRes.products)) {
        const sanitizedProds = prodRes.products.map((p) => ({
          ...p,
          images:
            Array.isArray(p.images) && p.images.length > 0
              ? p.images.map((img) => sanitizeAssetPath(img))
              : ["/assets/imgs/electronic-components.png"],
        }));
        saveStoredProducts(sanitizedProds);
      }
      if (cats && Array.isArray(cats) && cats.length > 0) {
        // Categories loaded directly from the Supabase database
        const syncedCats = cats.map((backendCat) => {
          const localDefault = defaultCategories.find((d) => d.slug === backendCat.slug);
          return {
            ...backendCat,
            image: sanitizeAssetPath(
              backendCat.image,
              localDefault?.image || "/assets/imgs/electronic-components.png",
            ),
            short: backendCat.short || localDefault?.short || backendCat.name,
          };
        });
        const mergedCategories = [
          ...syncedCats,
          ...defaultCategories.filter(
            (defaultCategory) =>
              !syncedCats.some((category) => category.slug === defaultCategory.slug),
          ),
        ];
        saveStoredCategories(mergedCategories);
      }
      if (brandRecords && Array.isArray(brandRecords)) {
        saveStoredBrandRecords(brandRecords);
      }
    } catch (err) {
      console.warn("Catalog sync with Supabase failed, using cached:", err);
    }
  })();

  return initialSyncPromise;
}

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// â”€â”€â”€ Storage Accessors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function getStoredProducts(): Product[] {
  if (typeof window === "undefined") return defaultProducts;
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (raw === null) return defaultProducts;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((p: Product) => ({
        ...p,
        images:
          Array.isArray(p.images) && p.images.length > 0
            ? p.images.map((img) => sanitizeAssetPath(img))
            : ["/assets/imgs/electronic-components.png"],
      }));
    }
    return defaultProducts;
  } catch {
    return defaultProducts;
  }
}

export function saveStoredProducts(items: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CATALOG_UPDATED_EVENT));
  } catch (e) {
    console.error("Failed to save products to localStorage", e);
  }
}

export function getStoredCategories(): Category[] {
  if (typeof window === "undefined") return defaultCategories;
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw === null) return defaultCategories;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Fix any legacy stale /src/assets/ or /assets/cat-*.jpg paths if present
      const repaired = parsed.map((cat: Category) => {
        const local = defaultCategories.find((d) => d.slug === cat.slug);
        const currentImg = cat.image || "";
        const needsRepair =
          !currentImg || currentImg.includes("/src/assets/") || currentImg.includes("cat-");
        return {
          ...cat,
          image: needsRepair
            ? local?.image || sanitizeAssetPath(currentImg, `/assets/imgs/${cat.slug}.png`)
            : sanitizeAssetPath(currentImg),
          short: local?.short ?? cat.short,
        };
      });
      return repaired;
    }
    return defaultCategories;
  } catch {
    return defaultCategories;
  }
}

export function saveStoredCategories(cats: Category[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
    window.dispatchEvent(new CustomEvent(CATALOG_UPDATED_EVENT));
  } catch (e) {
    console.error("Failed to save categories to localStorage", e);
  }
}

export function getStoredBrands(): string[] {
  const prods = getStoredProducts();
  const set = new Set<string>();
  getStoredBrandRecords().forEach((brand) => set.add(brand.name));
  prods.forEach((p) => {
    if (p.brand && p.brand.trim()) set.add(p.brand.trim());
  });
  return Array.from(set).sort();
}

const BRAND_LOGOS_STORAGE_KEY = "ae_brand_logos_v2";
const BRANDS_STORAGE_KEY = "ae_brands_v1";

export function getStoredBrandRecords(): Brand[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BRANDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredBrandRecords(brands: Brand[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(brands));
  window.dispatchEvent(new CustomEvent(CATALOG_UPDATED_EVENT));
}

export function getStoredBrandLogos(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(BRAND_LOGOS_STORAGE_KEY);
    const legacy = raw ? JSON.parse(raw) : {};
    const persisted = Object.fromEntries(
      getStoredBrandRecords()
        .filter((brand) => brand.imageUrl)
        .map((brand) => [brand.name, brand.imageUrl]),
    );
    return { ...legacy, ...persisted };
  } catch {
    return {};
  }
}

export async function saveBrandLogo(brand: string, logoUrl: string, imageData?: string) {
  if (typeof window === "undefined") return false;
  try {
    const cleanBrand = brand.trim();
    if (!cleanBrand) return false;
    const saved = await upsertBrandApi({
      name: cleanBrand,
      imageUrl: logoUrl.trim(),
      imageData,
    });
    if (!saved) return false;

    const current = getStoredBrandRecords().filter((item) => item.slug !== saved.slug);
    saveStoredBrandRecords([...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
    return true;
  } catch (e) {
    console.error("Failed to save brand logo", e);
    throw e;
  }
}

export async function deleteBrandLogo(brand: string) {
  if (typeof window === "undefined") return false;
  try {
    const saved = await upsertBrandApi({ name: brand.trim(), removeImage: true });
    if (!saved) return false;
    const current = getStoredBrandRecords().filter((item) => item.slug !== saved.slug);
    saveStoredBrandRecords([...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
    return true;
  } catch (e) {
    console.error("Failed to remove brand logo", e);
    throw e;
  }
}

// â”€â”€â”€ Product CRUD Operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CreateProductInput {
  name: string;
  sku: string;
  brand: string;
  model: string;
  category: string;
  subcategory?: string | undefined;
  priceLKR: number;
  compareAtLKR?: number | undefined;
  stock: number;
  description?: string | undefined;
  image?: string | undefined;
  images?: string[] | undefined;
  featured?: boolean | undefined;
  isNew?: boolean | undefined;
  showPrice?: boolean | undefined;
  showQuantity?: boolean | undefined;
  showAvailability?: boolean | undefined;
  specs?: Record<string, string> | undefined;
  attributes?: Record<string, string> | undefined;
}

function saveProductSubcategoryOnCategory(categorySlug: string, subcategory?: string): void {
  const label = subcategory?.trim();
  if (!label) return;

  const categories = getStoredCategories();
  const index = categories.findIndex((category) => category.slug === categorySlug);
  if (index === -1) return;

  const category = categories[index];
  if (!category || category.subcategories?.includes(label)) return;

  const updatedCategory: Category = {
    ...category,
    subcategories: [...(category.subcategories ?? []), label],
  };
  const updatedCategories = [...categories];
  updatedCategories[index] = updatedCategory;
  saveStoredCategories(updatedCategories);
  void updateCategoryApi(categorySlug, updatedCategory);
}

export function createProduct(input: CreateProductInput): Product {
  const current = getStoredProducts();
  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const slug = slugify(`${input.brand}-${input.name}-${input.sku}`);
  const fallbackImg = images.catComponents;
  const resolvedImages =
    input.images && input.images.length > 0
      ? input.images
      : input.image
        ? [input.image]
        : [fallbackImg];

  const newProduct: Product = {
    id,
    slug,
    name: input.name.trim(),
    sku: input.sku.trim().toUpperCase(),
    brand: input.brand.trim() || "Generic",
    model: input.model.trim() || "Standard",
    category: input.category,
    subcategory: input.subcategory || input.attributes?.Subcategory || undefined,
    priceCents: Math.round(Number(input.priceLKR) * 100),
    compareAtCents: input.compareAtLKR ? Math.round(Number(input.compareAtLKR) * 100) : undefined,
    stock: Math.max(0, Math.floor(Number(input.stock) || 0)),
    images: resolvedImages,
    description: input.description?.trim() || "High-quality electronics and repair part.",
    specs: input.specs ?? { Condition: "Brand New", Warranty: "Standard" },
    attributes: input.attributes ?? { Type: "Component" },
    featured: Boolean(input.featured),
    isNew: input.isNew !== undefined ? Boolean(input.isNew) : true,
    showPrice: input.showPrice !== undefined ? Boolean(input.showPrice) : true,
    showQuantity: input.showQuantity !== undefined ? Boolean(input.showQuantity) : true,
    showAvailability: input.showAvailability !== undefined ? Boolean(input.showAvailability) : true,
    createdAt: new Date().toISOString(),
  };

  const updated = [newProduct, ...current];
  saveStoredProducts(updated);
  saveProductSubcategoryOnCategory(newProduct.category, newProduct.subcategory);
  createProductApi({
    id: newProduct.id,
    slug: newProduct.slug,
    name: newProduct.name,
    sku: newProduct.sku,
    brand: newProduct.brand,
    model: newProduct.model,
    category: newProduct.category,
    subcategory: newProduct.subcategory,
    priceCents: newProduct.priceCents,
    compareAtCents: newProduct.compareAtCents,
    stock: newProduct.stock,
    images: newProduct.images,
    description: newProduct.description,
    specs: newProduct.specs,
    attributes: newProduct.attributes,
    featured: newProduct.featured,
    isNew: newProduct.isNew,
    showPrice: newProduct.showPrice,
    showQuantity: newProduct.showQuantity,
    showAvailability: newProduct.showAvailability,
  }).then((saved) => {
    if (saved) {
      console.log("Product saved to Supabase database:", saved.id);
    }
  });
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<CreateProductInput>): Product | null {
  const current = getStoredProducts();
  const idx = current.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const existing = current[idx];
  if (!existing) return null;

  const fallbackImg = images.catComponents;
  const updatedImages =
    updates.images !== undefined
      ? updates.images.length > 0
        ? updates.images
        : [fallbackImg]
      : updates.image
        ? [updates.image, ...(existing.images.slice(1) || [])]
        : existing.images;

  const updatedProduct: Product = {
    ...existing,
    id: existing.id,
    slug: existing.slug,
    name: updates.name ? updates.name.trim() : existing.name,
    sku: updates.sku ? updates.sku.trim().toUpperCase() : existing.sku,
    brand: updates.brand ? updates.brand.trim() : existing.brand,
    model: updates.model ? updates.model.trim() : existing.model,
    category: updates.category ? updates.category : existing.category,
    subcategory: updates.subcategory !== undefined ? updates.subcategory : existing.subcategory,
    priceCents:
      updates.priceLKR !== undefined
        ? Math.round(Number(updates.priceLKR) * 100)
        : existing.priceCents,
    compareAtCents:
      updates.compareAtLKR !== undefined
        ? updates.compareAtLKR
          ? Math.round(Number(updates.compareAtLKR) * 100)
          : undefined
        : existing.compareAtCents,
    stock:
      updates.stock !== undefined
        ? Math.max(0, Math.floor(Number(updates.stock) || 0))
        : existing.stock,
    description:
      updates.description !== undefined ? updates.description.trim() : existing.description,
    images: updatedImages,
    featured: updates.featured !== undefined ? updates.featured : existing.featured,
    isNew: updates.isNew !== undefined ? updates.isNew : existing.isNew,
    showPrice:
      updates.showPrice !== undefined ? Boolean(updates.showPrice) : existing.showPrice !== false,
    showQuantity:
      updates.showQuantity !== undefined
        ? Boolean(updates.showQuantity)
        : existing.showQuantity !== false,
    showAvailability:
      updates.showAvailability !== undefined
        ? Boolean(updates.showAvailability)
        : existing.showAvailability !== false,
    attributes: updates.attributes !== undefined ? updates.attributes : existing.attributes,
  };

  if (updates.name || updates.brand) {
    updatedProduct.slug = slugify(
      `${updatedProduct.brand}-${updatedProduct.name}-${updatedProduct.sku}`,
    );
  }

  const updatedList = [...current];
  updatedList[idx] = updatedProduct;
  saveStoredProducts(updatedList);
  saveProductSubcategoryOnCategory(updatedProduct.category, updatedProduct.subcategory);
  updateProductApi(id, {
    name: updatedProduct.name,
    sku: updatedProduct.sku,
    brand: updatedProduct.brand,
    model: updatedProduct.model,
    category: updatedProduct.category,
    subcategory: updatedProduct.subcategory,
    priceCents: updatedProduct.priceCents,
    compareAtCents: updatedProduct.compareAtCents,
    stock: updatedProduct.stock,
    description: updatedProduct.description,
    images: updatedProduct.images,
    featured: updatedProduct.featured,
    isNew: updatedProduct.isNew,
    showPrice: updatedProduct.showPrice,
    showQuantity: updatedProduct.showQuantity,
    showAvailability: updatedProduct.showAvailability,
    attributes: updatedProduct.attributes,
    slug: updatedProduct.slug,
  }).then((saved) => {
    if (saved) {
      console.log("Product successfully updated in Supabase:", saved.id);
    }
  });
  return updatedProduct;
}

export function deleteProduct(id: string): boolean {
  const current = getStoredProducts();
  const filtered = current.filter((p) => p.id !== id);
  if (filtered.length === current.length) return false;
  saveStoredProducts(filtered);
  void deleteProductApi(id);
  return true;
}

// â”€â”€â”€ Category CRUD Operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CreateCategoryInput {
  name: string;
  short?: string | undefined;
  slug?: string | undefined;
  filterKey?: string | undefined;
  image?: string | undefined;
  subcategories?: string[] | undefined;
}

export function createCategory(input: CreateCategoryInput): Category {
  const current = getStoredCategories();
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  const short = input.short?.trim() || input.name.trim();

  // If already exists, return existing
  const existing = current.find((c) => c.slug === slug);
  if (existing) return existing;

  const newCat: Category = {
    slug,
    name: input.name.trim(),
    short,
    image: input.image || images.catComponents,
    filterKey: input.filterKey?.trim() || "Type",
    subcategories: input.subcategories ?? [],
  };

  saveStoredCategories([...current, newCat]);
  void createCategoryApi(newCat);
  return newCat;
}

export function updateCategory(
  slug: string,
  updates: Partial<CreateCategoryInput>,
): Category | null {
  const current = getStoredCategories();
  const idx = current.findIndex((c) => c.slug === slug);
  if (idx === -1) return null;

  const existing = current[idx];
  if (!existing) return null;

  const updatedCat: Category = {
    ...existing,
    slug: existing.slug,
    name: updates.name ? updates.name.trim() : existing.name,
    short: updates.short ? updates.short.trim() : existing.short,
    filterKey: updates.filterKey ? updates.filterKey.trim() : existing.filterKey,
    image: updates.image ? updates.image : existing.image,
    subcategories: updates.subcategories ?? existing.subcategories ?? [],
  };

  const updatedList = [...current];
  updatedList[idx] = updatedCat;
  saveStoredCategories(updatedList);
  void updateCategoryApi(slug, updatedCat);
  return updatedCat;
}

export function deleteCategory(slug: string): boolean {
  const current = getStoredCategories();
  const filtered = current.filter((c) => c.slug !== slug);
  if (filtered.length === current.length) return false;
  saveStoredCategories(filtered);
  void deleteCategoryApi(slug);
  return true;
}

// â”€â”€â”€ 800+ SKU Bulk Generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function generate800SKUs(): { count: number; total: number } {
  const existing = getStoredProducts();
  const baseCategories = getStoredCategories();
  const categorySlugs = baseCategories.map((c) => c.slug);

  const sampleBrands = [
    "Nichicon",
    "Hakko",
    "Texas Instruments",
    "Espressif",
    "STMicroelectronics",
    "Microchip",
    "Vishay",
    "Samsung",
    "Sony",
    "Anker",
    "Philips",
    "Kester",
    "Weller",
    "TDK",
    "Yageo",
    "Murata",
    "Keyestudio",
    "Orange Electric",
    "TCL",
  ];

  const componentTemplates = [
    {
      prefix: "RES",
      type: "Passive parts",
      name: "Metal Film Resistor {val} 1/4W 1%",
      brand: "Yageo",
      priceRange: [15, 60] as const,
    },
    {
      prefix: "CAP-E",
      type: "Passive parts",
      name: "Electrolytic Capacitor {val} 50V Low-ESR",
      brand: "Nichicon",
      priceRange: [35, 180] as const,
    },
    {
      prefix: "CAP-C",
      type: "Passive parts",
      name: "Multilayer Ceramic Capacitor {val} 50V",
      brand: "TDK",
      priceRange: [20, 80] as const,
    },
    {
      prefix: "IND",
      type: "Passive parts",
      name: "Power Inductor SMD {val} Shielded",
      brand: "Murata",
      priceRange: [120, 450] as const,
    },
    {
      prefix: "DIO",
      type: "Discrete semiconductors",
      name: "Fast Recovery Diode {val}",
      brand: "Vishay",
      priceRange: [25, 90] as const,
    },
    {
      prefix: "MOS",
      type: "Discrete semiconductors",
      name: "N-Channel MOSFET {val} TO-220",
      brand: "STMicroelectronics",
      priceRange: [180, 520] as const,
    },
    {
      prefix: "BJT",
      type: "Discrete semiconductors",
      name: "NPN Bipolar Transistor {val} SOT-23",
      brand: "Texas Instruments",
      priceRange: [30, 110] as const,
    },
    {
      prefix: "IC-REG",
      type: "ICs",
      name: "Voltage Regulator {val} Linear LDO",
      brand: "Texas Instruments",
      priceRange: [90, 320] as const,
    },
    {
      prefix: "IC-OP",
      type: "ICs",
      name: "Dual Precision Op-Amp {val} SOIC-8",
      brand: "Texas Instruments",
      priceRange: [140, 480] as const,
    },
    {
      prefix: "MCU",
      type: "Dev boards",
      name: "Microcontroller Board {val}",
      brand: "Espressif",
      priceRange: [950, 4200] as const,
    },
    {
      prefix: "SEN",
      type: "Sensors",
      name: "Precision Sensor Module {val}",
      brand: "Keyestudio",
      priceRange: [450, 2200] as const,
    },
    {
      prefix: "REL",
      type: "Relays",
      name: "Miniature Power Relay 12V DC {val}",
      brand: "Omron",
      priceRange: [280, 850] as const,
    },
    {
      prefix: "CON-HDR",
      type: "Connectors",
      name: "Pin Header Strip 2.54mm {val}",
      brand: "Generic",
      priceRange: [60, 210] as const,
    },
    {
      prefix: "CON-TRM",
      type: "Connectors",
      name: "Screw Terminal Block {val} 5.08mm",
      brand: "Generic",
      priceRange: [90, 260] as const,
    },
    {
      prefix: "FUS",
      type: "Protection",
      name: "Slow-Blow Glass Fuse {val} 250V",
      brand: "Bussmann",
      priceRange: [40, 120] as const,
    },
    {
      prefix: "TOOL-TIP",
      type: "Tools",
      name: "Soldering Tip 900M Series {val}",
      brand: "Hakko",
      priceRange: [450, 1400] as const,
    },
    {
      prefix: "TOOL-WR",
      type: "Tools",
      name: "High-Purity Solder Wire Spool {val}",
      brand: "Kester",
      priceRange: [1200, 4500] as const,
    },
    {
      prefix: "LED-5MM",
      type: "Lighting",
      name: "Diffused High-Brightness LED 5mm {val}",
      brand: "Orange Electric",
      priceRange: [20, 50] as const,
    },
    {
      prefix: "LED-MOD",
      type: "Lighting",
      name: "Constant Current LED Driver {val}",
      brand: "Philips",
      priceRange: [1450, 3800] as const,
    },
    {
      prefix: "MOB-FLX",
      type: "Mobile Parts",
      name: "Charging Port Flex Replacement {val}",
      brand: "OEM Grade",
      priceRange: [1200, 4900] as const,
    },
    {
      prefix: "MOB-SCR",
      type: "Mobile Parts",
      name: "Replacement Touch Digitizer {val}",
      brand: "OEM Grade",
      priceRange: [3800, 18500] as const,
    },
    {
      prefix: "BAT-LI",
      type: "Power",
      name: "High-Drain 18650 Li-Ion Cell {val}",
      brand: "Samsung",
      priceRange: [1100, 2400] as const,
    },
  ];

  const valueVariations = [
    "10 Ohm",
    "100 Ohm",
    "470 Ohm",
    "1K Ohm",
    "4.7K Ohm",
    "10K Ohm",
    "47K Ohm",
    "100K Ohm",
    "1M Ohm",
    "10pF",
    "100pF",
    "1nF",
    "10nF",
    "100nF",
    "1uF",
    "10uF",
    "47uF",
    "100uF",
    "470uF",
    "1000uF",
    "1uH",
    "4.7uH",
    "10uH",
    "47uH",
    "100uH",
    "1N4007 1A",
    "1N4148 100V",
    "1N5819 Schottky",
    "2N2222A",
    "BC547B",
    "BC557B",
    "IRFZ44N 55V",
    "IRF3205 110A",
    "IRF540N",
    "LM317T Adj",
    "7805 5V",
    "7812 12V",
    "AMS1117-3.3V",
    "AMS1117-5.0V",
    "LM358 Dual",
    "LM393 Comparator",
    "NE555 Timer",
    "TL072 Low-Noise",
    "ESP32-WROOM-32D",
    "ESP8266 NodeMCU",
    "ATmega328P DIP-28",
    "STM32F103C8T6 BluePill",
    "DHT22 Temp/Humidity",
    "BMP280 Barometric",
    "HC-SR04 Ultrasonic",
    "MQ-2 Gas Detector",
    "5V 1-Channel",
    "12V 2-Channel",
    "5V 4-Channel",
    "Solid State 2A",
    "40-Pin Straight",
    "40-Pin Right Angle",
    "2x20 Dual Row",
    "JST-XH 4-Pin",
    "2-Pin PCB",
    "3-Pin PCB",
    "4-Pin PCB",
    "Barrier Strip 6P",
    "0.5A 5x20mm",
    "1A 5x20mm",
    "2A 5x20mm",
    "5A 5x20mm",
    "10A 5x20mm",
    "900M-T-B Conical",
    "900M-T-K Knife",
    "900M-T-2.4D Chisel",
    "900M-T-I Fine Needle",
    "Sn63/Pb37 0.8mm 100g",
    "Sn60/Pb40 1.0mm 200g",
    "Lead-Free Sn99 0.8mm",
    "Red Pack of 20",
    "Green Pack of 20",
    "Blue Pack of 20",
    "Warm White Pack of 20",
    "12V 3A 36W",
    "24V 2.5A 60W",
    "12V 5A 60W Ultra-Slim",
    "iPhone 11 Series",
    "iPhone 12 / 12 Pro",
    "iPhone 13 Series",
    "Galaxy S20 FE",
    "Galaxy A32 4G",
    "Redmi Note 10",
    "2500mAh 20A",
    "3000mAh 15A",
    "3500mAh 10A High-Capacity",
  ];

  const generated: Product[] = [];
  const targetTotal = 850;
  const needed = Math.max(0, targetTotal - existing.length);

  let seq = existing.length + 1;

  for (let i = 0; i < needed; i++) {
    const tpl = componentTemplates[i % componentTemplates.length] ?? componentTemplates[0]!;
    const val = valueVariations[i % valueVariations.length] ?? "Standard";
    const num = 1000 + seq;
    const sku = `AE-${tpl.prefix}-${num}`;
    const name = tpl.name.replace("{val}", val);
    let catSlug = "electronic-components";
    if (tpl.type === "Lighting") catSlug = "lighting";
    else if (tpl.type === "Power") catSlug = "power-solar-batteries";
    else if (tpl.type === "Mobile Parts") catSlug = "mobile";
    else if (tpl.type === "Tools") catSlug = "tools-installation";
    const category = categorySlugs.includes(catSlug)
      ? catSlug
      : (categorySlugs[0] ?? "electronic-components");

    const minPrice = tpl.priceRange[0];
    const maxPrice = tpl.priceRange[1];
    const priceLKR = Math.round(minPrice + (i % 7) * ((maxPrice - minPrice) / 6));

    // Realistic stock distributions (plenty of stock, some low, some out of stock)
    let stock = 15 + (i % 65);
    if (i % 17 === 0)
      stock = 0; // out of stock
    else if (i % 9 === 0) stock = Math.min(5, 1 + (i % 5)); // low stock

    const hasDiscount = i % 5 === 0;
    const compareLKR = hasDiscount ? Math.round(priceLKR * 1.15) : undefined;

    const catImgMap: Record<string, string> = {
      components: images.catComponents,
      audio: images.catAudio,
      lighting: images.catLighting,
      mobile: images.catMobile,
      tv: images.catTv,
    };
    const prodImg = catImgMap[category] || images.catComponents;

    generated.push({
      id: `p_${seq}_${Math.random().toString(36).slice(2, 6)}`,
      slug: slugify(`${brand}-${name}-${sku}`),
      name,
      sku,
      brand,
      model: `${tpl.prefix}-${val.split(" ")[0]}`,
      category,
      priceCents: priceLKR * 100,
      compareAtCents: compareLKR ? compareLKR * 100 : undefined,
      stock,
      images: [prodImg],
      description: `Industrial and repair grade ${name.toLowerCase()}. Certified genuine component for electronic repair and manufacturing.`,
      specs: {
        "Part Type": tpl.type,
        Specification: val,
        Standard: "RoHS Compliant",
        Condition: "New Factory Sealed",
      },
      attributes: {
        Type: tpl.type,
      },
      featured: i % 14 === 0,
      isNew: i % 8 === 0,
      createdAt: new Date(Date.now() - (i % 90) * 86400000).toISOString(),
    });

    seq++;
  }

  const combined = [...existing, ...generated];
  saveStoredProducts(combined);
  return { count: generated.length, total: combined.length };
}

export function resetCatalogToDefault(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PRODUCTS_STORAGE_KEY);
  localStorage.removeItem(CATEGORIES_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CATALOG_UPDATED_EVENT));
}

export async function clearAllProducts(): Promise<void> {
  saveStoredProducts([]);
  await clearAllProductsApi();
  window.dispatchEvent(new CustomEvent(CATALOG_UPDATED_EVENT));
}

// â”€â”€â”€ Query & List Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listProducts(query: ProductQuery = {}): Promise<ProductPage> {
  await delay(60);
  const {
    q,
    category,
    subcategory,
    brands: bs,
    min,
    max,
    inStock,
    attr,
    sort = "featured",
    page = 1,
    pageSize = 8,
  } = query;
  let items = getStoredProducts().slice();

  if (q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    items = items.filter((p) => {
      const hay =
        `${p.name} ${p.sku} ${p.brand} ${p.model} ${(p.compatibility ?? []).join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  if (category) items = items.filter((p) => p.category === category);
  if (subcategory) {
    items = items.filter((p) => (p.subcategory || p.attributes["Subcategory"]) === subcategory);
  }
  if (bs?.length) items = items.filter((p) => bs.includes(p.brand));
  if (min != null) items = items.filter((p) => p.priceCents >= min * 100);
  if (max != null) items = items.filter((p) => p.priceCents <= max * 100);
  if (inStock) items = items.filter((p) => p.stock > 0);

  if (attr && category) {
    const key = getStoredCategories().find((c) => c.slug === category)?.filterKey;
    if (key) items = items.filter((p) => p.attributes[key] === attr);
  }

  const sorters: Record<string, (a: (typeof items)[number], b: (typeof items)[number]) => number> =
    {
      featured: (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
      "price-asc": (a, b) => a.priceCents - b.priceCents,
      "price-desc": (a, b) => b.priceCents - a.priceCents,
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      name: (a, b) => a.name.localeCompare(b.name),
    };
  items.sort(sorters[sort] ?? sorters.featured);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pages);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    total,
    page: safePage,
    pages,
  };
}

export async function getProduct(slug: string): Promise<Product | null> {
  const normalized = (slug || "").trim();
  if (!normalized) return null;

  // 1. Check local cached products first
  const local = getStoredProducts().find(
    (p) =>
      p.slug === normalized ||
      p.id === normalized ||
      p.sku.toLowerCase() === normalized.toLowerCase(),
  );

  // 2. Fetch fresh product data from backend API
  try {
    const apiProduct = await fetchProductApi(normalized);
    if (apiProduct) {
      const sanitized: Product = {
        ...apiProduct,
        images:
          Array.isArray(apiProduct.images) && apiProduct.images.length > 0
            ? apiProduct.images.map((img) => sanitizeAssetPath(img))
            : ["/assets/imgs/electronic-components.png"],
      };

      if (typeof window !== "undefined") {
        try {
          const current = getStoredProducts();
          const idx = current.findIndex(
            (p) => p.id === sanitized.id || p.slug === sanitized.slug,
          );
          if (idx >= 0) {
            current[idx] = sanitized;
          } else {
            current.unshift(sanitized);
          }
          saveStoredProducts(current);
        } catch {
          // ignore localStorage write errors
        }
      }

      return sanitized;
    }
  } catch (err) {
    console.warn("fetchProductApi failed in getProduct:", err);
  }

  // 3. Fall back to local product if API was unreachable or returned 404
  return local ?? null;
}

export async function getRelated(slug: string): Promise<Product[]> {
  await delay(50);
  const products = getStoredProducts();
  let p = products.find(
    (x) =>
      x.slug === slug ||
      x.id === slug ||
      x.sku.toLowerCase() === slug.toLowerCase(),
  );

  if (!p) {
    try {
      p = (await getProduct(slug)) ?? undefined;
    } catch {
      // ignore
    }
  }

  if (!p) return [];

  const pool = products;
  return pool
    .filter((x) => x.category === p.category && x.slug !== p.slug && x.id !== p.id)
    .slice(0, 4);
}

export function attributeOptions(category: string) {
  const cats = getStoredCategories();
  const prods = getStoredProducts();
  const cat = cats.find((c) => c.slug === category);
  if (!cat) return { key: null as string | null, options: [] as string[] };
  const opts = Array.from(
    new Set(
      prods
        .filter((p) => p.category === category)
        .map((p) => p.attributes[cat.filterKey])
        .filter(Boolean),
    ),
  );
  return { key: cat.filterKey, options: opts.sort() };
}

// â”€â”€â”€ React Hook for Live Catalog Updates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [brands, setBrands] = useState<string[]>(() => getStoredBrands());
  const [brandLogos, setBrandLogos] = useState<Record<string, string>>(() => getStoredBrandLogos());

  useEffect(() => {
    const handleUpdate = () => {
      setProducts(getStoredProducts());
      setCategories(getStoredCategories());
      setBrands(getStoredBrands());
      setBrandLogos(getStoredBrandLogos());
    };

    window.addEventListener(CATALOG_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    // sync on mount
    handleUpdate();
    void syncCatalogWithBackend().then(() => {
      handleUpdate();
    });

    return () => {
      window.removeEventListener(CATALOG_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return {
    products,
    categories,
    brands,
    brandLogos,
    saveBrandLogo,
    deleteBrandLogo,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    generate800SKUs,
    resetCatalogToDefault,
    clearAllProducts,
  };
}

export { defaultBrands as brands, defaultCategories as categories, defaultProducts as products };

export const productsQuery = (q: ProductQuery) =>
  queryOptions({ queryKey: ["products", q], queryFn: () => listProducts(q) });
export const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProduct(slug) });
export const relatedQuery = (slug: string) =>
  queryOptions({ queryKey: ["related", slug], queryFn: () => getRelated(slug) });
