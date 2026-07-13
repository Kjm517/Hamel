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

## What is dynamic (Neon)

- Products, tags, employees, auth
- CMS: banners, cool deals, promo pages, brands page (`site_content`)
- Inquiries (storefront AI chat posts to API), customers, messages
- Dashboard KPIs, analytics, store settings
- Pageview beacons (`site_events`)
