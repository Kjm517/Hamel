/** Digits only for wa.me / tel links. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Format PH mobile for display, e.g. 639171234567 → +63 917 123 4567 */
export function formatWhatsAppDisplay(whatsappNumber: string): string {
  const d = digitsOnly(whatsappNumber);
  if (d.startsWith('63') && d.length >= 12) {
    return `+${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  }
  if (d.startsWith('0') && d.length >= 11) {
    return `${d.slice(0, 4)}-${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return whatsappNumber.trim() || d;
}

export function buildWhatsAppUrl(whatsappNumber: string, message?: string): string {
  const n = digitsOnly(whatsappNumber) || '639171234567';
  const base = `https://wa.me/${n}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** m.me click-to-chat. Prefer `ref` for Page auto-confirm; `text` is customer-draft fallback. */
export function buildMessengerUrl(
  messengerUrl: string,
  opts?: { message?: string; ref?: string }
): string {
  const raw = messengerUrl.trim() || 'https://m.me/fcmtradingservices';
  const base = raw.replace(/^http:\/\//i, 'https://');
  const message = opts?.message?.trim();
  const ref = opts?.ref?.trim();
  if (!message && !ref) return base;
  try {
    const url = new URL(base);
    if (ref) url.searchParams.set('ref', ref);
    if (message) url.searchParams.set('text', message);
    return url.toString();
  } catch {
    const params = new URLSearchParams();
    if (ref) params.set('ref', ref);
    if (message) params.set('text', message);
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}${params.toString()}`;
  }
}

export function buildViberUrl(whatsappNumber: string): string {
  const n = digitsOnly(whatsappNumber) || '639171234567';
  return `viber://chat?number=${n}`;
}

export function buildTelHref(phoneDisplayOrDigits: string): string {
  const d = digitsOnly(phoneDisplayOrDigits);
  if (!d) return 'tel:';
  return d.startsWith('63') ? `tel:+${d}` : `tel:${d}`;
}
