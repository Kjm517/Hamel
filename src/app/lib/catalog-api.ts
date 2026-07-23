import type { Product } from '../data/products';
import { products as seedProducts } from '../data/products';
import { apiFetch, ApiError, getApiBase } from './api';
import { normalizeCatalogProduct } from './catalog-product';
import { normalizeProductForSave } from './product-promos';
import { syncDealOfDayProductLink } from './sync-deal-of-day-product';

const GUEST_VOTER_KEY = 'hamel_guest_voter';

/** Stable per-browser id so guests can toggle Helpful without an account. */
export function getGuestVoterKey(): string {
  if (typeof localStorage === 'undefined') return 'guest-ssr';
  const existing = localStorage.getItem(GUEST_VOTER_KEY)?.trim();
  if (existing && existing.length >= 8) return existing.slice(0, 80);
  const next =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `g-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(GUEST_VOTER_KEY, next);
  return next;
}

function reviewAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Guest-Voter': getGuestVoterKey(),
  };
  const customerToken =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('hamel_customer_token')
      : null;
  if (customerToken) headers.Authorization = `Bearer ${customerToken}`;
  return headers;
}
export type CustomerReview = {
  id: string;
  productId?: string;
  name: string;
  email?: string;
  rating: number;
  roomSize?: string;
  comment: string;
  electricityImpact?: string;
  date: string;
  tags?: string[];
  anonymous?: boolean;
  images?: string[];
  helpfulCount?: number;
  /** True when the signed-in account already marked this review Helpful. */
  helpfulByMe?: boolean;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | null;
};

/** Load catalog: API products when present, otherwise local seed. */
export async function loadCatalogProducts(): Promise<Product[]> {
  try {
    const remote = await fetchProductList();
    if (remote.length > 0) {
      return remote.map((p) => normalizeCatalogProduct(p));
    }
  } catch {

  }
  return seedProducts.map((p) => normalizeCatalogProduct({ ...p, id: p.id }));
}

type ProductRow = { id: string; data: Product };

export async function fetchProductList(): Promise<Product[]> {
  const res = await apiFetch<{ products: ProductRow[] }>('/api/products', { auth: false });
  return (res.products ?? []).map((r) =>
    normalizeCatalogProduct({ ...(r.data as Product), id: r.id })
  );
}

export async function fetchProductDetail(
  id: string
): Promise<{ product: Product; reviews: CustomerReview[] }> {
  const res = await fetch(`${getApiBase()}/api/products/${encodeURIComponent(id)}`, {
    headers: reviewAuthHeaders(),
  });
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
    throw new ApiError(message, res.status);
  }
  const payload = data as { product: Product; reviews: CustomerReview[] };
  return {
    product: normalizeCatalogProduct({
      ...payload.product,
      id: payload.product.id ?? id,
    }),
    reviews: payload.reviews ?? [],
  };
}

export type CreateReviewInput = {
  productId: string;
  name: string;
  email?: string;
  rating: number;
  roomSize?: string;
  comment: string;
  electricityImpact?: string;
  tags?: string[];
  anonymous?: boolean;
  images?: string[];
};

export async function createReview(input: CreateReviewInput): Promise<CustomerReview> {
  const customerToken =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('hamel_customer_token')
      : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customerToken) headers.Authorization = `Bearer ${customerToken}`;

  const res = await fetch(`${getApiBase()}/api/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
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
    throw new ApiError(message, res.status);
  }
  window.dispatchEvent(new CustomEvent('hamel-catalog-updated'));
  return (data as { review: CustomerReview }).review;
}

export async function markReviewHelpful(reviewId: string): Promise<CustomerReview> {
  const res = await fetch(
    `${getApiBase()}/api/reviews/${encodeURIComponent(reviewId)}/helpful`,
    {
      method: 'POST',
      headers: reviewAuthHeaders(),
    }
  );
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
    throw new ApiError(message, res.status);
  }
  return (data as { review: CustomerReview }).review;
}

export async function createProduct(product: Product): Promise<Product> {
  const payload = normalizeProductForSave({ ...product, rating: 0, reviews: 0 });
  const res = await apiFetch<{ product: Product }>('/api/products', {
    method: 'POST',
    body: payload,
  });
  const saved = normalizeCatalogProduct({ ...(res.product ?? payload), id: payload.id });
  window.dispatchEvent(new CustomEvent('hamel-catalog-updated'));
  void syncDealOfDayProductLink(saved).catch(() => undefined);
  return saved;
}

export async function saveProduct(product: Product): Promise<Product> {
  const payload = normalizeProductForSave({ ...product, rating: 0, reviews: 0 });
  const res = await apiFetch<{ product: Product }>(
    `/api/products/${encodeURIComponent(payload.id)}`,
    {
      method: 'PUT',
      body: payload,
    }
  );
  const saved = normalizeCatalogProduct({ ...(res.product ?? payload), id: payload.id });
  window.dispatchEvent(new CustomEvent('hamel-catalog-updated'));
  void syncDealOfDayProductLink(saved).catch(() => undefined);
  return saved;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
  window.dispatchEvent(new CustomEvent('hamel-catalog-updated'));
}
