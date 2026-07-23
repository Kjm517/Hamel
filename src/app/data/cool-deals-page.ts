import { hexForColorInput, readableOnBackground } from '../lib/color-utils';
import { fetchContent, getCachedContent, saveContent } from '../lib/content-api';
import type { BannerLinkFields } from '../lib/banner-link';
import { hamelAssets } from './hamelAssets';

const cd = hamelAssets.coolDeals;

export type CoolDealsSectionType =
  | 'promo-strip'
  | 'deal-of-day'
  | 'service-sticky'
  | 'card-grid'
  | 'best-sellers'
  | 'flash-deals'
  | 'finder'
  | 'financing'
  | 'bundles'
  
  | 'brands'
  | 'recommended'
  | 'product-matrix'
  | 'trust-bar'
  | 'cta'
  | 'stats-brands';

export interface CoolDealsCardItem extends BannerLinkFields {
  id: string;
  title: string;
  color: string;
  imageUrl: string;
  body: string;
  /** Platform voucher code (Admin → Vouchers). Claimed cards appear under Platform Voucher. */
  voucherCode?: string;
}

export const DEAL_CARD_DEFAULT_COLORS = {
  bg: '#0C4A6E',
  title: '#FFFFFF',
  body: '#BFDBFE',
  cta: '#FFC107',
  accent: '#FFFFFF',
} as const;

export interface CoolDealsDealCardItem extends BannerLinkFields {
  id: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  imageUrl?: string;
  accent?: string;
  bgColor?: string;
  titleColor?: string;
  bodyColor?: string;
  ctaColor?: string;
  accentColor?: string;
}

function sameHex(a: string, b: string): boolean {
  return hexForColorInput(a) === hexForColorInput(b);
}

export function resolveDealCardColors(card: CoolDealsDealCardItem) {
  const bg = card.bgColor ?? DEAL_CARD_DEFAULT_COLORS.bg;
  const titleRaw = card.titleColor ?? DEAL_CARD_DEFAULT_COLORS.title;
  const bodyRaw = card.bodyColor ?? DEAL_CARD_DEFAULT_COLORS.body;
  const ctaRaw = card.ctaColor ?? DEAL_CARD_DEFAULT_COLORS.cta;

  const title = readableOnBackground(titleRaw, bg, DEAL_CARD_DEFAULT_COLORS.title);
  const body = readableOnBackground(bodyRaw, bg, DEAL_CARD_DEFAULT_COLORS.body);
  const cta = readableOnBackground(ctaRaw, bg, DEAL_CARD_DEFAULT_COLORS.cta);
  return {
    bg,
    title: sameHex(title, bg) ? DEAL_CARD_DEFAULT_COLORS.title : title,
    body: sameHex(body, bg) ? DEAL_CARD_DEFAULT_COLORS.body : body,
    cta: sameHex(cta, bg) ? DEAL_CARD_DEFAULT_COLORS.cta : cta,
    accent: card.accentColor ?? DEAL_CARD_DEFAULT_COLORS.accent,
  };
}

export interface CoolDealsSectionBase {
  id: string;
  type: CoolDealsSectionType;
  enabled: boolean;
}

export interface CoolDealsPromoStripSection extends CoolDealsSectionBase {
  type: 'promo-strip';
  badge: string;
  text: string;
  showCountdown: boolean;
}

export interface CoolDealsDealOfDaySection extends CoolDealsSectionBase {
  type: 'deal-of-day';
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  secondaryHref: string;
  trustLine: string;
  /** Catalog product id — prices/image pulled live when set */
  productId?: string;
  /** Manual overrides when no product (or to override display) */
  brand?: string;
  productName?: string;
  imageUrl?: string;
  priceNow?: number;
  priceWas?: number;
  badge?: string;
  /** Units remaining — drives “Only N left” and the selling-fast bar. */
  stockLeft?: number;
  /** Starting / total units for the bar (sold % = capacity − left). Default 20. */
  stockCapacity?: number;
  /** @deprecated Prefer stockLeft — still used as fallback label. */
  stockLabel?: string;
  /** @deprecated Prefer stockLeft + stockCapacity — still used as fallback bar %. */
  stockPct?: number;
  months?: number;
  tag?: string;
  inquireCta?: string;
  /** Timer turns urgent red when time left is under this many hours (end of day). */
  urgencyThresholdHours?: number;
  /** Auto-apply urgent red when under the threshold (default true). */
  blinkWhenUrgent?: boolean;
  /** Always show urgent red while the countdown is visible. */
  forceBlink?: boolean;
  /** @deprecated Deal sticky replaced by `service-sticky` section */
  showStickyBar?: boolean;
}

export interface CoolDealsServiceStickySection extends CoolDealsSectionBase {
  type: 'service-sticky';
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  /** Bar gradient start */
  bgFrom: string;
  /** Bar gradient end */
  bgTo: string;
  titleColor: string;
  subtitleColor: string;
  ctaBg: string;
  ctaText: string;
  accentColor: string;
}

export interface CoolDealsCardGridSection extends CoolDealsSectionBase {
  type: 'card-grid';
  variant: 'voucher' | 'deal';
  headingEyebrow?: string;
  headingTitle: string;
  headingSubtitle?: string;
  headingColor?: string;
  headingSubtitleColor?: string;
  background: 'white' | 'gray';
  cards: CoolDealsCardItem[];
  dealCards?: CoolDealsDealCardItem[];
}

export interface CoolDealsBestSellersSection extends CoolDealsSectionBase {
  type: 'best-sellers';
  eyebrow: string;
  headingTitle: string;
  seeAllHref: string;
  source: 'catalog' | 'manual';
  productIds: string[];
  /** Optional HP per product id — shown in ranking and opens product detail on that size. */
  productHps?: Record<string, string>;
  limit: number;
}

export interface CoolDealsFlashDealsSection extends CoolDealsSectionBase {
  type: 'flash-deals';
  headingTitle: string;
  headingSubtitle: string;
  seeAllHref: string;
  showCountdown: boolean;
  /** ISO date/time the sale ends. Empty = counts down to the end of the current day. */
  endsAt?: string;
  /** Timer turns urgent red when time left is at or below this many hours (default 72 = 3 days). */
  urgencyThresholdHours?: number;
  /** Auto-apply urgent red when under the threshold (default true). */
  blinkWhenUrgent?: boolean;
  /** Always show urgent red while the countdown is visible. */
  forceBlink?: boolean;
  source: 'catalog' | 'manual';
  productIds: string[];
  limit: number;
}

export interface CoolDealsFinderSection extends CoolDealsSectionBase {
  type: 'finder';
  eyebrow: string;
  title: string;
  subtitle: string;
}

export interface CoolDealsFinancingSection extends CoolDealsSectionBase {
  type: 'financing';
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  ctaLabel: string;
  minMonths: number;
  maxMonths: number;
  stepMonths: number;
  defaultMonths: number;
  /** Extra named prices for the calculator (beyond catalog) */
  models: { id: string; name: string; price: number }[];
}

export interface CoolDealsBundleItem {
  id: string;
  name: string;
  sub: string;
  imageUrl: string;
  priceNow: number;
  priceWas: number;
  featured?: boolean;
  badge?: string;
  includes: string[];
  ctaLabel?: string;
}

export interface CoolDealsBundlesSection extends CoolDealsSectionBase {
  type: 'bundles';
  eyebrow: string;
  headingTitle: string;
  headingSubtitle: string;
  items: CoolDealsBundleItem[];
}

export interface CoolDealsBrandsSection extends CoolDealsSectionBase {
  type: 'brands';
  eyebrow: string;
  headingTitle: string;
  /** Empty = use catalog brand logos */
  brandNames: string[];
}

export interface CoolDealsRecommendedSection extends CoolDealsSectionBase {
  type: 'recommended';
  headingTitle: string;
  source: 'catalog' | 'manual';
  productIds: string[];
  limit: number;
}

export interface CoolDealsProductColumn extends BannerLinkFields {
  id: string;
  name: string;
  sub: string;
  imageUrl: string;
  perks: string[];
}

export interface CoolDealsProductMatrixSection extends CoolDealsSectionBase {
  type: 'product-matrix';
  headingTitle: string;
  headingSubtitle?: string;
  footnote?: string;
  columns: CoolDealsProductColumn[];
  mechanicsLinkText?: string;
  mechanicsLinkHref?: string;
}

export interface CoolDealsTrustItem {
  id: string;
  title: string;
  sub: string;
  icon: string;
}

export interface CoolDealsTrustBarSection extends CoolDealsSectionBase {
  type: 'trust-bar';
  items: CoolDealsTrustItem[];
}

export interface CoolDealsCtaSection extends CoolDealsSectionBase {
  type: 'cta';
  title: string;
  subtitle: string;
}

export interface CoolDealsStatItem {
  id: string;
  value: string;
  label: string;
}

export interface CoolDealsStatsBrandsSection extends CoolDealsSectionBase {
  type: 'stats-brands';
  stats: CoolDealsStatItem[];
  brandsLabel: string;
}

export type CoolDealsSection =
  | CoolDealsPromoStripSection
  | CoolDealsDealOfDaySection
  | CoolDealsServiceStickySection
  | CoolDealsCardGridSection
  | CoolDealsBestSellersSection
  | CoolDealsFlashDealsSection
  | CoolDealsFinderSection
  | CoolDealsFinancingSection
  | CoolDealsBundlesSection
  | CoolDealsBrandsSection
  | CoolDealsRecommendedSection
  | CoolDealsProductMatrixSection
  | CoolDealsTrustBarSection
  | CoolDealsCtaSection
  | CoolDealsStatsBrandsSection;

export interface CoolDealsPageConfig {
  sections: CoolDealsSection[];
}

export const COOL_DEALS_PAGE_STORAGE_KEY = 'hamel_cool_deals_page_v2';
const STORAGE_KEY = COOL_DEALS_PAGE_STORAGE_KEY;

const defaultProductColumns: CoolDealsProductColumn[] = [
  {
    id: 'pt-window',
    name: 'Window Type',
    sub: 'Compact cooling for smaller rooms',
    imageUrl: cd.typeWindow,
    perks: ['Free Jisulife Fan', 'Free Delivery', 'Discount Voucher', 'Free 1 Cleaning'],
  },
  {
    id: 'pt-wall',
    name: 'Wall Mounted Split Type',
    sub: 'Most popular for homes & offices',
    imageUrl: cd.typeWallSplit,
    perks: ['Free Jisulife Fan', 'Free Delivery', 'Discount Voucher', 'Free 1 Cleaning'],
  },
  {
    id: 'pt-package',
    name: 'Package Type (Commercial)',
    sub: 'Larger spaces & businesses',
    imageUrl: cd.typePackage,
    perks: ['Free Jisulife Fan', 'Free Delivery', 'Discount Voucher', 'Free 1 Cleaning'],
  },
  {
    id: 'pt-vrf',
    name: 'VRF Type (Large Scale)',
    sub: 'Multi-zone commercial systems',
    imageUrl: cd.typeVrf,
    perks: ['Free Jisulife Fan', 'Free Delivery', 'Discount Voucher', 'Free 1 Cleaning'],
  },
];

function sid(): string {
  return `cd-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`;
}

const defaultVoucherCards: CoolDealsCardItem[] = [
  {
    id: 'v1',
    title: 'Free Jisulife Fan',
    color: '#0EA5E9',
    imageUrl: cd.voucherFan,
    body: 'Get a FREE Jisulife portable fan when you purchase a qualifying split-type or package aircon unit from Hamel.',
  },
  {
    id: 'v2',
    title: 'Free Delivery',
    color: '#6366F1',
    imageUrl: cd.voucherDelivery,
    body: 'Enjoy FREE delivery within Metro Cebu on all brand-new aircon units purchased during the promo period.',
  },
  {
    id: 'v3',
    title: 'Discount Vouchers',
    color: '#F97316',
    imageUrl: hamelAssets.mascot.cta,
    body: 'Save up to ₱3,000 OFF with exclusive Hamel discount vouchers on select models and HP ratings.',
    voucherCode: 'COOL1500',
  },
  {
    id: 'v4',
    title: 'Free 1 Cleaning Service',
    color: '#16A34A',
    imageUrl: cd.voucherCleaning,
    body: 'Receive one FREE professional cleaning service for your new unit — keep it running efficiently all year.',
  },
];

const defaultDealCards: CoolDealsDealCardItem[] = [
  {
    id: 'd1',
    title: 'Bundle & Save',
    body: 'Up to 15% OFF when you bundle multiple units.',
    cta: 'Shop Bundles',
    href: '/products',
    imageUrl: hamelAssets.aircon.wallSplitDaikinAmihan,
  },
  {
    id: 'd2',
    title: 'Install Now, Pay Later',
    body: '0% installment for up to 12 months.',
    cta: 'Learn More',
    href: '/contact',
    accent: '0%',
  },
  {
    id: 'd3',
    title: 'Trade-In Old AC',
    body: 'Get additional discounts on your new purchase.',
    cta: 'Get Quote',
    href: '/contact',
  },
  {
    id: 'd4',
    title: 'Big Project Special',
    body: 'Exclusive deals for commercial projects.',
    cta: 'Inquire Now',
    href: '/contact',
    imageUrl: hamelAssets.clients.commercial01,
  },
];

const defaultTrustItems: CoolDealsTrustItem[] = [
  { id: 't1', title: '100% Authentic', sub: 'Genuine, brand-new units', icon: 'award' },
  { id: 't2', title: 'Pro Installation', sub: 'Certified technicians', icon: 'wrench' },
  { id: 't3', title: 'Warranty Coverage', sub: 'Official manufacturer', icon: 'shield' },
  { id: 't4', title: 'Flexible Payment', sub: '0% up to 36 months', icon: 'package' },
  { id: 't5', title: 'After-Sales Support', sub: 'We stay with you', icon: 'headset' },
];

const defaultBundles: CoolDealsBundleItem[] = [
  {
    id: 'b-bedroom',
    name: 'Bedroom Cool Combo',
    sub: '1.0HP inverter · small rooms',
    priceNow: 19900,
    priceWas: 24400,
    imageUrl: hamelAssets.aircon.wallSplitDaikinAmihan,
    includes: [
      '1.0HP inverter split-type unit',
      'Professional installation',
      'Free Jisulife portable fan',
      '1 free cleaning service',
    ],
  },
  {
    id: 'b-living',
    name: 'Family Living Room',
    sub: '2.0HP inverter · most popular',
    priceNow: 37900,
    priceWas: 46900,
    featured: true,
    badge: 'MOST POPULAR',
    imageUrl: hamelAssets.aircon.wallSplitDaikinAmihan,
    includes: [
      '2.0HP inverter split-type unit',
      'Professional installation',
      'Free Jisulife fan + free delivery',
      '1 free cleaning + ₱3,000 voucher',
    ],
  },
  {
    id: 'b-duo',
    name: 'Whole-Home Duo',
    sub: '2× 1.5HP units · save more',
    priceNow: 58900,
    priceWas: 73000,
    imageUrl: hamelAssets.clients.commercial01,
    includes: [
      '2× 1.5HP inverter units',
      'Installation for both units',
      'Free fan + free delivery',
      '2 free cleaning services',
    ],
  },
];

export const defaultCoolDealsPage: CoolDealsPageConfig = {
  sections: [
    {
      id: 'sec-promo-strip',
      type: 'promo-strip',
      enabled: true,
      badge: 'SUMMER COOL SALE',
      text: 'Free installation on every inverter unit · Up to 40% off',
      showCountdown: true,
    },
    {
      id: 'sec-deal-of-day',
      type: 'deal-of-day',
      enabled: true,
      eyebrow: 'DEAL OF THE DAY',
      title: 'Beat the heat,\nnot your budget.',
      subtitle:
        'Inverter aircon from the brands you trust — with free installation, flexible monthly plans, and prices that won\'t last the week.',
      primaryCta: "Shop today's deal →",
      secondaryCta: 'Find my aircon',
      secondaryHref: '#finder',
      trustLine: '100% authentic · Free pro installation · Up to 36 mos to pay',
      brand: 'DAIKIN',
      productName: 'Amihan Inverter 1.5HP',
      imageUrl: hamelAssets.aircon.wallSplitDaikinAmihan,
      priceNow: 28900,
      priceWas: 39900,
      badge: 'SAVE ₱11,000',
      stockLeft: 7,
      stockCapacity: 20,
      stockLabel: 'Only 7 left',
      stockPct: 65,
      months: 36,
      tag: 'INVERTER',
      inquireCta: 'Inquire now',
      urgencyThresholdHours: 24,
      blinkWhenUrgent: true,
      forceBlink: false,
      showStickyBar: false,
    },
    {
      id: 'sec-service-sticky',
      type: 'service-sticky',
      enabled: true,
      eyebrow: 'Already own an aircon?',
      title: 'Aircon needs cleaning or repair?',
      subtitle: 'Certified techs · Metro Cebu · Book in under a minute',
      ctaLabel: 'Request a Service',
      bgFrom: '#0EA5E9',
      bgTo: '#0284C7',
      titleColor: '#FFFFFF',
      subtitleColor: '#E0F2FE',
      ctaBg: '#FFC107',
      ctaText: '#22303C',
      accentColor: '#FFC107',
    },
    {
      id: 'sec-vouchers',
      type: 'card-grid',
      enabled: true,
      variant: 'voucher',
      headingEyebrow: '',
      headingTitle: 'Exclusive Vouchers For You',
      headingSubtitle: 'More perks, more savings with every purchase!',
      background: 'white',
      cards: defaultVoucherCards,
    },
    {
      id: 'sec-best-sellers',
      type: 'best-sellers',
      enabled: true,
      eyebrow: 'MOST WANTED',
      headingTitle: 'Best sellers this week',
      seeAllHref: '/products',
      source: 'catalog',
      productIds: [],
      limit: 5,
    },
    {
      id: 'sec-flash-deals',
      type: 'flash-deals',
      enabled: true,
      headingTitle: 'Flash Deals',
      headingSubtitle: 'Lowest prices this month · while stocks last',
      seeAllHref: '/products',
      showCountdown: true,
      endsAt: '',
      urgencyThresholdHours: 72,
      blinkWhenUrgent: true,
      source: 'catalog',
      productIds: [],
      limit: 8,
    },
    {
      id: 'sec-finder',
      type: 'finder',
      enabled: true,
      eyebrow: 'NOT SURE WHAT TO BUY?',
      title: 'Find your perfect aircon in 30 seconds',
      subtitle: 'Answer 3 quick questions and we’ll match the right unit and HP to your space — no guessing.',
    },
    {
      id: 'sec-financing',
      type: 'financing',
      enabled: true,
      eyebrow: '0% INTEREST · UP TO 36 MOS',
      title: 'Cool now, pay monthly.',
      body: 'Slide to see your monthly payment. No hidden fees, approval in minutes with any valid ID + proof of billing.',
      bullets: ['No downpayment options', 'Fast approval'],
      ctaLabel: 'Apply for financing',
      minMonths: 3,
      maxMonths: 36,
      stepMonths: 3,
      defaultMonths: 24,
      models: [
        { id: 'fm1', name: 'Daikin Amihan 1.5HP', price: 28900 },
        { id: 'fm2', name: 'Panasonic Aero 2HP', price: 33575 },
        { id: 'fm3', name: 'Condura Neo 2HP', price: 25200 },
        { id: 'fm4', name: 'Family Living Bundle', price: 37900 },
      ],
    },
    {
      id: 'sec-bundles',
      type: 'bundles',
      enabled: true,
      eyebrow: 'BUY THE WHOLE SOLUTION',
      headingTitle: 'Value bundles — unit + install + perks',
      headingSubtitle: 'Everything you need in one price. No surprise add-ons, no separate installation fee.',
      items: defaultBundles,
    },
    {
      id: 'sec-brands',
      type: 'brands',
      enabled: true,
      eyebrow: 'AUTHORIZED DEALER',
      headingTitle: 'Shop by brand',
      brandNames: [],
    },
    {
      id: 'sec-recommended',
      type: 'recommended',
      enabled: true,
      headingTitle: 'Recommended for you',
      source: 'catalog',
      productIds: [],
      limit: 4,
    },
    {
      id: 'sec-trust',
      type: 'trust-bar',
      enabled: true,
      items: defaultTrustItems,
    },
    {
      id: 'sec-cta',
      type: 'cta',
      enabled: true,
      title: 'Ready to enjoy these cool deals?',
      subtitle: 'Talk to our experts and get the best cooling solution for your space.',
    },
  ],
};

export const COOL_DEALS_SECTION_LABELS: Record<CoolDealsSectionType, string> = {
  'promo-strip': 'Promo countdown strip',
  'deal-of-day': 'Deal of the Day hero',
  'service-sticky': 'Service sticky bar',
  'card-grid': 'Offer cards',
  'best-sellers': 'Best sellers ranking',
  'flash-deals': 'Flash deals',
  finder: 'Aircon finder quiz',
  financing: 'Financing calculator',
  bundles: 'Value bundles',
  brands: 'Shop by brand',
  recommended: 'Recommended products',
  'product-matrix': 'Product types & perks',
  'trust-bar': 'Trust icons',
  cta: 'Contact section',
  'stats-brands': 'Stats & brands',
};

export function defaultServiceStickySection(): CoolDealsServiceStickySection {
  return {
    id: 'sec-service-sticky',
    type: 'service-sticky',
    enabled: true,
    eyebrow: 'Already own an aircon?',
    title: 'Aircon needs cleaning or repair?',
    subtitle: 'Certified techs · Metro Cebu · Book in under a minute',
    ctaLabel: 'Request a Service',
    bgFrom: '#0EA5E9',
    bgTo: '#0284C7',
    titleColor: '#FFFFFF',
    subtitleColor: '#E0F2FE',
    ctaBg: '#FFC107',
    ctaText: '#22303C',
    accentColor: '#FFC107',
  };
}

function mergeServiceSticky(section: CoolDealsServiceStickySection): CoolDealsServiceStickySection {
  const d = defaultServiceStickySection();
  const rawLabel = section.ctaLabel?.trim() || '';
  const ctaLabel =
    !rawLabel || /^book a service$/i.test(rawLabel) ? d.ctaLabel : rawLabel;
  return {
    ...d,
    ...section,
    id: section.id || d.id,
    type: 'service-sticky',
    enabled: section.enabled !== false,
    eyebrow: section.eyebrow?.trim() || d.eyebrow,
    title: section.title?.trim() || d.title,
    subtitle: section.subtitle?.trim() || d.subtitle,
    ctaLabel,
    bgFrom: section.bgFrom?.trim() || d.bgFrom,
    bgTo: section.bgTo?.trim() || d.bgTo,
    titleColor: section.titleColor?.trim() || d.titleColor,
    subtitleColor: section.subtitleColor?.trim() || d.subtitleColor,
    ctaBg: section.ctaBg?.trim() || d.ctaBg,
    ctaText: section.ctaText?.trim() || d.ctaText,
    accentColor: section.accentColor?.trim() || d.accentColor,
  };
}

function mergeDealCard(card: CoolDealsDealCardItem, index: number): CoolDealsDealCardItem {
  const fallback = defaultDealCards[index % defaultDealCards.length];
  const legacyHref = card.href?.trim() || fallback.href;
  return {
    ...fallback,
    ...card,
    id: card.id,
    title: card.title?.trim() || fallback.title,
    body: card.body?.trim() || fallback.body,
    cta: card.cta?.trim() || fallback.cta,
    href: legacyHref,
    linkMode: card.linkMode ?? (legacyHref ? 'custom' : 'none'),
    promoPageId: card.promoPageId,
    linkHref: card.linkHref?.trim() || legacyHref,
    linkExternal: Boolean(card.linkExternal),
    ctaHref: card.ctaHref?.trim() || legacyHref,
    ctaExternal: Boolean(card.ctaExternal),
    imageUrl: card.imageUrl?.trim() || fallback.imageUrl,
    accent: card.accent?.trim() ? card.accent : fallback.accent,
    bgColor: card.bgColor,
    titleColor: card.titleColor,
    bodyColor: card.bodyColor,
    ctaColor: card.ctaColor,
    accentColor: card.accentColor,
  };
}

function mergeDealCardGrid(section: CoolDealsCardGridSection): CoolDealsCardGridSection {
  if (section.variant !== 'deal' || !section.dealCards?.length) return section;
  return {
    ...section,
    dealCards: section.dealCards.map(mergeDealCard),
  };
}

function mergeVoucherCard(card: CoolDealsCardItem, index: number): CoolDealsCardItem {
  const fallback = defaultVoucherCards[index % defaultVoucherCards.length];
  return {
    ...fallback,
    ...card,
    id: card.id,
    title: card.title?.trim() || fallback.title,
    body: card.body?.trim() || fallback.body,
    imageUrl: card.imageUrl?.trim() || fallback.imageUrl,
    voucherCode: (card.voucherCode ?? fallback.voucherCode)?.trim().toUpperCase() || undefined,
    linkMode: card.linkMode ?? 'none',
    promoPageId: card.promoPageId,
    linkHref: card.linkHref?.trim() || '',
    linkExternal: Boolean(card.linkExternal),
    ctaHref: card.ctaHref?.trim() || '',
    ctaExternal: Boolean(card.ctaExternal),
  };
}

function mergeVoucherCardGrid(section: CoolDealsCardGridSection): CoolDealsCardGridSection {
  if (section.variant !== 'voucher' || !section.cards?.length) return section;
  return {
    ...section,
    cards: section.cards.map(mergeVoucherCard),
  };
}

function mergeProductMatrix(section: CoolDealsProductMatrixSection): CoolDealsProductMatrixSection {
  const base = { ...section };
  if (!base.columns?.length) {
    base.columns = defaultProductColumns.map((c) => ({ ...c, perks: [...c.perks] }));
  }
  if (!base.mechanicsLinkText) base.mechanicsLinkText = 'View Full Promo Mechanics';
  if (!base.mechanicsLinkHref) base.mechanicsLinkHref = '/contact';
  base.columns = base.columns.map((column) => ({
    ...column,
    linkMode: column.linkMode ?? 'none',
    promoPageId: column.promoPageId,
    linkHref: column.linkHref?.trim() || '',
    linkExternal: Boolean(column.linkExternal),
    ctaHref: column.ctaHref?.trim() || '',
    ctaExternal: Boolean(column.ctaExternal),
  }));
  return base;
}

function mergeTrustBar(section: CoolDealsTrustBarSection): CoolDealsTrustBarSection {
  if (section.items?.length) return section;
  return { ...section, items: defaultTrustItems.map((i) => ({ ...i })) };
}

function mergeBundles(section: CoolDealsBundlesSection): CoolDealsBundlesSection {
  if (section.items?.length) return section;
  return {
    ...section,
    eyebrow: section.eyebrow || 'BUY THE WHOLE SOLUTION',
    headingTitle: section.headingTitle || 'Value bundles — unit + install + perks',
    headingSubtitle: section.headingSubtitle || '',
    items: defaultBundles.map((b) => ({ ...b, includes: [...b.includes] })),
  };
}

function mergeFinancing(section: CoolDealsFinancingSection): CoolDealsFinancingSection {
  return {
    ...section,
    eyebrow: section.eyebrow || '0% INTEREST · UP TO 36 MOS',
    title: section.title || 'Cool now, pay monthly.',
    body: section.body || '',
    bullets: section.bullets?.length ? section.bullets : ['No downpayment options', 'Fast approval'],
    ctaLabel: section.ctaLabel || 'Apply for financing',
    minMonths: section.minMonths === 6 && (!section.stepMonths || section.stepMonths === 6)
      ? 3
      : section.minMonths || 3,
    maxMonths: section.maxMonths || 36,
    stepMonths: section.stepMonths === 6 && (section.minMonths === 6 || !section.minMonths)
      ? 3
      : section.stepMonths || 3,
    defaultMonths: section.defaultMonths || 24,
    models: section.models?.length
      ? section.models
      : [
          { id: 'fm1', name: 'Daikin Amihan 1.5HP', price: 28900 },
          { id: 'fm2', name: 'Panasonic Aero 2HP', price: 33575 },
        ],
  };
}

function migrateToRedesign(sections: CoolDealsSection[]): CoolDealsSection[] {
  const hasDealHero = sections.some((s) => s.type === 'deal-of-day' || s.type === 'promo-strip');
  if (hasDealHero) return sections;

  // Older CMS configs only had voucher/matrix/cta — promote to the new design defaults
  // while preserving editable voucher cards and CTA copy when present.
  const defaults = JSON.parse(JSON.stringify(defaultCoolDealsPage.sections)) as CoolDealsSection[];
  const voucher = sections.find((s) => s.type === 'card-grid' && s.variant === 'voucher') as
    | CoolDealsCardGridSection
    | undefined;
  const cta = sections.find((s) => s.type === 'cta') as CoolDealsCtaSection | undefined;
  const trust = sections.find((s) => s.type === 'trust-bar');

  return defaults.map((d) => {
    if (d.type === 'card-grid' && d.variant === 'voucher' && voucher?.cards?.length) {
      return {
        ...d,
        headingTitle: voucher.headingTitle || d.headingTitle,
        headingSubtitle: voucher.headingSubtitle || d.headingSubtitle,
        cards: voucher.cards,
        enabled: voucher.enabled !== false,
      };
    }
    if (d.type === 'cta' && cta) {
      return { ...d, title: cta.title || d.title, subtitle: cta.subtitle || d.subtitle, enabled: cta.enabled !== false };
    }
    if (d.type === 'trust-bar' && trust) {
      return { ...d, enabled: trust.enabled !== false };
    }
    return d;
  });
}

function normalizeSections(sections: CoolDealsSection[]): CoolDealsSection[] {
  const migrated = migrateToRedesign(sections);
  const withSticky = migrated.some((s) => s.type === 'service-sticky')
    ? migrated
    : [...migrated, defaultServiceStickySection()];

  return withSticky.map((s) => {
    if (s.type === 'service-sticky') return mergeServiceSticky(s);
    if (s.type === 'product-matrix') return mergeProductMatrix(s);
    if (s.type === 'card-grid' && s.variant === 'deal') return mergeDealCardGrid(s);
    if (s.type === 'card-grid' && s.variant === 'voucher') return mergeVoucherCardGrid(s);
    if (s.type === 'trust-bar') return mergeTrustBar(s as CoolDealsTrustBarSection);
    if (s.type === 'bundles') return mergeBundles(s as CoolDealsBundlesSection);
    if (s.type === 'financing') return mergeFinancing(s as CoolDealsFinancingSection);
    if (s.type === 'deal-of-day') {
      const deal = s as CoolDealsDealOfDaySection;
      const hours = Number(deal.urgencyThresholdHours);
      let stockLeft = Number(deal.stockLeft);
      if (!Number.isFinite(stockLeft) || stockLeft < 0) {
        const fromLabel = deal.stockLabel?.match(/(\d+)/)?.[1];
        stockLeft = fromLabel ? Number(fromLabel) : 7;
      }
      let stockCapacity = Number(deal.stockCapacity);
      if (!Number.isFinite(stockCapacity) || stockCapacity <= 0) {
        stockCapacity = Math.max(20, stockLeft);
      }
      if (stockCapacity < stockLeft) stockCapacity = stockLeft;
      return {
        ...deal,
        stockLeft,
        stockCapacity,
        urgencyThresholdHours: Number.isFinite(hours) && hours > 0 ? hours : 24,
        blinkWhenUrgent: deal.blinkWhenUrgent !== false,
        forceBlink: deal.forceBlink === true,
      };
    }
    if (s.type === 'flash-deals') {
      const flash = s as CoolDealsFlashDealsSection;
      const hours = Number(flash.urgencyThresholdHours);
      return {
        ...flash,
        showCountdown: flash.showCountdown !== false,
        endsAt: typeof flash.endsAt === 'string' ? flash.endsAt : '',
        urgencyThresholdHours: Number.isFinite(hours) && hours > 0 ? hours : 72,
        blinkWhenUrgent: flash.blinkWhenUrgent !== false,
        forceBlink: flash.forceBlink === true,
      };
    }
    if (s.type === 'stats-brands') {
      const st = s as CoolDealsStatsBrandsSection;
      return {
        ...st,
        stats: st.stats?.length
          ? st.stats
          : [
              { id: 's1', value: '2,000+', label: 'Satisfied Customers' },
              { id: 's2', value: '500+', label: 'Projects Completed' },
              { id: 's3', value: '8+', label: 'Years in Service' },
            ],
        brandsLabel: st.brandsLabel || 'Authorized Dealer of Top Brands',
      };
    }
    return s;
  });
}

export function getCoolDealsPage(): CoolDealsPageConfig {
  const cached = getCachedContent<CoolDealsPageConfig>('cool_deals');
  if (cached?.sections?.length) {
    return { sections: normalizeSections(cached.sections) };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CoolDealsPageConfig;
      if (parsed.sections?.length) {
        return { sections: normalizeSections(parsed.sections) };
      }
    }
    const legacy = localStorage.getItem('hamel_cool_deals_page_v1');
    if (legacy) {
      const parsed = JSON.parse(legacy) as CoolDealsPageConfig;
      if (parsed.sections?.length) {
        return { sections: normalizeSections(parsed.sections) };
      }
    }
  } catch {
    /* ignore */
  }
  return {
    sections: normalizeSections(
      JSON.parse(JSON.stringify(defaultCoolDealsPage)).sections as CoolDealsSection[]
    ),
  };
}

export async function loadCoolDealsPage(): Promise<CoolDealsPageConfig> {
  const data = await fetchContent<CoolDealsPageConfig>('cool_deals', defaultCoolDealsPage);
  const normalized = {
    sections: normalizeSections(data.sections?.length ? data.sections : defaultCoolDealsPage.sections),
  };
  window.dispatchEvent(new CustomEvent('hamel-cool-deals-updated'));
  return normalized;
}

export async function saveCoolDealsPage(config: CoolDealsPageConfig): Promise<void> {
  await saveContent('cool_deals', { sections: normalizeSections(config.sections) });
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('hamel_cool_deals_page_v1');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('hamel-cool-deals-updated'));
}

export async function resetCoolDealsPage(): Promise<void> {
  await saveContent('cool_deals', defaultCoolDealsPage);
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('hamel_cool_deals_page_v1');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('hamel-cool-deals-updated'));
}

export function createCardGridSection(variant: 'voucher' | 'deal'): CoolDealsCardGridSection {
  return {
    id: sid(),
    type: 'card-grid',
    enabled: true,
    variant,
    headingEyebrow: variant === 'voucher' ? 'LIMITED-TIME · SAVE AT CHECKOUT' : undefined,
    headingTitle: variant === 'voucher' ? 'Claim your vouchers' : 'New deals section',
    headingSubtitle: '',
    background: 'white',
    cards: variant === 'voucher' ? [createVoucherCard()] : [],
    dealCards: variant === 'deal' ? [createDealCard()] : [],
  };
}

export function createVoucherCard(): CoolDealsCardItem {
  return {
    id: sid(),
    title: 'New offer',
    color: '#0EA5E9',
    imageUrl: cd.voucherFan,
    body: 'Describe this promotion.',
    linkMode: 'none',
  };
}

export function createDealCard(): CoolDealsDealCardItem {
  return {
    id: sid(),
    title: 'New deal',
    body: 'Short description.',
    cta: 'Learn more',
    href: '/contact',
    linkMode: 'custom',
    linkHref: '/contact',
    ctaHref: '/contact',
    bgColor: DEAL_CARD_DEFAULT_COLORS.bg,
    titleColor: DEAL_CARD_DEFAULT_COLORS.title,
    bodyColor: DEAL_CARD_DEFAULT_COLORS.body,
    ctaColor: DEAL_CARD_DEFAULT_COLORS.cta,
    accentColor: DEAL_CARD_DEFAULT_COLORS.accent,
  };
}

export function createBundleItem(): CoolDealsBundleItem {
  return {
    id: sid(),
    name: 'New bundle',
    sub: 'Short description',
    imageUrl: hamelAssets.aircon.wallSplitDaikinAmihan,
    priceNow: 19900,
    priceWas: 24900,
    includes: ['Unit', 'Installation', 'Free perk'],
    ctaLabel: 'Get this bundle',
  };
}

export function createSection(type: CoolDealsSectionType): CoolDealsSection {
  switch (type) {
    case 'promo-strip':
      return {
        id: sid(),
        type: 'promo-strip',
        enabled: true,
        badge: 'SUMMER COOL SALE',
        text: 'Free installation on every inverter unit',
        showCountdown: true,
      };
    case 'deal-of-day':
      return {
        id: sid(),
        type: 'deal-of-day',
        enabled: true,
        eyebrow: 'DEAL OF THE DAY',
        title: 'Beat the heat,\nnot your budget.',
        subtitle: 'Inverter aircon from the brands you trust — with free installation and flexible monthly plans.',
        primaryCta: "Shop today's deal →",
        secondaryCta: 'Find my aircon',
        secondaryHref: '#finder',
        trustLine: '100% authentic · Free pro installation · Up to 36 mos to pay',
        brand: 'DAIKIN',
        productName: 'Amihan Inverter 1.5HP',
        imageUrl: hamelAssets.aircon.wallSplitDaikinAmihan,
        priceNow: 28900,
        priceWas: 39900,
        badge: 'SAVE ₱11,000',
        stockLeft: 7,
        stockCapacity: 20,
        stockLabel: 'Only 7 left',
        stockPct: 65,
        months: 36,
        tag: 'INVERTER',
        inquireCta: 'Inquire now — reserve this price',
        urgencyThresholdHours: 24,
        blinkWhenUrgent: true,
        forceBlink: false,
        showStickyBar: false,
      };
    case 'service-sticky':
      return { ...defaultServiceStickySection(), id: sid() };
    case 'card-grid':
      return createCardGridSection('voucher');
    case 'best-sellers':
      return {
        id: sid(),
        type: 'best-sellers',
        enabled: true,
        eyebrow: 'MOST WANTED',
        headingTitle: 'Best sellers this week',
        seeAllHref: '/products',
        source: 'catalog',
        productIds: [],
        limit: 5,
      };
    case 'flash-deals':
      return {
        id: sid(),
        type: 'flash-deals',
        enabled: true,
        headingTitle: 'Flash Deals',
        headingSubtitle: 'Lowest prices this month · while stocks last',
        seeAllHref: '/products',
        showCountdown: true,
        endsAt: '',
        urgencyThresholdHours: 72,
        blinkWhenUrgent: true,
        source: 'catalog',
        productIds: [],
        limit: 8,
      };
    case 'finder':
      return {
        id: sid(),
        type: 'finder',
        enabled: true,
        eyebrow: 'NOT SURE WHAT TO BUY?',
        title: 'Find your perfect aircon in 30 seconds',
        subtitle: 'Answer 3 quick questions and we’ll match the right unit.',
      };
    case 'financing':
      return {
        id: sid(),
        type: 'financing',
        enabled: true,
        eyebrow: '0% INTEREST · UP TO 36 MOS',
        title: 'Cool now, pay monthly.',
        body: 'Slide to see your monthly payment.',
        bullets: ['No downpayment options', 'Fast approval'],
        ctaLabel: 'Apply for financing',
        minMonths: 3,
        maxMonths: 36,
        stepMonths: 3,
        defaultMonths: 24,
        models: [
          { id: sid(), name: 'Sample unit', price: 28900 },
        ],
      };
    case 'bundles':
      return {
        id: sid(),
        type: 'bundles',
        enabled: true,
        eyebrow: 'BUY THE WHOLE SOLUTION',
        headingTitle: 'Value bundles',
        headingSubtitle: '',
        items: [createBundleItem()],
      };
    case 'brands':
      return {
        id: sid(),
        type: 'brands',
        enabled: true,
        eyebrow: 'AUTHORIZED DEALER',
        headingTitle: 'Shop by brand',
        brandNames: [],
      };
    case 'recommended':
      return {
        id: sid(),
        type: 'recommended',
        enabled: true,
        headingTitle: 'Recommended for you',
        source: 'catalog',
        productIds: [],
        limit: 4,
      };
    case 'product-matrix':
      return {
        id: sid(),
        type: 'product-matrix',
        enabled: true,
        headingTitle: 'Which Vouchers Can You Get?',
        headingSubtitle: '',
        footnote: '',
        columns: [createProductColumn()],
        mechanicsLinkText: 'View Full Promo Mechanics',
        mechanicsLinkHref: '/contact',
      };
    case 'trust-bar':
      return { id: sid(), type: 'trust-bar', enabled: true, items: defaultTrustItems.map((i) => ({ ...i })) };
    case 'cta':
      return {
        id: sid(),
        type: 'cta',
        enabled: true,
        title: 'Still deciding? Talk to a real person.',
        subtitle: 'Talk to our experts today.',
      };
    case 'stats-brands':
      return {
        id: sid(),
        type: 'stats-brands',
        enabled: true,
        stats: [
          { id: 's1', value: '2,000+', label: 'Satisfied Customers' },
          { id: 's2', value: '500+', label: 'Projects Completed' },
          { id: 's3', value: '8+', label: 'Years in Service' },
        ],
        brandsLabel: 'Authorized Dealer of Top Brands',
      };
    default:
      return createCardGridSection('voucher');
  }
}

export function createProductColumn(): CoolDealsProductColumn {
  return {
    id: sid(),
    name: 'New product type',
    sub: 'Short description',
    imageUrl: cd.typeWindow,
    perks: ['Free delivery', 'Discount voucher'],
    linkMode: 'none',
  };
}
