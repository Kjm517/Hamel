import type { Product } from '../data/products';
import type { ProductTag } from '../data/productTags';
import { isCornerTag } from '../data/productTags';
import { productHasFlashSale } from './product-promos';

const MAX_CORNER_TAGS = 4;

export function cornerTagTextColor(tag: ProductTag): string {
  return tag.iconBgColor ?? '#FFFFFF';
}

export function cornerTagBgColor(tag: ProductTag): string {
  return tag.textBgColor ?? '#EA580C';
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

/** Corner badges on product image (top-right). Manual IDs override auto rules. */
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
