import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  readProducts,
  readOrders,
  readCategories,
  readProductAnalyticsEvents,
  recordProductAnalyticsEvent,
} from "../data/db.js";

const router = express.Router();

// Public, anonymous engagement collection. The payload is deliberately limited
// to product ID, event type, and a browser-generated anonymous session ID.
router.post("/events", async (req, res) => {
  try {
    const { productId, eventType, sessionId } = req.body || {};
    if (
      !String(productId || "").trim() ||
      !["view", "add_to_cart"].includes(eventType) ||
      !/^[a-zA-Z0-9_-]{8,80}$/.test(String(sessionId || ""))
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid analytics event" });
    }
    await recordProductAnalyticsEvent({
      productId: String(productId),
      eventType,
      sessionId: String(sessionId),
    });
    res.status(201).json({ success: true });
  } catch (err) {
    // Analytics must never interrupt browsing or checkout if the table has not
    // yet been migrated in a deployment.
    res.status(202).json({ success: false });
  }
});

// GET /api/analytics
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const products = await readProducts();
    const orders = await readOrders();
    const categories = await readCategories();
    const events = await readProductAnalyticsEvents();

    const validOrders = orders.filter((o) => o.status !== "Cancelled");
    const totalRevenue = validOrders.reduce(
      (sum, o) => sum + (Number(o.totalLKR) || 0),
      0,
    );
    const completedOrders = orders.filter(
      (o) => o.status === "Delivered",
    ).length;
    const processingOrders = orders.filter(
      (o) => o.status === "Processing" || o.status === "Quotation Requested",
    ).length;

    // Revenue by category breakdown
    const categoryBreakdown = categories.map((c) => {
      const prodsInCat = products.filter((p) => p.category === c.slug);
      const estRevenue = prodsInCat
        .slice(0, 15)
        .reduce((acc, p) => acc + p.priceCents / 100, 0);
      return {
        category: c.name,
        slug: c.slug,
        productCount: prodsInCat.length,
        estimatedRevenueLKR: Math.round(estRevenue),
      };
    });

    const productEngagement = new Map();
    for (const product of products) {
      productEngagement.set(product.id, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: Number(product.stock) || 0,
        views: 0,
        addToCart: 0,
        quotationRequests: 0,
        deliveredOrders: 0,
      });
    }
    for (const event of events) {
      const item = productEngagement.get(event.product_id);
      if (!item) continue;
      if (event.event_type === "view") item.views += 1;
      if (event.event_type === "add_to_cart") item.addToCart += 1;
    }
    for (const order of orders) {
      for (const line of order.items || []) {
        const item = [...productEngagement.values()].find(
          (p) => p.sku === line.sku,
        );
        if (!item) continue;
        item.quotationRequests += Number(line.qty) || 1;
        if (order.status === "Delivered")
          item.deliveredOrders += Number(line.qty) || 1;
      }
    }
    const popularProducts = [...productEngagement.values()]
      .map((item) => ({
        ...item,
        cartRate: item.views
          ? Math.round((item.addToCart / item.views) * 100)
          : 0,
      }))
      .filter((item) => item.views || item.addToCart || item.quotationRequests)
      .sort(
        (a, b) =>
          b.views +
          b.addToCart * 3 +
          b.quotationRequests * 5 -
          (a.views + a.addToCart * 3 + a.quotationRequests * 5),
      )
      .slice(0, 10);
    const insights = popularProducts
      .flatMap((item) => {
        const messages = [];
        if (item.views >= 10 && item.addToCart / item.views < 0.1)
          messages.push(
            `${item.name} gets many views but few add-to-carts. Review its price, photo, or description.`,
          );
        if (
          (item.addToCart >= 5 || item.quotationRequests >= 3) &&
          item.stock <= 5
        )
          messages.push(
            `${item.name} is popular and has only ${item.stock} in stock. Consider restocking.`,
          );
        return messages;
      })
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalRevenueLKR: totalRevenue,
        totalOrders: orders.length,
        completedOrders,
        processingOrders,
        activeProducts: products.length,
        inStockProducts: products.filter((p) => p.stock > 0).length,
        lowStockAlerts: products.filter((p) => p.stock > 0 && p.stock <= 5)
          .length,
        categoryBreakdown,
        engagement: {
          totalViews: events.filter((event) => event.event_type === "view")
            .length,
          totalAddToCart: events.filter(
            (event) => event.event_type === "add_to_cart",
          ).length,
          popularProducts,
          insights,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
