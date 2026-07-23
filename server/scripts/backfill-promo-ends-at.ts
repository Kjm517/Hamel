import pg from 'pg';
import '../src/env.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

/** Default flash countdown end (PH time). */
const DEFAULT_ENDS_AT = '2026-07-16T23:59:59+08:00';
const DEFAULT_VALID_UNTIL = 'July 16, 2026';

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

function patchPromo(entry: Record<string, unknown>): { entry: Record<string, unknown>; changed: boolean } {
  const badge = String(entry.badgeType ?? '').toLowerCase();
  const isFlash = badge === 'flash-sale';
  const hasEnds = typeof entry.promoEndsAt === 'string' && entry.promoEndsAt.trim().length > 0;
  if (!isFlash && !hasEnds) return { entry, changed: false };

  let changed = false;
  const next = { ...entry };
  if (isFlash && !hasEnds) {
    next.promoEndsAt = DEFAULT_ENDS_AT;
    changed = true;
  }
  if (isFlash && (!next.validUntil || String(next.validUntil).includes('May 31'))) {
    next.validUntil = DEFAULT_VALID_UNTIL;
    changed = true;
  }

  if (isFlash && typeof next.promoEndsAt === 'string') {
    const t = Date.parse(next.promoEndsAt);
    if (Number.isFinite(t) && t <= Date.now()) {
      next.promoEndsAt = DEFAULT_ENDS_AT;
      next.validUntil = DEFAULT_VALID_UNTIL;
      changed = true;
    }
  }
  return { entry: next, changed };
}

await client.connect();
try {
  const { rows } = await client.query<{ id: string; data: Record<string, unknown> }>(
    `select id, data from products`
  );
  let updated = 0;
  for (const row of rows) {
    const data = { ...row.data };
    let changed = false;

    if (Array.isArray(data.promos)) {
      data.promos = (data.promos as Record<string, unknown>[]).map((p) => {
        const result = patchPromo(p);
        if (result.changed) changed = true;
        return result.entry;
      });
    }
    if (data.promo && typeof data.promo === 'object') {
      const result = patchPromo(data.promo as Record<string, unknown>);
      if (result.changed) {
        data.promo = result.entry;
        changed = true;
      }
    }

    if (!changed) continue;
    await client.query(
      `update products set data = $2::jsonb, updated_at = now() where id = $1`,
      [row.id, JSON.stringify({ ...data, id: row.id })]
    );
    updated += 1;
    console.log(`Updated product ${row.id}`);
  }
  console.log(`Backfilled promoEndsAt on ${updated} product(s).`);
} finally {
  await client.end();
}
