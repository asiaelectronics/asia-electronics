import express from "express";
import {
  readOrders,
  readProducts,
  createOrderWithInventory,
  updateOrderStatus,
  updateOrder,
  restoreOrderInventory,
  deletePastOrder,
} from "../data/db.js";
import { sendOrderStatusEmail } from "../services/orderStatusEmail.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/orders
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await readOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/mine
// A signed-in customer can view only orders placed with their account email.
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const email = String(req.user?.email || "").trim().toLowerCase();
    if (!email) return res.json({ success: true, data: [] });

    const orders = await readOrders();
    const ownOrders = orders.filter(
      (order) => String(order.email || "").trim().toLowerCase() === email,
    );
    res.json({ success: true, data: ownOrders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// GET /api/orders/:id/status
// Returns only the tracking status, never customer or order-item details.
router.get("/:id/status", async (req, res) => {
  try {
    const orders = await readOrders();
    const order = orders.find((item) => item.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });

    res.json({ success: true, data: { id: order.id, status: order.status } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// POST /api/orders  (Quotation request)
router.post("/", async (req, res) => {
  try {
    const { customerName, phone, email, address, city, items, notes } = req.body;
    if (!customerName || !phone || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "customerName, phone, and items (array) are required",
      });
    }

    // Generate a unique AEC order ID
    const uid = `AEC-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    const products = await readProducts();
    const validatedItems = items.map((item) => {
      const sku = String(item?.sku || "").trim().toUpperCase();
      const quantity = Number.parseInt(item?.qty, 10);
      const product = products.find((candidate) => candidate.sku?.toUpperCase() === sku);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        throw new Error("Each order item must reference a valid product with a quantity from 1 to 100");
      }
      return {
        sku: product.sku,
        name: product.name,
        qty: quantity,
        priceLKR: product.showPrice === false ? 0 : Math.round(Number(product.priceCents || 0) / 100),
      };
    });
    const totalLKR = validatedItems.reduce((sum, item) => sum + item.priceLKR * item.qty, 0);

    const newOrder = {
      id: uid,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      address: (address || "").trim(),
      city: (city || "").trim(),
      notes: (notes || "").trim(),
      items: validatedItems,
      totalLKR,
      status: "Quotation Requested",
      createdAt: new Date().toISOString(),
    };

    const saved = await createOrderWithInventory(newOrder);

    // Send confirmation email to customer if email was provided
    if (newOrder.email) {
      void sendOrderStatusEmail(saved || newOrder, "Quotation Requested").catch((err) => {
        console.warn("Initial quotation email notification skipped:", err?.message);
      });
    }

    res.status(201).json({
      success: true,
      data: saved,
      message: "Quotation request saved successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id (Update Customer Details & Delivery Destination until status is "Shipped")
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await readOrders();
    const existing = orders.find((o) => o.id === id);

    if (!existing) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const currentStatus = (existing.status || "").trim().toLowerCase();
    const lockedStatuses = ["shipped", "delivered", "cancelled"];

    if (lockedStatuses.includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Order details cannot be edited once status is "${existing.status}". Please contact Asia Electronics support directly.`,
      });
    }

    const { customerName, phone, email, address, city, notes } = req.body;
    if (customerName !== undefined && !String(customerName).trim()) {
      return res.status(400).json({ success: false, error: "Customer name cannot be empty" });
    }
    if (phone !== undefined && !String(phone).trim()) {
      return res.status(400).json({ success: false, error: "Phone number cannot be empty" });
    }

    const updated = await updateOrder(id, {
      customerName,
      phone,
      email,
      address,
      city,
      notes,
    });

    res.json({
      success: true,
      data: updated,
      message: "Order details updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "Quotation Requested",
      "Quotation Sent",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const orders = await readOrders();
    const order = orders.find((item) => item.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const prevStatus = order.status;
    const updated = await updateOrderStatus(req.params.id, status);

    // Stock is deducted atomically when the order is created. A cancellation
    // restores it through a row-locked database function exactly once.
    if (status === "Cancelled" && prevStatus !== "Cancelled") {
      await restoreOrderInventory(order.id);
    }

    const notification = await sendOrderStatusEmail(updated || order, status);

    res.json({
      success: true,
      data: updated,
      notification,
      message: `Order status updated to ${status}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/orders/:id
// Keep active orders intact. Delivered and cancelled orders may be permanently
// removed by an administrator when they are no longer needed.
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await deletePastOrder(req.params.id);
    if (!deleted) {
      return res.status(400).json({
        success: false,
        error: "Only delivered or cancelled orders can be deleted.",
      });
    }

    res.json({ success: true, data: deleted, message: "Past order deleted permanently" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;