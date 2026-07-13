import { Hono } from 'hono';
import { getSql } from '../db';
import { requireAuth, type AuthVariables } from '../middleware/auth';

const ALLOWED_KEYS = new Set(['banners', 'cool_deals', 'promo_pages', 'brands_page']);

export const contentRoutes = new Hono<{ Variables: AuthVariables }>();

contentRoutes.get('/:key', async (c) => {
  const key = c.req.param('key');
  if (!ALLOWED_KEYS.has(key)) return c.json({ error: 'Unknown content key' }, 404);

  const sql = getSql();
  const rows = (await sql`
    select data from site_content where key = ${key} limit 1
  `) as { data: unknown }[];

  return c.json({ key, data: rows[0]?.data ?? null });
});

contentRoutes.put('/:key', requireAuth, async (c) => {
  const key = c.req.param('key');
  if (!ALLOWED_KEYS.has(key)) return c.json({ error: 'Unknown content key' }, 404);

  const body = await c.req.json<{ data?: unknown }>();
  if (body.data === undefined) return c.json({ error: 'data is required' }, 400);

  const sql = getSql();
  await sql`
    insert into site_content (key, data, updated_at)
    values (${key}, ${JSON.stringify(body.data)}::jsonb, now())
    on conflict (key) do update set
      data = excluded.data,
      updated_at = now()
  `;

  return c.json({ ok: true, key });
});
