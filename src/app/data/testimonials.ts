import { fetchContent, getCachedContent, saveContent } from '../lib/content-api';

export interface Testimonial {
  id: string;
  name: string;
  /** City or review date / source line */
  location: string;
  rating: number;
  text: string;
  /** Product mentioned, or short label (e.g. Facebook recommend) */
  model: string;
  source?: 'facebook' | 'site' | 'other';
  /** When false, hidden from storefront but kept in admin. */
  enabled?: boolean;
}

export interface TestimonialsConfig {
  items: Testimonial[];
  /** How many reviews to show on the homepage (default 4). */
  homepageLimit: number;
  facebookReviewsUrl: string;
  facebookRecommendSummary: string;
  sectionTitle: string;
  sectionEyebrow: string;
}

export const DEFAULT_FACEBOOK_REVIEWS_URL =
  'https://www.facebook.com/hameltrading/reviews/?id=100064107279848&sk=reviews';

/** Empty shell — reviews live in Neon via Admin → Reviews. */
export const defaultTestimonials: TestimonialsConfig = {
  items: [],
  homepageLimit: 4,
  facebookReviewsUrl: DEFAULT_FACEBOOK_REVIEWS_URL,
  facebookRecommendSummary: '',
  sectionTitle: 'What Cebu Families Say',
  sectionEyebrow: 'Happy Customers',
};

function normalizeSource(raw: unknown): Testimonial['source'] {
  if (raw === 'site' || raw === 'other' || raw === 'facebook') return raw;
  return 'facebook';
}

function normalizeItem(raw: Partial<Testimonial>, index: number): Testimonial {
  const rating = Math.min(5, Math.max(1, Math.round(Number(raw.rating) || 5)));
  return {
    id: (raw.id || `review-${index}`).trim() || `review-${index}`,
    name: (raw.name || 'Customer').trim() || 'Customer',
    location: (raw.location || '').trim(),
    rating,
    text: (raw.text || '').trim(),
    model: (raw.model || '').trim(),
    source: normalizeSource(raw.source),
    enabled: raw.enabled !== false,
  };
}

export function normalizeTestimonials(raw: Partial<TestimonialsConfig> | null): TestimonialsConfig {
  const base = structuredClone(defaultTestimonials);
  if (!raw) return base;

  const items = Array.isArray(raw.items)
    ? raw.items.map((item, i) => normalizeItem(item, i))
    : [];

  const limit = Number(raw.homepageLimit);
  return {
    items,
    homepageLimit: Number.isFinite(limit) && limit > 0 ? Math.min(24, Math.round(limit)) : 4,
    facebookReviewsUrl:
      typeof raw.facebookReviewsUrl === 'string' && raw.facebookReviewsUrl.trim()
        ? raw.facebookReviewsUrl.trim()
        : base.facebookReviewsUrl,
    facebookRecommendSummary:
      typeof raw.facebookRecommendSummary === 'string'
        ? raw.facebookRecommendSummary.trim()
        : base.facebookRecommendSummary,
    sectionTitle:
      typeof raw.sectionTitle === 'string' && raw.sectionTitle.trim()
        ? raw.sectionTitle.trim()
        : base.sectionTitle,
    sectionEyebrow:
      typeof raw.sectionEyebrow === 'string' && raw.sectionEyebrow.trim()
        ? raw.sectionEyebrow.trim()
        : base.sectionEyebrow,
  };
}

export function getTestimonialsCached(): TestimonialsConfig {
  return normalizeTestimonials(getCachedContent<TestimonialsConfig>('testimonials') ?? null);
}

export async function loadTestimonials(): Promise<TestimonialsConfig> {
  const data = await fetchContent('testimonials', defaultTestimonials);
  return normalizeTestimonials(data);
}

export async function saveTestimonials(config: TestimonialsConfig): Promise<void> {
  await saveContent('testimonials', normalizeTestimonials(config));
}

/** Enabled reviews for the homepage, capped by homepageLimit. */
export function homepageTestimonialsFrom(config: TestimonialsConfig): Testimonial[] {
  const limit = config.homepageLimit || 4;
  return config.items.filter((t) => t.enabled !== false && t.text.trim()).slice(0, limit);
}
