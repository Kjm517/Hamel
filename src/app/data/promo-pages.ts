import { fetchContent, getCachedContent, saveContent } from '../lib/content-api';

/** Building blocks an admin can stack to design a page. */
export type PageBlockType = 'hero' | 'text' | 'image' | 'cta' | 'faq';

export type PageBlock =
  | {
      id: string;
      type: 'hero';
      tag?: string;
      title: string;
      subtitle?: string;
      imageUrl?: string;
      buttonLabel?: string;
      buttonHref?: string;
    }
  | {
      id: string;
      type: 'text';
      heading?: string;
      body: string;
    }
  | {
      id: string;
      type: 'image';
      imageUrl: string;
      caption?: string;
    }
  | {
      id: string;
      type: 'cta';
      title: string;
      subtitle?: string;
      buttonLabel: string;
      buttonHref: string;
    }
  | {
      id: string;
      type: 'faq';
      heading?: string;
      items: Array<{ id: string; question: string; answer: string }>;
    };

export interface PromoPage {
  id: string;
  slug: string;
  title: string;
  tag?: string;
  summary?: string;
  heroImageUrl?: string;
  /** Legacy plain text — kept for older pages; prefer `blocks`. */
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  published: boolean;
  /** When true and published, show in the website header menu. */
  showInNav?: boolean;
  /** Menu label (defaults to title). */
  navLabel?: string;
  /**
   * Where this item goes:
   * - page = built page at /promo/{slug}
   * - url = open an outside (or full) website link
   */
  linkMode?: 'page' | 'url';
  /** Used when linkMode is `url`. */
  externalUrl?: string;
  /** Stackable sections for the page builder. */
  blocks?: PageBlock[];
  updatedAt: string;
}

const STORAGE_KEY = 'hamel_promo_pages_v1';

export const PAGE_BLOCK_LABELS: Record<PageBlockType, string> = {
  hero: 'Top banner',
  text: 'Text section',
  image: 'Photo',
  cta: 'Button / call to action',
  faq: 'Questions & answers',
};

export function slugifyPromoPage(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function nowIso(): string {
  return new Date().toISOString();
}

function bid(prefix: string): string {
  return `${prefix}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : String(Date.now())}`;
}

export function createPageBlock(type: PageBlockType): PageBlock {
  switch (type) {
    case 'hero':
      return {
        id: bid('hero'),
        type: 'hero',
        tag: '',
        title: 'Your headline here',
        subtitle: 'Add a short supporting line.',
        imageUrl: '',
        buttonLabel: 'Learn more',
        buttonHref: '/products',
      };
    case 'text':
      return {
        id: bid('text'),
        type: 'text',
        heading: 'Section title',
        body: 'Write your message here. Keep it clear and friendly.',
      };
    case 'image':
      return {
        id: bid('img'),
        type: 'image',
        imageUrl: '',
        caption: '',
      };
    case 'cta':
      return {
        id: bid('cta'),
        type: 'cta',
        title: 'Ready to get started?',
        subtitle: 'Message our team for a free quote.',
        buttonLabel: 'Contact us',
        buttonHref: '/contact',
      };
    case 'faq':
      return {
        id: bid('faq'),
        type: 'faq',
        heading: 'Frequently asked questions',
        items: [
          {
            id: bid('q'),
            question: 'What is included?',
            answer: 'Add a short answer customers will understand.',
          },
        ],
      };
  }
}

/** Turn older title/body pages into editable blocks. */
export function ensurePageBlocks(page: PromoPage): PageBlock[] {
  if (page.blocks && page.blocks.length > 0) return page.blocks;

  const blocks: PageBlock[] = [
    {
      id: bid('hero'),
      type: 'hero',
      tag: page.tag || '',
      title: page.title,
      subtitle: page.summary || '',
      imageUrl: page.heroImageUrl || '',
      buttonLabel: page.ctaLabel || '',
      buttonHref: page.ctaHref || '/products',
    },
  ];

  if (page.body?.trim()) {
    blocks.push({
      id: bid('text'),
      type: 'text',
      heading: '',
      body: page.body,
    });
  }

  if (page.ctaLabel && page.ctaHref && !page.body?.trim()) {
    blocks.push({
      id: bid('cta'),
      type: 'cta',
      title: page.ctaLabel,
      subtitle: '',
      buttonLabel: page.ctaLabel,
      buttonHref: page.ctaHref,
    });
  }

  return blocks;
}

export const defaultPromoPages: PromoPage[] = [
  {
    id: 'promo-summer-sale',
    slug: 'summer-sale-2026',
    title: 'Summer Sale — Up to 20% OFF Select Models',
    tag: 'Limited Time',
    summary: 'Free installation + delivery on all orders above ₱20,000. Valid until May 31, 2026.',
    body: '',
    ctaLabel: 'Shop aircons',
    ctaHref: '/products',
    published: true,
    showInNav: false,
    blocks: [
      {
        id: 'hero-summer',
        type: 'hero',
        tag: 'Limited Time',
        title: 'Summer Sale — Up to 20% OFF Select Models',
        subtitle: 'Free installation + delivery on all orders above ₱20,000. Valid until May 31, 2026.',
        imageUrl: '',
        buttonLabel: 'Shop aircons',
        buttonHref: '/products',
      },
      {
        id: 'text-summer',
        type: 'text',
        heading: "What's included",
        body: `Beat the Cebu heat with our biggest summer promotion of the year. Selected inverter and split-type models are marked down up to 20% while supplies last.

• Discounted unit pricing on participating brands
• Free professional installation (Metro Cebu)
• Free delivery on orders ₱20,000 and above

How to claim: Browse our catalog, pick your HP rating, and message our team for a formal quote. Mention "Summer Sale" so we apply the correct promo.`,
      },
    ],
    updatedAt: nowIso(),
  },
  {
    id: 'promo-same-day-delivery',
    slug: 'same-day-delivery-cebu',
    title: 'Same Day Delivery — Metro Cebu',
    tag: 'Metro Cebu',
    summary: 'Order before 12nn — delivered the same day on qualifying in-stock units.',
    body: '',
    ctaLabel: 'Contact us',
    ctaHref: '/contact',
    published: true,
    showInNav: false,
    blocks: [
      {
        id: 'hero-sameday',
        type: 'hero',
        tag: 'Metro Cebu',
        title: 'Same Day Delivery — Metro Cebu',
        subtitle: 'Order before 12nn — delivered the same day on qualifying in-stock units.',
        imageUrl: '',
        buttonLabel: 'Contact us',
        buttonHref: '/contact',
      },
      {
        id: 'text-sameday',
        type: 'text',
        heading: 'How it works',
        body: `Need cooling fast? Hamel offers same-day delivery within Metro Cebu when you order before 12:00 noon.

• Applies to in-stock units only
• Cut-off: 12:00 PM for same-day dispatch
• Installation can be booked separately or bundled with your purchase`,
      },
    ],
    updatedAt: nowIso(),
  },
  {
    id: 'promo-free-install',
    slug: 'free-installation-offer',
    title: '₱500 OFF + Free Authorized Installation',
    tag: 'Special Offer',
    summary: 'Free installation by Hamel certified technicians on qualifying orders.',
    body: '',
    ctaLabel: 'View cool deals',
    ctaHref: '/cool-deals',
    published: true,
    showInNav: false,
    blocks: [
      {
        id: 'hero-install',
        type: 'hero',
        tag: 'Special Offer',
        title: '₱500 OFF + Free Authorized Installation',
        subtitle: 'Free installation by Hamel certified technicians on qualifying orders.',
        imageUrl: '',
        buttonLabel: 'View cool deals',
        buttonHref: '/cool-deals',
      },
      {
        id: 'text-install',
        type: 'text',
        heading: 'Why this offer',
        body: `Get ₱500 off plus free authorized installation when you purchase a qualifying aircon package from Hamel.

Our in-house technicians are trained for consistent quality — proper vacuuming, mounting, and testing so your unit runs efficiently from day one.`,
      },
    ],
    updatedAt: nowIso(),
  },
];

export function getPromoPages(): PromoPage[] {
  const cached = getCachedContent<PromoPage[]>('promo_pages');
  // An empty array is a valid saved state: it means every custom page was deleted.
  if (cached) return cached.map(withBlocks);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PromoPage[];
      if (Array.isArray(parsed)) return parsed.map(withBlocks);
    }
  } catch {
    // ignore
  }
  return defaultPromoPages.map(withBlocks);
}

export async function loadPromoPages(): Promise<PromoPage[]> {
  const data = await fetchContent<PromoPage[]>('promo_pages', defaultPromoPages);
  // Keep an intentionally empty saved list empty instead of restoring defaults.
  const pages = Array.isArray(data) ? data : defaultPromoPages;
  window.dispatchEvent(new CustomEvent('hamel-promo-pages-updated'));
  return pages.map(withBlocks);
}

export async function savePromoPages(pages: PromoPage[]): Promise<void> {
  const normalized = pages.map((p) => {
    if (p.linkMode === 'url') {
      return {
        ...p,
        linkMode: 'url' as const,
        externalUrl: p.externalUrl?.trim() || '',
        blocks: p.blocks ?? [],
        body: p.body || '',
      };
    }
    const blocks = ensurePageBlocks(p);
    const hero = blocks.find((b) => b.type === 'hero');
    return {
      ...p,
      linkMode: 'page' as const,
      blocks,
      title: p.title,
      tag: hero?.type === 'hero' ? hero.tag : p.tag,
      summary: hero?.type === 'hero' ? hero.subtitle : p.summary,
      heroImageUrl: hero?.type === 'hero' ? hero.imageUrl : p.heroImageUrl,
      body: p.body || '',
    };
  });
  await saveContent('promo_pages', normalized);
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Notify other tabs (storefront) to reload the menu
    localStorage.setItem('hamel_promo_pages_ping', String(Date.now()));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('hamel-promo-pages-updated'));
}

export function getPromoPageById(id: string): PromoPage | undefined {
  return getPromoPages().find((p) => p.id === id);
}

export function getPromoPageBySlug(slug: string): PromoPage | undefined {
  const normalized = slugifyPromoPage(slug);
  return getPromoPages().find((p) => p.slug === normalized && p.published);
}

export function getPromoPagePath(page: PromoPage): string {
  return `/promo/${page.slug}`;
}

const RESERVED_SLUGS = new Set([
  'home',
  'products',
  'brands',
  'cool-deals',
  'why-hamel',
  'contact',
  'admin',
  'promo',
  'product',
]);

export function isReservedPromoSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slugifyPromoPage(slug));
}

/** Public href for nav / “View page” — either /promo/slug or an outside URL. */
export function getPromoPageHref(page: PromoPage): string {
  if (page.linkMode === 'url') {
    const url = page.externalUrl?.trim() || '';
    return url;
  }
  return getPromoPagePath(page);
}

export function isExternalPromoLink(page: PromoPage): boolean {
  if (page.linkMode !== 'url') return false;
  const url = page.externalUrl?.trim() || '';
  return /^https?:\/\//i.test(url);
}

/** Published custom pages explicitly opted into the header menu. */
export function getNavPromoPages(): PromoPage[] {
  return getPromoPages().filter((p) => {
    if (!p.published || !p.showInNav) return false;
    if (p.linkMode === 'url') return Boolean(p.externalUrl?.trim());
    return Boolean(p.slug?.trim());
  });
}

function withBlocks(page: PromoPage): PromoPage {
  // Preserve legacy published pages in the menu when they predate the separate visibility option.
  return {
    ...page,
    showInNav: page.showInNav ?? Boolean(page.published),
    blocks: ensurePageBlocks(page),
  };
}

export function createPromoPageDraft(title = 'New page'): PromoPage {
  const base = slugifyPromoPage(title) || 'new-page';
  const pages = getPromoPages();
  let slug = base;
  let n = 1;
  while (pages.some((p) => p.slug === slug) || isReservedPromoSlug(slug)) {
    slug = `${base}-${n++}`;
  }
  return {
    id: bid('page'),
    slug,
    title,
    tag: '',
    summary: '',
    heroImageUrl: '',
    body: '',
    ctaLabel: '',
    ctaHref: '',
    published: true,
    showInNav: false,
    navLabel: title,
    linkMode: 'page',
    externalUrl: '',
    blocks: [
      createPageBlock('hero'),
      createPageBlock('text'),
      createPageBlock('cta'),
    ],
    updatedAt: nowIso(),
  };
}

export async function resetPromoPages(): Promise<void> {
  await saveContent('promo_pages', defaultPromoPages);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('hamel-promo-pages-updated'));
}
