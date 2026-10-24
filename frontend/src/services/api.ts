import type { Product, Category, Brand } from "@/lib/types";
import { toast } from "sonner";

export function getApiBaseUrl(): string {
  // 1. Client-side browser runtime: use same origin /api on Vercel to prevent cross-origin CORS errors
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

    if (hostname.endsWith(".vercel.app")) {
      return `${origin}/api`;
    }

    if (!isLocalhost) {
      // Local IP (e.g. testing mobile on Wi-Fi at 192.168.x.x)
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
        return `http://${hostname}:5000/api`;
      }
      return `${origin}/api`;
    }
  }

  // 2. Explicitly configured VITE_API_URL (used for local development or custom setups)
  const envUrl = (
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    (typeof process !== "undefined" && process.env?.VITE_API_URL) ||
    ""
  ).trim();
  if (envUrl) return envUrl;

  // 3. Server-side SSR runtime on Vercel: automatically resolve host from Vercel system env vars
  if (typeof process !== "undefined" && process.env) {
    const vercelHost =
      process.env.VERCEL_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (vercelHost) {
      const cleanHost = vercelHost.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      return `https://${cleanHost}/api`;
    }
  }

  return "http://localhost:5000/api";
}

const API_BASE = getApiBaseUrl();
const AUTH_TOKEN_KEY = "ae_auth_token_v1";

function authHeaders(includeContentType = true): HeadersInit {
  const token = typeof window === "undefined" ? null : localStorage.getItem(AUTH_TOKEN_KEY);
  return {
    ...(includeContentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ApiOrder {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  totalLKR: number;
  status:
    "Quotation Requested" | "Quotation Sent" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  items: Array<{
    sku: string;
    name: string;
    qty: number;
    priceLKR: number;
  }>;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiAnalytics {
  totalRevenueLKR: number;
  totalOrders: number;
  completedOrders: number;
  processingOrders: number;
  activeProducts: number;
  inStockProducts: number;
  lowStockAlerts: number;
  categoryBreakdown: Array<{
    category: string;
    slug: string;
    productCount: number;
    estimatedRevenueLKR: number;
  }>;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Products API ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

export async function fetchProductsApi(params?: {
  search?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; total: number; pages: number } | null> {
  try {
    const base = getApiBaseUrl();
    const fallbackOrigin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
    const fullPath =
      base.startsWith("http://") || base.startsWith("https://")
        ? `${base}/products`
        : `${fallbackOrigin}${base.startsWith("/") ? "" : "/"}${base}/products`;
    const url = new URL(fullPath);
    if (params) {
      if (params.search) url.searchParams.set("search", params.search);
      if (params.category && params.category !== "all")
        url.searchParams.set("category", params.category);
      if (params.subcategory) url.searchParams.set("subcategory", params.subcategory);
      if (params.brand && params.brand !== "all") url.searchParams.set("brand", params.brand);
      if (params.minPrice != null) url.searchParams.set("minPrice", String(params.minPrice));
      if (params.maxPrice != null) url.searchParams.set("maxPrice", String(params.maxPrice));
      if (params.inStock) url.searchParams.set("inStock", "true");
      if (params.sort) url.searchParams.set("sort", params.sort);
      if (params.page) url.searchParams.set("page", String(params.page));
      if (params.limit) url.searchParams.set("limit", String(params.limit));
    }

    const res = await fetch(url.toString(), {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      products: json.data || [],
      total: json.pagination?.total || (json.data || []).length,
      pages: json.pagination?.pages || 1,
    };
  } catch (err) {
    console.warn("Backend API fetchProducts error (will use fallback):", err);
    return null;
  }
}

export async function fetchProductApi(identifier: string): Promise<Product | null> {
  try {
    const base = getApiBaseUrl();
    const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
    const prefix = base.startsWith("http://") || base.startsWith("https://") ? base : `${fallbackOrigin}${base.startsWith("/") ? "" : "/"}${base}`;
    const res = await fetch(`${prefix}/products/${encodeURIComponent(identifier)}`, { headers: authHeaders(false) });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("Backend API fetchProduct error:", err);
    return null;
  }
}
export async function createProductApi(
  data: Partial<Product> & { priceLKR?: number },
): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        ...data,
        priceLKR: data.priceLKR ?? (data.priceCents ? data.priceCents / 100 : 0),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || `Failed to save product to database (${res.status})`;
      console.error("Backend API createProduct error:", res.status, err);
      toast.error(msg);
      return null;
    }
    const json = await res.json();
    return json.data || null;
  } catch (err: unknown) {
    console.warn("Backend API createProduct network error:", err);
    toast.error("Network error: Could not reach backend server to save product");
    return null;
  }
}

export async function updateProductApi(
  id: string,
  updates: Partial<Product> & { priceLKR?: number },
): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || `Failed to update product in database (${res.status})`;
      console.error("Backend API updateProduct error:", res.status, err);
      toast.error(msg);
      return null;
    }
    const json = await res.json();
    return json.data || null;
  } catch (err: unknown) {
    console.warn("Backend API updateProduct network error:", err);
    toast.error("Network error: Could not reach backend server to update product");
    return null;
  }
}

export async function deleteProductApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(false),
    });
    return res.ok;
  } catch (err) {
    console.warn("Backend API deleteProduct error:", err);
    return false;
  }
}

export async function clearAllProductsApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/products/clear-all`, {
      method: "DELETE",
      headers: authHeaders(false),
    });
    return res.ok;
  } catch (err) {
    console.warn("Backend API clearAllProducts error:", err);
    return false;
  }
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Categories API ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

export async function fetchCategoriesApi(): Promise<Category[] | null> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("Backend API fetchCategories error:", err);
    return null;
  }
}

export async function createCategoryApi(category: Partial<Category>): Promise<Category | null> {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(category),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("Backend API createCategory error:", err);
    return null;
  }
}

export async function updateCategoryApi(
  slug: string,
  updates: Partial<Category>,
): Promise<Category | null> {
  try {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(slug)}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("Backend API updateCategory error:", err);
    return null;
  }
}

export async function deleteCategoryApi(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      headers: authHeaders(false),
    });
    return res.ok;
  } catch (err) {
    console.warn("Backend API deleteCategory error:", err);
    return false;
  }
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Brands API ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

export async function fetchBrandsApi(): Promise<Brand[] | null> {
  try {
    const res = await fetch(`${API_BASE}/brands`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("Backend API fetchBrands error:", err);
    return null;
  }
}

export async function upsertBrandApi(input: {
  name: string;
  imageUrl?: string;
  imageData?: string;
  removeImage?: boolean;
}): Promise<Brand | null> {
  try {
    const res = await fetch(`${API_BASE}/brands`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Failed to save brand (HTTP ${res.status})`);
    return json.data || null;
  } catch (err) {
    console.warn("Backend API upsertBrand error:", err);
    throw err;
  }
}

export async function deleteBrandApi(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/brands/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      headers: authHeaders(false),
    });
    return res.ok;
  } catch (err) {
    console.warn("Backend API deleteBrand error:", err);
    return false;
  }
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Orders API ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

export async function fetchOrdersApi(scope: "all" | "mine" = "all"): Promise<ApiOrder[] | null> {
  try {
    const path = scope === "mine" ? "/orders/mine" : "/orders";
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders(false) });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("Backend API fetchOrders error:", err);
    return null;
  }
}

export async function createOrderApi(order: {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  items: Array<{ sku: string; name: string; qty: number; priceLKR: number }>;
}): Promise<ApiOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(order),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("Backend API createOrder error:", err);
    throw err; // re-throw so the caller can handle failures
  }
}

export async function fetchOrderStatusApi(id: string): Promise<ApiOrder["status"] | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/status`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.status || null;
  } catch (err) {
    console.warn("Backend API fetchOrderStatus error:", err);
    return null;
  }
}
export interface OrderStatusUpdateResult {
  order: ApiOrder | null;
  emailSent: boolean;
  emailReason?: string;
}

export async function updateOrderStatusApi(
  id: string,
  status: string,
): Promise<OrderStatusUpdateResult | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      order: json.data || null,
      emailSent: Boolean(json.notification?.sent),
      emailReason: json.notification?.reason,
    };
  } catch (err) {
    console.warn("Backend API updateOrderStatus error:", err);
    return null;
  }
}

export async function updateOrderDetailsApi(
  id: string,
  details: {
    customerName?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    notes?: string;
  },
): Promise<{ success: boolean; data?: ApiOrder; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(details),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json.error || `Failed to update order (HTTP ${res.status})` };
    }
    return { success: true, data: json.data };
  } catch (err: unknown) {
    console.warn("Backend API updateOrderDetails error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Analytics API ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

export async function fetchAnalyticsApi(): Promise<ApiAnalytics | null> {
  try {
    const res = await fetch(`${API_BASE}/analytics`, { headers: authHeaders(false) });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("Backend API fetchAnalytics error:", err);
    return null;
  }
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Settings API ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

export interface ApiSettings {
  id?: string;
  storeName: string;
  whatsappNumber: string;
  officeEmail: string;
  phone: string;
  currency: string;
  taxRate: string;
  address: string;
  notifications: {
    newOrders: boolean;
    lowStock: boolean;
    weeklyReport: boolean;
  };
  updatedAt?: string;
}

export const DEFAULT_SETTINGS: ApiSettings = {
  storeName: "Asiaelectronics",
  whatsappNumber: "+94 74 106 6017",
  officeEmail: "aecpvt60@gmail.com",
  phone: "+94 74 106 6017",
  currency: "LKR (Rs.)",
  taxRate: "0%",
  address: "60 1st Cross St, Colombo 01100, Sri Lanka",
  notifications: {
    newOrders: true,
    lowStock: true,
    weeklyReport: false,
  },
};

export async function fetchSettingsApi(): Promise<ApiSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) return DEFAULT_SETTINGS;
    const json = await res.json();
    return json.data || DEFAULT_SETTINGS;
  } catch (err) {
    console.warn("Backend API fetchSettings error (using default):", err);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettingsApi(
  settings: Partial<ApiSettings>,
): Promise<ApiSettings | null> {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("Backend API updateSettings error:", err);
    return null;
  }
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Authentication API (Supabase Auth) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer";
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  token?: string | null;
  refreshToken?: string | null;
  message?: string;
  error?: string;
}

export async function loginApi(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(credentials),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to sign in");
    }
    return json;
  } catch (err: unknown) {
    console.error("loginApi error:", err);
    throw err;
  }
}

export async function registerApi(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to create account");
    }
    return json;
  } catch (err: unknown) {
    console.error("registerApi error:", err);
    throw err;
  }
}

export async function fetchCurrentUserApi(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.user || null;
  } catch (err) {
    return null;
  }
}

export async function logoutApi(token?: string | null): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    console.warn("logoutApi error:", err);
  }
}

export async function updateAdminCredentialsApi(
  token: string,
  payload: { currentPassword: string; newEmail?: string; newPassword?: string },
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/admin/credentials`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to update admin credentials");
  }
  return json;
}

export async function adjustInventoryApi(id: string, payload: { mode: "add" | "remove" | "set"; quantity: number; reason: string; reference?: string }): Promise<{ newQuantity: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}/adjust-inventory`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Unable to adjust stock");
    return json.data || null;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Unable to adjust stock");
    return null;
  }
}

export async function fetchInventoryHistoryApi(id: string): Promise<Array<{ id: number; quantity_change: number; previous_quantity: number; new_quantity: number; reason: string; reference?: string; created_at: string }> | null> {
  try { const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}/inventory-history`, { headers: authHeaders(false) }); if (!res.ok) return null; const json = await res.json(); return json.data || []; } catch { return null; }
}
