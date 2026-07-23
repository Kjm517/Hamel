# Hamel Trading

This is a code bundle for Hamel Trading. The original project is available at https://www.figma.com/design/fnsUYKlJvjLwlPUVgIw7Ci/Hamel-Trading.

## Stack

- **Frontend:** Vite + React + TypeScript (this folder)
- **Backend:** Hono API in [`server/`](server/) → **Neon** Postgres + JWT auth

## Running the code

### 1. Neon + API

1. Create a Neon project and copy the connection string.
2. In `server/`, copy `.env.example` → `.env` and set `DATABASE_URL` + `JWT_SECRET`.
3. Run SQL in the Neon SQL Editor (in order):
   - [`server/sql/001_schema.sql`](server/sql/001_schema.sql)
   - [`server/sql/002_cms_and_ops.sql`](server/sql/002_cms_and_ops.sql)
4. Install, seed admin, and start the API:

```bash
cd server
npm i
npm run seed:admin
npm run dev
```

Default admin: `manager` / `HamelAdmin1!` (or `manager@hamel.example`).

### 2. Frontend

In a **second** terminal:

```bash
cd Main
npm i
npm run dev
```

Vite proxies `/api` and `/uploads` to `http://localhost:8787`.

Open http://localhost:5173 — admin at `/admin/login`.

## Security scanning (free)

GitHub Actions run **Gitleaks**, **Semgrep**, **Trivy**, and **CodeQL** on push/PR.

- Guide: [`docs/SECURITY_SCANNING.md`](docs/SECURITY_SCANNING.md)
- Local (Docker): `npm run security:scan`

## Deploy storefront to Vercel (partial / UI fixes)

Vite + Hono API deploy together: `npm run build` builds the SPA and bundles the API into `api/_app.mjs` for the serverless function.

### 1. Push this repo, then import in Vercel

- Root directory: **`.`** (this `Main` folder is the git root)
- Framework preset: **Vite** (or leave as detected)
- Build command: `npm run build` (Vite + API bundle)
- Output: `dist`

`vercel.json` already sets SPA rewrites so `/admin`, `/products`, etc. work on refresh.

### 2. Vercel environment variables (required for admin / API)

Leave `VITE_API_URL` **empty** so the browser calls same-origin `/api` (serverless on Vercel).

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | Long random secret |
| `PUBLIC_BASE_URL` | Site origin only, e.g. `https://hamel-seven.vercel.app` (**not** `/admin/login`) |
| `NODEJS_HELPERS` | `0` (**exactly** `0` — not `.` or empty; login POST fails without this) |
| `CORS_ORIGINS` | Same Vercel URL (optional; `.vercel.app` is allowed automatically) |

Optional AI/Messenger vars: `AI_PROVIDER`, `GEMINI_API_KEY`, `MESSENGER_*`, etc.

Redeploy after saving env vars. Check `https://your-app.vercel.app/api/health` (should return JSON, not a Vercel crash page), then `/admin/login` with `manager` / `HamelAdmin1!`.

### 3. API CORS (only if API is on a separate host)

On a separate API host `.env`:

```env
CORS_ORIGINS=https://your-app.vercel.app
PUBLIC_BASE_URL=https://your-app.vercel.app
```

And set Vercel `VITE_API_URL` to that API origin.

## What is dynamic (Neon)

- Products, tags, employees, auth
- CMS: banners, cool deals, promo pages, brands page (`site_content`)
- Inquiries (storefront AI chat posts to API), customers, messages
- Dashboard KPIs, analytics, store settings
- Pageview beacons (`site_events`)
