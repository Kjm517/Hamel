import { Hono } from 'hono';
import { getSql } from '../db';
import type { AuthVariables } from '../middleware/auth';

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

function formatReviewDate(d = new Date()): string {
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export type ProductReviewStats = { rating: number; reviews: number };

/** Live avg rating + count for one product from customer_reviews. */
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

/** Map of productId → live review stats (products with zero reviews omitted). */
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

/** Overlay live rating/reviews onto a product payload (never trust seeded JSON). */
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

/** Recompute product.rating / product.reviews from customer_reviews rows. */
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

/** Sync rating/reviews on every product from customer_reviews (clears stale seed counts). */
export async function syncAllProductReviewStats(): Promise<number> {
  const sql = getSql();
  const products = (await sql`select id from products`) as { id: string }[];
  for (const { id } of products) {
    await syncProductReviewStats(id);
  }
  return products.length;
}

export function mapReviewRow(row: {
  id: string;
  data: Record<string, unknown>;
  created_at?: string;
}): Record<string, unknown> {
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

  return {
    ...data,
    id: row.id,
    productId: data.productId ?? undefined,
    date,
    tags,
    images,
    helpfulCount: Number(data.helpfulCount) || 0,
    anonymous: Boolean(data.anonymous),
  };
}

export const reviewRoutes = new Hono<{ Variables: AuthVariables }>();

/** Public: submit a product review */
reviewRoutes.post('/', async (c) => {
  const body = (await c.req.json()) as ReviewInput;
  const productId = body.productId?.trim() ?? '';
  const anonymous = Boolean(body.anonymous);
  const name = anonymous ? 'Anonymous' : (body.name?.trim() ?? '');
  const email = body.email?.trim() ?? '';
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

  return c.json({ review: mapReviewRow({ ...row, data: withId }) }, 201);
});

/** Public: list reviews for a product */
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

  return c.json({ reviews: rows.map(mapReviewRow) });
});

/** Public: mark review helpful */
reviewRoutes.post('/:id/helpful', async (c) => {
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

  const helpfulCount = (Number(row.data.helpfulCount) || 0) + 1;
  const next = { ...row.data, id: row.id, helpfulCount };
  await sql`
    update customer_reviews
    set data = ${JSON.stringify(next)}::jsonb
    where id = ${id}::uuid
  `;

  return c.json({ review: mapReviewRow({ ...row, data: next }) });
});
