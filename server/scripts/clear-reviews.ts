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
  const deleted = await client.query(`delete from customer_reviews returning product_id`);

  // Reset ALL products — seeded rating/reviews linger even when no review rows exist.
  const reset = await client.query(
    `update products
     set data = jsonb_set(
       jsonb_set(data, '{rating}', '0'::jsonb, true),
       '{reviews}', '0'::jsonb, true
     ),
     updated_at = now()
     returning id`
  );

  console.log(
    `Removed ${deleted.rowCount ?? 0} reviews; reset rating/reviews on ${reset.rowCount ?? 0} products.`
  );
} finally {
  await client.end();
}
