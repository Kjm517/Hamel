import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import '../src/env.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || '002_cms_and_ops.sql';
const sqlPath = resolve(__dirname, '../sql', file);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const sql = readFileSync(sqlPath, 'utf8');
console.log(`Applying ${file}…`);

await client.connect();
try {
  await client.query(sql);
  console.log('Migration complete.');
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
