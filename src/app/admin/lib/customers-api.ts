import { apiFetch } from '../../lib/api';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

export type CustomerRow = {
  id: string;
  customerCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  loyaltyTier: LoyaltyTier | null;
  createdAt: string;
  updatedAt: string;
  inquiryCount: number;
  hasAccount: boolean;
  accountId: string | null;
};

export type CustomerClaim = {
  id: string;
  cardId: string;
  title: string;
  voucherCode?: string;
  source: 'cool-deals' | 'admin';
  claimedAt: string;
};

export type CustomerInquiry = {
  id: string;
  status: string;
  productLabel: string | null;
  quantity: number | null;
  createdAt: string;
};

export type CustomerDetail = {
  customer: CustomerRow;
  inquiries: CustomerInquiry[];
  claims: CustomerClaim[];
};

type ApiCustomer = {
  id: string;
  customer_code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  loyalty_tier: string | null;
  created_at: string;
  updated_at: string;
  inquiry_count: number;
  has_account: boolean;
  account_id: string | null;
};

function mapLoyalty(raw: string | null | undefined): LoyaltyTier | null {
  if (raw === 'bronze' || raw === 'silver' || raw === 'gold') return raw;
  return null;
}

function mapCustomer(c: ApiCustomer): CustomerRow {
  return {
    id: c.id,
    customerCode: c.customer_code,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    loyaltyTier: mapLoyalty(c.loyalty_tier),
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    inquiryCount: Number(c.inquiry_count ?? 0),
    hasAccount: Boolean(c.has_account),
    accountId: c.account_id,
  };
}

export async function fetchCustomers(limit = 100): Promise<CustomerRow[]> {
  const res = await apiFetch<{ customers: ApiCustomer[] }>(
    `/api/customers?limit=${limit}`
  );
  return (res.customers ?? []).map(mapCustomer);
}

export async function fetchCustomerDetail(id: string): Promise<CustomerDetail> {
  const res = await apiFetch<{
    customer: ApiCustomer;
    inquiries: Array<{
      id: string;
      status: string;
      product_label: string | null;
      quantity: number | null;
      created_at: string;
    }>;
    claims: CustomerClaim[];
  }>(`/api/customers/${encodeURIComponent(id)}`);

  return {
    customer: mapCustomer(res.customer),
    inquiries: (res.inquiries ?? []).map((i) => ({
      id: i.id,
      status: i.status,
      productLabel: i.product_label,
      quantity: i.quantity,
      createdAt: i.created_at,
    })),
    claims: res.claims ?? [],
  };
}

export async function updateCustomer(
  id: string,
  input: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    loyaltyTier?: LoyaltyTier | null;
  }
): Promise<CustomerRow> {
  const res = await apiFetch<{ ok: boolean; customer: ApiCustomer }>(
    `/api/customers/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        loyaltyTier: input.loyaltyTier === null ? 'none' : input.loyaltyTier,
      },
    }
  );
  return mapCustomer(res.customer);
}

export async function assignCustomerClaim(
  customerId: string,
  input: { voucherId?: string; title?: string; voucherCode?: string }
): Promise<CustomerClaim> {
  const res = await apiFetch<{ ok: boolean; claim: CustomerClaim }>(
    `/api/customers/${encodeURIComponent(customerId)}/claims`,
    { method: 'POST', body: input }
  );
  return res.claim;
}

export async function removeCustomerClaim(
  customerId: string,
  claimId: string
): Promise<void> {
  await apiFetch(
    `/api/customers/${encodeURIComponent(customerId)}/claims/${encodeURIComponent(claimId)}`,
    { method: 'DELETE' }
  );
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiFetch(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
