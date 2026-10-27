export type CategorySlug = string;

export interface Category {
  slug: CategorySlug;
  name: string;
  short: string;
  image: string;
  /** Category-specific attribute exposed as an extra filter */
  filterKey: string;
  /** Managed subcategory labels for this category. */
  subcategories?: string[] | undefined;
}

export interface Brand {
  slug: string;
  name: string;
  imageUrl: string;
  imagePath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Variant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  brand: string;
  model: string;
  category: CategorySlug;
  subcategory?: string | undefined;
  /** Price in LKR cents (integer minor units) */
  priceCents: number;
  compareAtCents?: number | undefined;
  stock: number;
  images: string[];
  /** Original unwatermarked images for external feeds/channels */
  originalImages?: string[] | undefined;
  description: string;
  specs: Record<string, string>;
  attributes: Record<string, string>;
  compatibility?: string[] | undefined;
  variants?: Variant[] | undefined;
  isNew?: boolean | undefined;
  featured?: boolean | undefined;
  /** Visibility controls (independent) */
  showPrice?: boolean | undefined;
  showQuantity?: boolean | undefined;
  showAvailability?: boolean | undefined;
  createdAt: string;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "name";

export interface ProductQuery {
  q?: string | undefined;
  category?: CategorySlug | undefined;
  subcategory?: string | undefined;
  brands?: string[] | undefined;
  min?: number | undefined;
  max?: number | undefined;
  inStock?: boolean | undefined;
  attr?: string | undefined;
  sort?: SortKey | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}
