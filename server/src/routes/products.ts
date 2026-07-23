import { Hono } from 'hono';
import { getSql } from '../db';
import { requireAuth, type AuthVariables } from '../middleware/auth';
import {
  getAllProductReviewStats,
  getProductReviewStats,
  mapReviewRowsWithLoyalty,
  optionalCustomerAccount,
  syncProductReviewStats,
  withLiveReviewStats,
} from './reviews';

export const productRoutes = new Hono<{ Variables: AuthVariables }>();

/** Rating/reviews are always derived from customer_reviews — never accept seeded values. */
function stripManualReviewFields(product: Record<string, unknown>): Record<string, unknown> {
  const { rating: _r, reviews: _c, ...rest } = product;
  return { ...rest, rating: 0, reviews: 0 };
}

productRoutes.get('/', async (c) => {
  const sql = getSql();
  const rows = (await sql`
    select id, data
    from products
    order by id asc
  `) as { id: string; data: Record<string, unknown> }[];
  const statsByProduct = await getAllProductReviewStats();
  return c.json({
    products: rows.map((row) => ({
      id: row.id,
      data: withLiveReviewStats(
        { ...(row.data ?? {}), id: row.id },
        statsByProduct.get(row.id)
      ),
    })),
  });
});

productRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  const products = (await sql`
    select id, data
    from products
    where id = ${id}
    limit 1
  `) as { id: string; data: Record<string, unknown> }[];
  const product = products[0];
  if (!product) return c.json({ error: 'Product not found' }, 404);

  const reviews = (await sql`
    select id::text as id, data, created_at::text as created_at
    from customer_reviews
    where product_id = ${id}
    order by created_at desc
  `) as { id: string; data: Record<string, unknown>; created_at: string }[];

  const stats = await getProductReviewStats(id);
  const viewer = await optionalCustomerAccount(c.req.header('authorization'));
  return c.json({
    product: withLiveReviewStats({ ...(product.data ?? {}), id: product.id }, stats),
    reviews: await mapReviewRowsWithLoyalty(reviews, {
      viewerAccountId: viewer?.id ?? null,
      guestKey: c.req.header('x-guest-voter') ?? null,
    }),
  });
});

productRoutes.post('/', requireAuth, async (c) => {
  const product = stripManualReviewFields((await c.req.json()) as Record<string, unknown>);
  const id = typeof product.id === 'string' ? product.id : null;
  if (!id) return c.json({ error: 'Product id is required.' }, 400);

  const sql = getSql();
  await sql`
    insert into products (id, data)
    values (${id}, ${JSON.stringify(product)}::jsonb)
  `;
  await syncProductReviewStats(id);
  const stats = await getProductReviewStats(id);
  return c.json({ product: withLiveReviewStats({ ...product, id }, stats) });
});

productRoutes.put('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const product = stripManualReviewFields((await c.req.json()) as Record<string, unknown>);
  const payload = { ...product, id, rating: 0, reviews: 0 };

  const sql = getSql();
  const result = (await sql`
    update products
    set data = ${JSON.stringify(payload)}::jsonb, updated_at = now()
    where id = ${id}
    returning id
  `) as { id: string }[];
  if (!result.length) return c.json({ error: 'Product not found' }, 404);
  await syncProductReviewStats(id);
  const stats = await getProductReviewStats(id);
  return c.json({ product: withLiveReviewStats(payload, stats) });
});

productRoutes.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  await sql`delete from products where id = ${id}`;
  return c.json({ ok: true });
});
