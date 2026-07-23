import { ApiError, getApiBase } from './api';

/**
 * Customer (storefront) auth is kept fully separate from the admin/employee
 * session in api.ts: different token key, different fetch helper, different
 * change event. The two never share a token.
 */
const CUSTOMER_TOKEN_KEY = 'hamel_customer_token';
export const CUSTOMER_AUTH_EVENT = 'hamel:customer-auth-changed';

export type Customer = {
  id: string;
  customerId: string;
  customerCode: string | null;
  name: string;
  email: string;
  phone: string | null;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | null;
  status: 'active' | 'disabled';
  emailVerified: boolean;
  createdAt: string;
};

export function getCustomerToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(token: string) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CUSTOMER_AUTH_EVENT));
  }
}

export function clearCustomerToken() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CUSTOMER_AUTH_EVENT));
  }
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function customerFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  if (options.auth !== false) {
    const token = getCustomerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  init.headers = headers;

  const res = await fetch(`${getApiBase()}${path}`, init);
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    if (res.status === 401 && options.auth !== false) {
      clearCustomerToken();
    }
    // Attach the parsed body so callers can read flags like requiresVerification.
    const err = new ApiError(message, res.status) as ApiError & { data?: unknown };
    err.data = data;
    throw err;
  }

  return data as T;
}

/* ------------------------------------------------------------------ */
/* Auth flows                                                          */
/* ------------------------------------------------------------------ */

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

export type VerificationPending = {
  requiresVerification: true;
  email: string;
  devCode?: string;
};

export async function registerCustomer(
  input: RegisterInput
): Promise<VerificationPending> {
  const res = await customerFetch<{
    ok: boolean;
    requiresVerification: true;
    email: string;
    devCode?: string;
  }>('/api/account/register', { body: input, auth: false });
  return { requiresVerification: true, email: res.email, devCode: res.devCode };
}

export async function verifyCustomerEmail(
  email: string,
  code: string
): Promise<Customer> {
  const res = await customerFetch<{ ok: boolean; token: string; customer: Record<string, unknown> }>(
    '/api/account/verify-email',
    { body: { email, code }, auth: false }
  );
  setCustomerToken(res.token);
  const customer = normalizeCustomer(res.customer);
  if (!customer) throw new ApiError('Invalid customer response', 500);
  return customer;
}

export async function resendCustomerCode(email: string): Promise<{ devCode?: string }> {
  const res = await customerFetch<{ ok: boolean; devCode?: string }>(
    '/api/account/resend-code',
    { body: { email }, auth: false }
  );
  return { devCode: res.devCode };
}

/**
 * Log in. On success sets the token and returns the customer. When the account
 * exists but is unverified the server replies 403 with requiresVerification —
 * we surface that as a typed result instead of throwing.
 */
export async function loginCustomer(
  email: string,
  password: string
): Promise<{ customer: Customer } | VerificationPending> {
  try {
    const res = await customerFetch<{ ok: boolean; token: string; customer: Record<string, unknown> }>(
      '/api/account/login',
      { body: { email, password }, auth: false }
    );
    setCustomerToken(res.token);
    const customer = normalizeCustomer(res.customer);
    if (!customer) throw new ApiError('Invalid customer response', 500);
    return { customer };
  } catch (err) {
    const data = (err as { data?: unknown }).data;
    if (
      err instanceof ApiError &&
      err.status === 403 &&
      data &&
      typeof data === 'object' &&
      (data as { requiresVerification?: boolean }).requiresVerification
    ) {
      const d = data as { email: string; devCode?: string };
      return { requiresVerification: true, email: d.email, devCode: d.devCode };
    }
    throw err;
  }
}

export async function fetchCustomerMe(): Promise<Customer | null> {
  if (!getCustomerToken()) return null;
  try {
    const res = await customerFetch<{ customer: Record<string, unknown> }>('/api/account/me');
    return normalizeCustomer(res.customer);
  } catch {
    return null;
  }
}

function normalizeLoyaltyTier(raw: unknown): Customer['loyaltyTier'] {
  if (raw === 'bronze' || raw === 'silver' || raw === 'gold') return raw;
  return null;
}

function normalizeCustomer(raw: Record<string, unknown> | null | undefined): Customer | null {
  if (!raw || typeof raw !== 'object') return null;
  const loyalty =
    normalizeLoyaltyTier(raw.loyaltyTier) ??
    normalizeLoyaltyTier(raw.loyalty_tier);
  const code =
    (typeof raw.customerCode === 'string' && raw.customerCode) ||
    (typeof raw.customer_code === 'string' && raw.customer_code) ||
    null;
  return {
    id: String(raw.id ?? ''),
    customerId: String(raw.customerId ?? raw.customer_id ?? ''),
    customerCode: code,
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    phone: raw.phone == null || raw.phone === '' ? null : String(raw.phone),
    loyaltyTier: loyalty,
    status: raw.status === 'disabled' ? 'disabled' : 'active',
    emailVerified: Boolean(raw.emailVerified ?? raw.email_verified),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
  };
}

export async function logoutCustomer() {
  try {
    await customerFetch('/api/account/logout', { method: 'POST', auth: false });
  } catch {
    /* ignore network errors on logout */
  }
  clearCustomerToken();
}

export async function updateCustomerProfile(input: {
  name: string;
  phone?: string | null;
}): Promise<Customer> {
  const res = await customerFetch<{ ok: boolean; customer: Customer }>(
    '/api/account/profile',
    { method: 'PATCH', body: input }
  );
  return res.customer;
}

export async function changeCustomerPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await customerFetch('/api/account/change-password', {
    method: 'POST',
    body: input,
  });
}

export type ChangeEmailResult = {
  customer: Customer;
  requiresVerification: true;
  email: string;
  devCode?: string;
};

export async function changeCustomerEmail(input: {
  newEmail: string;
  password: string;
}): Promise<ChangeEmailResult> {
  const res = await customerFetch<{
    ok: boolean;
    token: string;
    customer: Customer;
    requiresVerification: true;
    email: string;
    devCode?: string;
  }>('/api/account/change-email', { method: 'POST', body: input });
  setCustomerToken(res.token);
  return {
    customer: res.customer,
    requiresVerification: true,
    email: res.email,
    devCode: res.devCode,
  };
}

/* ------------------------------------------------------------------ */
/* Voucher claims (DB-backed)                                          */
/* ------------------------------------------------------------------ */

export type CustomerVoucherClaim = {
  id: string;
  cardId: string;
  title: string;
  voucherCode?: string;
  source: 'cool-deals' | 'admin';
  claimedAt: string;
};

export async function fetchCustomerClaims(): Promise<CustomerVoucherClaim[]> {
  if (!getCustomerToken()) return [];
  const res = await customerFetch<{ claims: CustomerVoucherClaim[] }>(
    '/api/account/claims'
  );
  return res.claims ?? [];
}

export async function createCustomerClaim(input: {
  cardId: string;
  title: string;
  voucherCode?: string;
  source?: 'cool-deals' | 'admin';
}): Promise<CustomerVoucherClaim> {
  const res = await customerFetch<{ ok: boolean; claim: CustomerVoucherClaim }>(
    '/api/account/claims',
    { method: 'POST', body: input }
  );
  return res.claim;
}
