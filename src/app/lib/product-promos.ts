import type { Product, ProductPromoEntry } from '../data/products';
import {
  formatHpDiscountLabel,
  getHpDiscountPercentRange,
  getHpDiscountPesoRange,
  getHpSalePrice,
  getHpUnitPrice,
  hasHpDiscounts,
  isSplitTypeProduct,
} from '../data/products';
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
export const FREE_INSTALL_TAG_ID = 'tag-free-install';

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

function hasFreeInstallPromo(entries: ProductPromoEntry[]): boolean {
  return entries.some(
    (p) =>
      p.tagId === FREE_INSTALL_TAG_ID ||
      p.badgeType === 'free-install' ||
      p.type === 'free-service'
  );
}

/** Promos shown on storefront (auto-adds free install for Split Type). */
export function getEffectivePromoList(
  product: Product,
  catalogTags?: ProductTag[]
): ProductPromoEntry[] {
  const catalog = catalogTags ?? getProductTags();
  let list = [...getProductPromoList(product)];

  if (isSplitTypeProduct(product) && !hasFreeInstallPromo(list)) {
    const injected =
      createPromoEntryFromTag(FREE_INSTALL_TAG_ID, catalog) ??
      ({
        tagId: FREE_INSTALL_TAG_ID,
        type: 'free-service' as const,
        value: 0,
        label: 'FREE AUTHORIZED',
        badgeType: 'free-install' as const,
      } satisfies ProductPromoEntry);
    if (list.length >= MAX_PRODUCT_PROMOS) {
      list = [injected, ...list.slice(0, MAX_PRODUCT_PROMOS - 1)];
    } else {
      list = [...list, injected];
    }
  }

  return list.slice(0, MAX_PRODUCT_PROMOS);
}

/** Sync percentage/fixed promo values from per-HP discounts (admin helper). */
export function syncPromosFromHpDiscounts(product: Product): ProductPromoEntry[] {
  const list = getProductPromoList(product);
  if (!hasHpDiscounts(product)) return list;

  const discounted = (product.hpVariants ?? []).filter(
    (v) => Number(v.discount) > 0 && Number(v.price) > 0
  );
  const pesoRange = getHpDiscountPesoRange(product);
  const pctRange = getHpDiscountPercentRange(product);
  const appliesTo = discounted.map((v) => v.hp).join(', ');
  const hpLabel = formatHpDiscountLabel(product);

  return list.map((entry) => {
    if (entry.type === 'fixed' && pesoRange) {
      return {
        ...entry,
        value: pesoRange.max,
        appliesTo,
        label: hpLabel || `₱${pesoRange.max.toLocaleString()} OFF`,
      };
    }
    if (entry.type === 'percentage' && pctRange) {
      return {
        ...entry,
        value: pctRange.max,
        appliesTo,
        label:
          pctRange.min === pctRange.max
            ? `${pctRange.max}% OFF`
            : `${pctRange.min}%–${pctRange.max}% OFF`,
      };
    }
    return entry;
  });
}

/** Chip/sticker text: product discount values + live tag name from catalog. */
export function buildPromoDisplayLabel(
  entry: ProductPromoEntry,
  tag?: ProductTag,
  product?: Product
): string {
  if (
    product &&
    hasHpDiscounts(product) &&
    (entry.type === 'percentage' || entry.type === 'fixed')
  ) {
    const hpLabel = formatHpDiscountLabel(product);
    if (hpLabel) return hpLabel;
  }
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
  const synced = hasHpDiscounts(product)
    ? { ...product, promos: syncPromosFromHpDiscounts(product) }
    : product;
  const promos = getProductPromoList(synced)
    .filter((p) => p.tagId || p.label.trim())
    .map((entry) => {
      const tag = entry.tagId ? getProductTagById(entry.tagId, catalog) : undefined;
      if (!tag) return entry;
      return {
        ...entry,
        badgeType: normalizePromoBadgeStyle(tag.style),
        type: entry.type || promoTypeForStyle(tag.style),
        label: buildPromoDisplayLabel(entry, tag, synced),
      };
    });
  const next = { ...synced, promo: undefined as Product['promo'] };
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
  tagCatalog?: ProductTag[],
  product?: Product
): ResolvedProductPromo | null {
  const catalog = tagCatalog ?? getProductTags();
  const tag = entry.tagId ? getProductTagById(entry.tagId, catalog) : undefined;

  if (!entry.tagId && !entry.label?.trim()) return null;
  if (entry.tagId && !tag && !entry.label?.trim()) return null;

  const badgeType = normalizePromoBadgeStyle(tag?.style ?? entry.badgeType);
  const colors = getStyleColors(badgeType);
  const label = buildPromoDisplayLabel(entry, tag, product);

  return {
    badgeType,
    label,
    subtitle: tag?.subtitle,
    description: tag?.description?.trim() || undefined,
    chipImageUrl: tag?.chipImageUrl,
    renderMode: tag?.renderMode ?? (tag?.chipImageUrl ? 'image' : 'composed'),
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
  return getEffectivePromoList(product, tagCatalog)
    .map((entry) => resolvePromoEntry(entry, tagCatalog, product))
    .filter((p): p is ResolvedProductPromo => p !== null);
}

function applyPromoDiscounts(product: Product, price: number): number {
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

/**
 * Sale price for a list price. When `hp` is set (or per-HP discounts exist),
 * uses the HP discount; otherwise applies product-level percentage/fixed promos.
 */
export function getDiscountedPrice(product: Product, price: number, hp?: string): number {
  if (hp) {
    // A product with per-HP discounts must never fall back to the synced
    // product-level promo. That promo can represent another HP's discount.
    // No discount on this HP therefore means its normal list price.
    if (hasHpDiscounts(product)) return getHpSalePrice(product, hp);
    return applyPromoDiscounts(product, getHpUnitPrice(product, hp));
  }

  if (hasHpDiscounts(product)) {
    const match = product.hpVariants?.find((v) => v.price === price);
    if (match) {
      const hp = match.hp;
      return getHpSalePrice(product, hp);
    }

    if (price === product.priceStart || price === product.priceEnd) {
      const hps = product.hp.length ? product.hp : (product.hpVariants?.map((v) => v.hp) ?? []);
      const sales = hps.map((h) => getHpSalePrice(product, h));
      if (sales.length) {
        return price === product.priceStart ? Math.min(...sales) : Math.max(...sales);
      }
    }
  }

  return applyPromoDiscounts(product, price);
}

export function getProductDisplayPrices(product: Product): {
  listStart: number;
  listEnd: number;
  saleStart: number;
  saleEnd: number;
  hasDiscount: boolean;
} {
  const hps = product.hp.length
    ? product.hp
    : (product.hpVariants?.map((v) => v.hp) ?? ['']);
  const rows = hps.map((hp) => {
    const list = getHpUnitPrice(product, hp || undefined);
    const sale = getDiscountedPrice(product, list, hp || undefined);
    return { list, sale };
  });
  const listStart = rows.length ? Math.min(...rows.map((r) => r.list)) : product.priceStart;
  const listEnd = rows.length ? Math.max(...rows.map((r) => r.list)) : product.priceEnd;
  const saleStart = rows.length ? Math.min(...rows.map((r) => r.sale)) : listStart;
  const saleEnd = rows.length ? Math.max(...rows.map((r) => r.sale)) : listEnd;
  return {
    listStart,
    listEnd,
    saleStart,
    saleEnd,
    hasDiscount: saleStart < listStart || saleEnd < listEnd,
  };
}

export function productHasPromos(product: Product): boolean {
  return getEffectivePromoList(product).length > 0;
}

export function productHasFlashSale(product: Product): boolean {
  return getEffectivePromoList(product).some(
    (p) => normalizePromoBadgeStyle(p.badgeType) === 'flash-sale'
  );
}

/** Primary promo for banner copy / inquiry (first entry). */
export function getPrimaryPromoEntry(product: Product): ProductPromoEntry | undefined {
  return getEffectivePromoList(product)[0];
}

/** Prefer flash-sale entry with promoEndsAt; else any promo with an end time; else parse validUntil. */
export function getPromoCountdownEndsAt(product: Product): string | undefined {
  const list = getEffectivePromoList(product);
  const flash = list.find(
    (p) =>
      normalizePromoBadgeStyle(p.badgeType) === 'flash-sale' && Boolean(p.promoEndsAt?.trim())
  );
  if (flash?.promoEndsAt) return flash.promoEndsAt;

  const withEnds = list.find((p) => p.promoEndsAt?.trim());
  if (withEnds?.promoEndsAt) return withEnds.promoEndsAt;

  const flashWithLabel = list.find(
    (p) =>
      normalizePromoBadgeStyle(p.badgeType) === 'flash-sale' && Boolean(p.validUntil?.trim())
  );
  if (flashWithLabel?.validUntil) {
    const parsed = Date.parse(flashWithLabel.validUntil);
    if (Number.isFinite(parsed)) {
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
