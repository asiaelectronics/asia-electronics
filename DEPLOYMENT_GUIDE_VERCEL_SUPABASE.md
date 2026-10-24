# Comprehensive Deployment Guide: New Supabase & Vercel Setup

This guide details everything required to spin up a brand-new **Supabase** database and **Vercel** production deployment from scratch for this project.

---

## 🏗️ Architecture Overview

* **Frontend**: React + TanStack Start (SSR + Client SPA).
* **Backend**: Express API (runs as a Vercel Serverless Function under `/api/*`).
* **Unified Build**: Handled automatically by `build-combined.mjs` (copies frontend SSR output + backend serverless function into `.vercel/output`).
* **Database & Auth**: Supabase (PostgreSQL + Service Role Auth + Storage).

---

## 📦 PART 1: Supabase Setup (Database & Auth)

### 1. Create a New Supabase Project
1. Go to [database.new](https://database.new) or log in to [Supabase](https://supabase.com).
2. Click **New Project**.
3. Choose an Organization, Name (e.g., `asia-electronics`), and a strong Database Password.
4. Select the region closest to your customers (e.g., `Singapore - ap-southeast-1` or `Mumbai - ap-south-1`).
5. Wait ~2 minutes for the database to provision.

---

### 2. Run Database Migrations
You must run the migration scripts to create tables, indexes, and storage buckets:

1. In your Supabase Dashboard, click **SQL Editor** on the left menu.
2. Click **New Query**.
3. Copy the full contents of [`backend/src/data/migration.sql`](./backend/src/data/migration.sql) and paste it into the editor.
4. Click **Run** (or `Ctrl + Enter`). Verify all tables are created (`products`, `categories`, `subcategories`, `orders`, `banners`, `inventory_history`, etc.).
5. Open another **New Query**.
6. Copy the contents of [`backend/src/data/brands-migration.sql`](./backend/src/data/brands-migration.sql) and paste it.
7. Click **Run**. This creates the `brands` table and the public `brand-images` storage bucket.

---

### 3. Create the Admin User
1. In the Supabase Dashboard, go to **Authentication** ➔ **Users**.
2. Click **Add User** ➔ **Create User**.
3. Enter your admin email (e.g., `admin@asiaelectronics.lk`) and a strong password.
4. Toggle **Auto Confirm User?** to **ON** (so no email confirmation is required).
5. Click **Create User**.

---

### 4. Copy Your Supabase API Credentials
Go to **Project Settings** (gear icon) ➔ **API**:
1. **Project URL**: `https://<your-project-id>.supabase.co`
2. **`anon` / `public` Key**: Used for public reads.
3. **`service_role` (Secret) Key**: Click *Reveal* and copy this.
   > ⚠️ **IMPORTANT**: The `service_role` key bypasses Row Level Security and is only used securely by your backend serverless functions. Never expose it in client code.

---

## 🚀 PART 2: Vercel Setup (Unified Frontend + Backend)

### 1. Push Your Code to GitHub
Make sure your project repository is on GitHub:
```bash
git add .
git commit -m "chore: initial project commit"
git push origin main
```
*(Ensure `build-combined.mjs` is NOT in `.gitignore`).*

---

### 2. Import Project into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Select your GitHub repository (`asia-electronics`).
4. In the configuration screen:
   * **Framework Preset**: Leave as **Other** (or None).
   * **Root Directory**: `./` (leave default root, do NOT select `frontend`).
   * **Build & Development Settings**:
     * Build Command: `node build-combined.mjs` (automatically picked up from `vercel.json`).
     * Output Directory: `.vercel/output`.
     * Install Command: `echo skip` (handled inside `build-combined.mjs`).

---

### 3. Add Environment Variables in Vercel
Under **Environment Variables**, add the following keys for **Production**, **Preview**, and **Development**:

| Variable Name | Example / Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment flag |
| `PORT` | `5000` | Port default for serverless runtime |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Your Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | `sb_secret_...` | Supabase Service Role Secret Key |
| `SUPABASE_ANON_KEY` | `sb_publishable_...` | Supabase Anon Key |
| `ADMIN_EMAIL` | `admin@asiaelectronics.lk` | Email address of the admin account |
| `FRONTEND_URL` | `http://localhost:8080,http://localhost:5173,https://yourdomain.com,https://www.yourdomain.com` | Allowed CORS origins for mutating API calls |
| `STORE_URL` | `https://www.yourdomain.com` | Primary URL used in order emails |
| `SMTP_HOST` | `smtp.gmail.com` | Email SMTP host |
| `SMTP_PORT` | `465` | SMTP port (465 for SSL, 587 for TLS) |
| `SMTP_SECURE` | `true` | `true` for 465, `false` for 587 |
| `SMTP_USER` | `yourcompany@gmail.com` | Sender email address |
| `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | Gmail 16-character App Password |
| `EMAIL_FROM` | `yourcompany@gmail.com` | From header on outgoing emails |

---

### 4. Deploy
Click **Deploy**. Vercel will:
1. Run `build-combined.mjs`.
2. Compile TanStack Start SSR frontend.
3. Bundle the Express backend into `api.func`.
4. Create the unified serverless deployment.

---

## 🌐 PART 3: Connecting Your Custom Domain

1. In Vercel, go to **Project Settings** ➔ **Domains**.
2. Add your domain (e.g. `yourdomain.lk` and `www.yourdomain.lk`).
3. Set `yourdomain.lk` to redirect with **308 Permanent Redirect** to `www.yourdomain.lk`.
4. At your domain registrar (register.lk / Namecheap / GoDaddy / Cloudflare):
   * Add **A Record**: Host `@`, Points to: `216.198.79.1` (or `76.76.21.21`).
   * Add **CNAME Record**: Host `www`, Points to: `cname.vercel-dns.com` (or Vercel's assigned CNAME target).
5. Once verified, ensure `FRONTEND_URL` and `STORE_URL` in Vercel Environment Variables include your new domain.
6. Trigger a **Redeploy** on Vercel so the environment variables take effect.

---

## 🛡️ PART 4: Critical Checklist & Common Gotchas

* **Never ignore `build-combined.mjs`**: Ensure `build-combined.mjs` is committed to git.
* **CORS / CSRF Protection**: If customers or admins see `403 Forbidden` on POST/PUT requests, check `FRONTEND_URL` in Vercel to verify the current domain (with and without `www`) is listed.
* **Gmail SMTP App Password**: Standard Gmail passwords will not work. You must enable 2-Step Verification in Google Account and create a dedicated **App Password**.
* **Database Restores & Backups**: Supabase takes daily automated backups. You can also export table data directly from the Supabase Table Editor.
