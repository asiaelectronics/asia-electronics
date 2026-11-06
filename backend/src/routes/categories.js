import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { readCategories, insertCategory, updateCategoryInDb, deleteCategory, readProducts } from "../data/db.js";

const router = express.Router();

// Core subcategories that must remain available even before a product has been
// created inside them. Existing admin-created subcategories are always kept.
const requiredSubcategories = {
  mobile: ["Car & Bike Holders", "Computer & Gaming Accessories"],
};

// GET /api/categories (with product counts)
router.get("/", async (req, res) => {
  try {
    const cats = await readCategories();
    const prods = await readProducts();

    // Backfill category subcategories from products created before category-level
    // subcategories existed. This is idempotent and preserves manually added values.
    const syncedCategories = await Promise.all(
      cats.map(async (category) => {
        const productSubcategories = prods
          .filter((product) => product.category === category.slug)
          .map((product) => product.subcategory || product.attributes?.Subcategory || "")
          .map((subcategory) => String(subcategory).trim())
          .filter(Boolean);
        const subcategories = [
          ...new Set([
            ...(category.subcategories || []),
            ...(requiredSubcategories[category.slug] || []),
            ...productSubcategories,
          ]),
        ];

        if (subcategories.length !== (category.subcategories || []).length) {
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
      subcategories: Array.isArray(subcategories)
        ? [...new Set(subcategories.map((item) => String(item).trim()).filter(Boolean))]
        : [],
    };

    const saved = await insertCategory(newCat);

    res.status(201).json({ success: true, data: saved, message: "Category created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/categories/:slug
router.put("/:slug", requireAuth, requireAdmin, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.subcategories !== undefined) {
      updates.subcategories = Array.isArray(updates.subcategories)
        ? [...new Set(updates.subcategories.map((item) => String(item).trim()).filter(Boolean))]
        : [];
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

