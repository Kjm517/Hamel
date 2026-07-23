import type { BannerConfig } from '../components/PageBanner';
import { fetchContent, getCachedContent, saveContent } from '../lib/content-api';
import { hamelAssets, hamelHeroSlides, hamelPromoBanners } from './hamelAssets';
import type { PromoAnimationStyle } from '../lib/promo-animations';
import type {
  PromoAmbientDirection,
  PromoAmbientEffect,
  PromoAmbientIntensity,
} from '../lib/promo-ambient-effects';
import {
  normalizePromoAmbientEffect,
  normalizePromoAmbientIntensity,
  normalizePromoAmbientDurationSec,
  normalizePromoAmbientDirection,
  DEFAULT_AMBIENT_DURATION_SEC,
} from '../lib/promo-ambient-effects';
import { resolveStorageImageUrl } from '../lib/storage';

export type PageKey = 'home' | 'products' | 'brands' | 'why-hamel' | 'contact';

export interface FeaturedCollectionConfig {
  /** When false, homepage hides this promo event section. */
  enabled?: boolean;
  title: string;
  titleHighlight: string;
  bgColor: string;
  /** Optional full-bleed background image (waves, campaign art). Color shows underneath / as fallback. */
  bgImageUrl?: string;
  /** Darken/tint the image so title text stays readable (0–1). Default 0.25 when image set. */
  bgImageOverlay?: number;
  titleColor: string;
  highlightColor: string;
  subtitle?: string;
  /** CTA under the product row (e.g. "See All Products"). */
  seeAllLabel?: string;
  /** Header + button link target (default /products). */
  seeAllHref?: string;
  seeAllExternal?: boolean;
  /** Curated product IDs (order preserved). Empty = first catalog products. */
  productIds?: string[];
  /** Optional section-level countdown end (ISO). Hidden when empty/expired. */
  countdownEndsAt?: string;
  /** Label beside countdown, e.g. "ENDS IN". */
  countdownLabel?: string;
  /** Hours left under which timer boxes turn urgent red (default 72 = 3 days). */
  urgencyThresholdHours?: number;
  /** Auto-apply urgent red when under the threshold (default true). */
  urgentWhenEndingSoon?: boolean;
  /** Always show urgent red while the countdown is visible. */
  forceUrgentRed?: boolean;
  /** Entrance animation for the Birthday / promo event strip. */
  animation?: PromoAnimationStyle;
  /** Continuous overlay effect (balloons, breeze, frost, etc.). */
  ambientEffect?: PromoAmbientEffect;
  /** How strong the ambient overlay feels. */
  ambientIntensity?: PromoAmbientIntensity;
  /** Seconds the effect stays before fade. 0 = continuous. */
  ambientDurationSec?: number;
  /** Vertical travel: bottom→top or top→bottom. */
  ambientDirection?: PromoAmbientDirection;
}

/** Cool Deals page hero — full-width banner image + optional text overlay. */
export interface CoolDealsBannerConfig {
  /** Full-width hero banner image (upload one graphic for the whole strip). */
  bannerImageUrl: string;
  /** Show badge / headline on top of the banner image. */
  showTextOverlay?: boolean;
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  titleColor: string;
  highlightColor: string;
  linkMode?: 'none' | 'promo-page' | 'custom';
  promoPageId?: string;
  linkHref?: string;
  ctaHref?: string;
  linkExternal?: boolean;
  ctaExternal?: boolean;
  ambientEffect?: PromoAmbientEffect;
  ambientIntensity?: PromoAmbientIntensity;
  ambientDurationSec?: number;
  ambientDirection?: PromoAmbientDirection;
}

export interface PromoBannerItem {
  /** Whether this optional offer appears beside the homepage carousel. */
  enabled?: boolean;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
  /** Whole-banner click target; falls back to `ctaHref` when empty. */
  linkHref?: string;
  linkExternal?: boolean;
  linkMode?: 'none' | 'promo-page' | 'custom';
  promoPageId?: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  imageUrl?: string;
}

export interface BannerStore {
  home: BannerConfig;
  products: BannerConfig;
  brands: BannerConfig;
  'why-hamel': BannerConfig;
  contact: BannerConfig;
  heroSlides: BannerConfig[];
  featuredCollection: FeaturedCollectionConfig;
  promoBanners: [PromoBannerItem, PromoBannerItem, PromoBannerItem];
  coolDealsBanner: CoolDealsBannerConfig;
}

export const PAGE_LABELS: Record<PageKey, string> = {
  home: 'Home — Announcement Banner',
  products: 'Products Page',
  brands: 'Brands Page',
  'why-hamel': 'Why Hamel Page',
  contact: 'Contact Page',
};

const defaultHeroSlides: BannerConfig[] = [...hamelHeroSlides];

const defaultFeaturedCollection: FeaturedCollectionConfig = {
  enabled: true,
  title: 'COOL',
  titleHighlight: 'SUMMER',
  bgColor: '#0EA5E9',
  bgImageUrl: '',
  bgImageOverlay: 0.2,
  titleColor: '#FFFFFF',
  highlightColor: '#FFC107',
  subtitle: 'Beat the heat with our top-selling cooling solutions.',
  seeAllLabel: 'See All Products',
  seeAllHref: '/products',
  seeAllExternal: false,
  productIds: [],
  countdownEndsAt: undefined,
  countdownLabel: 'ENDS IN',
  urgencyThresholdHours: 72,
  urgentWhenEndingSoon: true,
  forceUrgentRed: false,
  animation: 'fade',
  ambientEffect: 'none',
  ambientIntensity: 'medium',
  ambientDurationSec: DEFAULT_AMBIENT_DURATION_SEC,
  ambientDirection: 'down',
};

const FEATURED_PRODUCT_LIMIT = 5;

function mergeFeaturedCollection(
  parsed?: Partial<FeaturedCollectionConfig> | null
): FeaturedCollectionConfig {
  const productIds = Array.isArray(parsed?.productIds)
    ? parsed!.productIds!.filter((id): id is string => typeof id === 'string' && id.trim().length > 0).slice(0, FEATURED_PRODUCT_LIMIT)
    : [];
  return {
    ...defaultFeaturedCollection,
    ...parsed,
    enabled: parsed?.enabled !== false,
    productIds,
    bgImageUrl: typeof parsed?.bgImageUrl === 'string' ? parsed.bgImageUrl.trim() : '',
    bgImageOverlay:
      typeof parsed?.bgImageOverlay === 'number' && Number.isFinite(parsed.bgImageOverlay)
        ? Math.min(1, Math.max(0, parsed.bgImageOverlay))
        : defaultFeaturedCollection.bgImageOverlay,
    seeAllLabel: parsed?.seeAllLabel?.trim() || defaultFeaturedCollection.seeAllLabel,
    seeAllHref: parsed?.seeAllHref?.trim() || defaultFeaturedCollection.seeAllHref,
    seeAllExternal: Boolean(parsed?.seeAllExternal),
    countdownEndsAt: parsed?.countdownEndsAt?.trim() || undefined,
    countdownLabel: parsed?.countdownLabel?.trim() || defaultFeaturedCollection.countdownLabel,
    urgencyThresholdHours: (() => {
      const raw = Number(parsed?.urgencyThresholdHours);
      return Number.isFinite(raw) && raw > 0
        ? raw
        : defaultFeaturedCollection.urgencyThresholdHours;
    })(),
    urgentWhenEndingSoon: parsed?.urgentWhenEndingSoon !== false,
    forceUrgentRed: parsed?.forceUrgentRed === true,
    animation: parsed?.animation || defaultFeaturedCollection.animation || 'fade',
    ambientEffect: normalizePromoAmbientEffect(parsed?.ambientEffect),
    ambientIntensity: normalizePromoAmbientIntensity(parsed?.ambientIntensity),
    ambientDurationSec: normalizePromoAmbientDurationSec(parsed?.ambientDurationSec),
    ambientDirection: normalizePromoAmbientDirection(
      parsed?.ambientDirection,
      parsed?.ambientEffect
    ),
  };
}

export { FEATURED_PRODUCT_LIMIT };

const defaultPromoBanners = hamelPromoBanners.map((banner, index) => ({
  ...banner,

  enabled: index > 0,
})) as unknown as [PromoBannerItem, PromoBannerItem, PromoBannerItem];

const defaultCoolDealsBanner: CoolDealsBannerConfig = {
  badge: 'Limited Time Only!',
  title: 'COOL DEALS.',
  titleHighlight: 'BIGGER SAVINGS.',
  subtitle: 'Enjoy exclusive vouchers and freebies when you buy your new aircon from Hamel!',
  titleColor: '#0C4A6E',
  highlightColor: '#0EA5E9',
  bannerImageUrl: hamelAssets.promo.saleBanner,
  showTextOverlay: false,
  ambientEffect: 'none',
  ambientIntensity: 'medium',
  ambientDurationSec: DEFAULT_AMBIENT_DURATION_SEC,
  ambientDirection: 'down',
};

export const defaultBanners: BannerStore = {
  home: {
    imageUrl: hamelAssets.promo.saleBanner,
    imageAlt: 'Summer Promo',
    tag: '⚡ Limited Time',
    title: 'Summer Sale — Up to 20% OFF Select Models',
    subtitle: 'Free installation + delivery on all orders above ₱20,000. Valid until May 31, 2026.',
    ctaLabel: 'Shop Deals',
    ctaHref: '/products',
    overlayColor: 'linear-gradient(to right, rgba(234,88,12,0.93) 0%, rgba(249,115,22,0.75) 55%, rgba(249,115,22,0.3) 100%)',
    height: 'sm',
    textAlign: 'left',
  },
  products: {
    imageUrl: hamelAssets.aircon.wallSplitDaikinAmihan,
    imageAlt: 'Aircon products',
    tag: 'Summer 2026',
    title: 'Find Your Perfect Aircon',
    subtitle: 'All units include free delivery, professional installation, and full manufacturer warranty.',
    ctaLabel: 'View Flash Deals',
    ctaHref: '/products',
    overlayColor: 'linear-gradient(to right, rgba(14,165,233,0.93) 0%, rgba(14,165,233,0.65) 55%, rgba(14,165,233,0.15) 100%)',
    height: 'md',
    textAlign: 'left',
  },
  brands: {
    imageUrl: hamelAssets.hero.showroom,
    imageAlt: 'Premium brands',
    tag: 'Authorized Dealer',
    title: 'Top Aircon Brands in Cebu',
    subtitle: 'All units are 100% authentic with official manufacturer warranty. Sold only through authorized channels.',
    ctaLabel: 'Shop by Brand',
    ctaHref: '/products',
    overlayColor: 'linear-gradient(to right, rgba(26,58,107,0.95) 0%, rgba(14,165,233,0.75) 55%, rgba(14,165,233,0.2) 100%)',
    height: 'md',
    textAlign: 'left',
  },
  'why-hamel': {
    imageUrl: hamelAssets.services.install01,
    imageAlt: 'Professional team',
    tag: 'Since 2010',
    title: "Cebu's Most Trusted Aircon Partner",
    subtitle: 'Over 500 satisfied families and businesses. TESDA-certified installers. Real people, real service.',
    overlayColor: 'linear-gradient(to right, rgba(26,58,107,0.95) 0%, rgba(14,165,233,0.75) 55%, rgba(14,165,233,0.25) 100%)',
    height: 'md',
    textAlign: 'left',
  },
  contact: {
    imageUrl: hamelAssets.hero.modelPhone,
    imageAlt: 'Customer service',
    tag: "We're Here to Help",
    title: 'Talk to Our Team',
    subtitle: 'Real people, real answers. No bots, no call centers. Reach us on Messenger, WhatsApp, or Viber.',
    ctaLabel: 'Chat on WhatsApp',
    ctaHref: 'https://wa.me/639171234567',
    ctaExternal: true,
    overlayColor: 'linear-gradient(to right, rgba(26,58,107,0.95) 0%, rgba(14,165,233,0.7) 60%, rgba(14,165,233,0.2) 100%)',
    height: 'md',
    textAlign: 'left',
  },
  heroSlides: defaultHeroSlides,
  featuredCollection: defaultFeaturedCollection,
  promoBanners: defaultPromoBanners,
  coolDealsBanner: defaultCoolDealsBanner,
};

const STORAGE_KEY = 'hamel_banners_v6';

type LegacyCoolDealsBanner = Partial<CoolDealsBannerConfig> & {
  mascotImageUrl?: string;
  heroImageUrl?: string;
  heroPromos?: unknown[];
  imageOnly?: boolean;
};

function mergeCoolDealsBanner(parsed?: LegacyCoolDealsBanner): CoolDealsBannerConfig {
  const base = { ...defaultCoolDealsBanner, ...parsed };
  if (!parsed?.bannerImageUrl) {
    base.bannerImageUrl =
      parsed?.heroImageUrl ||
      parsed?.mascotImageUrl ||
      hamelAssets.coolDeals.heroVisual ||
      hamelAssets.promo.saleBanner;
  }
  if (parsed?.showTextOverlay === undefined && parsed?.imageOnly !== undefined) {
    base.showTextOverlay = !parsed.imageOnly;
  }
  base.ambientEffect = normalizePromoAmbientEffect(parsed?.ambientEffect);
  base.ambientIntensity = normalizePromoAmbientIntensity(parsed?.ambientIntensity);
  base.ambientDurationSec = normalizePromoAmbientDurationSec(parsed?.ambientDurationSec);
  base.ambientDirection = normalizePromoAmbientDirection(
    parsed?.ambientDirection,
    parsed?.ambientEffect
  );
  return base;
}

function resolveBannerImage(url?: string | null): string {
  const trimmed = url?.trim() || '';
  if (!trimmed) return '';

  if (trimmed.startsWith('data:')) return trimmed;
  return resolveStorageImageUrl(trimmed) || trimmed;
}

function mergePageBanner(
  parsed: Partial<BannerConfig> | undefined,
  fallback: BannerConfig
): BannerConfig {
  const merged = { ...fallback, ...parsed };
  return {
    ...merged,
    imageUrl: resolveBannerImage(merged.imageUrl) || fallback.imageUrl,
  };
}

function mergePromoBanners(
  parsed?: PromoBannerItem[] | null
): [PromoBannerItem, PromoBannerItem, PromoBannerItem] {
  return defaultPromoBanners.map((fallback, index) => {
    const saved = parsed?.[index];
    const merged = {
      ...fallback,
      ...saved,
      enabled: saved?.enabled ?? fallback.enabled,
    };
    return {
      ...merged,
      imageUrl: resolveBannerImage(merged.imageUrl) || undefined,
    };
  }) as [PromoBannerItem, PromoBannerItem, PromoBannerItem];
}

function normalizeStore(parsed: Partial<BannerStore> | null | undefined): BannerStore {
  const pageKeys: PageKey[] = ['home', 'products', 'brands', 'why-hamel', 'contact'];
  const pages = Object.fromEntries(
    pageKeys.map((key) => [key, mergePageBanner(parsed?.[key], defaultBanners[key])])
  ) as Pick<BannerStore, PageKey>;

  const heroSlides = (parsed?.heroSlides ?? defaultBanners.heroSlides).map((slide, i) =>
    mergePageBanner(slide, defaultHeroSlides[i] ?? defaultHeroSlides[0] ?? slide)
  );

  const cool = mergeCoolDealsBanner(parsed?.coolDealsBanner);

  return {
    ...defaultBanners,
    ...parsed,
    ...pages,
    heroSlides,
    featuredCollection: mergeFeaturedCollection(parsed?.featuredCollection),
    promoBanners: mergePromoBanners(parsed?.promoBanners),
    coolDealsBanner: {
      ...cool,
      bannerImageUrl: resolveBannerImage(cool.bannerImageUrl) || cool.bannerImageUrl,
    },
  };
}

export function getBanners(): BannerStore {
  const cached = getCachedContent<BannerStore>('banners');
  if (cached) return normalizeStore(cached);
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return normalizeStore(JSON.parse(stored) as Partial<BannerStore>);
    }
  } catch {

  }
  return { ...defaultBanners };
}

export async function loadBanners(): Promise<BannerStore> {
  const data = await fetchContent<BannerStore>('banners', defaultBanners);
  const normalized = normalizeStore(data);
  window.dispatchEvent(new CustomEvent('hamel-banners-updated'));
  return normalized;
}

export async function saveBanners(banners: BannerStore): Promise<void> {
  await saveContent('banners', banners);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {

  }
  window.dispatchEvent(new CustomEvent('hamel-banners-updated'));
}

export async function resetBanners(): Promise<void> {
  await saveContent('banners', defaultBanners);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {

  }
  window.dispatchEvent(new CustomEvent('hamel-banners-updated'));
}
