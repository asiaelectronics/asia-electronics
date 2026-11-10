import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { readCategories, insertCategory, updateCategoryInDb, deleteCategory, readProducts } from "../data/db.js";
import { supabase } from "../data/supabase.js";

const router = express.Router();

const requiredCategories = [
  {
    slug: "car-bike-holders",
    name: "Car & Bike Holders",
    short: "Car & Bike Holders",
    image: "/assets/imgs/mobile-parts-accessories.png",
    filterKey: "Type",
  },
  {
    slug: "computer-gaming-accessories",
    name: "Computer & Gaming Accessories",
    short: "Computer & Gaming",
    image: "/assets/imgs/mobile-parts-accessories.png",
    filterKey: "Type",
  },
];
const legacyMobileSubcategories = new Set([
  "Car & Bike Holders",
  "Computer & Gaming Accessories",
]);
const CATEGORY_IMAGE_BUCKET = "category-images";
const MAX_CATEGORY_IMAGE_BYTES = 3 * 1024 * 1024;
const CATEGORY_IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

async function ensureCategoryImageBucket() {
  const { data } = await supabase.storage.getBucket(CATEGORY_IMAGE_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(CATEGORY_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_CATEGORY_IMAGE_BYTES,
    allowedMimeTypes: Object.keys(CATEGORY_IMAGE_EXTENSIONS),
  });
  if (error && !/already exists/i.test(error.message || "")) throw new Error(error.message);
}

function uniqueSubcategories(values) {
  const seen = new Set();
  return (values || []).reduce((result, value) => {
    const name = String(value).trim();
    const key = name.toLocaleLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      result.push(name);
    }
    return result;
  }, []);
}

// GET /api/categories (with product counts)
router.get("/", async (req, res) => {
  try {
    let cats = await readCategories();
    const missingCategories = requiredCategories.filter(
      (required) => !cats.some((category) => category.slug === required.slug),
    );
    if (missingCategories.length) {
      const created = await Promise.all(missingCategories.map(insertCategory));
      cats = [...cats, ...created];
    }
    const prods = await readProducts();

    // Backfill category subcategories from products created before category-level
    // subcategories existed. This is idempotent and preserves manually added values.
    const syncedCategories = await Promise.all(
      cats.map(async (category) => {
        const productSubcategories = prods
          .filter((product) => product.category === category.slug)
          .map((product) => product.subcategory || product.attributes?.Subcategory || "")
          .map((subcategory) => String(subcategory).trim())
          .filter(
            (subcategory) =>
              Boolean(subcategory) &&
              (category.slug !== "mobile" || !legacyMobileSubcategories.has(subcategory)),
          );
        const existingSubcategories = (category.subcategories || []).filter(
          (subcategory) =>
            category.slug === "mobile" ? !legacyMobileSubcategories.has(subcategory) : true,
        );
        const subcategories = uniqueSubcategories([
          ...existingSubcategories,
          ...productSubcategories,
        ]);

        if (
          subcategories.length !== (category.subcategories || []).length ||
          subcategories.some((subcategory) => !category.subcategories?.includes(subcategory))
        ) {
          return updateCategoryInDb(category.slug, { subcategories });
        }
        return category;
      }),
    );

    const withCounts = syncedCategories.map((category) => {
      const count = prods.filter((product) => product.category === category.slug).length;
      return { ...category, productCount: count };
    });

    res.json({ success: true, data: withCounts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/categories
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, slug, short, image, filterKey, subcategories } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, error: "Name and slug are required" });
    }

    const cleanSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const newCat = {
      name: String(name).trim(),
      slug: cleanSlug,
      short: short || name.split(" ")[0] || "General",
      image: image || "/assets/imgs/electronic-components.png",
      filterKey: filterKey || "Type",
      subcategories: uniqueSubcategories(Array.isArray(subcategories) ? subcategories : []),
    };

    const saved = await insertCategory(newCat);

    res.status(201).json({ success: true, data: saved, message: "Category created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload image files directly to Storage. The categories table keeps only the
// public URL, rather than a multi-megabyte Base64 string.
router.post("/image-upload-url", requireAuth, requireAdmin, async (req, res) => {
  try {
    const contentType = String(req.body.contentType || "").toLowerCase();
    const size = Number(req.body.size || 0);
    if (!CATEGORY_IMAGE_EXTENSIONS[contentType] || size < 1 || size > MAX_CATEGORY_IMAGE_BYTES) {
      return res.status(400).json({ success: false, error: "Upload an image no larger than 3 MB." });
    }

    await ensureCategoryImageBucket();
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${CATEGORY_IMAGE_EXTENSIONS[contentType]}`;
    const { data, error } = await supabase.storage.from(CATEGORY_IMAGE_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message || "Could not prepare category image upload");
    const { data: publicData } = supabase.storage.from(CATEGORY_IMAGE_BUCKET).getPublicUrl(path);
    res.json({ success: true, uploadUrl: data.signedUrl, publicUrl: publicData.publicUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Could not prepare category image upload" });
  }
});

// PUT /api/categories/:slug
router.put("/:slug", requireAuth, requireAdmin, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.subcategories !== undefined) {
      updates.subcategories = uniqueSubcategories(
        Array.isArray(updates.subcategories) ? updates.subcategories : [],
      );
    }
    const updated = await updateCategoryInDb(req.params.slug, updates);
    res.json({ success: true, data: updated, message: "Category updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/categories/:slug
router.delete("/:slug", requireAuth, requireAdmin, async (req, res) => {
  try {
    await deleteCategory(req.params.slug);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

