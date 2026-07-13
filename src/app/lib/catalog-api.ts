import type { Product } from '../data/products';
import { products as seedProducts } from '../data/products';
import { apiFetch } from './api';
import { normalizeCatalogProduct } from './catalog-product';
import { normalizeProductForSave } from './product-promos';

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
};

/** Load catalog: API products when present, otherwise local seed. */
export async function loadCatalogProducts(): Promise<Product[]> {
  try {
    const remote = await fetchProductList();
    if (remote.length > 0) {
      return remote.map((p) => normalizeCatalogProduct(p));
    }
  } catch {
    // API unavailable — fall back to seed
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
  const res = await apiFetch<{ product: Product; reviews: CustomerReview[] }>(
    `/api/products/${encodeURIComponent(id)}`,
    { auth: false }
  );
  return {
    product: normalizeCatalogProduct({ ...res.product, id: res.product.id ?? id }),
    reviews: res.reviews ?? [],
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
  const res = await apiFetch<{ review: CustomerReview }>('/api/reviews', {
    method: 'POST',
    body: input,
    auth: false,
  });
  window.dispatchEvent(new CustomEvent('hamel-catalog-updated'));
  return res.review;
}

export async function markReviewHelpful(reviewId: string): Promise<CustomerReview> {
  const res = await apiFetch<{ review: CustomerReview }>(
    `/api/reviews/${encodeURIComponent(reviewId)}/helpful`,
    { method: 'POST', auth: false }
  );
  return res.review;
}

export async function createProduct(product: Product): Promise<Product> {
  const payload = normalizeProductForSave({ ...product, rating: 0, reviews: 0 });
  const res = await apiFetch<{ product: Product }>('/api/products', {
    method: 'POST',
    body: payload,
  });
  window.dispatchEvent(new CustomEvent('hamel-catalog-updated'));
  return normalizeCatalogProduct({ ...(res.product ?? payload), id: payload.id });
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
  window.dispatchEvent(new CustomEvent('hamel-catalog-updated'));
  return normalizeCatalogProduct({ ...(res.product ?? payload), id: payload.id });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
