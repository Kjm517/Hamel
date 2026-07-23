import { apiFetch } from './api';

const cache = new Map<string, unknown>();
const loaded = new Set<string>();
const inflight = new Map<string, Promise<unknown>>();

export function getCachedContent<T>(key: string): T | null {
  if (!cache.has(key)) return null;
  return cache.get(key) as T;
}

export function setCachedContent(key: string, data: unknown) {
  cache.set(key, data);
  loaded.add(key);
}

export async function fetchContent<T>(key: string, fallback: T): Promise<T> {
  if (inflight.has(key)) {
    return inflight.get(key) as Promise<T>;
  }

  const run = (async () => {
    try {
      const res = await apiFetch<{ data: T | null }>(`/api/content/${key}`, { auth: false });
      if (res.data != null) {
        setCachedContent(key, res.data);
        return res.data;
      }
    } catch {

    }

    try {
      const legacyKey =
        key === 'banners'
          ? 'hamel_banners_v6'
          : key === 'cool_deals'
            ? 'hamel_cool_deals_page_v2'
            : key === 'promo_pages'
              ? 'hamel_promo_pages_v1'
              : key === 'brands_page'
                ? 'hamel_brands_page_v1'
                : null;
      if (legacyKey) {
        const raw = localStorage.getItem(legacyKey);
        if (raw) {
          const parsed = JSON.parse(raw) as T;
          setCachedContent(key, parsed);
          try {
            await saveContent(key, parsed);
            localStorage.removeItem(legacyKey);
          } catch {

          }
          return parsed;
        }
      }
    } catch {

    }

    setCachedContent(key, fallback);
    return fallback;
  })();

  inflight.set(key, run);
  try {
    return await run;
  } finally {
    inflight.delete(key);
  }
}

export async function saveContent<T>(key: string, data: T): Promise<void> {
  setCachedContent(key, data);
  await apiFetch(`/api/content/${key}`, {
    method: 'PUT',
    body: { data },
  });
}

export function isContentLoaded(key: string): boolean {
  return loaded.has(key);
}
