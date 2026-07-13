import { Hono } from 'hono';
import { getSql } from '../db';
import { requireAuth, type AuthVariables } from '../middleware/auth';

type InquiryInput = {
  customerName?: string;
  productLabel?: string;
  productId?: string;
  quantity?: string;
  phone?: string;
  address?: string;
  propertyType?: string;
  floor?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  hp?: string;
  notes?: string;
  source?: string;
  status?: string;
};

async function upsertCustomer(input: {
  name: string;
  phone?: string | null;
  address?: string | null;
}): Promise<string | null> {
  const sql = getSql();
  const phone = input.phone?.trim() || null;
  const name = input.name.trim();
  const address = input.address?.trim() || null;
  if (!name) return null;

  if (phone) {
    const existing = (await sql`
      select id::text as id from customers where phone = ${phone} limit 1
    `) as { id: string }[];
    if (existing[0]) {
      await sql`
        update customers
        set name = ${name},
            address = coalesce(${address}, address),
            updated_at = now()
        where id = ${existing[0].id}::uuid
      `;
      return existing[0].id;
    }
  }

  const rows = (await sql`
    insert into customers (name, phone, address)
    values (${name}, ${phone}, ${address})
    returning id::text as id
  `) as { id: string }[];
  return rows[0]?.id ?? null;
}

const INQUIRY_SELECT = `
  id::text as id,
  status,
  customer_name,
  product_label,
  product_id,
  quantity,
  phone,
  address,
  property_type,
  floor,
  schedule_date,
  schedule_time,
  hp,
  notes,
  source,
  customer_id::text as customer_id,
  created_at::text as created_at,
  updated_at::text as updated_at
`;

export const inquiryRoutes = new Hono<{ Variables: AuthVariables }>();

/** Public create from storefront */
inquiryRoutes.post('/', async (c) => {
  const body = (await c.req.json()) as InquiryInput;
  const customerName = body.customerName?.trim() ?? '';
  if (!customerName) return c.json({ error: 'customerName is required' }, 400);

  const customerId = await upsertCustomer({
    name: customerName,
    phone: body.phone,
    address: body.address,
  });

  const sql = getSql();
  const rows = customerId
    ? ((await sql`
        insert into inquiries (
          status, customer_name, product_label, product_id, quantity,
          phone, address, property_type, floor, schedule_date, schedule_time,
          hp, notes, source, customer_id
        ) values (
          'pending',
          ${customerName},
          ${body.productLabel ?? null},
          ${body.productId ?? null},
          ${body.quantity ?? null},
          ${body.phone ?? null},
          ${body.address ?? null},
          ${body.propertyType ?? null},
          ${body.floor ?? null},
          ${body.scheduleDate ?? null},
          ${body.scheduleTime ?? null},
          ${body.hp ?? null},
          ${body.notes ?? null},
          ${body.source ?? 'storefront'},
          ${customerId}::uuid
        )
        returning id::text as id
      `) as { id: string }[])
    : ((await sql`
        insert into inquiries (
          status, customer_name, product_label, product_id, quantity,
          phone, address, property_type, floor, schedule_date, schedule_time,
          hp, notes, source
        ) values (
          'pending',
          ${customerName},
          ${body.productLabel ?? null},
          ${body.productId ?? null},
          ${body.quantity ?? null},
          ${body.phone ?? null},
          ${body.address ?? null},
          ${body.propertyType ?? null},
          ${body.floor ?? null},
          ${body.scheduleDate ?? null},
          ${body.scheduleTime ?? null},
          ${body.hp ?? null},
          ${body.notes ?? null},
          ${body.source ?? 'storefront'}
        )
        returning id::text as id
      `) as { id: string }[]);

  return c.json({ ok: true, id: rows[0]?.id, customerId });
});

inquiryRoutes.get('/', requireAuth, async (c) => {
  const limit = Math.min(Number(c.req.query('limit') || 50), 200);
  const status = c.req.query('status')?.trim();
  const sql = getSql();

  const rows = status
    ? ((await sql`
        select
          id::text as id, status, customer_name, product_label, product_id, quantity,
          phone, address, property_type, floor, schedule_date, schedule_time,
          hp, notes, source, customer_id::text as customer_id,
          created_at::text as created_at, updated_at::text as updated_at
        from inquiries
        where status = ${status}
        order by created_at desc
        limit ${limit}
      `) as Record<string, unknown>[])
    : ((await sql`
        select
          id::text as id, status, customer_name, product_label, product_id, quantity,
          phone, address, property_type, floor, schedule_date, schedule_time,
          hp, notes, source, customer_id::text as customer_id,
          created_at::text as created_at, updated_at::text as updated_at
        from inquiries
        order by created_at desc
        limit ${limit}
      `) as Record<string, unknown>[]);

  return c.json({ inquiries: rows });
});

inquiryRoutes.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  const rows = (await sql`
    select
      id::text as id, status, customer_name, product_label, product_id, quantity,
      phone, address, property_type, floor, schedule_date, schedule_time,
      hp, notes, source, customer_id::text as customer_id,
      created_at::text as created_at, updated_at::text as updated_at
    from inquiries
    where id = ${id}::uuid
    limit 1
  `) as Record<string, unknown>[];
  if (!rows[0]) return c.json({ error: 'Not found' }, 404);
  return c.json({ inquiry: rows[0] });
});

inquiryRoutes.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json()) as { status?: string; notes?: string };
  const sql = getSql();

  if (body.status) {
    await sql`
      update inquiries
      set status = ${body.status}, updated_at = now()
      where id = ${id}::uuid
    `;
  }
  if (body.notes !== undefined) {
    await sql`
      update inquiries
      set notes = ${body.notes}, updated_at = now()
      where id = ${id}::uuid
    `;
  }
  return c.json({ ok: true });
});

inquiryRoutes.patch('/:id/complete', requireAuth, async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  await sql`
    update inquiries
    set status = 'completed', updated_at = now()
    where id = ${id}::uuid
  `;
  return c.json({ ok: true });
});
