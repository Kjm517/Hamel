import type { Product } from '../data/products';
import {
  getHpDiscountPercent,
  getHpDiscountPercentRange,
  hasHpDiscounts,
} from '../data/products';
import type { ProductTag } from '../data/productTags';
import { isCornerTag } from '../data/productTags';
import type { CornerTagVariant } from '../components/PromoBadge';
import { getPrimaryPromoEntry, productHasFlashSale } from './product-promos';

const MAX_CORNER_TAGS = 4;

export function cornerTagTextColor(tag: ProductTag): string {
  return tag.iconBgColor ?? '#FFFFFF';
}

export function cornerTagBgColor(tag: ProductTag): string {
  return tag.textBgColor ?? '#EA580C';
}

/** TAG-D: discount/sale = solid pill; inverter/spec = outline pill. */
export function cornerTagVariant(tag: ProductTag): CornerTagVariant {
  const rule = tag.autoApply ?? 'manual';
  if (rule === 'inverter' || rule === 'best-seller') return 'outline';
  if (tag.style === 'flash-sale' || tag.style === 'discount') return 'solid';
  const n = tag.name.toUpperCase();
  if (
    n.includes('INV') ||
    n.includes('INVERTER') ||
    n.includes('TOP') ||
    n.includes('RATED') ||
    n.includes('BEST')
  ) {
    return 'outline';
  }
  return 'solid';
}

/**
 * Live −% for flash/discount corner tags.
 * Pass `hp` on the product detail page so the badge matches the selected size’s price.
 * Returns null when a discount-style tag has nothing real to show (hides placeholder names like "-").
 */
export function formatCornerTagLabel(
  product: Product,
  tag: ProductTag,
  hp?: string
): string | null {
  const variant = cornerTagVariant(tag);
  if (variant === 'solid') {
    if (hasHpDiscounts(product)) {
      if (hp) {
        const pct = getHpDiscountPercent(product, hp);
        if (pct > 0) {
          const rounded = Number.isInteger(pct) ? pct : Math.round(pct * 10) / 10;
          return `-${rounded}%`;
        }
      } else {
        const range = getHpDiscountPercentRange(product);
        if (range && range.max > 0) {
          const max =
            Number.isInteger(range.max) ? range.max : Math.round(range.max * 10) / 10;
          if (range.min !== range.max) return `up to -${max}%`;
          return `-${max}%`;
        }
      }
    }
    const promo = getPrimaryPromoEntry(product);
    // When HP discounts drive pricing, never show a synced single promo.value
    // (it can be the max across HPs and disagree with the selected size).
    if (!hasHpDiscounts(product) && promo?.type === 'percentage' && promo.value > 0) {
      return `-${promo.value}%`;
    }
    // Discount/sale pills with no computed % — don't show placeholder tag names ("-", "SALE", etc.)
    const rule = tag.autoApply ?? 'manual';
    if (
      rule === 'flash-sale' ||
      tag.style === 'flash-sale' ||
      tag.style === 'discount' ||
      /^[-–—]$/.test(tag.name.trim()) ||
      !tag.name.trim()
    ) {
      return null;
    }
  }
  if (tag.autoApply === 'inverter') {
    const n = tag.name.trim();
    if (/^inv$/i.test(n) || /inverter/i.test(n)) return 'INVERTER';
  }
  const name = tag.name.trim();
  return name && !/^[-–—]$/.test(name) ? name : null;
}

function productMatchesAutoRule(product: Product, rule: ProductTag['autoApply']): boolean {
  switch (rule) {
    case 'flash-sale':
      return productHasFlashSale(product);
    case 'inverter':
      return product.features.some((f) => f.toLowerCase().includes('inverter'));
    case 'best-seller':
      return product.reviews > 150;
    default:
      return false;
  }
}

/** Corner pills on the product card (TAG-D). Manual IDs override auto rules. */
export function resolveProductCornerTags(
  product: Product,
  catalog: ProductTag[]
): ProductTag[] {
  const cornerCatalog = catalog.filter(isCornerTag);

  if (product.cornerTagIds !== undefined) {
    return product.cornerTagIds
      .map((id) => cornerCatalog.find((t) => t.id === id))
      .filter((t): t is ProductTag => Boolean(t))
      .slice(0, MAX_CORNER_TAGS);
  }

  const matched: ProductTag[] = [];
  for (const tag of cornerCatalog) {
    const rule = tag.autoApply ?? 'manual';
    if (rule !== 'manual' && productMatchesAutoRule(product, rule)) {
      matched.push(tag);
    }
  }
  return matched.slice(0, MAX_CORNER_TAGS);
}
