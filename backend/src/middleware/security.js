const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PASSWORD_FIELDS = new Set(["password", "currentPassword", "newPassword", "refreshToken"]);
const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function cleanText(value) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|svg|math)[^>]*>/gi, "")
    .replace(/\bon[a-z]+\s*=/gi, "")
    .replace(/^\s*javascript\s*:/i, "");
}

function sanitize(value, key = "") {
  if (typeof value === "string") return PASSWORD_FIELDS.has(key) ? value : cleanText(value);
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([entryKey]) => !BLOCKED_KEYS.has(entryKey))
      .map(([entryKey, entryValue]) => [entryKey, sanitize(entryValue, entryKey)]),
  );
}

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );
  next();
}

export function sanitizeRequestInput(req, res, next) {
  if (req.body && typeof req.body === "object") req.body = sanitize(req.body);
  if (req.query && typeof req.query === "object") req.query = sanitize(req.query);
  next();
}

export function requireTrustedOrigin(allowedOrigins) {
  const trustedOrigins = new Set(allowedOrigins);
  return (req, res, next) => {
    if (!UNSAFE_METHODS.has(req.method)) return next();

    const origin = req.get("Origin");
    // Requests without Origin are non-browser clients (e.g. server jobs or curl).
    if (!origin || trustedOrigins.has(origin)) return next();
    if (/^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$/i.test(origin)) return next();
    if (/^http:\/\/(localhost|127\.0\.0\.1|(\d{1,3}\.){3}\d{1,3})(:\d+)?$/i.test(origin)) return next();

    return res.status(403).json({ success: false, error: "Untrusted request origin" });
  };
}
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 120 } = {}) {
  const requests = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown")
      .split(",")[0]
      .trim();
    const current = requests.get(key) || { count: 0, resetAt: now + windowMs };
    if (now >= current.resetAt) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }
    current.count += 1;
    requests.set(key, current);
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - current.count)));
    if (current.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, error: "Too many requests. Please try again later." });
    }
    next();
  };
}