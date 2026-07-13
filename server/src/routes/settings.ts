import { Hono } from 'hono';
import { getSql } from '../db';
import { requireAuth, type AuthVariables } from '../middleware/auth';

export const settingsRoutes = new Hono<{ Variables: AuthVariables }>();

settingsRoutes.get('/:key', async (c) => {
  const key = c.req.param('key');
  const sql = getSql();
  const rows = (await sql`
    select data from site_settings where key = ${key} limit 1
  `) as { data: unknown }[];
  return c.json({ key, data: rows[0]?.data ?? null });
});

settingsRoutes.put('/:key', requireAuth, async (c) => {
  const key = c.req.param('key');
  const body = await c.req.json<{ data?: unknown }>();
  if (body.data === undefined) return c.json({ error: 'data is required' }, 400);

  const sql = getSql();
  await sql`
    insert into site_settings (key, data, updated_at)
    values (${key}, ${JSON.stringify(body.data)}::jsonb, now())
    on conflict (key) do update set
      data = excluded.data,
      updated_at = now()
  `;
  return c.json({ ok: true, key });
});
