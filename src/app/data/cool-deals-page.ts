import { hexForColorInput, readableOnBackground } from '../lib/color-utils';
import { fetchContent, getCachedContent, saveContent } from '../lib/content-api';
import { hamelAssets } from './hamelAssets';

const cd = hamelAssets.coolDeals;

export type CoolDealsSectionType =
  | 'card-grid'
  | 'product-matrix'
  | 'trust-bar'
  | 'cta'
  | 'stats-brands';

export interface CoolDealsCardItem {
  id: string;
  title: string;
  color: string;
  imageUrl: string;
  body: string;
}

export const DEAL_CARD_DEFAULT_COLORS = {
  bg: '#0C4A6E',
  title: '#FFFFFF',
  body: '#BFDBFE',
  cta: '#FFC107',
  accent: '#FFFFFF',
} as const;

export interface CoolDealsDealCardItem {
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
  // Ensure readable contrast on the tile background
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

export interface CoolDealsCardGridSection extends CoolDealsSectionBase {
  type: 'card-grid';
  variant: 'voucher' | 'deal';
  headingTitle: string;
  headingSubtitle?: string;
  /** Deal / voucher section heading colors */
  headingColor?: string;
  headingSubtitleColor?: string;
  background: 'white' | 'gray';
  cards: CoolDealsCardItem[];
  dealCards?: CoolDealsDealCardItem[];
}

export interface CoolDealsProductColumn {
  id: string;
  name: string;
  sub: string;
  imageUrl: string;
  /** Checklist items shown under each product type */
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

export interface CoolDealsTrustBarSection extends CoolDealsSectionBase {
  type: 'trust-bar';
}

export interface CoolDealsCtaSection extends CoolDealsSectionBase {
  type: 'cta';
  title: string;
  subtitle: string;
}

export interface CoolDealsStatsBrandsSection extends CoolDealsSectionBase {
  type: 'stats-brands';
}

export type CoolDealsSection =
  | CoolDealsCardGridSection
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

export const defaultCoolDealsPage: CoolDealsPageConfig = {
  sections: [
    {
      id: 'sec-vouchers',
      type: 'card-grid',
      enabled: true,
      variant: 'voucher',
      headingTitle: 'Exclusive Vouchers For You',
      headingSubtitle: 'More perks, more savings with every purchase!',
      background: 'white',
      cards: defaultVoucherCards,
    },
    {
      id: 'sec-product-matrix',
      type: 'product-matrix',
      enabled: true,
      headingTitle: 'Which Vouchers Can You Get?',
      headingSubtitle: 'Your eligible vouchers depend on the type of aircon you choose.',
      footnote: 'Promo subject to availability and minimum spend requirements.',
      columns: defaultProductColumns.map((c) => ({ ...c, perks: [...c.perks] })),
      mechanicsLinkText: 'View Full Promo Mechanics',
      mechanicsLinkHref: '/contact',
    },
    {
      id: 'sec-more-deals',
      type: 'card-grid',
      enabled: true,
      variant: 'deal',
      headingTitle: 'More Cool Deals Await!',
      headingColor: '#0C4A6E',
      headingSubtitleColor: '#6B7280',
      background: 'white',
      cards: [],
      dealCards: defaultDealCards,
    },
    {
      id: 'sec-trust',
      type: 'trust-bar',
      enabled: true,
    },
    {
      id: 'sec-cta',
      type: 'cta',
      enabled: true,
      title: 'Ready to enjoy these cool deals?',
      subtitle: 'Talk to our experts and get the best cooling solution for your space.',
    },
    {
      id: 'sec-stats',
      type: 'stats-brands',
      enabled: true,
    },
  ],
};

export const COOL_DEALS_SECTION_LABELS: Record<CoolDealsSectionType, string> = {
  'card-grid': 'Offer cards',
  'product-matrix': 'Product types & perks',
  'trust-bar': 'Trust icons',
  cta: 'Contact section',
  'stats-brands': 'Stats & brands',
};

function mergeDealCard(card: CoolDealsDealCardItem, index: number): CoolDealsDealCardItem {
  const fallback = defaultDealCards[index % defaultDealCards.length];
  return {
    ...fallback,
    ...card,
    id: card.id,
    title: card.title?.trim() || fallback.title,
    body: card.body?.trim() || fallback.body,
    cta: card.cta?.trim() || fallback.cta,
    href: card.href?.trim() || fallback.href,
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

function mergeProductMatrix(section: CoolDealsProductMatrixSection): CoolDealsProductMatrixSection {
  const base = { ...section };
  if (!base.columns?.length) {
    base.columns = defaultProductColumns.map((c) => ({ ...c, perks: [...c.perks] }));
  }
  if (!base.mechanicsLinkText) base.mechanicsLinkText = 'View Full Promo Mechanics';
  if (!base.mechanicsLinkHref) base.mechanicsLinkHref = '/contact';
  return base;
}

function normalizeSections(sections: CoolDealsSection[]): CoolDealsSection[] {
  return sections.map((s) => {
    if (s.type === 'product-matrix') return mergeProductMatrix(s);
    if (s.type === 'card-grid' && s.variant === 'deal') return mergeDealCardGrid(s);
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
    // ignore
  }
  return JSON.parse(JSON.stringify(defaultCoolDealsPage)) as CoolDealsPageConfig;
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
  await saveContent('cool_deals', config);
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('hamel_cool_deals_page_v1');
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('hamel-cool-deals-updated'));
}

export async function resetCoolDealsPage(): Promise<void> {
  await saveContent('cool_deals', defaultCoolDealsPage);
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('hamel_cool_deals_page_v1');
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('hamel-cool-deals-updated'));
}

export function createCardGridSection(variant: 'voucher' | 'deal'): CoolDealsCardGridSection {
  return {
    id: sid(),
    type: 'card-grid',
    enabled: true,
    variant,
    headingTitle: variant === 'voucher' ? 'New voucher section' : 'New deals section',
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
  };
}

export function createDealCard(): CoolDealsDealCardItem {
  return {
    id: sid(),
    title: 'New deal',
    body: 'Short description.',
    cta: 'Learn more',
    href: '/contact',
    bgColor: DEAL_CARD_DEFAULT_COLORS.bg,
    titleColor: DEAL_CARD_DEFAULT_COLORS.title,
    bodyColor: DEAL_CARD_DEFAULT_COLORS.body,
    ctaColor: DEAL_CARD_DEFAULT_COLORS.cta,
    accentColor: DEAL_CARD_DEFAULT_COLORS.accent,
  };
}

export function createSection(type: CoolDealsSectionType): CoolDealsSection {
  switch (type) {
    case 'card-grid':
      return createCardGridSection('voucher');
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
      return { id: sid(), type: 'trust-bar', enabled: true };
    case 'cta':
      return {
        id: sid(),
        type: 'cta',
        enabled: true,
        title: 'Ready to enjoy these cool deals?',
        subtitle: 'Talk to our experts today.',
      };
    case 'stats-brands':
      return { id: sid(), type: 'stats-brands', enabled: true };
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
  };
}
