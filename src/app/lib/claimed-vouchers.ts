/** Customer voucher claims — persisted in the database via /api/account/claims. */

export type ClaimedVoucherEntry = {
  id?: string;
  /** Cool Deals card id (or other source id). */
  cardId: string;
  /** Platform voucher code when linked (uppercase). */
  voucherCode?: string;
  title: string;
  claimedAt: string;
  source?: 'cool-deals' | 'admin';
};

const EVENT = 'hamel-claimed-vouchers-updated';
const LEGACY_KEYS = ['hamel_claimed_vouchers_v1', 'hamel_claimed_vouchers_v2'];

/** Drop old browser-local claim stores (claims live in the DB now). */
export function clearLegacyClaimedVoucherStorage() {
  try {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function notifyClaimedVouchersUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function subscribeClaimedVouchers(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

export function isVoucherCardClaimed(
  claims: ClaimedVoucherEntry[],
  cardId: string
): boolean {
  return claims.some((e) => e.cardId === cardId);
}

export function isVoucherCodeClaimed(
  claims: ClaimedVoucherEntry[],
  code: string
): boolean {
  const key = code.trim().toUpperCase();
  if (!key) return false;
  return claims.some((e) => (e.voucherCode || '').toUpperCase() === key);
}

export function getClaimedVoucherCodes(claims: ClaimedVoucherEntry[]): string[] {
  const codes = new Set<string>();
  for (const e of claims) {
    const c = (e.voucherCode || '').trim().toUpperCase();
    if (c) codes.add(c);
  }
  return [...codes];
}
