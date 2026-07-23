const WISHLIST_KEY = 'hamel_wishlist_v1';
const COMPARE_KEY = 'hamel_compare_v1';
const MAX_COMPARE = 3;

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {

  }
  window.dispatchEvent(new CustomEvent('hamel-product-actions-updated'));
}

export function getWishlistIds(): string[] {
  return readIds(WISHLIST_KEY);
}

export function isInWishlist(productId: string): boolean {
  return getWishlistIds().includes(productId);
}

export function toggleWishlist(productId: string): boolean {
  const current = getWishlistIds();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  writeIds(WISHLIST_KEY, next);
  return next.includes(productId);
}

export function getCompareIds(): string[] {
  return readIds(COMPARE_KEY).slice(0, MAX_COMPARE);
}

export function isInCompare(productId: string): boolean {
  return getCompareIds().includes(productId);
}

export function toggleCompare(productId: string): { ids: string[]; added: boolean; full: boolean } {
  const current = getCompareIds();
  if (current.includes(productId)) {
    const ids = current.filter((id) => id !== productId);
    writeIds(COMPARE_KEY, ids);
    return { ids, added: false, full: false };
  }
  if (current.length >= MAX_COMPARE) {
    return { ids: current, added: false, full: true };
  }
  const ids = [...current, productId];
  writeIds(COMPARE_KEY, ids);
  return { ids, added: true, full: false };
}

export function removeFromCompare(productId: string): string[] {
  const ids = getCompareIds().filter((id) => id !== productId);
  writeIds(COMPARE_KEY, ids);
  return ids;
}

export function clearCompare(): void {
  writeIds(COMPARE_KEY, []);
}

export function openShareUrl(url: string): void {
  if (typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function shareProduct(input: {
  title: string;
  text?: string;
  url: string;
}): Promise<'shared' | 'copied' | 'failed'> {
  return (async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: input.title,
          text: input.text,
          url: input.url,
        });
        return 'shared';
      }
    } catch {

    }
    const ok = await copyTextToClipboard(input.url);
    return ok ? 'copied' : 'failed';
  })();
}

export { MAX_COMPARE };
