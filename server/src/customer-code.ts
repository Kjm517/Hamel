import { getSql } from './db';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

/** Allocate the next public Customer ID (HML-000001). */
export async function allocateCustomerCode(): Promise<string> {
  const sql = getSql();
  const rows = (await sql`
    select nextval('customer_code_seq')::bigint as n
  `) as { n: string | number }[];
  const n = Number(rows[0]?.n ?? 0);
  return `HML-${String(n).padStart(6, '0')}`;
}

/** Parse PATCH body loyaltyTier. `undefined` = leave unchanged. */
export function parseLoyaltyTierInput(
  raw: unknown
): LoyaltyTier | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === '' || raw === 'none') return null;
  if (raw === 'bronze' || raw === 'silver' || raw === 'gold') return raw;
  throw new Error('loyaltyTier must be bronze, silver, gold, or none.');
}
