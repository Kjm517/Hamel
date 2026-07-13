import { apiFetch } from '../../lib/api';

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  inquiryCount: number;
};

export async function fetchCustomers(limit = 100): Promise<CustomerRow[]> {
  const res = await apiFetch<{
    customers: Array<{
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      address: string | null;
      created_at: string;
      updated_at: string;
      inquiry_count: number;
    }>;
  }>(`/api/customers?limit=${limit}`);

  return (res.customers ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    inquiryCount: Number(c.inquiry_count ?? 0),
  }));
}
