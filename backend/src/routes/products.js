import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  readProducts,
  writeProducts,
  generate850Products,
  insertProduct,
  updateProduct,
  deleteProduct,
  findProduct,
  adjustInventory,
  readInventoryHistory,
} from "../data/db.js";

const router = express.Router();

// GET /api/products (with search, category, brand, stock, price, pagination)
router.get("/", async (req, res) => {
  try {
    let items = await readProducts();
    const {
      search,
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sort,
      page = 1,
      limit = 25,
    } = req.query;

    if (search) {
      const q = String(search).trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.model?.toLowerCase().includes(q) ||
          p.subcategory?.toLowerCase().includes(q) ||
          Object.values(p.attributes || {}).some((value) =>
            String(value).toLowerCase().includes(q),
          )
      );
    }

    if (category) {
      items = items.filter((p) => p.category === category);
    }

    if (subcategory) {
      items = items.filter((p) => p.subcategory === subcategory);
    }

    if (brand) {
      const brandList = String(brand).split(",").map((b) => b.trim().toLowerCase());
      items = items.filter((p) => brandList.includes(p.brand?.toLowerCase()));
    }

    if (minPrice) {
      items = items.filter((p) => p.priceCents >= Number(minPrice) * 100);
    }

    if (maxPrice) {
      items = items.filter((p) => p.priceCents <= Number(maxPrice) * 100);
    }

    if (inStock === "true" || inStock === true) {
      items = items.filter((p) => p.stock > 0);
    }

    // Sort
    if (sort === "price-asc") {
      items.sort((a, b) => a.priceCents - b.priceCents);
    } else if (sort === "price-desc") {
      items.sort((a, b) => b.priceCents - a.priceCents);
    } else if (sort === "name") {
      items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sort === "newest") {
      items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }

    const total = items.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const pages = Math.ceil(total / pageSize);
    const paginated = items.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        pages,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/stats
router.get("/stats", async (req, res) => {
  try {
    const items = await readProducts();
    const inStock = items.filter((p) => p.stock > 5).length;
    const lowStock = items.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const outOfStock = items.filter((p) => p.stock === 0).length;

    res.json({
      success: true,
      stats: {
        total: items.length,
        inStock,
        lowStock,
        outOfStock,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Inventory actions are protected server-side; the SQL function locks the SKU
// row and writes the audit record in the same transaction.
router.post('/:id/adjust-inventory', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { mode, quantity, reason, reference } = req.body || {};
    if (!['add', 'remove', 'set'].includes(mode) || !Number.isInteger(Number(quantity)) || Number(quantity) < 0 || !String(reason || '').trim()) {
      return res.status(400).json({ success: false, error: 'Mode, non-negative integer quantity, and reason are required' });
    }
    const result = await adjustInventory(req.params.id, { mode, quantity: Number(quantity), reason: String(reason).trim(), reference: reference || null });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.message.includes('Insufficient stock') ? 409 : 500).json({ success: false, error: err.message });
  }
});

router.get('/:id/inventory-history', requireAuth, requireAdmin, async (req, res) => {
  try { res.json({ success: true, data: await readInventoryHistory(req.params.id) }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
// GET /api/products/:identifier (by id or slug or sku)
router.get("/:identifier", async (req, res) => {
  try {
    const product = await findProduct(req.params.identifier);

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products (create)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    const name = body.name;
    const sku = body.sku;
    const category = body.category;
    const brand = body.brand || "Generic";
    const model = body.model || "Standard";
    const description = body.description || "Quality electronic component backed by Asia Electronics warranty.";
    const stock = Number(body.stock) || 0;

    // Accept either priceLKR or priceCents from the frontend
    let priceCents;
    if (body.priceCents !== undefined) {
      priceCents = Number(body.priceCents);
    } else if (body.priceLKR !== undefined) {
      priceCents = Math.round(Number(body.priceLKR) * 100);
    } else {
      return res.status(400).json({ success: false, error: "Missing required field: priceCents or priceLKR" });
    }

    if (!name || !sku || !category) {
      return res.status(400).json({ success: false, error: "Missing required fields: name, sku, category" });
    }

    const cleanSku = String(sku).trim().toUpperCase();
    const cleanName = String(name).trim();

    // Accept id and slug from frontend if provided (avoids duplicate on re-save)
    const id = body.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slug = body.slug || `ae-${cleanSku.toLowerCase()}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    // compareAtCents: accept either compareAtCents or compareAtLKR
    let compareAtCents;
    if (body.compareAtCents !== undefined) {
      compareAtCents = Number(body.compareAtCents) || undefined;
    } else if (body.compareAtLKR) {
      compareAtCents = Math.round(Number(body.compareAtLKR) * 100);
    }

    let finalImages = ["/assets/imgs/electronic-components.png"];
    if (Array.isArray(body.images) && body.images.length > 0) {
      finalImages = body.images;
    } else if (body.image) {
      finalImages = [body.image];
    }

    const newProd = {
      id,
      slug,
      name: cleanName,
      sku: cleanSku,
      brand,
      model,
      category,
      subcategory: body.subcategory || body.attributes?.Subcategory || null,
      priceCents,
      compareAtCents,
      stock,
      images: finalImages,
      originalImages: Array.isArray(body.originalImages) ? body.originalImages : undefined,
      description,
      specs: body.specs || {},
      attributes: body.attributes || {},
      featured: Boolean(body.featured),
      isNew: body.isNew !== undefined ? Boolean(body.isNew) : true,
      showPrice: body.showPrice !== false,
      showQuantity: body.showQuantity !== false,
      showAvailability: body.showAvailability !== false,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const saved = await insertProduct(newProd);

    res.status(201).json({ success: true, data: saved, message: "Product created successfully" });
  } catch (err) {
    console.error("POST /api/products error:", err.message);
    const isConflict = err.message?.includes("duplicate") || err.message?.includes("unique");
    res.status(isConflict ? 409 : 500).json({
      success: false,
      error: isConflict ? `A product with this SKU or slug already exists: ${err.message}` : err.message,
    });
  }
});

// PUT /api/products/:id (update)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    res.json({ success: true, data: updated, message: "Product updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/products/clear-all (Clears all products from database)
router.delete("/clear-all", requireAuth, requireAdmin, async (req, res) => {
  try {
    await writeProducts([]);
    res.json({ success: true, message: "All products cleared successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products/seed-800
router.post("/seed-800", requireAuth, requireAdmin, async (req, res) => {
  try {
    const fresh = generate850Products();
    await writeProducts(fresh);
    res.json({
      success: true,
      message: `Generated and stored ${fresh.length} SKUs in Supabase!`,
      total: fresh.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
