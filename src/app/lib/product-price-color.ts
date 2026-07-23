import type { Product } from '../data/products';

/** Sale price color used on product cards and detail — blue by default, orange for deals. */
export function getPriceColor(tier: Product['tier'], hasPromo: boolean): string {
  if (tier === 'flash-sale' && hasPromo) return '#EA580C';
  if (tier === 'budget') return '#D97706';
  return '#0EA5E9';
}
