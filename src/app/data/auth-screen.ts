import { fetchContent, getCachedContent, saveContent } from '../lib/content-api';

export type AuthScreenLayout = 'single' | 'split';

export interface AuthScreenDealProduct {
  id: string;
  /** Catalog product id when picked from the store catalog. */
  productId?: string;
  name: string;
  /** Display price without ₱, e.g. "24,999" */
  price: string;
  oldPrice: string;
  /** Percent off label, e.g. "14" */
  offPercent: string;
  imageUrl?: string;
}

export interface AuthScreenConfig {
  layout: AuthScreenLayout;
  brandName: string;
  brandTagline: string;
  promoTitle: string;
  promoSubtitle: string;
  promoImageUrl?: string;
  /** If set, plays instead of the promo image in the split panel. */
  promoVideoUrl?: string;
  voucherEnabled: boolean;
  voucherAmount: string;
  voucherLabel: string;
  voucherHint: string;
  socialProofRating: string;
  socialProofText: string;
  products: AuthScreenDealProduct[];
  providers: {
    google: boolean;
    apple: boolean;
    facebook: boolean;
  };
  requireConfirmPassword: boolean;
  showKeepSignedIn: boolean;
  loginTitle: string;
  loginSubtitle: string;
  signupTitle: string;
  signupSubtitle: string;
  loginCta: string;
  signupCta: string;
  termsText: string;
}

const CONTENT_KEY = 'auth_screen';

function sid(): string {
  return `auth-deal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyAuthDealProduct(
  partial?: Partial<AuthScreenDealProduct>
): AuthScreenDealProduct {
  return {
    id: sid(),
    name: 'New product',
    price: '0',
    oldPrice: '0',
    offPercent: '0',
    imageUrl: '',
    ...partial,
  };
}

export const defaultAuthScreen: AuthScreenConfig = {
  layout: 'split',
  brandName: 'HAMEL',
  brandTagline: 'The Cooling Experts',
  promoTitle: 'Sign up & save on cooling.',
  promoSubtitle:
    'Members get exclusive vouchers and member-only pricing on units & service.',
  promoImageUrl: '',
  promoVideoUrl: '',
  voucherEnabled: true,
  voucherAmount: '500',
  voucherLabel: 'First service voucher',
  voucherHint: 'Auto-applied when you join today.',
  socialProofRating: '4.9',
  socialProofText: '12,000+ homes kept cool',
  products: [],
  providers: { google: true, apple: true, facebook: true },
  requireConfirmPassword: true,
  showKeepSignedIn: true,
  loginTitle: 'Welcome back',
  loginSubtitle: 'Sign in to claim your voucher and member deals.',
  signupTitle: 'Create your account',
  signupSubtitle: 'Join free to unlock ₱500 off and member pricing.',
  loginCta: 'Sign in & claim ₱500',
  signupCta: 'Create account',
  termsText: "By continuing you agree to Hamel's Terms & Privacy Policy.",
};

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function normalizeProduct(raw: unknown): AuthScreenDealProduct | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  return {
    id: asString(p.id) || sid(),
    productId: asString(p.productId) || undefined,
    name: asString(p.name, 'Product'),
    price: asString(p.price, '0'),
    oldPrice: asString(p.oldPrice ?? p.old, '0'),
    offPercent: asString(p.offPercent ?? p.off, '0'),
    imageUrl: asString(p.imageUrl) || undefined,
  };
}

export function normalizeAuthScreen(raw: unknown): AuthScreenConfig {
  const d = defaultAuthScreen;
  if (!raw || typeof raw !== 'object') return { ...d, products: [] };
  const r = raw as Record<string, unknown>;
  const products = Array.isArray(r.products)
    ? r.products.map(normalizeProduct).filter((p): p is AuthScreenDealProduct => Boolean(p))
    : [];
  const providersRaw =
    r.providers && typeof r.providers === 'object'
      ? (r.providers as Record<string, unknown>)
      : {};

  return {
    layout: r.layout === 'single' ? 'single' : 'split',
    brandName: asString(r.brandName, d.brandName),
    brandTagline: asString(r.brandTagline, d.brandTagline),
    promoTitle: asString(r.promoTitle, d.promoTitle),
    promoSubtitle: asString(r.promoSubtitle, d.promoSubtitle),
    promoImageUrl: asString(r.promoImageUrl) || undefined,
    promoVideoUrl: asString(r.promoVideoUrl) || undefined,
    voucherEnabled: asBool(r.voucherEnabled, d.voucherEnabled),
    voucherAmount: asString(r.voucherAmount, d.voucherAmount),
    voucherLabel: asString(r.voucherLabel, d.voucherLabel),
    voucherHint: asString(r.voucherHint, d.voucherHint),
    socialProofRating: asString(r.socialProofRating, d.socialProofRating),
    socialProofText: asString(r.socialProofText, d.socialProofText),
    products,
    providers: {
      google: asBool(providersRaw.google, d.providers.google),
      apple: asBool(providersRaw.apple, d.providers.apple),
      facebook: asBool(providersRaw.facebook, d.providers.facebook),
    },
    requireConfirmPassword: asBool(r.requireConfirmPassword, d.requireConfirmPassword),
    showKeepSignedIn: asBool(r.showKeepSignedIn, d.showKeepSignedIn),
    loginTitle: asString(r.loginTitle, d.loginTitle),
    loginSubtitle: asString(r.loginSubtitle, d.loginSubtitle),
    signupTitle: asString(r.signupTitle, d.signupTitle),
    signupSubtitle: asString(r.signupSubtitle, d.signupSubtitle),
    loginCta: asString(r.loginCta, d.loginCta),
    signupCta: asString(r.signupCta, d.signupCta),
    termsText: asString(r.termsText, d.termsText),
  };
}

export function getAuthScreen(): AuthScreenConfig {
  const cached = getCachedContent<AuthScreenConfig>(CONTENT_KEY);
  if (cached) return normalizeAuthScreen(cached);
  return normalizeAuthScreen(defaultAuthScreen);
}

export async function loadAuthScreen(): Promise<AuthScreenConfig> {
  const data = await fetchContent<AuthScreenConfig>(CONTENT_KEY, defaultAuthScreen);
  const normalized = normalizeAuthScreen(data);
  window.dispatchEvent(new CustomEvent('hamel-auth-screen-updated'));
  return normalized;
}

export async function saveAuthScreen(config: AuthScreenConfig): Promise<void> {
  await saveContent(CONTENT_KEY, normalizeAuthScreen(config));
  window.dispatchEvent(new CustomEvent('hamel-auth-screen-updated'));
}

export async function resetAuthScreen(): Promise<AuthScreenConfig> {
  const next = normalizeAuthScreen(defaultAuthScreen);
  await saveAuthScreen(next);
  return next;
}
