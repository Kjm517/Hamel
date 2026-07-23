import { productImageForBrand } from './hamelAssets';
import type { PromoBadgeStyle } from './productTags';

export interface InstallmentOption {
  months: number;
  interestRate: number;
  label: string;
}

export type ProductHpDiscountType = 'fixed' | 'percent';

export type ProductHpVariant = {
  hp: string;
  price: number;
  /** Optional discount value (₱ if fixed, percent if percent). List price stays in `price`. */
  discount?: number;
  /** Defaults to `fixed` (₱) when omitted. */
  discountType?: ProductHpDiscountType;
};

export type ProductVoucher = {
  code: string;
  label: string;
};

export type ProductCompareContent = {
  summary?: string;
  highlights?: { key: string; value: string }[];
  whatsInBox?: string[];
  productFeatures?: string[];
};

export interface Product {
  id: string;
  brand: string;
  model: string;
  category: string;
  priceStart: number;
  priceEnd: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  hp: string[];
  /** Per-HP unit prices. When missing, UI interpolates between priceStart and priceEnd. */
  hpVariants?: ProductHpVariant[];
  features: string[];
  description: string;
  specifications: {
    label: string;
    value: string;
  }[];

  tier: 'premium' | 'budget' | 'flash-sale';
  installmentOptions?: InstallmentOption[];
  /** Up to 4 promo stickers on the product card (Admin â†’ Tags) */
  promos?: ProductPromoEntry[];
  /** @deprecated Legacy single promo â€” use promos; still read for older saves */
  promo?: ProductPromoEntry;
  /** When false, hidden from the public Products page (stored in Neon `products.data`). */
  isActive?: boolean;
  /** Corner badge tag ids (SALE, INV, etc.). Set in admin to override auto rules. */
  cornerTagIds?: string[];
  /** Live units available to sell (Admin → Products). */
  stockQty?: number;
  /** Starting / shelf capacity for urgency bars (defaults to max(stockQty, 20)). */
  stockCapacity?: number;
  /** Copyable voucher codes shown on the product detail page. */
  vouchers?: ProductVoucher[];
  /** Extra content for the compare page. */
  compare?: ProductCompareContent;
}

/** Unit price for a selected HP (uses hpVariants, else interpolates priceStart→priceEnd). */
export function getHpUnitPrice(product: Product, hp?: string): number {
  const selected = (hp || product.hp[0] || '').trim();
  const exact = product.hpVariants?.find((v) => v.hp === selected);
  if (exact && Number.isFinite(exact.price) && exact.price > 0) return exact.price;

  const list = product.hp.filter(Boolean);
  if (list.length <= 1) return product.priceStart || product.priceEnd || 0;
  const idx = list.indexOf(selected);
  if (idx < 0) return product.priceStart || 0;
  const t = idx / (list.length - 1);
  return Math.round(product.priceStart + (product.priceEnd - product.priceStart) * t);
}

/** Peso amount off for a selected HP (converts % discounts using list price). */
export function getHpDiscount(product: Product, hp?: string): number {
  const selected = (hp || product.hp[0] || '').trim();
  const exact = product.hpVariants?.find((v) => v.hp === selected);
  if (!exact) return 0;
  const n = Number(exact.discount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const list = Number(exact.price) > 0 ? Number(exact.price) : getHpUnitPrice(product, selected);
  if (exact.discountType === 'percent') {
    return Math.round((list * Math.min(n, 100)) / 100);
  }
  return Math.min(n, list);
}

export function getHpDiscountType(
  product: Product,
  hp?: string
): ProductHpDiscountType {
  const selected = (hp || product.hp[0] || '').trim();
  const exact = product.hpVariants?.find((v) => v.hp === selected);
  return exact?.discountType === 'percent' ? 'percent' : 'fixed';
}

export function hasHpDiscounts(product: Product): boolean {
  return (product.hpVariants ?? []).some((v) => Number(v.discount) > 0);
}

export type ProductStockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

/** Derive status badge from live quantity. */
export function deriveStockStatus(
  stockQty: number | undefined,
  stockCapacity?: number
): ProductStockStatus {
  const qty = Number(stockQty);
  if (!Number.isFinite(qty) || qty <= 0) return 'Out of Stock';
  const cap = Number(stockCapacity);
  const lowAt =
    Number.isFinite(cap) && cap > 0 ? Math.max(3, Math.ceil(cap * 0.25)) : 5;
  if (qty <= lowAt) return 'Low Stock';
  return 'In Stock';
}

/** Normalize qty/capacity for urgency bars and labels. */
export function resolveProductStock(product: {
  stockQty?: number;
  stockCapacity?: number;
}): { qty: number; capacity: number } | null {
  const qty = Number(product.stockQty);
  if (!Number.isFinite(qty) || qty < 0) return null;
  let capacity = Number(product.stockCapacity);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    capacity = Math.max(20, qty);
  }
  if (capacity < qty) capacity = qty;
  return { qty, capacity };
}

/** Sale price for an HP: list price minus optional per-HP discount. */
export function getHpSalePrice(product: Product, hp?: string): number {
  return Math.max(0, getHpUnitPrice(product, hp) - getHpDiscount(product, hp));
}

/** Min/max list prices from configured HP variants (or priceStart/End). */
export function priceRangeFromHpVariants(
  variants: ProductHpVariant[] | undefined,
  fallback: { priceStart: number; priceEnd: number }
): { priceStart: number; priceEnd: number } {
  const prices = (variants ?? []).map((v) => v.price).filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return fallback;
  return { priceStart: Math.min(...prices), priceEnd: Math.max(...prices) };
}

function hpDiscountPercentOfPrice(v: ProductHpVariant): number {
  const price = Number(v.price);
  const discount = Number(v.discount);
  if (!(price > 0) || !(discount > 0)) return 0;
  if (v.discountType === 'percent') return Math.min(discount, 100);
  return Math.round((Math.min(discount, price) / price) * 1000) / 10;
}

function hpDiscountPesos(v: ProductHpVariant): number {
  const price = Number(v.price);
  const discount = Number(v.discount);
  if (!(price > 0) || !(discount > 0)) return 0;
  if (v.discountType === 'percent') {
    return Math.round((price * Math.min(discount, 100)) / 100);
  }
  return Math.min(discount, price);
}

/** Effective % off for one HP (from % discount or equivalent of ₱ off). */
export function getHpDiscountPercent(product: Product, hp?: string): number {
  const selected = (hp || product.hp[0] || '').trim();
  const exact = product.hpVariants?.find((v) => v.hp === selected);
  if (!exact) return 0;
  return hpDiscountPercentOfPrice(exact);
}

/** Short label for one HP discount row (admin + chips). */
export function formatHpVariantDiscount(v: ProductHpVariant): string | null {
  const discount = Number(v.discount);
  if (!(discount > 0) || !(Number(v.price) > 0)) return null;
  if (v.discountType === 'percent') {
    return `${Math.min(discount, 100)}% off`;
  }
  return `₱${Math.min(discount, Number(v.price)).toLocaleString()} off`;
}

/** Human label for promo chips when per-HP discounts are set. */
export function formatHpDiscountLabel(product: Product): string | null {
  const rows = (product.hpVariants ?? []).filter(
    (v) => Number(v.discount) > 0 && Number(v.price) > 0
  );
  if (!rows.length) return null;

  const allPercent = rows.every((v) => v.discountType === 'percent');
  if (allPercent) {
    const pcts = rows.map((v) => Math.min(Number(v.discount), 100));
    const min = Math.min(...pcts);
    const max = Math.max(...pcts);
    if (min === max) return `${max}% OFF`;
    return `${min}%–${max}% OFF`;
  }

  const amounts = rows.map((v) => hpDiscountPesos(v));
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  if (min === max) return `₱${max.toLocaleString()} OFF`;
  return `₱${min.toLocaleString()}–₱${max.toLocaleString()} OFF`;
}

/** Effective % off range for corner tags / percentage promo sync. */
export function getHpDiscountPercentRange(product: Product): { min: number; max: number } | null {
  const pcts = (product.hpVariants ?? [])
    .map((v) => hpDiscountPercentOfPrice(v))
    .filter((n) => n > 0);
  if (!pcts.length) return null;
  return { min: Math.min(...pcts), max: Math.max(...pcts) };
}

/** Peso-off range for fixed promo sync. */
export function getHpDiscountPesoRange(product: Product): { min: number; max: number } | null {
  const amounts = (product.hpVariants ?? [])
    .map((v) => hpDiscountPesos(v))
    .filter((n) => n > 0);
  if (!amounts.length) return null;
  return { min: Math.min(...amounts), max: Math.max(...amounts) };
}

export function isSplitTypeProduct(product: Pick<Product, 'category'>): boolean {
  return /split/i.test(product.category?.trim() || '');
}

export interface ProductPromoEntry {
  tagId?: string;
  type: 'percentage' | 'fixed' | 'free-service' | 'cash-deal' | 'bundle';
  value: number;
  label: string;
  badgeType: PromoBadgeStyle;
  cashPerMonth?: number;
  /** Human-readable label, e.g. "May 31, 2026" */
  validUntil?: string;
  /** ISO datetime for live countdown (e.g. 2026-07-16T23:59:59+08:00) */
  promoEndsAt?: string;
  appliesTo?: string;
}

export const MAX_PRODUCT_PROMOS = 4;

const standardInstallments: InstallmentOption[] = [
  { months: 3, interestRate: 0, label: '3 months' },
  { months: 6, interestRate: 0, label: '6 months' },
  { months: 12, interestRate: 0, label: '12 months' },
  { months: 24, interestRate: 0.12, label: '24 months' },
  { months: 36, interestRate: 0.15, label: '36 months' },
];

const productsSeed: Product[] = [
  {
    id: "1",
    brand: "Samsung",
    model: "WindFreeâ„¢ Pure 1.5HP Inverter",
    category: "Split Type",
    tier: "flash-sale",
    priceStart: 28500,
    priceEnd: 32500,
    rating: 0,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1759772238012-9d5ad59ae637?w=400",
    images: [
      "https://images.unsplash.com/photo-1759772238012-9d5ad59ae637?w=800",
      "https://images.unsplash.com/photo-1662558727451-1e1cc84b98e1?w=800",
      "https://images.unsplash.com/photo-1436473849883-bb3464c23e93?w=800",
    ],
    hp: ["0.75HP", "1HP", "1.5HP", "2HP"],
    features: ["Inverter Technology", "Energy Saving", "Auto Clean", "Wi-Fi Control"],
    description: "Experience ultimate comfort with Samsung's WindFreeâ„¢ technology. Cool air gently disperses through 23,000 micro air holes, creating a 'Still Air' environment without the unpleasant feeling of cold wind directly on your skin. Perfect for Filipino homes and offices.",
    specifications: [
      { label: "Cooling Capacity", value: "13,000 BTU" },
      { label: "Energy Rating", value: "5 Star" },
      { label: "Refrigerant", value: "R32" },
      { label: "Noise Level", value: "19 dB(A)" },
      { label: "Coverage Area", value: "15-20 sqm" },
      { label: "Power Consumption", value: "940W" },
      { label: "Warranty", value: "1 Year Full + 5 Years Compressor" },
    ],
    installmentOptions: standardInstallments,
    vouchers: [
      { code: 'HAMEL1000', label: 'â‚±1,000 off voucher' },
      { code: 'FREEINSTALL', label: 'Free installation voucher' },
    ],
    compare: {
      summary:
        'Cool comfort with lower electricity bills. Samsung WindFreeâ„¢ Pure delivers still-air cooling without cold drafts.',
      highlights: [
        { key: 'Aircon Type', value: 'Split' },
        { key: 'Cooling Capacity (HP)', value: '0.75â€“2HP' },
        { key: 'Energy Rating', value: '5 Star' },
        { key: 'Warranty', value: '1 Year Full + 5 Years Compressor' },
      ],
      whatsInBox: ['Indoor unit', 'Outdoor unit', 'Remote control', 'User manual', 'Warranty card'],
      productFeatures: [
        'WindFreeâ„¢ still-air cooling',
        'Inverter Technology',
        'Energy Saving',
        'Auto Clean',
        'Wi-Fi Control',
      ],
    },
    promo: {
      tagId: 'tag-flash-15',
      type: 'percentage',
      value: 15,
      label: '15% OFF',
      badgeType: 'flash-sale',
      validUntil: 'July 16, 2026',
      promoEndsAt: '2026-07-16T23:59:59+08:00',
      appliesTo: '1.5HP Units',
    },
  },
  {
    id: "2",
    brand: "Carrier",
    model: "X-Power Gold Inverter 1HP",
    category: "Split Type",
    tier: "premium",
    priceStart: 24900,
    priceEnd: 27900,
    rating: 0,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1436473849883-bb3464c23e93?w=400",
    images: [
      "https://images.unsplash.com/photo-1436473849883-bb3464c23e93?w=800",
      "https://images.unsplash.com/photo-1662558727451-1e1cc84b98e1?w=800",
    ],
    hp: ["0.75HP", "1HP", "1.5HP"],
    features: ["Inverter Technology", "Turbo Cooling", "Sleep Mode", "Anti-Bacteria Filter"],
    description: "Carrier's X-Power Gold series delivers powerful cooling with maximum energy efficiency. Designed for tropical climates, it handles Cebu's heat with ease while keeping electricity bills low.",
    specifications: [
      { label: "Cooling Capacity", value: "9,000 BTU" },
      { label: "Energy Rating", value: "4 Star" },
      { label: "Refrigerant", value: "R32" },
      { label: "Noise Level", value: "22 dB(A)" },
      { label: "Coverage Area", value: "10-15 sqm" },
      { label: "Power Consumption", value: "780W" },
      { label: "Warranty", value: "1 Year Full + 5 Years Compressor" },
    ],
    installmentOptions: standardInstallments,
    promo: {
      tagId: 'tag-free-install',
      type: 'free-service',
      value: 0,
      label: 'FREE AUTHORIZED INSTALLATION',
      badgeType: 'free-install',
      validUntil: 'Jun 15, 2026',
      appliesTo: 'Buy 2+ Units',
    },
  },
  {
    id: "3",
    brand: "Panasonic",
    model: "Aero Series Inverter 2HP",
    category: "Split Type",
    tier: "premium",
    priceStart: 35500,
    priceEnd: 39500,
    rating: 0,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1662558727451-1e1cc84b98e1?w=400",
    images: [
      "https://images.unsplash.com/photo-1662558727451-1e1cc84b98e1?w=800",
      "https://images.unsplash.com/photo-1759772238012-9d5ad59ae637?w=800",
    ],
    hp: ["1.5HP", "2HP", "2.5HP"],
    features: ["Nanoe-G Technology", "Inverter", "Powerful Mode", "Energy Saving"],
    description: "Panasonic's Aero Series with Nanoe-G technology not only cools but also purifies the air, removing PM2.5 particles and deactivating allergens. Ideal for families in Cebu.",
    specifications: [
      { label: "Cooling Capacity", value: "18,000 BTU" },
      { label: "Energy Rating", value: "5 Star" },
      { label: "Refrigerant", value: "R32" },
      { label: "Noise Level", value: "24 dB(A)" },
      { label: "Coverage Area", value: "20-30 sqm" },
      { label: "Power Consumption", value: "1,680W" },
      { label: "Warranty", value: "1 Year Full + 5 Years Compressor" },
    ],
    installmentOptions: standardInstallments,
    promo: {
      tagId: 'tag-5000-off',
      type: 'fixed',
      value: 5000,
      label: 'â‚±5,000 OFF',
      badgeType: 'discount',
      validUntil: 'Jun 30, 2026',
      appliesTo: 'All Panasonic Models',
    },
  },
  {
    id: "4",
    brand: "LG",
    model: "DualCool Inverter Window Type",
    category: "Window Type",
    tier: "budget",
    priceStart: 18500,
    priceEnd: 21500,
    rating: 0,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1759772238012-9d5ad59ae637?w=400",
    images: [
      "https://images.unsplash.com/photo-1759772238012-9d5ad59ae637?w=800",
    ],
    hp: ["1HP", "1.5HP"],
    features: ["Dual Inverter", "Gold Fin Protection", "Auto Clean", "Energy Efficient"],
    description: "Affordable and reliable, LG's DualCool window type aircon is perfect for bedrooms and small spaces. The Gold Fin technology ensures durability in humid Philippine weather.",
    specifications: [
      { label: "Cooling Capacity", value: "9,000 BTU" },
      { label: "Energy Rating", value: "3 Star" },
      { label: "Refrigerant", value: "R32" },
      { label: "Noise Level", value: "48 dB(A)" },
      { label: "Coverage Area", value: "10-12 sqm" },
      { label: "Power Consumption", value: "860W" },
      { label: "Warranty", value: "1 Year Parts & Service" },
    ],
    installmentOptions: [
      { months: 3, interestRate: 0, label: '3 months' },
      { months: 6, interestRate: 0, label: '6 months' },
      { months: 12, interestRate: 0, label: '12 months' },
    ],
    promo: {
      tagId: 'tag-cool-cash',
      type: 'cash-deal',
      value: 0,
      label: 'â‚±513/mo',
      badgeType: 'cash-deal',
      cashPerMonth: 513,
      appliesTo: '36-month installment',
    },
  },
  {
    id: "5",
    brand: "Midea",
    model: "Xtreme Save Pro Inverter",
    category: "Inverter",
    tier: "budget",
    priceStart: 19900,
    priceEnd: 22900,
    rating: 0,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1436473849883-bb3464c23e93?w=400",
    images: [
      "https://images.unsplash.com/photo-1436473849883-bb3464c23e93?w=800",
      "https://images.unsplash.com/photo-1662558727451-1e1cc84b98e1?w=800",
    ],
    hp: ["1HP", "1.5HP", "2HP"],
    features: ["Inverter", "Follow Me Function", "iECO Mode", "Self-Diagnosis"],
    description: "Midea offers exceptional value for money. The Xtreme Save Pro series cuts energy consumption by up to 60% compared to non-inverter models, saving you thousands in electricity.",
    specifications: [
      { label: "Cooling Capacity", value: "9,000 BTU" },
      { label: "Energy Rating", value: "4 Star" },
      { label: "Refrigerant", value: "R32" },
      { label: "Noise Level", value: "20 dB(A)" },
      { label: "Coverage Area", value: "12-18 sqm" },
      { label: "Power Consumption", value: "720W" },
      { label: "Warranty", value: "1 Year Full + 5 Years Compressor" },
    ],
    installmentOptions: standardInstallments,
    promo: {
      tagId: 'tag-bundle',
      type: 'bundle',
      value: 0,
      label: 'BUNDLE DEAL',
      badgeType: 'bundle',
      appliesTo: 'With free cleaning kit',
    },
  },
  {
    id: "6",
    brand: "Daikin",
    model: "Inverter Smile Series 1.5HP",
    category: "Split Type",
    tier: "premium",
    priceStart: 32500,
    priceEnd: 36500,
    rating: 0,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1662558727451-1e1cc84b98e1?w=400",
    images: [
      "https://images.unsplash.com/photo-1662558727451-1e1cc84b98e1?w=800",
      "https://images.unsplash.com/photo-1759772238012-9d5ad59ae637?w=800",
      "https://images.unsplash.com/photo-1436473849883-bb3464c23e93?w=800",
    ],
    hp: ["1HP", "1.5HP", "2HP", "2.5HP"],
    features: ["R32 Refrigerant", "Coanda Airflow", "Streamer Technology", "Intelligent Eye"],
    description: "Daikin's legendary reliability meets cutting-edge technology. The Smile Series features Streamer technology that decomposes odors and allergens, ensuring clean, healthy air for your family.",
    specifications: [
      { label: "Cooling Capacity", value: "13,000 BTU" },
      { label: "Energy Rating", value: "5 Star" },
      { label: "Refrigerant", value: "R32" },
      { label: "Noise Level", value: "19 dB(A)" },
      { label: "Coverage Area", value: "15-20 sqm" },
      { label: "Power Consumption", value: "900W" },
      { label: "Warranty", value: "1 Year Full + 5 Years Compressor" },
    ],
    installmentOptions: standardInstallments,
    promo: {
      tagId: 'tag-free-install',
      type: 'free-service',
      value: 0,
      label: 'FREE AUTHORIZED INSTALLATION',
      badgeType: 'free-install',
      validUntil: 'Jun 30, 2026',
      appliesTo: 'All Daikin Smile Units',
    },
  },
  {
    id: "7",
    brand: "Koppel",
    model: "Inverter Split Type 1HP",
    category: "Split Type",
    tier: "budget",
    priceStart: 16900,
    priceEnd: 19900,
    rating: 0,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1759772238012-9d5ad59ae637?w=400",
    images: [
      "https://images.unsplash.com/photo-1759772238012-9d5ad59ae637?w=800",
    ],
    hp: ["0.75HP", "1HP", "1.5HP"],
    features: ["Inverter", "Turbo Mode", "Sleep Function", "Anti-Rust Cabinet"],
    description: "Budget-friendly Filipino brand Koppel delivers reliable cooling at an affordable price. Perfect for students, boarders, and small households in Cebu.",
    specifications: [
      { label: "Cooling Capacity", value: "9,000 BTU" },
      { label: "Energy Rating", value: "3 Star" },
      { label: "Refrigerant", value: "R32" },
      { label: "Noise Level", value: "26 dB(A)" },
      { label: "Coverage Area", value: "10-15 sqm" },
      { label: "Power Consumption", value: "840W" },
      { label: "Warranty", value: "1 Year Parts & Service" },
    ],
    installmentOptions: [
      { months: 3, interestRate: 0, label: '3 months' },
      { months: 6, interestRate: 0, label: '6 months' },
      { months: 12, interestRate: 0, label: '12 months' },
    ],
    promo: {
      tagId: 'tag-cool-cash',
      type: 'cash-deal',
      value: 0,
      label: 'â‚±469/mo',
      badgeType: 'cash-deal',
      cashPerMonth: 469,
      appliesTo: '36-month installment',
    },
  },
  {
    id: "8",
    brand: "Condura",
    model: "Neo Inverter 2HP",
    category: "Inverter",
    tier: "flash-sale",
    priceStart: 27500,
    priceEnd: 31500,
    rating: 0,
    reviews: 0,
    image: "https://images.unsplash.com/photo-1436473849883-bb3464c23e93?w=400",
    images: [
      "https://images.unsplash.com/photo-1436473849883-bb3464c23e93?w=800",
      "https://images.unsplash.com/photo-1662558727451-1e1cc84b98e1?w=800",
    ],
    hp: ["1.5HP", "2HP"],
    features: ["Inverter", "4-Way Swing", "Timer Function", "Eco Mode"],
    description: "Condura, a trusted Filipino appliance brand, brings you powerful cooling with the Neo Inverter series. Built to withstand Philippine weather conditions.",
    specifications: [
      { label: "Cooling Capacity", value: "18,000 BTU" },
      { label: "Energy Rating", value: "4 Star" },
      { label: "Refrigerant", value: "R32" },
      { label: "Noise Level", value: "23 dB(A)" },
      { label: "Coverage Area", value: "18-25 sqm" },
      { label: "Power Consumption", value: "1,580W" },
      { label: "Warranty", value: "1 Year Full + 5 Years Compressor" },
    ],
    installmentOptions: standardInstallments,
    promo: {
      tagId: 'tag-flash-15',
      type: 'percentage',
      value: 20,
      label: '20% OFF',
      badgeType: 'flash-sale',
      validUntil: 'July 16, 2026',
      promoEndsAt: '2026-07-16T23:59:59+08:00',
      appliesTo: 'All Condura Neo Units',
    },
  },
];

export const products: Product[] = productsSeed.map((product, index) => {
  const image = productImageForBrand(product.brand, index);
  return {
    ...product,
    image,
    images: [image, ...product.images.filter((url) => url !== product.image).slice(0, 2)],
  };
});

export const promoCodes: Record<string, { type: 'percentage' | 'fixed'; value: number; label: string }> = {
  'HAMEL10': { type: 'percentage', value: 10, label: '10% off your order' },
  'SUMMER20': { type: 'percentage', value: 20, label: '20% Summer Discount' },
  'CEBU500': { type: 'fixed', value: 500, label: 'â‚±500 off' },
  'NEWCLIENT': { type: 'percentage', value: 5, label: '5% New Customer Discount' },
  'BUNDLE15': { type: 'percentage', value: 15, label: '15% Bundle Deal' },
};

export const installmentPlans: InstallmentOption[] = [
  { months: 3, interestRate: 0, label: '3 months (0% interest)' },
  { months: 6, interestRate: 0, label: '6 months (0% interest)' },
  { months: 12, interestRate: 0, label: '12 months (0% interest)' },
  { months: 24, interestRate: 0.12, label: '24 months (12% p.a.)' },
  { months: 36, interestRate: 0.15, label: '36 months (15% p.a.)' },
];

export function calcInstallment(price: number, months: number, interestRate: number): number {
  if (interestRate === 0) return Math.ceil(price / months);
  const monthlyRate = interestRate / 12;
  return Math.ceil(price * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
}
