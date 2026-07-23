import { getSql } from './db';

export type ClaimSource = 'cool-deals' | 'admin';

export type DbVoucherClaim = {
  id: string;
  customer_account_id: string;
  card_id: string;
  title: string;
  voucher_code: string | null;
  source: ClaimSource;
  claimed_at: string;
};

export type PublicVoucherClaim = {
  id: string;
  cardId: string;
  title: string;
  voucherCode?: string;
  source: ClaimSource;
  claimedAt: string;
};

export function mapClaimPublic(row: DbVoucherClaim): PublicVoucherClaim {
  return {
    id: row.id,
    cardId: row.card_id,
    title: row.title,
    voucherCode: row.voucher_code ?? undefined,
    source: row.source,
    claimedAt: row.claimed_at,
  };
}

export async function listClaimsForAccount(
  customerAccountId: string
): Promise<DbVoucherClaim[]> {
  const sql = getSql();
  return (await sql`
    select
      id::text as id,
      customer_account_id::text as customer_account_id,
      card_id,
      title,
      voucher_code,
      source,
      claimed_at::text as claimed_at
    from customer_voucher_claims
    where customer_account_id = ${customerAccountId}::uuid
    order by claimed_at desc
  `) as DbVoucherClaim[];
}

export async function claimVoucherForAccount(input: {
  customerAccountId: string;
  cardId: string;
  title: string;
  voucherCode?: string | null;
  source?: ClaimSource;
}): Promise<DbVoucherClaim> {
  const sql = getSql();
  const cardId = input.cardId.trim();
  const title = input.title.trim() || 'Voucher';
  const voucherCode = input.voucherCode?.trim().toUpperCase() || null;
  const source = input.source ?? 'cool-deals';

  const rows = (await sql`
    insert into customer_voucher_claims (
      customer_account_id,
      card_id,
      title,
      voucher_code,
      source
    )
    values (
      ${input.customerAccountId}::uuid,
      ${cardId},
      ${title},
      ${voucherCode},
      ${source}
    )
    on conflict (customer_account_id, card_id) do update set
      title = excluded.title,
      voucher_code = coalesce(excluded.voucher_code, customer_voucher_claims.voucher_code),
      source = excluded.source
    returning
      id::text as id,
      customer_account_id::text as customer_account_id,
      card_id,
      title,
      voucher_code,
      source,
      claimed_at::text as claimed_at
  `) as DbVoucherClaim[];

  return rows[0];
}

export async function deleteClaimForAccount(
  customerAccountId: string,
  claimId: string
): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    delete from customer_voucher_claims
    where id = ${claimId}::uuid
      and customer_account_id = ${customerAccountId}::uuid
    returning id::text as id
  `) as { id: string }[];
  return Boolean(rows[0]);
}

export async function findAccountIdByCustomerId(
  customerId: string
): Promise<string | null> {
  const sql = getSql();
  const rows = (await sql`
    select id::text as id
    from customer_accounts
    where customer_id = ${customerId}::uuid
    limit 1
  `) as { id: string }[];
  return rows[0]?.id ?? null;
}
