import type { Product, ProductPromoEntry } from '../data/products';
import {
  getProductTagById,
  getProductTags,
  getStyleColors,
  normalizePromoBadgeStyle,
  type ProductTag,
  type PromoBadgeStyle,
} from '../data/productTags';
import type { ResolvedProductPromo } from './resolveProductPromo';

export const MAX_PRODUCT_PROMOS = 4;

export function promoTypeForStyle(style: PromoBadgeStyle): ProductPromoEntry['type'] {
  switch (style) {
    case 'flash-sale':
      return 'percentage';
    case 'discount':
      return 'fixed';
    case 'free-install':
      return 'free-service';
    case 'cash-deal':
      return 'cash-deal';
    case 'bundle':
      return 'bundle';
    default:
      return 'percentage';
  }
}

export function createPromoEntryFromTag(
  tagId: string,
  catalogTags: ProductTag[],
  partial?: Partial<ProductPromoEntry>
): ProductPromoEntry | null {
  const tag = catalogTags.find((t) => t.id === tagId);
  if (!tag) return null;
  const style = normalizePromoBadgeStyle(tag.style);
  const type = promoTypeForStyle(style);
  return {
    tagId: tag.id,
    badgeType: style,
    label: tag.name,
    type,
    value:
      partial?.value ?? (type === 'percentage' ? 15 : type === 'fixed' ? 5000 : 0),
    cashPerMonth: type === 'cash-deal' ? partial?.cashPerMonth ?? 500 : undefined,
    validUntil: partial?.validUntil,
    promoEndsAt: partial?.promoEndsAt,
    appliesTo: partial?.appliesTo,
  };
}

export function getProductPromoList(product: Product): ProductPromoEntry[] {
  if (product.promos?.length) {
    return product.promos.slice(0, MAX_PRODUCT_PROMOS);
  }
  if (product.promo) {
    return [product.promo];
  }
  return [];
}

/** Chip/sticker text: product discount values + live tag name from catalog. */
export function buildPromoDisplayLabel(entry: ProductPromoEntry, tag?: ProductTag): string {
  if (entry.type === 'percentage') {
    return `${entry.value}% OFF`;
  }
  if (entry.type === 'fixed' && entry.value > 0) {
    return `₱${entry.value.toLocaleString()} OFF`;
  }
  if (entry.type === 'cash-deal' && entry.cashPerMonth) {
    return `₱${entry.cashPerMonth.toLocaleString()}/mo`;
  }
  if (tag?.name?.trim()) return tag.name;
  return entry.label?.trim() || 'Promo';
}

export function normalizeProductForSave(product: Product): Product {
  const catalog = getProductTags();
  const promos = getProductPromoList(product)
    .filter((p) => p.tagId || p.label.trim())
    .map((entry) => {
      const tag = entry.tagId ? getProductTagById(entry.tagId, catalog) : undefined;
      if (!tag) return entry;
      return {
        ...entry,
        badgeType: normalizePromoBadgeStyle(tag.style),
        type: entry.type || promoTypeForStyle(tag.style),
        label: buildPromoDisplayLabel(entry, tag),
      };
    });
  const next = { ...product, promo: undefined as Product['promo'] };
  if (promos.length > 0) {
    next.promos = promos;
  } else {
    delete next.promos;
  }
  if (product.cornerTagIds !== undefined) {
    next.cornerTagIds = product.cornerTagIds;
  }
  return next;
}

export function resolvePromoEntry(
  entry: ProductPromoEntry,
  tagCatalog?: ProductTag[]
): ResolvedProductPromo | null {
  const catalog = tagCatalog ?? getProductTags();
  const tag = entry.tagId ? getProductTagById(entry.tagId, catalog) : undefined;

  if (!entry.tagId && !entry.label?.trim()) return null;
  if (entry.tagId && !tag && !entry.label?.trim()) return null;

  const badgeType = normalizePromoBadgeStyle(tag?.style ?? entry.badgeType);
  const colors = getStyleColors(badgeType);
  const label = buildPromoDisplayLabel(entry, tag);

  return {
    badgeType,
    label,
    subtitle: tag?.subtitle,
    description: tag?.description?.trim() || undefined,
    iconUrl: tag?.iconUrl,
    iconEmoji: tag?.iconUrl ? undefined : tag?.iconEmoji,
    iconBgColor: tag?.iconBgColor ?? colors.iconBg,
    textBgColor: tag?.textBgColor ?? colors.textBg,
    cashPerMonth: entry.cashPerMonth,
    type: entry.type,
    value: entry.value,
    validUntil: entry.validUntil,
    promoEndsAt: entry.promoEndsAt,
  };
}

export function resolveProductPromos(
  product: Product,
  tagCatalog?: ProductTag[]
): ResolvedProductPromo[] {
  return getProductPromoList(product)
    .map((entry) => resolvePromoEntry(entry, tagCatalog))
    .filter((p): p is ResolvedProductPromo => p !== null);
}

/** Lowest price after applying percentage/fixed promos (best deal for customer). */
export function getDiscountedPrice(product: Product, price: number): number {
  let result = price;
  for (const entry of getProductPromoList(product)) {
    if (entry.type === 'percentage') {
      result = Math.min(result, price - (price * entry.value) / 100);
    } else if (entry.type === 'fixed') {
      result = Math.min(result, Math.max(0, price - entry.value));
    }
  }
  return result;
}

export function productHasPromos(product: Product): boolean {
  return getProductPromoList(product).length > 0;
}

export function productHasFlashSale(product: Product): boolean {
  return getProductPromoList(product).some(
    (p) => normalizePromoBadgeStyle(p.badgeType) === 'flash-sale'
  );
}

/** Primary promo for banner copy / inquiry (first entry). */
export function getPrimaryPromoEntry(product: Product): ProductPromoEntry | undefined {
  return getProductPromoList(product)[0];
}

/** Prefer flash-sale entry with promoEndsAt; else any promo with an end time; else parse validUntil. */
export function getPromoCountdownEndsAt(product: Product): string | undefined {
  const list = getProductPromoList(product);
  const flash = list.find(
    (p) =>
      normalizePromoBadgeStyle(p.badgeType) === 'flash-sale' && Boolean(p.promoEndsAt?.trim())
  );
  if (flash?.promoEndsAt) return flash.promoEndsAt;

  const withEnds = list.find((p) => p.promoEndsAt?.trim());
  if (withEnds?.promoEndsAt) return withEnds.promoEndsAt;

  // Fallback: parse human-readable validUntil on flash promos
  const flashWithLabel = list.find(
    (p) =>
      normalizePromoBadgeStyle(p.badgeType) === 'flash-sale' && Boolean(p.validUntil?.trim())
  );
  if (flashWithLabel?.validUntil) {
    const parsed = Date.parse(flashWithLabel.validUntil);
    if (Number.isFinite(parsed)) {
      // End of that calendar day in local time
      const d = new Date(parsed);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    }
  }

  return undefined;
}

export function isPromoCountdownActive(endsAt?: string | null): boolean {
  if (!endsAt?.trim()) return false;
  const t = Date.parse(endsAt);
  return Number.isFinite(t) && t > Date.now();
}

/** datetime-local input value from ISO string */
export function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso?.trim()) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO string from datetime-local input (browser local timezone) */
export function fromDatetimeLocalValue(local: string): string | undefined {
  if (!local.trim()) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}
