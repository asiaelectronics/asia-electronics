# Deployment Environment Variables (Vercel)

Ready-to-import templates (Vercel → Settings → Environment Variables → **Import .env**):

| Vercel project | Template file |
| --- | --- |
| Frontend (`frontend/`) | [`vercel-frontend.env.example`](vercel-frontend.env.example) |
| Backend (`backend/`) | [`vercel-backend.env.example`](vercel-backend.env.example) |

Set them for the **Production** environment, then **redeploy**.

## Frontend

| Variable | Value | Notes |
| --- | --- | --- |
| `API_URL` | `https://www.asiaelectronics.lk/api` | **Required.** SSR API base |
| `VITE_API_URL` | `https://www.asiaelectronics.lk/api` | Optional, build-time |
| `NITRO_PRESET` | `vercel` | Already in `frontend/vercel.json` |

## Backend

| Variable | Secret | Notes |
| --- | --- | --- |
| `NODE_ENV` | No | `production` |
| `FRONTEND_URL` | No | CORS allow-list, comma-separated |
| `STORE_URL` | No | Store link in emails |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Service-role key |
| `ADMIN_EMAIL` | Yes | First admin (bootstrap only) |
| `ADMIN_PASSWORD` | Yes | First admin (bootstrap only) |
| `SMTP_HOST` | No | `smtp.gmail.com` |
| `SMTP_PORT` | No | `465` |
| `SMTP_SECURE` | No | `true` |
| `SMTP_USER` | Yes | Gmail address |
| `SMTP_PASS` | Yes | Google App Password |
| `EMAIL_FROM` | No | Sender address |

Do **not** set `PORT`, `VERCEL`, `VERCEL_URL`, `VERCEL_ENV` — Vercel provides them.

## Why `API_URL` matters

- Used by server-side rendering (SSR) to fetch data from the backend API.
- Without it, SSR may call the per-deployment `VERCEL_URL`, which is usually behind
  Vercel Deployment Protection (401), causing product links opened directly
  (e.g. from WhatsApp) to show **"Product not found"**.
- Also ensures WhatsApp/social link previews show the real product name and image.

Resolved in [`frontend/src/services/api.ts`](frontend/src/services/api.ts) → `getApiBaseUrl()`.
