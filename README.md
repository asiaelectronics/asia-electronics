# Asia Electronics & Cellular

Asia Electronics & Cellular is a full-stack Sri Lankan electronics catalogue and quotation-commerce platform. Customers can browse products, manage a browser-persisted cart, request quotations, track an order, create accounts, and submit wholesale requests. Store staff use a protected administration area to manage the catalogue, inventory, orders, content, and wholesale enquiries.

The application follows a quotation-first sales process: submitting an order creates a quotation request instead of taking a payment. Inventory is reserved when the request is created and restored once if an administrator cancels it.

Live storefront: <https://www.asiaelectronics.lk>

## Tech stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Frontend | TypeScript, React 19, TanStack Start/Router, Vite 8 | SSR-capable storefront and admin UI |
| UI | Tailwind CSS 4, Radix UI, Lucide, Motion, Sonner | Components, styling, icons, animation, notifications |
| Client state | React Context, `useReducer`, TanStack Query | Authentication, cart, settings, cached server data |
| Backend | Node.js, Express 4 | JSON REST API and business rules |
| Data and identity | Supabase PostgreSQL, Auth, Storage | Application data, sessions, asset storage |
| Email | Nodemailer / SMTP | Order and wholesale status notifications |
| Deployment | Vercel, Docker / Docker Compose | Serverless production and local containers |
| Quality | ESLint, Prettier, Vitest, Testing Library | Linting, formatting, frontend tests |

## Prerequisites

- Git
- Node.js **22 LTS** and npm. The Docker images use Node 22; this is the supported baseline.
- A Supabase project and a server-only **service-role** key.
- SMTP credentials when email notifications are required.
- Optional: Docker Desktop with Docker Compose.
- Optional: Python 3.9+ and `pip` for MkDocs.

## Getting started

### Clone and install

```bash
git clone https://github.com/asiaelectronics/asia-electronics.git
cd asia-electronics

cd backend
npm ci

cd ../frontend
npm ci
```

### Configure the backend

```bash
cd ../backend
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env`. Replace the placeholders; never expose server secrets to the frontend.

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port, default `5000`. |
| `NODE_ENV` | Yes | `development` locally, `production` when deployed. |
| `FRONTEND_URL` | Yes | Comma-separated browser origins allowed to call the API. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_SERVICE_KEY` | Yes | Server-only Supabase service-role key. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initially | Bootstrap the first administrator when none exists. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | For email | SMTP delivery configuration. |
| `PUBLIC_API_URL` | Recommended | Canonical backend origin for permanent wholesale attachment links. |
| `WHOLESALE_FILE_LINK_SECRET` | Recommended | Stable HMAC secret for private wholesale links. Defaults to the service key when omitted. |

### Configure the frontend

```bash
cd ../frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

### Create the database and seed data

1. Open **SQL Editor** in Supabase.
2. Run [backend/src/data/migration.sql](backend/src/data/migration.sql) in full. It creates tables, indexes, SQL functions, and category seed data.
3. From `backend/`, optionally seed catalogue data and the initial administrator:

```bash
npm run seed
npm run seed:admin
```

These scripts use the service-role key; use care when targeting production.

### Start development

Run the backend and frontend in separate terminals:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). The API health endpoint is `http://localhost:5000/api/health`.

### Docker

Create `backend/.env`, then run:

```bash
docker compose up --build
```

The frontend is at `http://localhost:3000`; API health is at `http://localhost:5000/health`. `VITE_API_URL` is compiled into the frontend image, so set the Docker build argument to the public API URL for non-local deployments.

## Available commands

Run commands from the listed directory.

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm run dev` | Start Express with watch mode. |
| `backend` | `npm start` | Start the production Express process. |
| `backend` | `npm run seed` | Seed Supabase catalogue data. |
| `backend` | `npm run seed:admin` | Create or promote the bootstrap admin. |
| `frontend` | `npm run dev` | Start Vite/TanStack Start development server. |
| `frontend` | `npm run build` | Produce the production SSR/client build. |
| `frontend` | `npm run preview` | Serve a completed build. |
| `frontend` | `npm run lint` | Run ESLint. |
| `frontend` | `npm test` | Run Vitest once. |
| `frontend` | `npm run test:watch` | Run Vitest in watch mode. |
| `frontend` | `npm run format` | Apply Prettier. |
| `frontend` | `npm run sitemap` | Generate the sitemap. |
| root | `docker compose up --build` | Build and run both services. |

## Folder structure

```text
asia-electronics/
├── backend/
│   ├── api/                     # Vercel adapters
│   ├── src/
│   │   ├── data/                # Supabase client, schema, persistence helpers
│   │   ├── middleware/          # Auth, roles, security controls
│   │   ├── routes/              # Express resource routers
│   │   ├── scripts/             # Bootstrap and maintenance scripts
│   │   ├── services/            # Email and attachment-link services
│   │   └── server.js            # Express application entrypoint
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Storefront, admin, and shared UI
│   │   ├── context/             # Auth, cart, and settings providers
│   │   ├── routes/              # TanStack file-based routes
│   │   ├── services/            # Browser API clients
│   │   ├── router.tsx           # Router configuration
│   │   └── server.ts            # SSR server entrypoint
│   ├── .env.example
│   ├── vite.config.ts
│   └── package.json
├── docs/                        # MkDocs source documentation
├── docker-compose.yml            # Local two-service stack
├── mkdocs.yml                    # Material for MkDocs configuration
└── README.md                     # Project onboarding guide
```

## Documentation

- [Documentation home](docs/index.md)
- [Architecture and system design](docs/architecture.md)
- [API and module reference](docs/api.md)

For a fresh Windows PowerShell clone, preview the documentation with:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-docs.txt
.\.venv\Scripts\python.exe -m mkdocs serve
```

## Production notes

Set `VITE_API_URL` to the public `/api` endpoint in the frontend deployment and `PUBLIC_API_URL` to the backend’s canonical origin. Deploy the SQL schema before relying on inventory creation, adjustment, or cancellation restoration.
