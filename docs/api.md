# API and module reference

## Conventions

Use `/api` as the canonical base path. Equivalent non-prefixed paths also exist for deployment compatibility. Protected endpoints require:

```http
Authorization: Bearer <supabase-access-token>
Content-Type: application/json
```

Most successful replies are `{ "success": true, "data": ... }`; failures are `{ "success": false, "error": "human-readable message" }`. Typical response codes are `400` validation, `401` invalid session, `403` missing admin role/untrusted origin, `404` missing resource, `409` conflicts or insufficient stock, `413` oversized input, `429` rate limiting, and `500` service failure.

`Public` means no session. `Signed-in` requires a customer or administrator session. `Admin` requires `app_metadata.role = admin`.

## Endpoint directory

### Platform and authentication

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | API uptime, timestamp, and service identity. |
| POST | `/auth/register` | Public | Create a customer and attempt immediate sign-in. |
| POST | `/auth/login` | Public | Sign in with Supabase Auth. |
| GET | `/auth/me` | Signed-in | Get the current public user profile. |
| PUT | `/auth/admin/credentials` | Admin | Change admin email and/or password. |
| POST | `/auth/logout` | Public | Attempt to invalidate a supplied session. |

### Catalogue and inventory

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/products` | Public | List products with filters, sorting, and pagination. |
| GET | `/products/stats` | Public | Product stock totals. |
| GET | `/products/:identifier` | Public | Get one product by ID, slug, or SKU. |
| POST | `/products` | Admin | Create a product. |
| PUT | `/products/:id` | Admin | Update a product. |
| DELETE | `/products/:id` | Admin | Delete a product. |
| DELETE | `/products/clear-all` | Admin | Delete every product. |
| POST | `/products/seed-800` | Admin | Generate the seed catalogue. |
| POST | `/products/:id/adjust-inventory` | Admin | Add, remove, or set stock with an audit reason. |
| GET | `/products/:id/inventory-history` | Admin | Get stock audit records. |
| POST | `/products/restore-original-images` | Admin | Restore archived pre-watermark product images. |
| GET | `/categories` | Public | List categories and subcategories. |
| POST | `/categories` | Admin | Create a category. |
| PUT | `/categories/:slug` | Admin | Update a category. |
| DELETE | `/categories/:slug` | Admin | Delete a category and cascading subcategories. |
| POST | `/categories/image-upload-url` | Admin | Create a category-image upload URL. |
| GET | `/brands` | Public | List brands. |
| POST | `/brands` | Admin | Create or update a brand. |
| DELETE | `/brands/:slug` | Admin | Delete a brand. |

### Orders, content, and analytics

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/orders` | Admin | List every quotation/order. |
| GET | `/orders/mine` | Signed-in | List orders matching the signed-in email. |
| GET | `/orders/:id/status` | Public | Return an ID and status only. |
| POST | `/orders` | Public | Create a quotation request and reserve inventory. |
| PATCH | `/orders/:id` | Admin | Update customer/delivery fields before shipment. |
| PATCH | `/orders/:id/status` | Admin | Update status; cancellation restores stock once. |
| DELETE | `/orders/:id` | Admin | Delete a delivered or cancelled order. |
| GET | `/settings` | Public | Get store settings. |
| PUT | `/settings` | Admin | Update store settings. |
| POST | `/analytics/events` | Public | Record product analytics. |
| GET | `/analytics` | Admin | Get dashboard analytics. |
| GET | `/banners` | Public | List banners. |
| POST | `/banners` | Admin | Create a banner. |
| PUT | `/banners/:id` | Admin | Update a banner. |
| DELETE | `/banners/:id` | Admin | Delete a banner. |
| POST | `/homepage-video/upload-url` | Admin | Create MP4/WebM upload URL. |
| DELETE | `/homepage-video` | Admin | Delete the homepage video. |
| POST | `/homepage-banners/upload-url` | Admin | Create a homepage banner-image upload URL. |

### Wholesale requests

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/wholesale-requests` | Public | Create a request, optional private attachment, and WhatsApp deep link. |
| GET | `/wholesale-requests` | Admin | List requests with temporary admin download URLs. |
| GET | `/wholesale-requests/:id/file?token=...` | HMAC link | Verify permanent attachment link, then redirect to fresh storage URL. |
| PATCH | `/wholesale-requests/:id/status` | Admin | Set wholesale workflow status and notify customer. |
| DELETE | `/wholesale-requests/:id` | Admin | Delete request and stored attachment. |

## Request and response specifications

### Register or log in

```http
POST /api/auth/register

{ "name": "Nimal Perera", "email": "nimal@example.com", "password": "at-least-six-characters" }
```

```json
{
  "success": true,
  "user": { "id": "auth-user-id", "email": "nimal@example.com", "name": "Nimal Perera", "role": "customer" },
  "token": "supabase-access-token",
  "refreshToken": "supabase-refresh-token",
  "message": "Registration successful!"
}
```

`POST /auth/login` accepts `{ "email", "password" }` and returns the same session shape. Duplicate registration returns `409`; invalid credentials return `401`.

### Query and create products

```http
GET /api/products?search=relay&category=electronic-components&brand=Generic,Omron&inStock=true&sort=price-asc&page=1&limit=25
```

Filters are `search`, `category`, `subcategory`, comma-separated `brand`, `minPrice` and `maxPrice` in LKR, `inStock=true`, `sort` (`price-asc`, `price-desc`, `name`, `newest`), `page`, and `limit`.

```json
{
  "success": true,
  "data": [{ "id": "prod_123", "slug": "ae-relay-12v", "name": "12V Relay", "sku": "REL-12V", "priceCents": 45000, "stock": 8, "images": ["https://..."], "specs": {}, "attributes": {} }],
  "pagination": { "total": 1, "page": 1, "limit": 25, "pages": 1 }
}
```

```http
POST /api/products
Authorization: Bearer <admin-token>

{
  "name": "12V Relay", "sku": "REL-12V", "category": "electronic-components",
  "subcategory": "Relays", "brand": "Generic", "priceLKR": 450, "stock": 20,
  "images": ["https://example.invalid/relay.jpg"], "specs": { "coilVoltage": "12V" },
  "attributes": { "Type": "SPDT" }, "showPrice": true, "showQuantity": true, "showAvailability": true
}
```

`name`, `sku`, `category`, and either `priceLKR` or `priceCents` are required. Duplicate SKU or slug returns `409`. To adjust stock, send `{ "mode": "add|remove|set", "quantity": 10, "reason": "Supplier delivery", "reference": "GRN-0042" }` to `/products/:id/adjust-inventory`. A removal that would create negative stock returns `409`.

### Create an order / quotation request

```http
POST /api/orders

{
  "customerName": "Nimal Perera", "phone": "+94770000000", "email": "nimal@example.com",
  "address": "12 Main Street", "city": "Colombo", "notes": "Please confirm availability.",
  "items": [{ "sku": "REL-12V", "qty": 2 }]
}
```

```json
{
  "success": true,
  "data": {
    "id": "AEC-ABC123456", "status": "Quotation Requested",
    "items": [{ "sku": "REL-12V", "name": "12V Relay", "qty": 2, "priceLKR": 450 }],
    "totalLKR": 900
  },
  "message": "Quotation request saved successfully"
}
```

Every item must contain an existing SKU and a quantity from 1 to 100. The server derives product name and price; client prices are ignored. Order status is one of `Quotation Requested`, `Quotation Sent`, `Processing`, `Shipped`, `Delivered`, or `Cancelled`.

### Create a wholesale request

```http
POST /api/wholesale-requests

{
  "customerName": "Nimal Perera", "companyName": "Perera Electronics",
  "phone": "+94770000000", "email": "nimal@example.com",
  "requestDetails": "Please quote for 50 relays.",
  "fileName": "requirements.pdf",
  "fileData": "data:application/pdf;base64,JVBERi0xLjQ..."
}
```

Files are optional and limited to 2 MB. PDF, XLS/XLSX, CSV, BR, JPG, JPEG, and PNG extensions are accepted with validated MIME types. The `201` response includes saved data and a `whatsappUrl`. If a file exists, that WhatsApp message contains a permanent private link that creates a fresh download redirect when opened.

### Public analytics event

```http
POST /api/analytics/events

{ "productId": "prod_123", "eventType": "add_to_cart", "sessionId": "browser-session-id" }
```

The API records the timestamp. The frontend uses product view and add-to-cart events.

## Core helper modules

| Module | Responsibility |
| --- | --- |
| `backend/src/server.js` | Application assembly, security middleware, health routes, and router mounting. |
| `backend/src/data/supabase.js` | Server-only service client and short-lived auth client. |
| `backend/src/data/db.js` | Model mapping, persistence, settings, and inventory RPC wrappers. |
| `backend/src/middleware/auth.js` | Bearer-token validation and administrator role enforcement. |
| `backend/src/middleware/security.js` | Headers, request sanitisation, origin validation, and rate limiting. |
| `backend/src/services/orderStatusEmail.js` | SMTP email generation and delivery. |
| `backend/src/services/wholesaleFileLinks.js` | HMAC signing and verification for private attachment links. |
| `frontend/src/services/api.ts` | Browser API client, types, defaults, and errors. |
| `frontend/src/context/auth.tsx` | Session lifecycle and admin credential updates. |
| `frontend/src/context/cart.tsx` | Persisted cart reducer and stock-aware totals. |
| `frontend/src/context/settings.tsx` | Public settings cache and WhatsApp links. |

## Media upload lifecycle

Category, homepage banner, and homepage video routes return a signed Supabase upload URL plus the eventual public URL. The browser uploads directly to Storage and saves the returned URL in the relevant entity. Product images are processed by the product persistence layer. Wholesale files differ: the browser sends a validated base64 data URL to the API, which stores it in a private bucket.
