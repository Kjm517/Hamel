import type { Product } from '../data/products';
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

/** Prefer live −% for flash/discount tags when the product has a percentage promo. */
export function formatCornerTagLabel(product: Product, tag: ProductTag): string {
  const variant = cornerTagVariant(tag);
  if (variant === 'solid') {
    const promo = getPrimaryPromoEntry(product);
    if (promo?.type === 'percentage' && promo.value > 0) {
      return `-${promo.value}%`;
    }
  }
  if (tag.autoApply === 'inverter') {
    const n = tag.name.trim();
    if (/^inv$/i.test(n) || /inverter/i.test(n)) return 'INVERTER';
  }
  return tag.name;
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
