import { readFileSync } from 'fs';
import pg from 'pg';
import { sendInquiryConfirmationToPsid } from '../src/messenger/inquiry-confirm.ts';

const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const i = t.indexOf('=');
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if (!(k in process.env)) process.env[k] = v;
}

const psid = process.argv[2];
if (!psid) {
  console.error('Usage: npx tsx scripts/send-messenger-test.ts <PSID>');
  process.exit(1);
}

const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await c.connect();
const r = await c.query(`
  select id::text as id, customer_name
  from inquiries
  where messenger_confirmation_sent_at is null
  order by created_at desc
  limit 1
`);
await c.end();

if (!r.rows[0]) {
  console.error('No unsent inquiry found');
  process.exit(1);
}

console.log('Sending inquiry', r.rows[0].id, 'to PSID', psid);
const result = await sendInquiryConfirmationToPsid(r.rows[0].id, psid);
console.log(result);
