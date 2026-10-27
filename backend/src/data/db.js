import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "./supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = process.env.VERCEL
  ? path.join("/tmp", "settings.json")
  : path.join(__dirname, "../../data/settings.json");

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Column mapping helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// JS camelCase Ã¢â€ â€ Postgres snake_case
function toDbProduct(p) {
  const showPrice = p.showPrice !== false;
  const showQuantity = p.showQuantity !== false;
  const showAvailability = p.showAvailability !== false;
  const attributes = {
    ...(p.attributes || {}),
    visibility: { showPrice, showQuantity, showAvailability },
  };

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    brand: p.brand,
    model: p.model,
    category: p.category,
    subcategory: p.subcategory || p.attributes?.Subcategory || null,
    price_cents: p.priceCents,
    compare_at_cents: p.compareAtCents ?? null,
    stock: p.stock,
    images: p.images,
    description: p.description,
    specs: p.specs,
    attributes: {
      ...attributes,
      originalImages: p.originalImages || p.attributes?.originalImages || undefined,
    },
    featured: p.featured,
    is_new: p.isNew,
    created_at: p.createdAt,
    updated_at: p.updatedAt ?? null,
  };
}

function fromDbProduct(row) {
  const attrs = row.attributes || {};
  const vis = attrs.visibility || {};

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    brand: row.brand,
    model: row.model,
    category: row.category,
    subcategory: row.subcategory || row.attributes?.Subcategory || undefined,
    priceCents: row.price_cents,
    compareAtCents: row.compare_at_cents ?? undefined,
    stock: row.stock,
    images: row.images,
    originalImages: attrs.originalImages || undefined,
    description: row.description,
    specs: row.specs,
    attributes: row.attributes,
    featured: row.featured,
    isNew: row.is_new,
    showPrice:
      row.show_price !== undefined && row.show_price !== null
        ? row.show_price
        : vis.showPrice !== undefined
          ? vis.showPrice
          : true,
    showQuantity:
      row.show_quantity !== undefined && row.show_quantity !== null
        ? row.show_quantity
        : vis.showQuantity !== undefined
          ? vis.showQuantity
          : true,
    showAvailability:
      row.show_availability !== undefined && row.show_availability !== null
        ? row.show_availability
        : vis.showAvailability !== undefined
          ? vis.showAvailability
          : true,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function toDbCategory(c) {
  return {
    slug: c.slug,
    name: c.name,
    short: c.short,
    image: c.image,
    filter_key: c.filterKey,
    subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
  };
}

function fromDbCategory(row) {
  return {
    slug: row.slug,
    name: row.name,
    short: row.short,
    image: row.image,
    filterKey: row.filter_key,
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
  };
}

async function replaceCategorySubcategories(categorySlug, subcategories) {
  const names = [...new Set((subcategories || []).map((item) => String(item).trim()).filter(Boolean))];
  const { error: deleteError } = await supabase.from("subcategories").delete().eq("category_slug", categorySlug);
  if (deleteError) throw new Error(deleteError.message);
  if (names.length === 0) return [];
  const { error: insertError } = await supabase
    .from("subcategories")
    .insert(names.map((name) => ({ category_slug: categorySlug, name })));
  if (insertError) throw new Error(insertError.message);
  return names;
}
function toDbBrand(brand) {
  return {
    slug: brand.slug,
    name: brand.name,
    image_url: brand.imageUrl || "",
    image_path: brand.imagePath || "",
    updated_at: new Date().toISOString(),
  };
}

function fromDbBrand(row) {
  return {
    slug: row.slug,
    name: row.name,
    imageUrl: row.image_url || "",
    imagePath: row.image_path || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbOrder(o) {
  return {
    id: o.id,
    customer_name: o.customerName,
    email: o.email,
    phone: o.phone,
    address: o.address ?? "",
    city: o.city ?? "",
    total_lkr: o.totalLKR,
    status: o.status,
    items: o.items,
    notes: o.notes ?? "",
    created_at: o.createdAt,
    updated_at: o.updatedAt ?? null,
  };
}

function fromDbOrder(row) {
  let items = row.items;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  if (!Array.isArray(items)) {
    items = [];
  }

  return {
    id: row.id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    address: row.address ?? "",
    city: row.city ?? "",
    totalLKR: row.total_lkr,
    status: row.status,
    items,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Default starter categories Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const defaultCategories = [
  // Active categories (10)
  {
    slug: "lighting",
    name: "Lighting",
    short: "Lighting",
    image: "/assets/imgs/lighting.png",
    filterKey: "Sub-type",
  },
  {
    slug: "home-appliances",
    name: "Home Appliances",
    short: "Home Appliances",
    image: "/assets/imgs/home-appliances.png",
    filterKey: "Type",
  },
  {
    slug: "kitchen-appliances",
    name: "Kitchen Appliances",
    short: "Kitchen Appliances",
    image: "/assets/imgs/kitchen-appliances.png",
    filterKey: "Type",
  },
  {
    slug: "appliance-spare-parts",
    name: "Appliance Spare Parts",
    short: "Spare Parts",
    image: "/assets/imgs/appliance-spare-parts.png",
    filterKey: "Compatible with",
  },
  {
    slug: "electronic-components",
    name: "Electronic Components",
    short: "Components",
    image: "/assets/imgs/electronic-components.png",
    filterKey: "Type",
  },
  {
    slug: "power-solar-batteries",
    name: "Power, Solar & Batteries",
    short: "Power & Solar",
    image: "/assets/imgs/power-solar-batteries.png",
    filterKey: "Type",
  },
  {
    slug: "audio",
    name: "Audio & Music",
    short: "Audio & Music",
    image: "/assets/imgs/audio-music.png",
    filterKey: "Type",
  },
  {
    slug: "mobile",
    name: "Mobile Parts & Accessories",
    short: "Mobile Parts",
    image: "/assets/imgs/mobile-parts-accessories.png",
    filterKey: "Compatible with",
  },
  {
    slug: "tools-installation",
    name: "Tools & Installation Supplies",
    short: "Tools & Supplies",
    image: "/assets/imgs/tools-installation-supplies.png",
    filterKey: "Type",
  },
  {
    slug: "laboratory-equipment",
    name: "Laboratory Equipment",
    short: "Lab Equipment",
    image: "/assets/imgs/laboratory-equipment.png",
    filterKey: "Type",
  },
  // Inactive / pending admin classification (3)
  {
    slug: "name-boards",
    name: "Name Boards",
    short: "Name Boards",
    image: "/assets/imgs/name-boards.png",
    filterKey: "Type",
  },
  {
    slug: "magnet-bars",
    name: "Magnet Bars",
    short: "Magnet Bars",
    image: "/assets/imgs/magnet-bars.png",
    filterKey: "Type",
  },
  {
    slug: "equipment",
    name: "Equipment",
    short: "Equipment",
    image: "/assets/imgs/other-equipment.png",
    filterKey: "Type",
  },
];

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Seed generator for 850 realistic electronics SKUs Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export function generate850Products() {
  const subcats = [
    {
      prefix: "RES",
      cat: "electronic-components",
      type: "Resistor",
      count: 120,
      brand: "Vishay",
      priceRange: [15, 60],
    },
    {
      prefix: "CAP",
      cat: "electronic-components",
      type: "Capacitor",
      count: 120,
      brand: "Nichicon",
      priceRange: [25, 350],
    },
    {
      prefix: "DIO",
      cat: "electronic-components",
      type: "Diode",
      count: 60,
      brand: "Vishay",
      priceRange: [20, 180],
    },
    {
      prefix: "TRN",
      cat: "electronic-components",
      type: "Transistor",
      count: 70,
      brand: "STMicroelectronics",
      priceRange: [50, 450],
    },
    {
      prefix: "IC",
      cat: "electronic-components",
      type: "Integrated Circuit",
      count: 90,
      brand: "Texas Instruments",
      priceRange: [180, 2400],
    },
    {
      prefix: "REG",
      cat: "electronic-components",
      type: "Voltage Regulator",
      count: 50,
      brand: "STMicroelectronics",
      priceRange: [90, 650],
    },
    {
      prefix: "MCU",
      cat: "electronic-components",
      type: "Microcontroller Board",
      count: 40,
      brand: "Keyestudio",
      priceRange: [1200, 8500],
    },
    {
      prefix: "AUD",
      cat: "audio",
      type: "Audio Cable & Driver",
      count: 70,
      brand: "JBL",
      priceRange: [650, 42000],
    },
    {
      prefix: "LGT",
      cat: "lighting",
      type: "LED Strip & Driver",
      count: 80,
      brand: "Philips",
      priceRange: [350, 14500],
    },
    {
      prefix: "MOB",
      cat: "mobile",
      type: "Phone Screen & Cable",
      count: 90,
      brand: "OEM Grade",
      priceRange: [450, 28000],
    },
    {
      prefix: "TV",
      cat: "home-appliances",
      type: "TV Board & Backlight",
      count: 60,
      brand: "Samsung",
      priceRange: [1200, 185000],
    },
  ];

  const prods = [];
  let idCounter = 1;

  for (const group of subcats) {
    for (let i = 1; i <= group.count; i++) {
      const sku = `AE-${group.prefix}-${String(i).padStart(3, "0")}`;
      const name = `${group.type} ${group.prefix}-${i * 10} Series (Grade A)`;
      const priceLKR = Math.round(
        group.priceRange[0] +
          Math.random() * (group.priceRange[1] - group.priceRange[0]),
      );
      const compareLKR =
        Math.random() > 0.4 ? Math.round(priceLKR * 1.15) : undefined;
      const stock = Math.floor(Math.random() * 85);

      prods.push({
        id: `prod_${idCounter++}`,
        slug: `ae-${group.prefix.toLowerCase()}-${i}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name,
        sku,
        brand: group.brand,
        model: `${group.prefix}-${i * 10}`,
        category: group.cat,
        priceCents: priceLKR * 100,
        compareAtCents: compareLKR ? compareLKR * 100 : undefined,
        stock,
        images: ["/assets/imgs/electronic-components.png"],
        description: `Industrial grade ${group.type.toLowerCase()} engineered for electronics repair, manufacturing, and maintenance. Tested and quality-assured by Asia Electronics.`,
        specs: {
          Standard: "RoHS Compliant",
          Tolerance: "Ã‚Â±1% / Grade A",
          "SKU Code": sku,
          "Operating Range": "-40Ã‚Â°C to +85Ã‚Â°C",
        },
        attributes: {
          "Component Type": group.type,
          Mounting: i % 2 === 0 ? "SMD / SMT" : "Through-Hole",
        },
        featured: i <= 2,
        isNew: i % 15 === 0,
        createdAt: new Date(
          Date.now() - Math.random() * 1000000000,
        ).toISOString(),
      });
    }
  }

  return prods;
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PRODUCTS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export async function readProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase readProducts error:", error.message);
    return [];
  }

  return data.map(fromDbProduct);
}

export async function writeProducts(prods) {
  // Full replace: delete all, then batch-insert
  const { error: delError } = await supabase
    .from("products")
    .delete()
    .neq("id", "");
  if (delError)
    console.error("Supabase deleteProducts error:", delError.message);

  if (prods.length === 0) return;

  // Supabase has a row-limit per insert; batch in chunks of 500
  const rows = prods.map(toDbProduct);
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    let { error } = await supabase.from("products").insert(chunk);
    if (
      error &&
      (error.message?.includes("show_") || error.message?.includes("column"))
    ) {
      const sanitizedChunk = chunk.map((r) => {
        const copy = { ...r };
        delete copy.show_price;
        delete copy.show_quantity;
        delete copy.show_availability;
        return copy;
      });
      const retry = await supabase.from("products").insert(sanitizedChunk);
      if (retry.error)
        console.error(
          `Supabase insertProducts batch ${i} retry error:`,
          retry.error.message,
        );
    } else if (error) {
      console.error(`Supabase insertProducts batch ${i} error:`, error.message);
    }
  }
}

export async function insertProduct(prod) {
  const row = toDbProduct(prod);
  let { data, error } = await supabase
    .from("products")
    .insert(row)
    .select()
    .single();

  if (
    error &&
    (error.message?.includes("show_") || error.message?.includes("column"))
  ) {
    console.warn(
      "Retrying insertProduct without direct visibility columns (saved in attributes.visibility):",
      error.message,
    );
    const sanitized = { ...row };
    delete sanitized.show_price;
    delete sanitized.show_quantity;
    delete sanitized.show_availability;
    const retry = await supabase
      .from("products")
      .insert(sanitized)
      .select()
      .single();
    if (retry.error) {
      console.error("Supabase insertProduct retry error:", retry.error.message);
      throw new Error(retry.error.message);
    }
    data = retry.data;
  } else if (error) {
    console.error("Supabase insertProduct error:", error.message);
    throw new Error(error.message);
  }

  return fromDbProduct(data);
}

export async function updateProduct(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
  if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
  if (updates.model !== undefined) dbUpdates.model = updates.model;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory || null;
  if (updates.priceLKR !== undefined)
    dbUpdates.price_cents = Math.round(Number(updates.priceLKR) * 100);
  if (updates.priceCents !== undefined)
    dbUpdates.price_cents = updates.priceCents;
  if (updates.compareAtCents !== undefined)
    dbUpdates.compare_at_cents = updates.compareAtCents;
  if (updates.stock !== undefined) dbUpdates.stock = Number(updates.stock);
  if (updates.images !== undefined) dbUpdates.images = updates.images;
  if (updates.description !== undefined)
    dbUpdates.description = updates.description;
  if (updates.specs !== undefined) dbUpdates.specs = updates.specs;
  if (updates.attributes !== undefined)
    dbUpdates.attributes = updates.attributes;
  if (updates.featured !== undefined) dbUpdates.featured = updates.featured;
  if (updates.isNew !== undefined) dbUpdates.is_new = updates.isNew;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;

  // Visibility fields
  if (updates.showPrice !== undefined)
    dbUpdates.show_price = Boolean(updates.showPrice);
  if (updates.showQuantity !== undefined)
    dbUpdates.show_quantity = Boolean(updates.showQuantity);
  if (updates.showAvailability !== undefined)
    dbUpdates.show_availability = Boolean(updates.showAvailability);

  // Preserve inside attributes.visibility for resilience
  try {
    const current = await findProduct(id);
    const baseAttrs = updates.attributes || current?.attributes || {};
    const origImages =
      updates.originalImages !== undefined
        ? updates.originalImages
        : current?.originalImages || baseAttrs.originalImages;

    dbUpdates.attributes = {
      ...baseAttrs,
      originalImages: origImages,
      visibility: {
        showPrice:
          updates.showPrice !== undefined
            ? Boolean(updates.showPrice)
            : current?.showPrice !== false,
        showQuantity:
          updates.showQuantity !== undefined
            ? Boolean(updates.showQuantity)
            : current?.showQuantity !== false,
        showAvailability:
          updates.showAvailability !== undefined
            ? Boolean(updates.showAvailability)
            : current?.showAvailability !== false,
      },
    };
  } catch (e) {
    console.warn("Could not merge attributes.visibility:", e.message);
  }

  dbUpdates.updated_at = new Date().toISOString();

  let { data, error } = await supabase
    .from("products")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error && error.message?.includes("show_")) {
    console.warn(
      "Retrying update without direct visibility columns (saved in attributes.visibility):",
      error.message,
    );
    delete dbUpdates.show_price;
    delete dbUpdates.show_quantity;
    delete dbUpdates.show_availability;
    const retry = await supabase
      .from("products")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    if (retry.error) throw new Error(retry.error.message);
    data = retry.data;
  } else if (error) {
    throw new Error(error.message);
  }

  return fromDbProduct(data);
}

export async function deleteProduct(id) {
  const { error, count } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return true;
}

export async function findProduct(identifier) {
  const value = String(identifier || "").trim();
  if (!/^[a-zA-Z0-9_-]{1,300}$/.test(value)) return null;

  // Safe PostgREST filters: user input is never interpolated into a filter string.
  for (const [column, operator] of [["id", "eq"], ["slug", "eq"], ["sku", "ilike"]]) {
    const query = supabase.from("products").select("*").limit(1);
    const { data, error } = operator === "ilike"
      ? await query.ilike(column, value).maybeSingle()
      : await query.eq(column, value).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return fromDbProduct(data);
  }
  return null;
}
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ CATEGORIES Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export async function readCategories() {
  const { data, error } = await supabase.from("categories").select("*");

  if (error) {
    console.error("Supabase readCategories error:", error.message);
    return defaultCategories;
  }

  if (data.length === 0) {
    // Auto-seed defaults
    await writeCategories(defaultCategories);
    return defaultCategories;
  }

  const categories = data.map(fromDbCategory);
  const { data: subcategoryRows, error: subcategoryError } = await supabase
    .from("subcategories")
    .select("category_slug, name")
    .order("name", { ascending: true });
  if (subcategoryError) return categories;

  const namesByCategory = new Map();
  subcategoryRows.forEach((row) => {
    const names = namesByCategory.get(row.category_slug) || [];
    names.push(row.name);
    namesByCategory.set(row.category_slug, names);
  });
  return categories.map((category) => ({
    ...category,
    subcategories: namesByCategory.get(category.slug) || [],
  }));
}

export async function writeCategories(cats) {
  const { error: delError } = await supabase
    .from("categories")
    .delete()
    .neq("slug", "");
  if (delError)
    console.error("Supabase deleteCategories error:", delError.message);

  if (cats.length === 0) return;

  const rows = cats.map(toDbCategory);
  const { error } = await supabase.from("categories").insert(rows);
  if (error) console.error("Supabase insertCategories error:", error.message);
}

export async function insertCategory(cat) {
  const { data, error } = await supabase
    .from("categories")
    .insert(toDbCategory(cat))
    .select()
    .single();

  if (error) throw new Error(error.message);
  const saved = fromDbCategory(data);
  saved.subcategories = await replaceCategorySubcategories(saved.slug, cat.subcategories);
  return saved;
}

export async function deleteCategory(slug) {
  const { error } = await supabase.from("categories").delete().eq("slug", slug);

  if (error) throw new Error(error.message);
  return true;
}

export async function updateCategoryInDb(slug, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.short !== undefined) dbUpdates.short = updates.short;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.filterKey !== undefined) dbUpdates.filter_key = updates.filterKey;
  if (updates.subcategories !== undefined) {
    dbUpdates.subcategories = Array.isArray(updates.subcategories) ? updates.subcategories : [];
  }

  const { data, error } = await supabase
    .from("categories")
    .update(dbUpdates)
    .eq("slug", slug)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const saved = fromDbCategory(data);
  if (updates.subcategories !== undefined) {
    saved.subcategories = await replaceCategorySubcategories(saved.slug, updates.subcategories);
  }
  return saved;
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ BRANDS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export async function readBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data.map(fromDbBrand);
}

export async function findBrand(slug) {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? fromDbBrand(data) : null;
}

export async function upsertBrand(brand) {
  const { data, error } = await supabase
    .from("brands")
    .upsert(toDbBrand(brand), { onConflict: "slug" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return fromDbBrand(data);
}

export async function deleteBrand(slug) {
  const { error } = await supabase.from("brands").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
  return true;
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ORDERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export async function readOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase readOrders error:", error.message);
    return [];
  }

  return data.map(fromDbOrder);
}

export async function writeOrders(orders) {
  const { error: delError } = await supabase
    .from("orders")
    .delete()
    .neq("id", "");
  if (delError) console.error("Supabase deleteOrders error:", delError.message);

  if (orders.length === 0) return;

  const rows = orders.map(toDbOrder);
  const { error } = await supabase.from("orders").insert(rows);
  if (error) console.error("Supabase insertOrders error:", error.message);
}

export async function insertOrder(order) {
  const { data, error } = await supabase
    .from("orders")
    .insert(toDbOrder(order))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return fromDbOrder(data);
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return fromDbOrder(data);
}

export async function updateOrder(id, fields) {
  const updates = {
    updated_at: new Date().toISOString(),
  };
  if (fields.customerName !== undefined)
    updates.customer_name = String(fields.customerName).trim();
  if (fields.phone !== undefined) updates.phone = String(fields.phone).trim();
  if (fields.email !== undefined) updates.email = String(fields.email).trim();
  if (fields.address !== undefined)
    updates.address = String(fields.address).trim();
  if (fields.city !== undefined) updates.city = String(fields.city).trim();
  if (fields.notes !== undefined) updates.notes = String(fields.notes).trim();

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return fromDbOrder(data);
}
// Orders are retained while they are being fulfilled. Only terminal orders can
// be removed by an administrator, so an in-progress order can never disappear
// accidentally from the dashboard.
export async function deletePastOrder(id) {
  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("id", id)
    .in("status", ["Delivered", "Cancelled"])
    .select("id, status")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data || null;
}
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ SETTINGS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const defaultSettings = {
  id: "default",
  storeName: "Asia Electronics & Cellular",
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
  updatedAt: new Date().toISOString(),
};

function readSettingsFile() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error("Error reading settings.json:", err.message);
  }
  return defaultSettings;
}

function writeSettingsFile(settings) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing settings.json:", err.message);
  }
}

export async function readSettings() {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      const merged = {
        id: data.id,
        storeName: data.store_name || defaultSettings.storeName,
        whatsappNumber: data.whatsapp_number || defaultSettings.whatsappNumber,
        officeEmail: data.office_email || defaultSettings.officeEmail,
        phone: data.phone || defaultSettings.phone,
        currency: data.currency || defaultSettings.currency,
        taxRate: data.tax_rate || defaultSettings.taxRate,
        address: data.address || defaultSettings.address,
        notifications: data.notifications || defaultSettings.notifications,
        updatedAt: data.updated_at || data.created_at,
      };
      writeSettingsFile(merged);
      return merged;
    }
  } catch (err) {
    console.warn(
      "Supabase store_settings query error (using local file fallback):",
      err.message,
    );
  }

  return readSettingsFile();
}

export async function updateSettings(updates) {
  const current = await readSettings();
  const merged = {
    ...current,
    ...updates,
    notifications: {
      ...current.notifications,
      ...(updates.notifications || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  // 1. Always save to local settings.json
  writeSettingsFile(merged);

  // 2. Try saving to Supabase store_settings table
  try {
    const row = {
      id: "default",
      store_name: merged.storeName,
      whatsapp_number: merged.whatsappNumber,
      office_email: merged.officeEmail,
      phone: merged.phone,
      currency: merged.currency,
      tax_rate: merged.taxRate,
      address: merged.address,
      notifications: merged.notifications,
      updated_at: merged.updatedAt,
    };
    const { error } = await supabase
      .from("store_settings")
      .upsert(row, { onConflict: "id" });
    if (error) {
      console.warn(
        "Supabase store_settings upsert error (saved locally):",
        error.message,
      );
    }
  } catch (err) {
    console.warn("Supabase store_settings error:", err.message);
  }

  return merged;
}

export async function adjustInventory(productId, { mode, quantity, reason, reference = null }) {
  const { data, error } = await supabase.rpc('adjust_inventory', {
    p_product_id: productId,
    p_mode: mode,
    p_quantity: quantity,
    p_reason: reason,
    p_reference: reference,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function readInventoryHistory(productId) {
  const { data, error } = await supabase
    .from('inventory_history')
    .select('id, quantity_change, previous_quantity, new_quantity, reason, reference, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createOrderWithInventory(order) {
  const { data, error } = await supabase.rpc('create_order_with_inventory', { p_order: order });
  if (error) throw new Error(error.message);
  return data;
}
export async function restoreOrderInventory(orderId) {
  const { error } = await supabase.rpc('restore_order_inventory', { p_order_id: orderId });
  if (error) throw new Error(error.message);
}
