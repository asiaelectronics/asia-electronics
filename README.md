# Asia Electronics & Cellular — E-Commerce Platform

Welcome to the official repository for **Asia Electronics & Cellular Pvt Ltd** ([asiaelectronics.lk](https://www.asiaelectronics.lk)).

This is a modern, full-stack e-commerce web application tailored for electronic components, repair parts, audio, lighting, and home electronics in Sri Lanka.

---

## 🌐 Live Storefront

* **Production Website**: [https://www.asiaelectronics.lk](https://www.asiaelectronics.lk)
* **Alternative URL**: [https://asiaelectronics.lk](https://asiaelectronics.lk) *(automatically redirects to www)*
* **Admin Portal**: [https://www.asiaelectronics.lk/admin](https://www.asiaelectronics.lk/admin)

---

## 🧭 Client Guide: How to Manage Your Store

This section explains how store managers and business owners can manage day-to-day operations.

### 1. Accessing the Admin Dashboard
1. Go to `https://www.asiaelectronics.lk/admin` (or click **Login** in the top navigation).
2. Enter your store administrator email and password.
3. You will enter the **Admin Control Center**.

---

### 2. Managing Products & Inventory
* **View All Products**: Click **Products** in the admin sidebar.
* **Add a Product**:
  * Click **+ Add Product**.
  * Enter Product Name, Brand, SKU, Model, Category, Price in LKR (Rs.), and Initial Stock.
  * Upload product images or provide image URLs.
  * Enter technical specs and description.
  * Click **Save Product**.
* **Edit or Restock Existing Items**:
  * Click the edit icon next to any product to update prices or adjust stock levels.
  * Stock updates automatically log to an auditable **Inventory History**.
* **Low Stock Alerts**: Products with low or zero stock are highlighted in red/amber on the dashboard.

---

### 3. Managing Orders
* **View Customer Orders**: Click **Orders** in the admin sidebar to see recent purchases.
* **Order Details**: Click any order to see items ordered, customer delivery address, contact phone number, and payment method (Cash on Delivery or Bank Transfer).
* **Updating Order Status**:
  * Change status between: `Pending` ➔ `Processing` ➔ `Shipped` ➔ `Delivered` (or `Cancelled`).
  * Updating status automatically triggers an order confirmation email to the customer with delivery details!

---

### 4. Updating Homepage Banners & Promotions
* Go to **Banners** in the admin panel.
* You can create, edit, reorder, or toggle promotional hero banners on the homepage (e.g., Seasonal Sales, Smart Home Entertainment, Repair Parts).

---

### 5. Managing Brands & Categories
* Go to **Brands** or **Categories** in the admin panel.
* Upload official brand logos and categorize items (e.g. Components, Mobile Parts, LED Lighting, Home Appliances).

---

### 6. Customer Contact & WhatsApp Inquiries
* Customers can click the floating **WhatsApp** button anywhere on the store to immediately send inquiries about circuit components or TV repair parts directly to your official WhatsApp number (`+94 74 106 6017`).
* Incoming order notifications are sent to the store email (`aecpvt60@gmail.com`).

---

## 🛠️ Technical Overview (For Developers & IT)

### Technology Stack
* **Frontend**: React + TanStack Start (Server-Side Rendering SSR + Vite client SPA) + Tailwind CSS + Lucide Icons.
* **Backend**: Express.js REST API bundled as a high-performance Vercel Serverless Function under `/api/*`.
* **Database & Authentication**: Supabase (PostgreSQL, Service-Role Auth, RLS, Storage Buckets).
* **Hosting**: Vercel (Edge CDN + Automated SSL + Git Deployments).
* **Emails**: NodeMailer with secure SMTP (Gmail App Password).

---

### Project Structure
```text
asia-electronics/
├── frontend/                     # TanStack Start / React UI
│   ├── src/
│   │   ├── routes/              # Pages: Home, Shop, Product Details, Admin, Cart
│   │   ├── components/          # Reusable UI components & modals
│   │   └── services/            # API client services
│   └── package.json
├── backend/                      # Express REST API
│   ├── src/
│   │   ├── routes/              # Endpoints: /api/products, /api/orders, /api/auth
│   │   ├── data/                # Database migrations & Supabase client
│   │   ├── middleware/          # Security, CSRF protection, CORS
│   │   └── server.js            # Express application entrypoint
│   └── package.json
├── build-combined.mjs            # Unified builder script for Vercel
├── vercel.json                   # Vercel deployment configuration
├── DEPLOYMENT_GUIDE_VERCEL_SUPABASE.md  # Complete Disaster Recovery & Deployment Guide
└── README.md                     # This document
```

---

## 💻 Local Development Setup

To run the project locally on your computer:

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (version 20 or higher)
* Git

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/asiaelectronics/asia-electronics.git
cd asia-electronics

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Environment Variables
Create `.env` inside `backend/` (refer to `backend/.env.example`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080,http://localhost:5173,https://www.asiaelectronics.lk
STORE_URL=https://www.asiaelectronics.lk
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
SUPABASE_ANON_KEY=your-supabase-anon-key
ADMIN_EMAIL=aecpvt60@gmail.com
```

### 4. Running the App
In one terminal (Backend):
```bash
cd backend
npm run dev
```

In a second terminal (Frontend):
```bash
cd frontend
npm run dev
```
Open **`http://localhost:8080`** in your browser.

---

## 🚀 Deployment & Updates

The project is connected to **Vercel** with automatic CI/CD.
Any time changes are pushed to the `main` branch on GitHub:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```
Vercel automatically builds and deploys the unified frontend and backend to [https://www.asiaelectronics.lk](https://www.asiaelectronics.lk).

For a complete guide on re-deploying to a new Vercel or Supabase project in the future, please refer to:
👉 **[DEPLOYMENT_GUIDE_VERCEL_SUPABASE.md](./DEPLOYMENT_GUIDE_VERCEL_SUPABASE.md)**

---

## 📞 Support & Contacts
* **Company**: Asia Electronics & Cellular Pvt Ltd
* **Official Website**: [https://www.asiaelectronics.lk](https://www.asiaelectronics.lk)
* **Email**: [aecpvt60@gmail.com](mailto:aecpvt60@gmail.com)
* **Phone / WhatsApp**: +94 74 106 6017
