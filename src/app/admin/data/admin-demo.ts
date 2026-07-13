import type { Product } from '../../data/products';

export type InquiryStatus = 'pending' | 'confirmed' | 'completed';

export type DemoInquiry = {
  id: string;
  customerName: string;
  product: string;
  hpQty: string;
  dateLabel: string;
  status: InquiryStatus;
};

export type DemoStatCard = {
  label: string;
  value: string;
  subtext: string;
  icon: 'inquiries' | 'pending' | 'completed' | 'customers' | 'visitors' | 'pageviews' | 'bounce' | 'chat';
  tone: 'blue' | 'yellow' | 'green' | 'purple';
};

export type AdminProductMeta = {
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  isActive: boolean;
  lastModifiedBy: string;
  lastModifiedAgo: string;
  modelNumber: string;
};

export type AdminProductRow = Product & AdminProductMeta;

export const DEMO_STAT_CARDS: DemoStatCard[] = [
  { label: 'Total Inquiries', value: '248', subtext: '+12% from last month', icon: 'inquiries', tone: 'blue' },
  { label: 'Pending Orders', value: '23', subtext: 'Needs attention', icon: 'pending', tone: 'yellow' },
  { label: 'Completed This Month', value: '87', subtext: '+8% from last month', icon: 'completed', tone: 'green' },
  { label: 'Active Customers', value: '1,234', subtext: '+156 this month', icon: 'customers', tone: 'purple' },
  { label: 'Website Visitors', value: '2,448', subtext: '+12.5% from last week', icon: 'visitors', tone: 'blue' },
  { label: 'Page Views', value: '5,234', subtext: '+15.7% from last week', icon: 'pageviews', tone: 'yellow' },
  { label: 'Bounce Rate', value: '32.4%', subtext: '-2.1% Improved', icon: 'bounce', tone: 'green' },
  { label: 'AI Chat Sessions', value: '892', subtext: '+18% from last week', icon: 'chat', tone: 'purple' },
];

export const DEMO_RECENT_INQUIRIES: DemoInquiry[] = [
  {
    id: 'a2000000-0000-4000-8000-000000000010',
    customerName: 'Juan dela Cruz',
    product: 'Panasonic Aero Series',
    hpQty: '1HP • 1 unit',
    dateLabel: '2 hours ago',
    status: 'pending',
  },
  {
    id: 'a2000000-0000-4000-8000-000000000011',
    customerName: 'Maria Santos',
    product: 'Samsung WindFree',
    hpQty: '1.5HP • 2 units',
    dateLabel: '5 hours ago',
    status: 'confirmed',
  },
  {
    id: 'a2000000-0000-4000-8000-000000000012',
    customerName: 'Pedro Garcia',
    product: 'Daikin Inverter',
    hpQty: '2HP • 1 unit',
    dateLabel: '1 day ago',
    status: 'completed',
  },
  {
    id: 'a2000000-0000-4000-8000-000000000013',
    customerName: 'Ana Reyes',
    product: 'LG Dual Cool',
    hpQty: '1HP • 3 units',
    dateLabel: '1 day ago',
    status: 'pending',
  },
  {
    id: 'a2000000-0000-4000-8000-000000000014',
    customerName: 'Carlos Ramos',
    product: 'Carrier X-Power',
    hpQty: '2.5HP • 1 unit',
    dateLabel: '2 days ago',
    status: 'confirmed',
  },
];

const IMG = 'https://images.unsplash.com/photo-1759772238012-9d5ad59ae637?w=200';

/** Fallback catalog rows when the API is empty or unreachable. */
export const DEMO_ADMIN_PRODUCTS: AdminProductRow[] = [
  {
    id: 'demo-1',
    brand: 'Panasonic',
    model: 'Aero Series',
    category: 'Split Type',
    priceStart: 25000,
    priceEnd: 45000,
    rating: 0,
    reviews: 0,
    image: IMG,
    images: [IMG],
    hp: ['1HP', '1.5HP', '2HP'],
    features: ['Inverter Technology', 'Nanoe-G Technology'],
    description: 'Panasonic Aero Series inverter split-type aircon.',
    specifications: [],
    stockStatus: 'In Stock',
    isActive: true,
    lastModifiedBy: 'Maria Santos',
    lastModifiedAgo: '2 days ago',
    modelNumber: 'CS-CU-Z12ZKH',
  },
  {
    id: 'demo-2',
    brand: 'Samsung',
    model: 'WindFree',
    category: 'Split Type',
    priceStart: 28000,
    priceEnd: 42000,
    rating: 0,
    reviews: 0,
    image: 'https://images.unsplash.com/photo-1436473849883-bb3464c23e93?w=200',
    images: [],
    hp: ['1HP', '1.5HP'],
    features: ['Inverter Technology', 'Wi-Fi Control'],
    description: 'Samsung WindFree split-type series.',
    specifications: [],
    stockStatus: 'In Stock',
    isActive: true,
    lastModifiedBy: 'John Doe',
    lastModifiedAgo: '5 hours ago',
    modelNumber: 'AR12TXHZAWK',
  },
  {
    id: 'demo-3',
    brand: 'Daikin',
    model: 'Inverter Smile',
    category: 'Split Type',
    priceStart: 32000,
    priceEnd: 48000,
    rating: 0,
    reviews: 0,
    image: 'https://images.unsplash.com/photo-1662558727451-1e1cc84b98e1?w=200',
    images: [],
    hp: ['1.5HP', '2HP', '2.5HP'],
    features: ['Inverter Technology', 'Streamer Technology'],
    description: 'Daikin Smile inverter series.',
    specifications: [],
    stockStatus: 'Low Stock',
    isActive: true,
    lastModifiedBy: 'Maria Santos',
    lastModifiedAgo: '1 day ago',
    modelNumber: 'FTKM35UVM',
  },
  {
    id: 'demo-4',
    brand: 'LG',
    model: 'Dual Cool',
    category: 'Window Type',
    priceStart: 18500,
    priceEnd: 21500,
    rating: 0,
    reviews: 0,
    image: IMG,
    images: [],
    hp: ['1HP', '1.5HP'],
    features: ['Dual Inverter', 'Auto Clean'],
    description: 'LG Dual Cool window type.',
    specifications: [],
    stockStatus: 'In Stock',
    isActive: true,
    lastModifiedBy: 'Pedro Garcia',
    lastModifiedAgo: '3 days ago',
    modelNumber: 'S4-Q12JA3QF',
  },
  {
    id: 'demo-5',
    brand: 'Carrier',
    model: 'X-Power',
    category: 'Split Type',
    priceStart: 24900,
    priceEnd: 39000,
    rating: 0,
    reviews: 0,
    image: 'https://images.unsplash.com/photo-1436473849883-bb3464c23e93?w=200',
    images: [],
    hp: ['1HP', '1.5HP', '2HP', '2.5HP'],
    features: ['Inverter Technology', 'Turbo Cooling'],
    description: 'Carrier X-Power Gold inverter.',
    specifications: [],
    stockStatus: 'In Stock',
    isActive: false,
    lastModifiedBy: 'John Doe',
    lastModifiedAgo: '1 week ago',
    modelNumber: '42QHC018DS',
  },
];

export const PRODUCT_BRANDS = [
  'Panasonic',
  'Samsung',
  'Daikin',
  'LG',
  'Carrier',
  'Midea',
  'Condura',
  'Koppel',
];

export const PRODUCT_CATEGORIES = ['Split Type', 'Window Type', 'Inverter', 'Floor Standing'];

export const HP_OPTIONS = ['0.5HP', '0.75HP', '1HP', '1.5HP', '2HP', '2.5HP', '3HP'];

export const FEATURE_OPTIONS = [
  'Inverter Technology',
  'Wi-Fi Control',
  'Sleep Mode',
  'Auto Clean',
];

export const STOCK_OPTIONS = ['In Stock', 'Low Stock', 'Out of Stock'] as const;

const META_BY_ID: Record<string, Partial<AdminProductMeta>> = {
  '1': { modelNumber: 'AR12TXHZAWK', stockStatus: 'In Stock', isActive: true, lastModifiedBy: 'Maria Santos', lastModifiedAgo: '2 days ago' },
  '2': { modelNumber: '42QHC018DS', stockStatus: 'In Stock', isActive: true, lastModifiedBy: 'John Doe', lastModifiedAgo: '5 hours ago' },
  '3': { modelNumber: 'CS-CU-Z12ZKH', stockStatus: 'In Stock', isActive: true, lastModifiedBy: 'Maria Santos', lastModifiedAgo: '1 day ago' },
  '4': { modelNumber: 'S4-Q12JA3QF', stockStatus: 'Low Stock', isActive: true, lastModifiedBy: 'Pedro Garcia', lastModifiedAgo: '3 days ago' },
  '5': { modelNumber: 'MSAG-12CRN8', stockStatus: 'In Stock', isActive: true, lastModifiedBy: 'John Doe', lastModifiedAgo: '4 days ago' },
  '6': { modelNumber: 'FTKM35UVM', stockStatus: 'In Stock', isActive: true, lastModifiedBy: 'Maria Santos', lastModifiedAgo: '6 hours ago' },
  '7': { modelNumber: 'KSA-09INV', stockStatus: 'Low Stock', isActive: true, lastModifiedBy: 'Pat Ruiz', lastModifiedAgo: '2 weeks ago' },
  '8': { modelNumber: 'CSD-18INV', stockStatus: 'In Stock', isActive: true, lastModifiedBy: 'Leo Mendoza', lastModifiedAgo: '1 week ago' },
};

const DEFAULT_META: AdminProductMeta = {
  stockStatus: 'In Stock',
  isActive: true,
  lastModifiedBy: 'Maria Santos',
  lastModifiedAgo: 'Recently',
  modelNumber: '—',
};

export function enrichProductForAdmin(product: Product, index = 0): AdminProductRow {
  const extra = META_BY_ID[product.id] ?? {};
  const stockCycle: AdminProductMeta['stockStatus'][] = ['In Stock', 'In Stock', 'Low Stock', 'In Stock'];
  return {
    ...product,
    ...DEFAULT_META,
    stockStatus: extra.stockStatus ?? stockCycle[index % stockCycle.length],
    isActive: extra.isActive ?? product.isActive ?? true,
    lastModifiedBy: extra.lastModifiedBy ?? 'Maria Santos',
    lastModifiedAgo: extra.lastModifiedAgo ?? `${index + 1} days ago`,
    modelNumber:
      extra.modelNumber ??
      (product.model.split(' ').slice(-2).join(' ') || product.id),
  };
}

export function demoNewProductTemplate(): Product {
  return {
    id: '',
    brand: 'Panasonic',
    model: 'Aero Series',
    category: 'Split Type',
    priceStart: 25000,
    priceEnd: 45000,
    rating: 0,
    reviews: 0,
    image: IMG,
    images: [IMG],
    hp: ['1HP', '1.5HP', '2HP'],
    features: ['Inverter Technology', 'Sleep Mode', 'Auto Clean'],
    description: 'Enter product description…',
    specifications: [
      { label: 'Coverage Area', value: '15-20 sqm' },
      { label: 'Energy Rating', value: '5 Star' },
    ],
  };
}
