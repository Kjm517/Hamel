import { createHash, randomInt } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { getSql } from './db';
import { env } from './env';
import { hashPassword, verifyPassword } from './auth';
import { allocateCustomerCode } from './customer-code';

export { hashPassword, verifyPassword };

/** Distinguishes customer tokens from employee/admin tokens so the two never mix. */
const CUSTOMER_TOKEN_TYPE = 'customer';
const CODE_TTL_MINUTES = 15;

export type DbCustomerAccount = {
  id: string;
  customer_id: string;
  email: string;
  password_hash: string;
  status: 'active' | 'disabled';
  email_verified_at: string | null;
  name: string;
  phone: string | null;
  customer_code: string | null;
  loyalty_tier: 'bronze' | 'silver' | 'gold' | null;
  created_at: string;
};

export type CustomerTokenPayload = {
  sub: string;
  email: string;
  typ: typeof CUSTOMER_TOKEN_TYPE;
};

function secretKey() {
  return new TextEncoder().encode(env.jwtSecret());
}

export async function signCustomerToken(account: {
  id: string;
  email: string;
}): Promise<string> {
  return new SignJWT({ email: account.email, typ: CUSTOMER_TOKEN_TYPE })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(account.id)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey());
}

export async function verifyCustomerToken(token: string): Promise<CustomerTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey());
  const sub = payload.sub;
  const email = typeof payload.email === 'string' ? payload.email : '';
  if (!sub || !email || payload.typ !== CUSTOMER_TOKEN_TYPE) {
    throw new Error('Invalid customer token payload');
  }
  return { sub, email, typ: CUSTOMER_TOKEN_TYPE };
}

/** Public-facing shape returned to the browser. Never includes the password hash. */
export function mapCustomerPublic(row: DbCustomerAccount) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerCode: row.customer_code || null,
    name: row.name,
    email: row.email,
    phone: row.phone,
    loyaltyTier: row.loyalty_tier || null,
    status: row.status,
    emailVerified: Boolean(row.email_verified_at),
    createdAt: row.created_at,
  };
}

const ACCOUNT_SELECT = `
  select
    ca.id::text as id,
    ca.customer_id::text as customer_id,
    ca.email,
    ca.password_hash,
    ca.status,
    ca.email_verified_at::text as email_verified_at,
    c.name,
    c.phone,
    c.customer_code,
    c.loyalty_tier,
    ca.created_at::text as created_at
  from customer_accounts ca
  join customers c on c.id = ca.customer_id
`;

export async function findCustomerAccountByEmail(
  email: string
): Promise<DbCustomerAccount | null> {
  const trimmed = email.trim();
  if (!trimmed) return null;
  const sql = getSql();
  const rows = (await sql`
    select
      ca.id::text as id,
      ca.customer_id::text as customer_id,
      ca.email,
      ca.password_hash,
      ca.status,
      ca.email_verified_at::text as email_verified_at,
      c.name,
      c.phone,
      c.customer_code,
      c.loyalty_tier,
      ca.created_at::text as created_at
    from customer_accounts ca
    join customers c on c.id = ca.customer_id
    where lower(ca.email) = lower(${trimmed})
    limit 1
  `) as DbCustomerAccount[];
  return rows[0] ?? null;
}

export async function findCustomerAccountById(
  id: string
): Promise<DbCustomerAccount | null> {
  const sql = getSql();
  const rows = (await sql`
    select
      ca.id::text as id,
      ca.customer_id::text as customer_id,
      ca.email,
      ca.password_hash,
      ca.status,
      ca.email_verified_at::text as email_verified_at,
      c.name,
      c.phone,
      c.customer_code,
      c.loyalty_tier,
      ca.created_at::text as created_at
    from customer_accounts ca
    join customers c on c.id = ca.customer_id
    where ca.id = ${id}::uuid
    limit 1
  `) as DbCustomerAccount[];
  return rows[0] ?? null;
}

/**
 * Create a customer record + linked account in one go. Reuses an existing
 * customer row when one already matches the phone (the CRM may have created it
 * from an inquiry), otherwise inserts a fresh customer.
 */
export async function createCustomerAccount(input: {
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
}): Promise<DbCustomerAccount> {
  const sql = getSql();

  let customerId: string | null = null;
  if (input.phone) {
    const existing = (await sql`
      select id::text as id from customers
      where phone = ${input.phone}
      limit 1
    `) as { id: string }[];
    customerId = existing[0]?.id ?? null;
  }

  if (customerId) {
    await sql`
      update customers
      set
        name = ${input.name},
        email = coalesce(${input.email}, email),
        updated_at = now()
      where id = ${customerId}::uuid
    `;
  } else {
    const code = await allocateCustomerCode();
    const inserted = (await sql`
      insert into customers (name, email, phone, customer_code)
      values (${input.name}, ${input.email}, ${input.phone}, ${code})
      returning id::text as id
    `) as { id: string }[];
    customerId = inserted[0].id;
  }

  const accountRows = (await sql`
    insert into customer_accounts (customer_id, email, password_hash)
    values (${customerId}::uuid, ${input.email}, ${input.passwordHash})
    returning id::text as id
  `) as { id: string }[];

  const account = await findCustomerAccountById(accountRows[0].id);
  if (!account) throw new Error('Failed to load newly created account');
  return account;
}

/* ------------------------------------------------------------------ */
/* Email verification codes                                            */
/* ------------------------------------------------------------------ */

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/** 6-digit numeric code, zero-padded. */
export function createVerificationCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function storeVerificationCode(
  customerAccountId: string,
  code: string
): Promise<void> {
  const sql = getSql();
  // One live code per account: clear previous / expired rows first.
  await sql`
    delete from customer_email_verifications
    where customer_account_id = ${customerAccountId}::uuid
       or expires_at < now()
  `;
  await sql`
    insert into customer_email_verifications (customer_account_id, code_hash, expires_at)
    values (
      ${customerAccountId}::uuid,
      ${hashCode(code)},
      now() + make_interval(mins => ${CODE_TTL_MINUTES})
    )
  `;
}

/** Returns true when the code matched a live verification row (and marks it used). */
export async function consumeVerificationCode(
  customerAccountId: string,
  code: string
): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql`
    select id::text as id
    from customer_email_verifications
    where customer_account_id = ${customerAccountId}::uuid
      and code_hash = ${hashCode(code)}
      and expires_at > now()
      and verified_at is null
    limit 1
  `) as { id: string }[];

  const row = rows[0];
  if (!row) return false;

  await sql`
    update customer_email_verifications
    set verified_at = now()
    where id = ${row.id}::uuid
  `;
  await sql`
    update customer_accounts
    set email_verified_at = now(), updated_at = now()
    where id = ${customerAccountId}::uuid
  `;
  return true;
}

export async function updateCustomerProfile(
  accountId: string,
  input: { name: string; phone: string | null }
): Promise<DbCustomerAccount> {
  const sql = getSql();
  const account = await findCustomerAccountById(accountId);
  if (!account) throw new Error('Account not found');

  await sql`
    update customers
    set
      name = ${input.name},
      phone = ${input.phone},
      updated_at = now()
    where id = ${account.customer_id}::uuid
  `;

  const fresh = await findCustomerAccountById(accountId);
  if (!fresh) throw new Error('Failed to reload account');
  return fresh;
}

export async function updateCustomerPassword(
  accountId: string,
  passwordHash: string
): Promise<void> {
  const sql = getSql();
  await sql`
    update customer_accounts
    set password_hash = ${passwordHash}, updated_at = now()
    where id = ${accountId}::uuid
  `;
}

/**
 * Updates login email on the account + CRM customer row, and clears verification
 * so the new address must be confirmed.
 */
export async function updateCustomerEmail(
  accountId: string,
  newEmail: string
): Promise<DbCustomerAccount> {
  const sql = getSql();
  const account = await findCustomerAccountById(accountId);
  if (!account) throw new Error('Account not found');

  await sql`
    update customer_accounts
    set
      email = ${newEmail},
      email_verified_at = null,
      updated_at = now()
    where id = ${accountId}::uuid
  `;
  await sql`
    update customers
    set email = ${newEmail}, updated_at = now()
    where id = ${account.customer_id}::uuid
  `;

  const fresh = await findCustomerAccountById(accountId);
  if (!fresh) throw new Error('Failed to reload account');
  return fresh;
}
