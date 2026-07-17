import type { Product } from '../data/products';
import type { PromoBadgeStyle } from '../data/productTags';
import { resolveProductPromos, getPrimaryPromoEntry, resolvePromoEntry } from './product-promos';
import type { ProductPromoEntry } from '../data/products';

export type ResolvedProductPromo = {
  badgeType: PromoBadgeStyle;
  label: string;
  subtitle?: string;
  description?: string;
  chipImageUrl?: string;
  renderMode?: 'composed' | 'image';
  iconUrl?: string;
  iconEmoji?: string;
  iconBgColor: string;
  textBgColor: string;
  cashPerMonth?: number;
  type: ProductPromoEntry['type'];
  value: number;
  validUntil?: string;
  promoEndsAt?: string;
};

/** @deprecated Use resolveProductPromos — returns first sticker only */
export function resolveProductPromo(product: Product): ResolvedProductPromo | null {
  const list = resolveProductPromos(product);
  return list[0] ?? null;
}

export { resolveProductPromos, resolvePromoEntry, getPrimaryPromoEntry };
