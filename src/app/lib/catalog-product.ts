import type { Product } from '../data/products';

const HP_ORDER = ['0.5HP', '0.75HP', '1HP', '1.5HP', '2HP', '2.5HP', '3HP', '3.5HP', '4HP', '5HP'];

function hpSortKey(hp: string): number {
  const m = hp.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 999;
}

function sortHpValues(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const ai = HP_ORDER.indexOf(a);
    const bi = HP_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return hpSortKey(a) - hpSortKey(b);
  });
}

/** Normalize a product row from Neon `data` jsonb for storefront use. */
export function normalizeCatalogProduct(raw: Partial<Product> & { id: string }): Product {
  const image = raw.image?.trim() || raw.images?.[0]?.trim() || '';
  const images =
    raw.images?.length && image
      ? [image, ...raw.images.filter((u) => u && u !== image)]
      : image
        ? [image]
        : raw.images ?? [];

  return {
    id: raw.id,
    brand: raw.brand?.trim() || 'Unknown',
    model: raw.model?.trim() || 'Untitled model',
    category: raw.category?.trim() || 'Split Type',
    priceStart: Number(raw.priceStart) || 0,
    priceEnd: Number(raw.priceEnd) || Number(raw.priceStart) || 0,
    rating: Number(raw.rating) || 0,
    reviews: Number(raw.reviews) || 0,
    image,
    images,
    hp: Array.isArray(raw.hp) ? raw.hp.filter(Boolean).map((h) => String(h).trim()) : ['1HP'],
    features: Array.isArray(raw.features) ? raw.features.filter(Boolean).map(String) : [],
    description: raw.description?.trim() || '',
    specifications: Array.isArray(raw.specifications)
      ? raw.specifications.filter((s) => s?.label && s?.value)
      : [],
    tier: raw.tier === 'budget' || raw.tier === 'flash-sale' ? raw.tier : 'premium',
    installmentOptions: raw.installmentOptions,
    promos: raw.promos,
    promo: raw.promo,
    isActive: raw.isActive !== false,
    cornerTagIds: Array.isArray(raw.cornerTagIds)
      ? raw.cornerTagIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : undefined,
    hpVariants: Array.isArray(raw.hpVariants)
      ? raw.hpVariants
          .filter((v) => v?.hp && Number(v.price) > 0)
          .map((v) => ({ hp: String(v.hp).trim(), price: Number(v.price) }))
      : undefined,
    vouchers: Array.isArray(raw.vouchers)
      ? raw.vouchers
          .filter((v) => v?.code?.trim())
          .map((v) => ({
            code: String(v.code).trim().toUpperCase(),
            label: String(v.label ?? '').trim() || String(v.code).trim().toUpperCase(),
          }))
      : undefined,
    compare: raw.compare
      ? {
          summary: raw.compare.summary?.trim() || undefined,
          highlights: Array.isArray(raw.compare.highlights)
            ? raw.compare.highlights.filter((h) => h?.key && h?.value)
            : undefined,
          whatsInBox: Array.isArray(raw.compare.whatsInBox)
            ? raw.compare.whatsInBox.filter(Boolean).map(String)
            : undefined,
          productFeatures: Array.isArray(raw.compare.productFeatures)
            ? raw.compare.productFeatures.filter(Boolean).map(String)
            : undefined,
        }
      : undefined,
  };
}

export function isStorefrontProduct(product: Product): boolean {
  return product.isActive !== false;
}

export function storefrontProducts(products: Product[]): Product[] {
  return products.filter(isStorefrontProduct);
}

export function deriveBrandFilterOptions(products: Product[]): string[] {
  const names = new Set<string>();
  for (const p of products) {
    if (p.brand?.trim()) names.add(p.brand.trim());
  }
  return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
}

export function deriveCategoryFilterOptions(products: Product[]): string[] {
  const names = new Set<string>();
  for (const p of products) {
    if (p.category?.trim()) names.add(p.category.trim());
  }
  return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
}

export function deriveHpFilterOptions(products: Product[]): string[] {
  const names = new Set<string>();
  for (const p of products) {
    for (const h of p.hp ?? []) {
      if (h?.trim()) names.add(h.trim());
    }
  }
  return ['All', ...sortHpValues(Array.from(names))];
}

export function resolveBrandFilterValue(
  options: string[],
  value: string | null | undefined
): string {
  if (!value || value === 'All') return 'All';
  const match = options.find((b) => b !== 'All' && b.toLowerCase() === value.toLowerCase());
  return match ?? value;
}

export function productMatchesBrand(product: Product, selected: string): boolean {
  if (selected === 'All') return true;
  return product.brand.trim().toLowerCase() === selected.trim().toLowerCase();
}

export function productMatchesCategory(product: Product, selected: string): boolean {
  if (selected === 'All') return true;
  return product.category.trim().toLowerCase() === selected.trim().toLowerCase();
}

export function productMatchesHp(product: Product, selected: string): boolean {
  if (selected === 'All') return true;
  const key = selected.trim().toLowerCase();
  return (product.hp ?? []).some((h) => h.trim().toLowerCase() === key);
}

export interface ProductListFilters {
  brand: string;
  category: string;
  hp: string;
}

export function filterStorefrontProducts(
  products: Product[],
  filters: ProductListFilters
): Product[] {
  return storefrontProducts(products).filter(
    (p) =>
      productMatchesBrand(p, filters.brand) &&
      productMatchesCategory(p, filters.category) &&
      productMatchesHp(p, filters.hp)
  );
}
