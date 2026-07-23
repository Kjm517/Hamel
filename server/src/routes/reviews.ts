import { Hono } from 'hono';
import { getSql } from '../db';
import type { AuthVariables } from '../middleware/auth';
import {
  findCustomerAccountById,
  verifyCustomerToken,
  type DbCustomerAccount,
} from '../customer-auth';

type ReviewInput = {
  productId?: string;
  name?: string;
  email?: string;
  rating?: number;
  roomSize?: string;
  comment?: string;
  electricityImpact?: string;
  tags?: string[];
  anonymous?: boolean;
  images?: string[];
};

type LoyaltyTier = 'bronze' | 'silver' | 'gold';

function formatReviewDate(d = new Date()): string {
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeLoyaltyTier(raw: unknown): LoyaltyTier | null {
  if (raw === 'bronze' || raw === 'silver' || raw === 'gold') return raw;
  return null;
}

export async function optionalCustomerAccount(
  authorizationHeader: string | undefined
): Promise<DbCustomerAccount | null> {
  const match = (authorizationHeader || '').match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    const payload = await verifyCustomerToken(match[1]);
    const account = await findCustomerAccountById(payload.sub);
    if (!account || account.status !== 'active') return null;
    return account;
  } catch {
    return null;
  }
}

/** Review IDs this account has already marked Helpful. */
export async function votedReviewIdsForAccount(
  accountId: string,
  reviewIds: string[]
): Promise<Set<string>> {
  const unique = [...new Set(reviewIds.map((id) => id.trim()).filter(Boolean))];
  if (!unique.length) return new Set();

  const sql = getSql();
  const rows = (await sql`
    select review_id::text as review_id
    from review_helpful_votes
    where customer_account_id = ${accountId}::uuid
      and review_id::text = any(${unique})
  `) as { review_id: string }[];

  return new Set(rows.map((r) => r.review_id));
}

/** Review IDs this guest browser key has already marked Helpful. */
export async function votedReviewIdsForGuest(
  guestKey: string,
  reviewIds: string[]
): Promise<Set<string>> {
  const key = guestKey.trim().slice(0, 80);
  const unique = [...new Set(reviewIds.map((id) => id.trim()).filter(Boolean))];
  if (!key || !unique.length) return new Set();

  const sql = getSql();
  const rows = (await sql`
    select review_id::text as review_id
    from review_helpful_votes
    where guest_key = ${key}
      and review_id::text = any(${unique})
  `) as { review_id: string }[];

  return new Set(rows.map((r) => r.review_id));
}

function normalizeGuestKey(raw: string | undefined | null): string | null {
  const key = (raw || '').trim().slice(0, 80);
  if (!key || key.length < 8) return null;
  return key;
}

/** Resolve loyalty badges for reviewer emails (account or CRM email). */
export async function loyaltyTiersByEmails(
  emails: string[]
): Promise<Map<string, LoyaltyTier>> {
  const map = new Map<string, LoyaltyTier>();
  const unique = [
    ...new Set(
      emails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes('@'))
    ),
  ];
  if (!unique.length) return map;

  const sql = getSql();
  const rows = (await sql`
    select
      lower(ca.email) as email,
      c.loyalty_tier
    from customer_accounts ca
    join customers c on c.id = ca.customer_id
    where lower(ca.email) = any(${unique})
      and c.loyalty_tier is not null
    union
    select
      lower(c.email) as email,
      c.loyalty_tier
    from customers c
    where c.email is not null
      and lower(c.email) = any(${unique})
      and c.loyalty_tier is not null
  `) as { email: string; loyalty_tier: string | null }[];

  for (const row of rows) {
    const tier = normalizeLoyaltyTier(row.loyalty_tier);
    if (tier && row.email) map.set(row.email, tier);
  }
  return map;
}

export async function loyaltyTierForEmail(email: string): Promise<LoyaltyTier | null> {
  const map = await loyaltyTiersByEmails([email]);
  return map.get(email.trim().toLowerCase()) ?? null;
}

async function loyaltyTierByAccountIds(
  accountIds: string[]
): Promise<Map<string, LoyaltyTier>> {
  const map = new Map<string, LoyaltyTier>();
  const unique = [...new Set(accountIds.map((id) => id.trim()).filter(Boolean))];
  if (!unique.length) return map;

  const sql = getSql();
  for (const id of unique) {
    const rows = (await sql`
      select
        ca.id::text as id,
        c.loyalty_tier
      from customer_accounts ca
      join customers c on c.id = ca.customer_id
      where ca.id = ${id}::uuid
        and c.loyalty_tier is not null
      limit 1
    `) as { id: string; loyalty_tier: string | null }[];
    const tier = normalizeLoyaltyTier(rows[0]?.loyalty_tier);
    if (tier && rows[0]) map.set(rows[0].id, tier);
  }
  return map;
}

export type ProductReviewStats = { rating: number; reviews: number };

export async function getProductReviewStats(productId: string): Promise<ProductReviewStats> {
  const sql = getSql();
  const stats = (await sql`
    select
      coalesce(avg((data->>'rating')::numeric), 0)::float8 as avg_rating,
      count(*)::int as review_count
    from customer_reviews
    where product_id = ${productId}
  `) as { avg_rating: number; review_count: number }[];

  const avg = stats[0]?.avg_rating ?? 0;
  const count = stats[0]?.review_count ?? 0;
  return {
    rating: count > 0 ? Math.round(avg * 10) / 10 : 0,
    reviews: count,
  };
}

export async function getAllProductReviewStats(): Promise<Map<string, ProductReviewStats>> {
  const sql = getSql();
  const rows = (await sql`
    select
      product_id,
      coalesce(avg((data->>'rating')::numeric), 0)::float8 as avg_rating,
      count(*)::int as review_count
    from customer_reviews
    group by product_id
  `) as { product_id: string; avg_rating: number; review_count: number }[];

  const map = new Map<string, ProductReviewStats>();
  for (const row of rows) {
    const count = row.review_count ?? 0;
    map.set(row.product_id, {
      rating: count > 0 ? Math.round(row.avg_rating * 10) / 10 : 0,
      reviews: count,
    });
  }
  return map;
}

export function withLiveReviewStats<T extends Record<string, unknown>>(
  product: T,
  stats: ProductReviewStats | undefined
): T & ProductReviewStats {
  return {
    ...product,
    rating: stats?.rating ?? 0,
    reviews: stats?.reviews ?? 0,
  };
}

export async function syncProductReviewStats(productId: string): Promise<void> {
  const sql = getSql();
  const { rating, reviews } = await getProductReviewStats(productId);

  const products = (await sql`
    select data from products where id = ${productId} limit 1
  `) as { data: Record<string, unknown> }[];
  const product = products[0];
  if (!product) return;

  const next = {
    ...product.data,
    id: productId,
    rating,
    reviews,
  };

  await sql`
    update products
    set data = ${JSON.stringify(next)}::jsonb, updated_at = now()
    where id = ${productId}
  `;
}

export async function syncAllProductReviewStats(): Promise<number> {
  const sql = getSql();
  const products = (await sql`select id from products`) as { id: string }[];
  for (const { id } of products) {
    await syncProductReviewStats(id);
  }
  return products.length;
}

export function mapReviewRow(
  row: {
    id: string;
    data: Record<string, unknown>;
    created_at?: string;
  },
  liveLoyaltyTier?: LoyaltyTier | null
): Record<string, unknown> {
  const data = row.data ?? {};
  const date =
    typeof data.date === 'string' && data.date.trim()
      ? data.date
      : row.created_at
        ? formatReviewDate(new Date(row.created_at))
        : formatReviewDate();

  const tags = Array.isArray(data.tags)
    ? data.tags.filter((t): t is string => typeof t === 'string')
    : [];
  const images = Array.isArray(data.images)
    ? data.images.filter((t): t is string => typeof t === 'string')
    : [];

  const anonymous = Boolean(data.anonymous);
  const storedTier = normalizeLoyaltyTier(data.loyaltyTier ?? data.loyalty_tier);
  const loyaltyTier = anonymous ? null : (liveLoyaltyTier ?? storedTier);

  return {
    ...data,
    id: row.id,
    productId: data.productId ?? undefined,
    date,
    tags,
    images,
    helpfulCount: Number(data.helpfulCount) || 0,
    helpfulByMe: false,
    anonymous,
    loyaltyTier,
  };
}

export async function mapReviewRowsWithLoyalty(
  rows: { id: string; data: Record<string, unknown>; created_at?: string }[],
  options?: { viewerAccountId?: string | null; guestKey?: string | null }
): Promise<Record<string, unknown>[]> {
  const emails = rows
    .map((r) => (typeof r.data?.email === 'string' ? r.data.email : ''))
    .filter(Boolean);
  const accountIds = rows
    .map((r) =>
      typeof r.data?.customerAccountId === 'string' ? r.data.customerAccountId : ''
    )
    .filter(Boolean);

  const reviewIds = rows.map((r) => r.id);
  const guestKey = normalizeGuestKey(options?.guestKey ?? null);

  const [loyaltyByEmail, loyaltyByAccount, votedIds] = await Promise.all([
    loyaltyTiersByEmails(emails),
    loyaltyTierByAccountIds(accountIds),
    options?.viewerAccountId
      ? votedReviewIdsForAccount(options.viewerAccountId, reviewIds)
      : guestKey
        ? votedReviewIdsForGuest(guestKey, reviewIds)
        : Promise.resolve(new Set<string>()),
  ]);

  return rows.map((row) => {
    const email =
      typeof row.data?.email === 'string' ? row.data.email.trim().toLowerCase() : '';
    const accountId =
      typeof row.data?.customerAccountId === 'string'
        ? row.data.customerAccountId.trim()
        : '';
    const live =
      (accountId ? loyaltyByAccount.get(accountId) : undefined) ??
      (email ? loyaltyByEmail.get(email) : undefined) ??
      null;
    return {
      ...mapReviewRow(row, live),
      helpfulByMe: votedIds.has(row.id),
    };
  });
}

export const reviewRoutes = new Hono<{ Variables: AuthVariables }>();

reviewRoutes.post('/', async (c) => {
  const body = await c.req.json() as ReviewInput;
  const productId = body.productId?.trim() ?? '';
  const anonymous = Boolean(body.anonymous);
  const name = anonymous ? 'Anonymous' : (body.name?.trim() ?? '');
  let email = body.email?.trim() ?? '';
  const comment = body.comment?.trim() ?? '';
  const rating = Number(body.rating);
  const roomSize = body.roomSize?.trim() || '';
  const electricityImpact = body.electricityImpact?.trim() || '';
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8)
    : [];
  const images = Array.isArray(body.images)
    ? body.images.map((t) => String(t).trim()).filter(Boolean).slice(0, 5)
    : [];

  if (!productId) return c.json({ error: 'productId is required' }, 400);
  if (!anonymous && !name) return c.json({ error: 'Nickname is required' }, 400);
  if (!email) return c.json({ error: 'Email is required' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Enter a valid email address' }, 400);
  }
  if (!comment) return c.json({ error: 'Review comment is required' }, 400);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400);
  }

  const sql = getSql();
  const products = (await sql`
    select id from products where id = ${productId} limit 1
  `) as { id: string }[];
  if (!products[0]) return c.json({ error: 'Product not found' }, 404);

  const account = await optionalCustomerAccount(c.req.header('authorization'));
  let loyaltyTier: LoyaltyTier | null = null;
  let customerAccountId: string | undefined;
  if (!anonymous && account) {
    email = account.email;
    customerAccountId = account.id;
    loyaltyTier = normalizeLoyaltyTier(account.loyalty_tier);
  } else if (!anonymous) {
    loyaltyTier = await loyaltyTierForEmail(email);
  }

  const date = formatReviewDate();
  const payload = {
    productId,
    name,
    email,
    rating: Math.round(rating),
    roomSize,
    comment,
    electricityImpact,
    tags,
    images,
    anonymous,
    helpfulCount: 0,
    date,
    loyaltyTier,
    ...(customerAccountId ? { customerAccountId } : {}),
  };

  const rows = (await sql`
    insert into customer_reviews (product_id, data)
    values (${productId}, ${JSON.stringify(payload)}::jsonb)
    returning id::text as id, data, created_at::text as created_at
  `) as { id: string; data: Record<string, unknown>; created_at: string }[];

  const row = rows[0];
  if (!row) return c.json({ error: 'Failed to save review' }, 500);

  const withId = { ...payload, id: row.id };
  await sql`
    update customer_reviews
    set data = ${JSON.stringify(withId)}::jsonb
    where id = ${row.id}::uuid
  `;

  await syncProductReviewStats(productId);

  return c.json(
    { review: mapReviewRow({ ...row, data: withId }, loyaltyTier) },
    201
  );
});

reviewRoutes.get('/', async (c) => {
  const productId = c.req.query('productId')?.trim();
  if (!productId) return c.json({ error: 'productId is required' }, 400);

  const sql = getSql();
  const rows = (await sql`
    select id::text as id, data, created_at::text as created_at
    from customer_reviews
    where product_id = ${productId}
    order by created_at desc
  `) as { id: string; data: Record<string, unknown>; created_at: string }[];

  return c.json({
    reviews: await mapReviewRowsWithLoyalty(rows, {
      viewerAccountId:
        (await optionalCustomerAccount(c.req.header('authorization')))?.id ?? null,
      guestKey: c.req.header('x-guest-voter') ?? null,
    }),
  });
});

reviewRoutes.post('/:id/helpful', async (c) => {
  const account = await optionalCustomerAccount(c.req.header('authorization'));
  const guestKey = account ? null : normalizeGuestKey(c.req.header('x-guest-voter'));
  if (!account && !guestKey) {
    return c.json({ error: 'Missing voter identity.' }, 400);
  }

  const id = c.req.param('id');
  const sql = getSql();
  const rows = (await sql`
    select id::text as id, data, created_at::text as created_at
    from customer_reviews
    where id = ${id}::uuid
    limit 1
  `) as { id: string; data: Record<string, unknown>; created_at: string }[];

  const row = rows[0];
  if (!row) return c.json({ error: 'Review not found' }, 404);

  const existing = account
    ? ((await sql`
        select id::text as id
        from review_helpful_votes
        where review_id = ${id}::uuid
          and customer_account_id = ${account.id}::uuid
        limit 1
      `) as { id: string }[])
    : ((await sql`
        select id::text as id
        from review_helpful_votes
        where review_id = ${id}::uuid
          and guest_key = ${guestKey!}
        limit 1
      `) as { id: string }[]);

  let nextData = row.data;
  let voted = false;

  if (existing.length > 0) {
    if (account) {
      await sql`
        delete from review_helpful_votes
        where review_id = ${id}::uuid
          and customer_account_id = ${account.id}::uuid
      `;
    } else {
      await sql`
        delete from review_helpful_votes
        where review_id = ${id}::uuid
          and guest_key = ${guestKey!}
      `;
    }
    const helpfulCount = Math.max(0, (Number(row.data.helpfulCount) || 0) - 1);
    nextData = { ...row.data, id: row.id, helpfulCount };
    await sql`
      update customer_reviews
      set data = ${JSON.stringify(nextData)}::jsonb
      where id = ${id}::uuid
    `;
    voted = false;
  } else {
    if (account) {
      await sql`
        insert into review_helpful_votes (review_id, customer_account_id)
        values (${id}::uuid, ${account.id}::uuid)
      `;
    } else {
      await sql`
        insert into review_helpful_votes (review_id, guest_key)
        values (${id}::uuid, ${guestKey!})
      `;
    }
    const helpfulCount = (Number(row.data.helpfulCount) || 0) + 1;
    nextData = { ...row.data, id: row.id, helpfulCount };
    await sql`
      update customer_reviews
      set data = ${JSON.stringify(nextData)}::jsonb
      where id = ${id}::uuid
    `;
    voted = true;
  }

  const [mapped] = await mapReviewRowsWithLoyalty([{ ...row, data: nextData }], {
    viewerAccountId: account?.id ?? null,
    guestKey,
  });
  return c.json({
    review: { ...mapped, helpfulByMe: voted },
    voted,
  });
});
