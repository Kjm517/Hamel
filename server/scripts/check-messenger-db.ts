import pg from 'pg';
import { readFileSync } from 'fs';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const url = env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error('DATABASE_URL missing');

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();

const cols = await c.query(`
  select column_name
  from information_schema.columns
  where table_name = 'inquiries' and column_name like 'messenger%'
  order by 1
`);
console.log('messenger cols', cols.rows.map((r) => r.column_name));

try {
  const recent = await c.query(`
    select id::text, customer_name,
           messenger_handoff_at,
           messenger_confirmation_sent_at,
           created_at
    from inquiries
    order by created_at desc
    limit 5
  `);
  console.log(recent.rows);
} catch (e) {
  console.error('query failed', e instanceof Error ? e.message : e);
  const recent = await c.query(`
    select id::text, customer_name, created_at
    from inquiries
    order by created_at desc
    limit 5
  `);
  console.log('basic', recent.rows);
}

await c.end();
