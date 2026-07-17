import { fetchContent, getCachedContent, saveContent } from '../lib/content-api';

export type VoucherDiscountType = 'fixed' | 'percent' | 'free_install';

/** Who may claim the voucher (enforced when customer accounts exist; shown on storefront). */
export type VoucherAudience = 'everyone' | 'new_users' | 'loyal_members' | 'returning';

export type VoucherProductScope = 'all' | 'selected';

export interface StoreVoucher {
  id: string;
  code: string;
  label: string;
  discountType: VoucherDiscountType;
  /** Pesos off, or percent (e.g. 10), or install value for free_install display. */
  value: number;
  minSpend: number;
  expiresAt?: string;
  enabled: boolean;
  /** all products vs only productIds */
  productScope: VoucherProductScope;
  /** Used when productScope is `selected`. */
  productIds: string[];
  audience: VoucherAudience;
  /**
   * Max number of customers / claims allowed. `0` = unlimited.
   * Counted when an inquiry is submitted with this voucher applied.
   */
  maxRedemptions: number;
  /** How many times this voucher has been claimed so far. */
  redemptionCount: number;
}

export interface VouchersConfig {
  vouchers: StoreVoucher[];
}

export const VOUCHER_AUDIENCE_LABELS: Record<VoucherAudience, string> = {
  everyone: 'Everyone',
  new_users: 'New customers only',
  loyal_members: 'Loyal members only',
  returning: 'Returning customers only',
};

export const defaultVouchers: VouchersConfig = {
  vouchers: [
    {
      id: 'v-cool1500',
      code: 'COOL1500',
      label: '₱1,500 OFF Aircon',
      discountType: 'fixed',
      value: 1500,
      minSpend: 15000,
      expiresAt: '2026-12-31',
      enabled: true,
      productScope: 'all',
      productIds: [],
      audience: 'everyone',
      maxRedemptions: 100,
      redemptionCount: 0,
    },
    {
      id: 'v-pct10',
      code: 'COOL10',
      label: '10% OFF selected units',
      discountType: 'percent',
      value: 10,
      minSpend: 20000,
      expiresAt: '2026-12-31',
      enabled: true,
      productScope: 'all',
      productIds: [],
      audience: 'everyone',
      maxRedemptions: 0,
      redemptionCount: 0,
    },
    {
      id: 'v-free-install',
      code: 'FREEINSTALL',
      label: 'Free professional installation',
      discountType: 'free_install',
      value: 1200,
      minSpend: 0,
      enabled: true,
      productScope: 'all',
      productIds: [],
      audience: 'new_users',
      maxRedemptions: 50,
      redemptionCount: 0,
    },
  ],
};

function normalizeAudience(raw: unknown): VoucherAudience {
  if (raw === 'new_users' || raw === 'loyal_members' || raw === 'returning') return raw;
  return 'everyone';
}

function normalize(raw: Partial<VouchersConfig> | null): VouchersConfig {
  if (!raw?.vouchers?.length) return structuredClone(defaultVouchers);
  return {
    vouchers: raw.vouchers.map((v, i) => {
      const productIds = Array.isArray(v.productIds)
        ? v.productIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        : [];
      const productScope: VoucherProductScope =
        v.productScope === 'selected' || (v.productScope !== 'all' && productIds.length > 0)
          ? 'selected'
          : 'all';
      return {
        id: v.id || `v-${i}`,
        code: (v.code || '').toUpperCase(),
        label: v.label || v.code || 'Voucher',
        discountType:
          v.discountType === 'percent' || v.discountType === 'free_install'
            ? v.discountType
            : 'fixed',
        value: Number(v.value) || 0,
        minSpend: Number(v.minSpend) || 0,
        expiresAt: v.expiresAt,
        enabled: v.enabled !== false,
        productScope,
        productIds: productScope === 'selected' ? productIds : [],
        audience: normalizeAudience(v.audience),
        maxRedemptions: Math.max(0, Number(v.maxRedemptions) || 0),
        redemptionCount: Math.max(0, Number(v.redemptionCount) || 0),
      };
    }),
  };
}

export function getVouchersCached(): VouchersConfig {
  return normalize(getCachedContent<VouchersConfig>('vouchers') ?? null);
}

export async function loadVouchers(): Promise<VouchersConfig> {
  const data = await fetchContent('vouchers', defaultVouchers);
  return normalize(data);
}

export async function saveVouchers(config: VouchersConfig): Promise<void> {
  await saveContent('vouchers', normalize(config));
}

/** `0` max = unlimited. */
export function voucherHasRemaining(voucher: StoreVoucher): boolean {
  if (!voucher.maxRedemptions || voucher.maxRedemptions <= 0) return true;
  return voucher.redemptionCount < voucher.maxRedemptions;
}

export function voucherRemainingSlots(voucher: StoreVoucher): number | null {
  if (!voucher.maxRedemptions || voucher.maxRedemptions <= 0) return null;
  return Math.max(0, voucher.maxRedemptions - voucher.redemptionCount);
}

export function voucherLimitLabel(voucher: StoreVoucher): string {
  if (!voucher.maxRedemptions || voucher.maxRedemptions <= 0) {
    return 'Unlimited claims';
  }
  const left = voucherRemainingSlots(voucher) ?? 0;
  return `${voucher.redemptionCount}/${voucher.maxRedemptions} used · ${left} left`;
}

export function voucherAppliesToProduct(voucher: StoreVoucher, productId?: string): boolean {
  if (voucher.productScope !== 'selected') return true;
  if (!productId) return false;
  return voucher.productIds.includes(productId);
}

export function listVouchersForProduct(
  productId: string | undefined,
  config?: VouchersConfig,
  opts?: { includeExhausted?: boolean }
): StoreVoucher[] {
  const list = (config ?? getVouchersCached()).vouchers.filter((v) => v.enabled);
  return list.filter((v) => {
    if (!voucherAppliesToProduct(v, productId)) return false;
    if (!opts?.includeExhausted && !voucherHasRemaining(v)) return false;
    return true;
  });
}

export function computeVoucherDiscount(
  voucher: StoreVoucher,
  subtotal: number
): { amount: number; label: string } {
  if (!voucherHasRemaining(voucher)) {
    return { amount: 0, label: 'Voucher claim limit reached' };
  }
  if (subtotal < voucher.minSpend) {
    return { amount: 0, label: `Min spend ₱${voucher.minSpend.toLocaleString()}` };
  }
  if (voucher.discountType === 'percent') {
    const amount = Math.round((subtotal * voucher.value) / 100);
    return { amount, label: voucher.label };
  }
  if (voucher.discountType === 'free_install') {
    return { amount: voucher.value, label: voucher.label };
  }
  return { amount: Math.min(voucher.value, subtotal), label: voucher.label };
}

export function findVoucherByCode(
  code: string,
  config?: VouchersConfig,
  productId?: string
): StoreVoucher | undefined {
  const list = (config ?? getVouchersCached()).vouchers.filter((v) => v.enabled);
  const needle = code.trim().toUpperCase();
  const found = list.find((v) => v.code.toUpperCase() === needle);
  if (!found) return undefined;
  if (!voucherAppliesToProduct(found, productId)) return undefined;
  return found;
}

/** Increment redemption count after a successful inquiry / claim. */
export async function recordVoucherRedemption(voucherId: string): Promise<StoreVoucher | null> {
  const cfg = await loadVouchers();
  const idx = cfg.vouchers.findIndex((v) => v.id === voucherId);
  if (idx < 0) return null;
  const current = cfg.vouchers[idx];
  if (!voucherHasRemaining(current)) return current;
  const next: StoreVoucher = {
    ...current,
    redemptionCount: current.redemptionCount + 1,
  };
  const vouchers = [...cfg.vouchers];
  vouchers[idx] = next;
  await saveVouchers({ vouchers });
  return next;
}
