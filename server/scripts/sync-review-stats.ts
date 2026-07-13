/**
 * Recompute every product's rating/reviews from customer_reviews.
 * Clears stale seeded counts that were never tied to real reviews.
 */
import pg from 'pg';
import '../src/env.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  const products = await client.query<{ id: string }>(`select id from products`);
  for (const { id } of products.rows) {
    const stats = await client.query<{ avg_rating: string | null; review_count: string }>(
      `select
         coalesce(avg((data->>'rating')::numeric), 0)::float8 as avg_rating,
         count(*)::int as review_count
       from customer_reviews
       where product_id = $1`,
      [id]
    );
    const count = Number(stats.rows[0]?.review_count ?? 0);
    const avg = Number(stats.rows[0]?.avg_rating ?? 0);
    const rating = count > 0 ? Math.round(avg * 10) / 10 : 0;

    await client.query(
      `update products
       set data = jsonb_set(
         jsonb_set(data, '{rating}', $2::jsonb, true),
         '{reviews}', $3::jsonb, true
       ),
       updated_at = now()
       where id = $1`,
      [id, JSON.stringify(rating), JSON.stringify(count)]
    );
  }
  console.log(`Synced review stats on ${products.rowCount ?? 0} products.`);
} finally {
  await client.end();
}
