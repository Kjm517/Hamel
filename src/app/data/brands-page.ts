import type { Product } from './products';
import { isStorefrontProduct } from '../lib/catalog-product';
import { fetchContent, getCachedContent, saveContent } from '../lib/content-api';
import { hamelBrandLogos, brandLogoFor } from './hamelAssets';

export interface BrandCardConfig {
  id: string;
  /** Display name on the Brands page card */
  name: string;
  /**
   * Must match the product `brand` field in the catalog (Neon).
   * Leave empty to use the display name above.
   */
  catalogBrandName?: string;
  description: string;
  features: string[];
  logoImageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  enabled: boolean;
}

/** Brand string used when counting / filtering catalog products. */
export function brandCatalogKey(brand: BrandCardConfig): string {
  return (brand.catalogBrandName?.trim() || brand.name.trim());
}

export function countProductsForBrand(products: Product[], brand: BrandCardConfig): number {
  const key = brandCatalogKey(brand).toLowerCase();
  if (!key) return 0;
  return products.filter((p) => isStorefrontProduct(p) && (p.brand ?? '').trim().toLowerCase() === key).length;
}

export function formatModelCount(count: number): string {
  return `${count} model${count === 1 ? '' : 's'} available`;
}

export interface BrandsPageConfig {
  brands: BrandCardConfig[];
}

export const BRANDS_PAGE_STORAGE_KEY = 'hamel_brands_page_v1';
const STORAGE_KEY = BRANDS_PAGE_STORAGE_KEY;

function sid(): string {
  return `brand-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`;
}

const defaultBrands: BrandCardConfig[] = [
  {
    id: 'brand-samsung',
    name: 'Samsung',
    description:
      'World-class innovation in air conditioning technology. Known for WindFree™ cooling and energy efficiency.',
    features: ['WindFree™ Technology', 'AI Auto Cooling', 'SmartThings Integration', '10-Year Warranty'],
    logoImageUrl: hamelBrandLogos.Samsung,
    enabled: true,
  },
  {
    id: 'brand-carrier',
    name: 'Carrier',
    description:
      'The inventor of modern air conditioning. Premium quality with superior cooling performance.',
    features: ['X-Power Gold Technology', 'Ultra-Quiet Operation', 'Fast Cooling', 'Energy Efficient'],
    logoImageUrl: hamelBrandLogos.Carrier,
    enabled: true,
  },
  {
    id: 'brand-panasonic',
    name: 'Panasonic',
    description:
      'Japanese engineering excellence. Reliable, durable, and energy-saving inverter technology.',
    features: ['Nanoe-G Air Purification', 'Econavi Sensor', 'Inverter Technology', 'Durable Compressor'],
    logoImageUrl: hamelBrandLogos.Panasonic,
    enabled: true,
  },
  {
    id: 'brand-daikin',
    name: 'Daikin',
    description:
      'Global leader in air conditioning. Premium quality with advanced features and reliability.',
    features: ['Intelligent Eye Sensor', 'Coanda Airflow', 'Streamer Technology', 'Premium Quality'],
    logoImageUrl: hamelBrandLogos.Daikin,
    enabled: true,
  },
  {
    id: 'brand-lg',
    name: 'LG',
    description:
      'Smart technology meets comfort. Dual Inverter compressors for faster cooling and energy savings.',
    features: ['Dual Inverter', 'Active Energy Control', 'Smart ThinQ', 'Gold Fin Protection'],
    logoImageUrl: hamelBrandLogos.LG,
    enabled: true,
  },
  {
    id: 'brand-midea',
    name: 'Midea',
    description:
      'Affordable quality with modern features. Great value for money without compromising performance.',
    features: ['Follow Me Function', 'Turbo Cooling', 'Sleep Mode', 'Affordable Pricing'],
    logoImageUrl: hamelBrandLogos.Midea,
    enabled: true,
  },
  {
    id: 'brand-koppel',
    name: 'Koppel',
    description: 'Trusted Filipino brand. Budget-friendly options perfect for Filipino homes.',
    features: ['Budget-Friendly', 'Local Support', 'Reliable Performance', 'Easy Maintenance'],
    enabled: true,
  },
  {
    id: 'brand-condura',
    name: 'Condura',
    description: 'Filipino-made excellence. Designed for Philippine climate with superior durability.',
    features: ['Made for PH Climate', 'Heavy Duty', 'Local Availability', 'Affordable Parts'],
    enabled: true,
  },
];

export const defaultBrandsPage: BrandsPageConfig = {
  brands: defaultBrands.map((b) => ({ ...b, features: [...b.features] })),
};

/** Fill missing logo URLs from the media kit when possible. */
export function withBrandLogos(config: BrandsPageConfig): BrandsPageConfig {
  return {
    brands: config.brands.map((b) => ({
      ...b,
      logoImageUrl: b.logoImageUrl?.trim() || brandLogoFor(brandCatalogKey(b)) || brandLogoFor(b.name),
    })),
  };
}

export function getBrandsPage(): BrandsPageConfig {
  const cached = getCachedContent<BrandsPageConfig>('brands_page');
  if (cached?.brands?.length) return withBrandLogos(cached);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BrandsPageConfig;
      if (parsed.brands?.length) return withBrandLogos(parsed);
    }
  } catch {

  }
  return withBrandLogos(JSON.parse(JSON.stringify(defaultBrandsPage)) as BrandsPageConfig);
}

export async function loadBrandsPage(): Promise<BrandsPageConfig> {
  const data = await fetchContent<BrandsPageConfig>('brands_page', defaultBrandsPage);
  window.dispatchEvent(new CustomEvent('hamel-brands-page-updated'));
  return withBrandLogos(data?.brands?.length ? data : defaultBrandsPage);
}

export async function saveBrandsPage(config: BrandsPageConfig): Promise<void> {
  await saveContent('brands_page', config);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {

  }
  window.dispatchEvent(new CustomEvent('hamel-brands-page-updated'));
}

export async function resetBrandsPage(): Promise<void> {
  await saveContent('brands_page', defaultBrandsPage);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {

  }
  window.dispatchEvent(new CustomEvent('hamel-brands-page-updated'));
}

export function createBrandCard(): BrandCardConfig {
  return {
    id: sid(),
    name: 'New brand',
    description: 'Short brand description.',
    features: ['Feature one', 'Feature two'],
    enabled: true,
    ctaHref: '/products',
  };
}

export function brandProductsHref(brand: BrandCardConfig): string {
  return `/products?brand=${encodeURIComponent(brandCatalogKey(brand))}`;
}

export function defaultCtaLabel(name: string): string {
  return `View ${name} Products`;
}

/** Enabled brands in admin order — drives Products page filter and homepage logos. */
export function enabledBrands(config: BrandsPageConfig): BrandCardConfig[] {
  return config.brands.filter((b) => b.enabled && brandCatalogKey(b));
}

/** Filter option labels for Products page (`All` + catalog keys in admin order). */
export function deriveBrandFilterOptionsFromConfig(config: BrandsPageConfig): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const brand of enabledBrands(config)) {
    const key = brandCatalogKey(brand);
    const lower = key.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    ordered.push(key);
  }
  return ['All', ...ordered];
}

/**
 * Products-page brand filter from live catalog data.
 * - Only brands that exist on active products
 * - Enabled Brands-admin entries keep admin order
 * - Disabled Brands-admin entries stay hidden even if products exist
 * - Catalog brands with no admin row still appear (A–Z after admin-ordered ones)
 */
export function deriveBrandFilterOptionsFromCatalog(
  products: Product[],
  config?: BrandsPageConfig
): string[] {
  const catalogByLower = new Map<string, string>();
  for (const p of products) {
    if (p.isActive === false) continue;
    const brand = p.brand?.trim();
    if (!brand) continue;
    const lower = brand.toLowerCase();
    if (!catalogByLower.has(lower)) catalogByLower.set(lower, brand);
  }

  if (!config) {
    return [
      'All',
      ...Array.from(catalogByLower.values()).sort((a, b) => a.localeCompare(b)),
    ];
  }

  const disabled = new Set(
    config.brands
      .filter((b) => !b.enabled)
      .map((b) => brandCatalogKey(b).toLowerCase())
      .filter(Boolean)
  );

  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const brand of enabledBrands(config)) {
    const lower = brandCatalogKey(brand).toLowerCase();
    if (!catalogByLower.has(lower) || seen.has(lower)) continue;
    seen.add(lower);
    ordered.push(catalogByLower.get(lower)!);
  }

  const orphans = Array.from(catalogByLower.entries())
    .filter(([lower]) => !seen.has(lower) && !disabled.has(lower))
    .map(([, name]) => name)
    .sort((a, b) => a.localeCompare(b));

  return ['All', ...ordered, ...orphans];
}

/** Brand names for product create/edit dropdowns. */
export function deriveProductBrandChoices(config: BrandsPageConfig): string[] {
  return deriveBrandFilterOptionsFromConfig(config).filter((b) => b !== 'All');
}
