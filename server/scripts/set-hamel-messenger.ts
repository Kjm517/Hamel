import { readFileSync } from 'fs';
import pg from 'pg';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const m = env.match(/^DATABASE_URL=(.*)$/m);
if (!m) throw new Error('DATABASE_URL missing');

const c = new pg.Client({
  connectionString: m[1].trim(),
  ssl: { rejectUnauthorized: false },
});
await c.connect();

const cur = await c.query(`select data from site_settings where key = 'store'`);
const data = {
  ...(cur.rows[0]?.data || {}),
  messengerUrl: 'https://m.me/hameltrading',
};

await c.query(
  `insert into site_settings (key, data, updated_at)
   values ('store', $1::jsonb, now())
   on conflict (key) do update set data = excluded.data, updated_at = now()`,
  [JSON.stringify(data)]
);

console.log('store messengerUrl =>', data.messengerUrl);
await c.end();
