import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { getSql } from '../db';
import { parseLoyaltyTierInput } from '../customer-code';
import { requireAuth, type AuthVariables } from '../middleware/auth';
import {
  claimVoucherForAccount,
  deleteClaimForAccount,
  findAccountIdByCustomerId,
  listClaimsForAccount,
  mapClaimPublic,
} from '../voucher-claims';

export const customerRoutes = new Hono<{ Variables: AuthVariables }>();

customerRoutes.use('*', requireAuth);

type CustomerListRow = {
  id: string;
  customer_code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  loyalty_tier: string | null;
  created_at: string;
  updated_at: string;
  inquiry_count: number;
  has_account: boolean;
  account_id: string | null;
};

customerRoutes.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') || 100), 500);
  const sql = getSql();
  const rows = (await sql`
    select
      c.id::text as id,
      c.customer_code,
      c.name,
      c.phone,
      c.email,
      c.address,
      c.loyalty_tier,
      c.created_at::text as created_at,
      c.updated_at::text as updated_at,
      (
        select count(*)::int from inquiries i where i.customer_id = c.id
      ) as inquiry_count,
      (ca.id is not null) as has_account,
      ca.id::text as account_id
    from customers c
    left join customer_accounts ca on ca.customer_id = c.id
    order by c.updated_at desc
    limit ${limit}
  `) as CustomerListRow[];
  return c.json({ customers: rows });
});

customerRoutes.get('/:id/claims', async (c) => {
  const id = c.req.param('id');
  const accountId = await findAccountIdByCustomerId(id);
  if (!accountId) {
    return c.json({ claims: [], hasAccount: false });
  }
  const rows = await listClaimsForAccount(accountId);
  return c.json({ claims: rows.map(mapClaimPublic), hasAccount: true });
});

customerRoutes.post('/:id/claims', async (c) => {
  const id = c.req.param('id');
  const accountId = await findAccountIdByCustomerId(id);
  if (!accountId) {
    return c.json(
      { error: 'This customer has no storefront account. They must register before vouchers can be assigned.' },
      400
    );
  }

  const body = await c.req.json<{
    voucherId?: string;
    title?: string;
    voucherCode?: string;
  }>();

  let title = body.title?.trim() ?? '';
  let voucherCode = body.voucherCode?.trim().toUpperCase() || undefined;
  let cardId = '';

  if (body.voucherId?.trim()) {
    const voucherId = body.voucherId.trim();
    // Load CMS vouchers from site_content
    const sql = getSql();
    const contentRows = (await sql`
      select data from site_content where key = 'vouchers' limit 1
    `) as { data: unknown }[];
    const raw = contentRows[0]?.data as { vouchers?: Array<Record<string, unknown>> } | null;
    const list = Array.isArray(raw?.vouchers) ? raw!.vouchers! : [];
    const found = list.find((v) => String(v.id) === voucherId);
    if (!found) {
      return c.json({ error: 'Voucher not found in catalog.' }, 404);
    }
    title = String(found.label || found.code || 'Voucher');
    voucherCode = String(found.code || '').trim().toUpperCase() || undefined;
    cardId = `admin:${voucherId}`;
  } else {
    if (!title) {
      return c.json({ error: 'title is required for a custom perk.' }, 400);
    }
    cardId = `admin:custom:${randomUUID()}`;
  }

  const row = await claimVoucherForAccount({
    customerAccountId: accountId,
    cardId,
    title,
    voucherCode,
    source: 'admin',
  });

  return c.json({ ok: true, claim: mapClaimPublic(row) });
});

customerRoutes.delete('/:id/claims/:claimId', async (c) => {
  const id = c.req.param('id');
  const claimId = c.req.param('claimId');
  const accountId = await findAccountIdByCustomerId(id);
  if (!accountId) {
    return c.json({ error: 'No storefront account for this customer.' }, 400);
  }
  const ok = await deleteClaimForAccount(accountId, claimId);
  if (!ok) return c.json({ error: 'Claim not found' }, 404);
  return c.json({ ok: true });
});

customerRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  const rows = (await sql`
    select
      c.id::text as id,
      c.customer_code,
      c.name,
      c.phone,
      c.email,
      c.address,
      c.loyalty_tier,
      c.created_at::text as created_at,
      c.updated_at::text as updated_at,
      (
        select count(*)::int from inquiries i where i.customer_id = c.id
      ) as inquiry_count,
      (ca.id is not null) as has_account,
      ca.id::text as account_id
    from customers c
    left join customer_accounts ca on ca.customer_id = c.id
    where c.id = ${id}::uuid
    limit 1
  `) as CustomerListRow[];
  if (!rows[0]) return c.json({ error: 'Not found' }, 404);

  const inquiries = (await sql`
    select
      id::text as id, status, product_label, quantity, created_at::text as created_at
    from inquiries
    where customer_id = ${id}::uuid
    order by created_at desc
  `) as Record<string, unknown>[];

  const accountId = rows[0].account_id;
  const claims = accountId
    ? (await listClaimsForAccount(accountId)).map(mapClaimPublic)
    : [];

  return c.json({
    customer: rows[0],
    inquiries,
    claims,
  });
});

customerRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    loyaltyTier?: string | null;
  }>();

  let loyaltyTier: string | null | undefined;
  try {
    loyaltyTier = parseLoyaltyTierInput(body.loyaltyTier);
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : 'Invalid loyalty tier.' },
      400
    );
  }

  const sql = getSql();
  const existing = (await sql`
    select
      id::text as id,
      name,
      phone,
      email,
      address,
      loyalty_tier
    from customers
    where id = ${id}::uuid
    limit 1
  `) as {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    loyalty_tier: string | null;
  }[];
  if (!existing[0]) return c.json({ error: 'Not found' }, 404);

  const nextName =
    body.name !== undefined ? body.name.trim() : existing[0].name;
  if (!nextName) return c.json({ error: 'Name is required.' }, 400);

  const nextPhone =
    body.phone === undefined
      ? existing[0].phone
      : body.phone === null || String(body.phone).trim() === ''
        ? null
        : String(body.phone).trim();
  const nextEmail =
    body.email === undefined
      ? existing[0].email
      : body.email === null || String(body.email).trim() === ''
        ? null
        : String(body.email).trim();
  const nextAddress =
    body.address === undefined
      ? existing[0].address
      : body.address === null || String(body.address).trim() === ''
        ? null
        : String(body.address).trim();
  const nextLoyalty =
    loyaltyTier === undefined ? existing[0].loyalty_tier : loyaltyTier;

  await sql`
    update customers
    set
      name = ${nextName},
      phone = ${nextPhone},
      email = ${nextEmail},
      address = ${nextAddress},
      loyalty_tier = ${nextLoyalty},
      updated_at = now()
    where id = ${id}::uuid
  `;

  const refreshed = (await sql`
    select
      c.id::text as id,
      c.customer_code,
      c.name,
      c.phone,
      c.email,
      c.address,
      c.loyalty_tier,
      c.created_at::text as created_at,
      c.updated_at::text as updated_at,
      (
        select count(*)::int from inquiries i where i.customer_id = c.id
      ) as inquiry_count,
      (ca.id is not null) as has_account,
      ca.id::text as account_id
    from customers c
    left join customer_accounts ca on ca.customer_id = c.id
    where c.id = ${id}::uuid
    limit 1
  `) as CustomerListRow[];

  if (!refreshed[0]) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true, customer: refreshed[0] });
});

customerRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  const rows = (await sql`
    delete from customers where id = ${id}::uuid returning id::text as id
  `) as { id: string }[];
  if (!rows[0]) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true, id: rows[0].id });
});
