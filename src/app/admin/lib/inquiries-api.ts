import { apiFetch } from '../../lib/api';

export type InquiryStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type InquiryRow = {
  id: string;
  customerName: string;
  product: string;
  productId?: string | null;
  hpQty: string;
  dateLabel: string;
  status: InquiryStatus;
  createdAt: string;
  phone?: string | null;
  address?: string | null;
  propertyType?: string | null;
  floor?: string | null;
  scheduleDate?: string | null;
  scheduleTime?: string | null;
  hp?: string | null;
  quantity?: string | null;
  notes?: string | null;
  source?: string | null;
  customerId?: string | null;
};

type DbInquiry = {
  id: string;
  status: string;
  customer_name: string;
  product_label: string | null;
  product_id?: string | null;
  quantity: string | null;
  phone?: string | null;
  address?: string | null;
  property_type?: string | null;
  floor?: string | null;
  schedule_date?: string | null;
  schedule_time?: string | null;
  hp?: string | null;
  notes?: string | null;
  source?: string | null;
  customer_id?: string | null;
  created_at: string;
};

export function formatHpQty(productLabel: string | null, quantity: string | null, hp?: string | null): string {
  const hpVal = hp?.trim() || productLabel?.match(/(\d+(?:\.\d+)?)\s*HP/i)?.[1];
  const hpLabel = hpVal ? `${hpVal}${/hp/i.test(String(hpVal)) ? '' : 'HP'}` : '1HP';
  const units = quantity?.trim() || '1';
  const unitLabel = units === '1' ? 'unit' : 'units';
  return `${hpLabel} • ${units} ${unitLabel}`;
}

export function formatRelativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function mapInquiry(row: DbInquiry): InquiryRow {
  return {
    id: row.id,
    customerName: row.customer_name,
    product: row.product_label ?? '—',
    productId: row.product_id,
    hpQty: formatHpQty(row.product_label, row.quantity, row.hp),
    dateLabel: formatRelativeTime(row.created_at),
    status: row.status as InquiryStatus,
    createdAt: row.created_at,
    phone: row.phone,
    address: row.address,
    propertyType: row.property_type,
    floor: row.floor,
    scheduleDate: row.schedule_date,
    scheduleTime: row.schedule_time,
    hp: row.hp,
    quantity: row.quantity,
    notes: row.notes,
    source: row.source,
    customerId: row.customer_id,
  };
}

export function isPersistedInquiryId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id);
}

export async function fetchRecentInquiries(limit = 5): Promise<InquiryRow[]> {
  const res = await apiFetch<{ inquiries: DbInquiry[] }>(`/api/inquiries?limit=${limit}`);
  return (res.inquiries ?? []).map(mapInquiry);
}

export async function fetchInquiries(opts?: {
  limit?: number;
  status?: string;
}): Promise<InquiryRow[]> {
  const params = new URLSearchParams();
  params.set('limit', String(opts?.limit ?? 100));
  if (opts?.status) params.set('status', opts.status);
  const res = await apiFetch<{ inquiries: DbInquiry[] }>(`/api/inquiries?${params}`);
  return (res.inquiries ?? []).map(mapInquiry);
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  await apiFetch(`/api/inquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function completeInquiry(id: string): Promise<void> {
  await apiFetch(`/api/inquiries/${encodeURIComponent(id)}/complete`, { method: 'PATCH' });
}

export type CreateInquiryInput = {
  customerName: string;
  productLabel?: string;
  productId?: string;
  quantity?: string;
  phone?: string;
  address?: string;
  propertyType?: string;
  floor?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  hp?: string;
  notes?: string;
  source?: string;
};

export async function createInquiry(input: CreateInquiryInput): Promise<{ id: string }> {
  const res = await apiFetch<{ id: string }>('/api/inquiries', {
    method: 'POST',
    body: input,
    auth: false,
  });
  return { id: res.id };
}
