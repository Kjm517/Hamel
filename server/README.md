# Hamel API (Neon + JWT)

Small Hono server that replaces Supabase for this project.

## Setup

1. Create a Neon project and copy the connection string.
2. Copy `.env.example` → `.env` and set `DATABASE_URL` + `JWT_SECRET`.
3. Run in Neon SQL Editor (in order):
   - [`sql/001_schema.sql`](sql/001_schema.sql)
   - [`sql/002_cms_and_ops.sql`](sql/002_cms_and_ops.sql)
   - [`sql/003_messenger.sql`](sql/003_messenger.sql) (Messenger Page confirmations)
4. Install and seed the admin user:

```bash
cd Main/server
npm i
npm run seed:admin
```

Default login (change after first sign-in):

- email / username: `manager@hamel.example` / `manager`
- password: `HamelAdmin1!`

5. Start the API:

```bash
npm run dev
```

API: `http://localhost:8787` — Vite proxies `/api` and `/uploads` here.

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | no |
| GET | `/api/auth/me` | yes |
| GET/PUT | `/api/content/:key` | write yes |
| GET/PUT | `/api/settings/:key` | write yes |
| GET/POST/PATCH | `/api/inquiries` | POST public |
| GET/PATCH | `/api/customers` | yes |
| GET/POST/PATCH | `/api/messages` | POST public |
| POST | `/api/events` | no |
| GET | `/api/analytics/summary` | yes |
| GET | `/api/dashboard/summary` | yes |
| GET/POST/PUT/DELETE | `/api/products` | write yes |
| GET/PUT/DELETE | `/api/product-tags` | write yes |
| GET/POST/PATCH/DELETE | `/api/employees` | manager |
| POST | `/api/uploads` | yes |
| GET | `/api/messenger/status` | no |
| GET/POST | `/api/messenger/webhook` | Meta verify / events |

## Messenger (Faith Hugs–style Page confirmations)

When configured, **Continue on Messenger** opens `m.me/…?ref=inquiry_<id>`. The **Page** then sends the inquiry summary into the customer’s Messenger thread (grey bubble — customer does not tap Send).

1. Create a Meta app → add **Messenger** → generate a **Page access token** for **Hamel Trading** (not FCM).
2. Set in `.env`:
   - `MESSENGER_PAGE_ACCESS_TOKEN`
   - `MESSENGER_VERIFY_TOKEN` (any secret string, e.g. `hamel_messenger_verify`)
   - `MESSENGER_PAGE_USERNAME=hameltrading`
3. Run `sql/003_messenger.sql` and `sql/009_messenger_handoff.sql` in Neon.
4. Expose the API with HTTPS (production domain or Cloudflare tunnel / ngrok for local).
5. In Meta webhook settings:
   - Callback URL: `https://YOUR_PUBLIC_API/api/messenger/webhook`
   - Verify token: same as `MESSENGER_VERIFY_TOKEN`
   - Subscribe the **Hamel Trading** page to: `messages`, `messaging_referrals`, `messaging_postbacks`
6. Restart the API. `/api/messenger/status` should return `{ "configured": true, "pageName": "Hamel Trading", ... }`.

**How it works**
1. Customer finishes inquiry → site calls `/api/messenger/expect`.
2. Site opens `https://m.me/hameltrading?ref=inquiry_<uuid>`.
3. Meta webhook (preferred) OR `/api/messenger/deliver` polling finds the PSID and the Page sends the details.

Until the token is set, the storefront falls back to clipboard + prefilled draft.