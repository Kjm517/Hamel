import {
  defaultProductTags,
  normalizePromoBadgeStyle,
  type CornerTagAutoRule,
  type ProductTag,
  type TagPlacement,
} from '../data/productTags';
import { apiFetch } from './api';
import {
  getDefaultTagIconPaths,
  getPublicStorageUrl,
  normalizeStoragePathForDb,
  resolveStorageImageUrl,
} from './storage';

type ProductTagRow = {
  id: string;
  name: string;
  style: string;
  icon_url: string | null;
  icon_emoji: string | null;
  icon_bg_color: string | null;
  text_bg_color: string | null;
  subtitle: string | null;
  description?: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  placement?: string | null;
  auto_rule?: string | null;
};

const VALID_AUTO_RULES = new Set(['manual', 'flash-sale', 'inverter', 'best-seller']);

function getDefaultTagById(id: string): ProductTag | undefined {
  return defaultProductTags.find((t) => t.id === id);
}

function normalizePlacement(value: string | null | undefined, id?: string): TagPlacement {
  if (value === 'corner') return 'corner';
  if (value === 'promo') return 'promo';
  if (id?.startsWith('corner-')) return 'corner';
  return 'promo';
}

function normalizeAutoRule(value: string | null | undefined): CornerTagAutoRule | undefined {
  if (value && VALID_AUTO_RULES.has(value)) return value as CornerTagAutoRule;
  return undefined;
}

function resolveTagIconUrl(row: ProductTagRow): string | undefined {
  if (row.icon_url) {
    return resolveStorageImageUrl(row.icon_url);
  }
  if (!row.icon_emoji && import.meta.env.VITE_TAG_ICON_FALLBACK !== 'false') {
    const [first] = getDefaultTagIconPaths(row.id);
    if (first) return getPublicStorageUrl(first);
  }
  return undefined;
}

function rowToTag(row: ProductTagRow): ProductTag {
  const iconUrl = resolveTagIconUrl(row);
  const placement = normalizePlacement(row.placement, row.id);
  const defaults = getDefaultTagById(row.id);
  const autoFromDb = normalizeAutoRule(row.auto_rule);
  const autoApply =
    placement === 'corner'
      ? autoFromDb ?? defaults?.autoApply ?? 'manual'
      : autoFromDb ?? defaults?.autoApply;

  return {
    id: row.id,
    name: row.name,
    style: normalizePromoBadgeStyle(row.style),
    placement,
    autoApply,
    iconUrl,
    iconEmoji: iconUrl ? undefined : row.icon_emoji ?? undefined,
    iconBgColor: row.icon_bg_color ?? defaults?.iconBgColor ?? undefined,
    textBgColor: row.text_bg_color ?? defaults?.textBgColor ?? undefined,
    subtitle: row.subtitle ?? undefined,
    description: row.description?.trim() || defaults?.description || undefined,
  };
}

export async function fetchProductTagsFromDb(): Promise<ProductTag[]> {
  const res = await apiFetch<{ tags: ProductTagRow[] }>('/api/product-tags', { auth: false });
  const rows = res.tags ?? [];
  if (rows.length === 0) return [...defaultProductTags];
  return rows.filter((r) => r.is_active !== false).map(rowToTag);
}

export async function upsertProductTags(tags: ProductTag[]): Promise<void> {
  await apiFetch('/api/product-tags', {
    method: 'PUT',
    body: {
      tags: tags.map((tag) => ({
        ...tag,
        iconUrl: tag.iconUrl ? normalizeStoragePathForDb(tag.iconUrl) ?? tag.iconUrl : undefined,
      })),
    },
  });
}

export async function deleteProductTagFromDb(id: string): Promise<void> {
  await apiFetch(`/api/product-tags/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function resetProductTagsInDb(): Promise<ProductTag[]> {
  const res = await apiFetch<{ tags: ProductTagRow[] }>('/api/product-tags/reset', {
    method: 'POST',
  });
  const rows = res.tags ?? [];
  if (rows.length === 0) return [...defaultProductTags];
  return rows.filter((r) => r.is_active !== false).map(rowToTag);
}
