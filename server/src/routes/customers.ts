import { Hono } from 'hono';
import { getSql } from '../db';
import { requireAuth, type AuthVariables } from '../middleware/auth';

export const customerRoutes = new Hono<{ Variables: AuthVariables }>();

customerRoutes.use('*', requireAuth);

customerRoutes.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') || 100), 500);
  const sql = getSql();
  const rows = (await sql`
    select
      c.id::text as id,
      c.name,
      c.phone,
      c.email,
      c.address,
      c.created_at::text as created_at,
      c.updated_at::text as updated_at,
      (
        select count(*)::int from inquiries i where i.customer_id = c.id
      ) as inquiry_count
    from customers c
    order by c.updated_at desc
    limit ${limit}
  `) as Record<string, unknown>[];
  return c.json({ customers: rows });
});

customerRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  const rows = (await sql`
    select
      id::text as id, name, phone, email, address,
      created_at::text as created_at, updated_at::text as updated_at
    from customers
    where id = ${id}::uuid
    limit 1
  `) as Record<string, unknown>[];
  if (!rows[0]) return c.json({ error: 'Not found' }, 404);

  const inquiries = (await sql`
    select
      id::text as id, status, product_label, quantity, created_at::text as created_at
    from inquiries
    where customer_id = ${id}::uuid
    order by created_at desc
  `) as Record<string, unknown>[];

  return c.json({ customer: rows[0], inquiries });
});

customerRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  }>();
  const sql = getSql();
  await sql`
    update customers
    set
      name = coalesce(${body.name ?? null}, name),
      phone = coalesce(${body.phone ?? null}, phone),
      email = coalesce(${body.email ?? null}, email),
      address = coalesce(${body.address ?? null}, address),
      updated_at = now()
    where id = ${id}::uuid
  `;
  return c.json({ ok: true });
});
