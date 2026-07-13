import pg from 'pg';
import '../src/env.ts';
import { products } from '../../src/app/data/products.ts';

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
  let n = 0;
  for (const product of products) {
    const payload = { ...product, rating: 0, reviews: 0 };
    await client.query(
      `insert into products (id, data)
       values ($1, $2::jsonb)
       on conflict (id) do update set data = excluded.data, updated_at = now()`,
      [product.id, JSON.stringify(payload)]
    );
    n += 1;
  }
  console.log(`Seeded ${n} products.`);
} finally {
  await client.end();
}
