import { fetchContent, getCachedContent, saveContent } from '../lib/content-api';
import type { PromoAnimationStyle } from '../lib/promo-animations';
import { normalizePromoAnimation } from '../lib/promo-animations';

export type PromoPopupLayout = 'centered' | 'split' | 'coupon' | 'poster';
export type PromoPopupPurpose = 'voucher' | 'product' | 'announcement';
export type PromoPopupMediaType = 'image' | 'video';

/** How often a matched popup may appear for this browser. */
export type PromoPopupFrequency =
  | 'once_per_browser'
  | 'once_per_session'
  | 'every_visit';

/** Which storefront pages can show this popup. */
export type PromoPopupPageScope = 'all' | 'home' | 'selected';

export interface SitePromoPopupItem {
  id: string;
  /** Admin-only label for the list. */
  name: string;
  enabled: boolean;
  /** Lower number = higher priority when several match. */
  priority: number;
  frequency: PromoPopupFrequency;
  pageScope: PromoPopupPageScope;
  /** Used when pageScope is `selected` (e.g. `/cool-deals`, `/products`). */
  pagePaths: string[];
  /** Optional delay before opening (ms). */
  delayMs: number;
  /** Determines whether this card promotes a voucher, a catalog product, or a general announcement. */
  purpose: PromoPopupPurpose;
  layout: PromoPopupLayout;
  animation: PromoAnimationStyle;
  headline: string;
  body: string;
  code: string;
  /** Catalog product used to populate a product spotlight. */
  productId?: string;
  /** Full-image ads can use either an image or an MP4 video. */
  mediaType: PromoPopupMediaType;
  imageUrl?: string;
  ctaLabel: string;
  ctaHref: string;
  dismissLabel: string;
}

/** CMS document: multiple conditional popups. */
export interface SitePromoPopupsConfig {
  popups: SitePromoPopupItem[];
}

/** @deprecated Legacy single-popup shape — still accepted on load. */
export interface SitePromoPopupConfig {
  enabled: boolean;
  layout: PromoPopupLayout;
  animation: PromoAnimationStyle;
  headline: string;
  body: string;
  code: string;
  imageUrl?: string;
  ctaLabel: string;
  ctaHref: string;
  dismissLabel: string;
  showOnce: boolean;
}

export const PROMO_POPUP_FREQUENCY_LABELS: Record<PromoPopupFrequency, string> = {
  once_per_browser: 'Once per browser (until dismissed)',
  once_per_session: 'Once per browser session',
  every_visit: 'Every visit / page load',
};

export const PROMO_POPUP_PAGE_SCOPE_LABELS: Record<PromoPopupPageScope, string> = {
  all: 'All storefront pages',
  home: 'Homepage only',
  selected: 'Selected pages',
};

export function emptyPromoPopup(partial?: Partial<SitePromoPopupItem>): SitePromoPopupItem {
  return {
    id: `popup-${Date.now()}`,
    name: 'New promo popup',
    enabled: false,
    priority: 10,
    frequency: 'once_per_browser',
    pageScope: 'home',
    pagePaths: [],
    delayMs: 400,
    purpose: 'voucher',
    layout: 'centered',
    animation: 'slide-up',
    headline: 'SUMMER COOL DEALS',
    body: 'Get ₱1,500 OFF your first aircon. Free installation + delivery on orders above ₱20,000.',
    code: 'COOL1500',
    mediaType: 'image',
    imageUrl: '',
    ctaLabel: 'Shop the sale',
    ctaHref: '/cool-deals',
    dismissLabel: 'No thanks, maybe later',
    ...partial,
  };
}

export const defaultSitePromoPopups: SitePromoPopupsConfig = {
  popups: [
    emptyPromoPopup({
      id: 'popup-welcome',
      name: 'Welcome / first visit',
      enabled: false,
      priority: 1,
      frequency: 'once_per_browser',
      pageScope: 'home',
    }),
  ],
};

/** @deprecated Prefer defaultSitePromoPopups */
export const defaultSitePromoPopup: SitePromoPopupConfig = {
  enabled: false,
  layout: 'centered',
  animation: 'slide-up',
  headline: 'SUMMER COOL DEALS',
  body: 'Get ₱1,500 OFF your first aircon. Free installation + delivery on orders above ₱20,000.',
  code: 'COOL1500',
  imageUrl: '',
  ctaLabel: 'Shop the sale',
  ctaHref: '/cool-deals',
  dismissLabel: 'No thanks, maybe later',
  showOnce: true,
};

function normalizeFrequency(raw: unknown, showOnce?: boolean): PromoPopupFrequency {
  if (raw === 'every_visit' || raw === 'once_per_session' || raw === 'once_per_browser') {
    return raw;
  }
  if (showOnce === false) return 'every_visit';
  return 'once_per_browser';
}

function normalizePageScope(raw: unknown): PromoPopupPageScope {
  if (raw === 'home' || raw === 'selected' || raw === 'all') return raw;
  return 'all';
}

function normalizePurpose(raw: unknown, code?: unknown): PromoPopupPurpose {
  if (raw === 'voucher' || raw === 'product' || raw === 'announcement') return raw;
  return typeof code === 'string' && code.trim() ? 'voucher' : 'announcement';
}

function normalizeMediaType(raw: unknown): PromoPopupMediaType {
  return raw === 'video' ? 'video' : 'image';
}

function normalizePaths(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .map((p) => {
      const t = p.trim();
      return t.startsWith('/') ? t : `/${t}`;
    });
}

function normalizeItem(
  raw: Partial<SitePromoPopupItem> & Partial<SitePromoPopupConfig>,
  index: number
): SitePromoPopupItem {
  const base = emptyPromoPopup({
    id: raw.id || `popup-${index}`,
    name: raw.name || raw.headline || `Popup ${index + 1}`,
  });
  return {
    ...base,
    ...raw,
    id: raw.id || base.id,
    name: (raw.name || raw.headline || base.name).trim() || base.name,
    enabled: Boolean(raw.enabled),
    priority: Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : index + 1,
    frequency: normalizeFrequency(raw.frequency, raw.showOnce),
    pageScope: normalizePageScope(raw.pageScope),
    pagePaths: normalizePaths(raw.pagePaths),
    delayMs: Math.max(0, Number(raw.delayMs) || 0),
    purpose: normalizePurpose(raw.purpose, raw.code),
    layout:
      raw.layout === 'split' || raw.layout === 'coupon' || raw.layout === 'poster'
        ? raw.layout
        : 'centered',
    animation: normalizePromoAnimation(raw.animation),
    headline: raw.headline ?? base.headline,
    body: raw.body ?? base.body,
    code: (raw.code || '').toUpperCase(),
    productId: typeof raw.productId === 'string' ? raw.productId : undefined,
    mediaType: normalizeMediaType(raw.mediaType),
    imageUrl: raw.imageUrl ?? '',
    ctaLabel: raw.ctaLabel ?? base.ctaLabel,
    ctaHref: raw.ctaHref ?? base.ctaHref,
    dismissLabel: raw.dismissLabel ?? base.dismissLabel,
  };
}

function isLegacySingle(raw: unknown): raw is Partial<SitePromoPopupConfig> {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return !Array.isArray(o.popups) && ('headline' in o || 'showOnce' in o || 'layout' in o);
}

export function normalizeSitePromoPopups(raw: unknown): SitePromoPopupsConfig {
  if (!raw || typeof raw !== 'object') {
    return structuredClone(defaultSitePromoPopups);
  }
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.popups) && o.popups.length > 0) {
    return {
      popups: o.popups.map((item, i) =>
        normalizeItem(item as Partial<SitePromoPopupItem>, i)
      ),
    };
  }
  if (isLegacySingle(raw)) {
    const legacy = raw as Partial<SitePromoPopupConfig>;
    return {
      popups: [
        normalizeItem(
          {
            ...legacy,
            id: 'popup-migrated',
            name: legacy.headline || 'Migrated popup',
            priority: 1,
            frequency: legacy.showOnce === false ? 'every_visit' : 'once_per_browser',
            pageScope: 'all',
            pagePaths: [],
            delayMs: 0,
          },
          0
        ),
      ],
    };
  }
  return structuredClone(defaultSitePromoPopups);
}

export function getSitePromoPopupsCached(): SitePromoPopupsConfig {
  return normalizeSitePromoPopups(getCachedContent('site_promo_popup') ?? null);
}

export async function loadSitePromoPopups(): Promise<SitePromoPopupsConfig> {
  const data = await fetchContent('site_promo_popup', defaultSitePromoPopups);
  return normalizeSitePromoPopups(data);
}

export async function saveSitePromoPopups(config: SitePromoPopupsConfig): Promise<void> {
  await saveContent('site_promo_popup', normalizeSitePromoPopups(config));
}

/** @deprecated Use loadSitePromoPopups */
export async function loadSitePromoPopup(): Promise<SitePromoPopupConfig> {
  const cfg = await loadSitePromoPopups();
  const first = cfg.popups[0];
  if (!first) return structuredClone(defaultSitePromoPopup);
  return {
    enabled: first.enabled,
    layout: first.layout,
    animation: first.animation,
    headline: first.headline,
    body: first.body,
    code: first.code,
    imageUrl: first.imageUrl,
    ctaLabel: first.ctaLabel,
    ctaHref: first.ctaHref,
    dismissLabel: first.dismissLabel,
    showOnce: first.frequency === 'once_per_browser',
  };
}

/** @deprecated Use saveSitePromoPopups */
export async function saveSitePromoPopup(config: SitePromoPopupConfig): Promise<void> {
  await saveSitePromoPopups({
    popups: [
      emptyPromoPopup({
        id: 'popup-legacy',
        name: config.headline || 'Promo popup',
        enabled: config.enabled,
        frequency: config.showOnce !== false ? 'once_per_browser' : 'every_visit',
        pageScope: 'all',
        layout: config.layout,
        animation: config.animation,
        headline: config.headline,
        body: config.body,
        code: config.code,
        imageUrl: config.imageUrl,
        ctaLabel: config.ctaLabel,
        ctaHref: config.ctaHref,
        dismissLabel: config.dismissLabel,
      }),
    ],
  });
}

const STORAGE_KEY_V2 = 'hamel_promo_popup_dismissed_v2';
const SESSION_KEY = 'hamel_promo_popup_session_v1';

type DismissMap = Record<string, string>;

function readMap(key: string, storage: Storage): DismissMap {
  try {
    const raw = storage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as DismissMap;
  } catch {
    return {};
  }
}

function writeMap(key: string, storage: Storage, map: DismissMap): void {
  try {
    storage.setItem(key, JSON.stringify(map));
  } catch {

  }
}

function dismissKey(popup: SitePromoPopupItem): string {
  return popup.id || popup.code || popup.headline;
}

export function wasPromoPopupDismissed(popup: SitePromoPopupItem): boolean {
  const key = dismissKey(popup);
  if (popup.frequency === 'every_visit') return false;
  if (popup.frequency === 'once_per_session') {
    if (typeof sessionStorage === 'undefined') return false;
    return Boolean(readMap(SESSION_KEY, sessionStorage)[key]);
  }

  if (typeof localStorage === 'undefined') return false;
  const map = readMap(STORAGE_KEY_V2, localStorage);
  if (map[key]) return true;

  try {
    const legacy = localStorage.getItem('hamel_promo_popup_dismissed_v1');
    if (legacy && (legacy === popup.code || legacy === popup.headline)) return true;
  } catch {

  }
  return false;
}

export function markPromoPopupDismissed(popup: SitePromoPopupItem): void {
  if (popup.frequency === 'every_visit') return;
  const key = dismissKey(popup);
  if (popup.frequency === 'once_per_session') {
    if (typeof sessionStorage === 'undefined') return;
    const map = readMap(SESSION_KEY, sessionStorage);
    map[key] = new Date().toISOString();
    writeMap(SESSION_KEY, sessionStorage, map);
    return;
  }
  if (typeof localStorage === 'undefined') return;
  const map = readMap(STORAGE_KEY_V2, localStorage);
  map[key] = new Date().toISOString();
  writeMap(STORAGE_KEY_V2, localStorage, map);
}

/** Normalize pathname for matching (strip trailing slash except root). */
export function normalizePopupPath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function popupMatchesPath(popup: SitePromoPopupItem, pathname: string): boolean {
  const path = normalizePopupPath(pathname);
  if (popup.pageScope === 'all') return true;
  if (popup.pageScope === 'home') return path === '/';
  return popup.pagePaths.some((p) => {
    const target = normalizePopupPath(p);
    if (target === path) return true;

    if (target !== '/' && path.startsWith(`${target}/`)) return true;
    return false;
  });
}

/**
 * All popups that match the current path (enabled, matching pages, not dismissed),
 * sorted by priority (lowest number first).
 */
export function listPromoPopupsForPath(
  config: SitePromoPopupsConfig,
  pathname: string
): SitePromoPopupItem[] {
  return config.popups
    .filter((p) => p.enabled)
    .filter((p) => popupMatchesPath(p, pathname))
    .filter((p) => !wasPromoPopupDismissed(p))
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

/**
 * Pick the single best popup for the current path.
 * Prefer listPromoPopupsForPath when showing a queue of matches.
 */
export function pickPromoPopupForPath(
  config: SitePromoPopupsConfig,
  pathname: string
): SitePromoPopupItem | null {
  return listPromoPopupsForPath(config, pathname)[0] ?? null;
}
