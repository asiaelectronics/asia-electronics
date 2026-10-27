import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { createRateLimiter, requireTrustedOrigin, sanitizeRequestInput, securityHeaders } from "./middleware/security.js";

import productsRouter from "./routes/products.js";
import categoriesRouter from "./routes/categories.js";
import ordersRouter from "./routes/orders.js";
import analyticsRouter from "./routes/analytics.js";
import settingsRouter from "./routes/settings.js";
import authRouter from "./routes/auth.js";
import brandsRouter from "./routes/brands.js";
import bannersRouter from "./routes/banners.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const defaultAllowedOrigins = "http://localhost:8080,http://localhost:5173,https://asiaelectronics.lk,https://www.asiaelectronics.lk";
const configuredOrigins = process.env.FRONTEND_URL || "";
const allowedOrigins = `${defaultAllowedOrigins},${configuredOrigins}`
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow all Vercel domains (production & branch preview URLs)
  if (/^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$/i.test(origin)) return true;
  // Allow localhost & LAN IP addresses
  if (/^http:\/\/(localhost|127\.0\.0\.1|(\d{1,3}\.){3}\d{1,3})(:\d+)?$/i.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(securityHeaders);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: false }));
app.use(sanitizeRequestInput);
app.use(requireTrustedOrigin(allowedOrigins));
app.use(createRateLimiter());
app.use(morgan("dev"));

// Health check endpoints
const healthHandler = (req, res) => {
  res.json({
    status: "ok",
    service: "Asia Electronics Express API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};
app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

// Mount Routes (both with and without /api prefix for flexible Vercel rewrites)
app.use("/api/products", productsRouter);
app.use("/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/categories", categoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/orders", ordersRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/analytics", analyticsRouter);
app.use("/api/settings", settingsRouter);
app.use("/settings", settingsRouter);
app.use("/api/auth", authRouter);
app.use("/auth", authRouter);
app.use("/api/brands", brandsRouter);
app.use("/api/banners", bannersRouter);
app.use("/brands", brandsRouter);
app.use("/banners", bannersRouter);

// 404 handler for undefined API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Root welcome message
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Asia Electronics & Cellular API Server",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      categories: "/api/categories",
      orders: "/api/orders",
      analytics: "/api/analytics",
    },
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`===============================================`);
    console.log(` Asia Electronics Express API is running!`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Network:   http://0.0.0.0:${PORT}`);
    console.log(` Health:    http://localhost:${PORT}/api/health`);
    console.log(` Products:  http://localhost:${PORT}/api/products`);
    console.log(`===============================================`);
  });
}

export default app;
