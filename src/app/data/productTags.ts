import {
  deleteProductTagFromDb,
  resetProductTagsInDb,
  upsertProductTags,
} from '../lib/product-tags-api';

export type PromoBadgeStyle =
  | 'cash-deal'
  | 'free-install'
  | 'discount'
  | 'flash-sale'
  | 'bundle';

export type TagPlacement = 'promo' | 'corner';

/** Auto-apply corner badge when product matches (if not manually overridden). */
export type CornerTagAutoRule = 'manual' | 'flash-sale' | 'inverter' | 'best-seller';

/** Composed = icon panel + text; image = Abenson-style full chip graphic (TAG D). */
export type ChipRenderMode = 'composed' | 'image';

export interface ProductTag {
  id: string;
  name: string;
  style: PromoBadgeStyle;
  placement?: TagPlacement;
  /** Corner badges only — when to show without picking on the product. */
  autoApply?: CornerTagAutoRule;
  /** How promo chips render on storefront cards. */
  renderMode?: ChipRenderMode;
  /** Full chip graphic (TAG D). Used when renderMode is `image`. */
  chipImageUrl?: string;
  iconUrl?: string;
  iconEmoji?: string;
  iconBgColor?: string;
  textBgColor?: string;
  subtitle?: string;
  /** Shown when customers click the chip (Special Offers modal). */
  description?: string;
}

export const CORNER_AUTO_RULE_LABELS: Record<CornerTagAutoRule, string> = {
  manual: 'Manual only (assign per product)',
  'flash-sale': 'Auto: product has flash-sale promo',
  inverter: 'Auto: product has Inverter feature',
  'best-seller': 'Auto: 150+ reviews',
};

export const PROMO_BADGE_STYLE_LABELS: Record<PromoBadgeStyle, string> = {
  'flash-sale': 'Flash sale (orange)',
  'free-install': 'Free install (green)',
  discount: 'Discount (red)',
  'cash-deal': 'Cool cash (blue)',
  bundle: 'Bundle (purple)',
};

export const DEFAULT_STYLE_COLORS: Record<
  PromoBadgeStyle,
  { iconBg: string; textBg: string }
> = {
  'flash-sale': { iconBg: '#C2410C', textBg: '#EA580C' },
  'free-install': { iconBg: '#065F46', textBg: '#059669' },
  discount: { iconBg: '#B91C1C', textBg: '#DC2626' },
  'cash-deal': { iconBg: '#1E3A8A', textBg: '#2563EB' },
  bundle: { iconBg: '#5B21B6', textBg: '#7C3AED' },
};

const VALID_STYLES = new Set<string>(Object.keys(DEFAULT_STYLE_COLORS));

/** Guards against bad localStorage / legacy promo data. */
export function normalizePromoBadgeStyle(style: string | undefined): PromoBadgeStyle {
  if (style && VALID_STYLES.has(style)) return style as PromoBadgeStyle;
  return 'flash-sale';
}

export function getStyleColors(style: string | undefined): { iconBg: string; textBg: string } {
  return DEFAULT_STYLE_COLORS[normalizePromoBadgeStyle(style)];
}

function mergeTagWithDefaults(partial: Partial<ProductTag>, fallback: ProductTag): ProductTag {
  const style = normalizePromoBadgeStyle(partial.style ?? fallback.style);
  const placement = partial.placement ?? fallback.placement ?? 'promo';
  const chipImageUrl = partial.chipImageUrl ?? fallback.chipImageUrl;
  const renderMode: ChipRenderMode =
    partial.renderMode ??
    fallback.renderMode ??
    (chipImageUrl ? 'image' : 'composed');
  return {
    id: partial.id ?? fallback.id,
    name: partial.name ?? fallback.name,
    style,
    placement,
    autoApply: partial.autoApply ?? fallback.autoApply,
    renderMode,
    chipImageUrl,
    iconUrl: partial.iconUrl ?? fallback.iconUrl,
    iconEmoji: partial.iconEmoji ?? fallback.iconEmoji,
    iconBgColor: partial.iconBgColor ?? fallback.iconBgColor,
    textBgColor: partial.textBgColor ?? fallback.textBgColor,
    subtitle: partial.subtitle ?? fallback.subtitle,
    description: partial.description ?? fallback.description,
  };
}

export function isCornerTag(tag: ProductTag): boolean {
  return tag.placement === 'corner';
}

export function isPromoTag(tag: ProductTag): boolean {
  return tag.placement !== 'corner';
}

function sanitizeStoredTags(parsed: ProductTag[]): ProductTag[] {
  return parsed.map((raw, index) => {
    const fallback = defaultProductTags[index % defaultProductTags.length];
    return mergeTagWithDefaults(raw, fallback);
  });
}

export const defaultProductTags: ProductTag[] = [
  {
    id: 'tag-flash-15',
    name: '15% OFF',
    style: 'flash-sale',
    iconEmoji: '⚡',
    description:
      'Limited-time flash discount on selected aircon models. Discount is applied to the unit price shown on the product. Ask our team which models are included when you inquire.',
  },
  {
    id: 'tag-free-install',
    name: 'FREE AUTHORIZED',
    style: 'free-install',
    iconEmoji: '✓',
    subtitle: 'INSTALLATION',
    description:
      'Free authorized installation by Hamel-certified technicians on all Split Type units within Metro Cebu. Includes standard mounting and testing. Extra materials or special site conditions may have separate charges.',
  },
  {
    id: 'tag-5000-off',
    name: '₱5,000 OFF',
    style: 'discount',
    iconEmoji: '★',
    description:
      'Get ₱5,000 off selected packages when you purchase through Hamel. Mention this promo when you inquire so we can apply it to your quote.',
  },
  {
    id: 'tag-cool-cash',
    name: 'COOL CASH',
    style: 'cash-deal',
    iconEmoji: '₱',
    subtitle: 'per month',
    description:
      'Flexible installment options so you can pay monthly. Available terms and interest rates depend on the bank or financing partner. Ask our team for current Cool Cash plans on this model.',
  },
  {
    id: 'tag-bundle',
    name: 'PROMO BUNDLE DEAL',
    style: 'bundle',
    iconEmoji: '🎁',
    description:
      'Bundle deal pricing when you buy this unit with eligible add-ons or multi-unit packages. Contact us for the latest bundle combinations and savings.',
  },
  {
    id: 'corner-sale',
    name: 'SALE',
    style: 'flash-sale',
    placement: 'corner',
    autoApply: 'flash-sale',
    textBgColor: '#EA580C',
    iconBgColor: '#FFFFFF',
  },
  {
    id: 'corner-inv',
    name: 'INV',
    style: 'flash-sale',
    placement: 'corner',
    autoApply: 'inverter',
    textBgColor: '#0EA5E9',
    iconBgColor: '#FFFFFF',
  },
  {
    id: 'corner-top',
    name: 'TOP',
    style: 'bundle',
    placement: 'corner',
    autoApply: 'best-seller',
    textBgColor: '#7C3AED',
    iconBgColor: '#FFFFFF',
  },
];

const STORAGE_KEY = 'hamel_product_tags_v1';

let tagsCache: ProductTag[] | null = null;

export function setProductTagsCache(tags: ProductTag[]): void {
  tagsCache = tags;
}

export function getProductTagsFromLocalStorage(): ProductTag[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ProductTag[];
      if (Array.isArray(parsed) && parsed.length > 0) return sanitizeStoredTags(parsed);
    }
  } catch {

  }
  return null;
}

/** Sync read — uses API cache when loaded, else localStorage, else defaults. */
export function getProductTags(): ProductTag[] {
  if (tagsCache?.length) return tagsCache;
  return getProductTagsFromLocalStorage() ?? [...defaultProductTags];
}

function persistTagsLocally(tags: ProductTag[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  } catch {

  }
}

export function notifyProductTagsUpdated(): void {
  window.dispatchEvent(new CustomEvent('hamel-product-tags-updated'));
  window.dispatchEvent(new CustomEvent('hamel-catalog-updated'));
}

export async function saveProductTags(tags: ProductTag[]): Promise<void> {
  await upsertProductTags(tags);
  setProductTagsCache(tags);
  persistTagsLocally(tags);
  notifyProductTagsUpdated();
}

export async function resetProductTags(): Promise<void> {
  const tags = await resetProductTagsInDb();
  setProductTagsCache(tags);
  persistTagsLocally(tags);
  notifyProductTagsUpdated();
}

export async function deleteProductTag(id: string): Promise<void> {
  await deleteProductTagFromDb(id);
}

export function getProductTagById(
  id: string | undefined,
  catalog?: ProductTag[]
): ProductTag | undefined {
  if (!id) return undefined;
  const list = catalog ?? getProductTags();
  return list.find((t) => t.id === id);
}
