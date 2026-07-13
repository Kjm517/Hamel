/** Hamel brand media served from /public/hamel (copied from client media kit). */
const base = '/hamel';

export const hamelAssets = {
  branding: {
    logo: `${base}/branding/logo.png`,
    soloLogo: `${base}/branding/hamel-solo-logo.png`,
  },
  mascot: {
    hero: `${base}/mascot/penguin-hero.png`,
    cta: `${base}/mascot/penguin-cta.png`,
  },
  promo: {
    fan: `${base}/promo/fan-promo.png`,
    installer: `${base}/promo/installer.png`,
    panasonicAd: `${base}/promo/panasonic-ad.png`,
    saleBanner: `${base}/promo/sale-banner.png`,
  },
  hero: {
    modelPhone: `${base}/hero/model-phone.png`,
    showroom: `${base}/hero/showroom.png`,
  },
  aircon: {
    wallSplitDaikinAmihan: `${base}/aircon/wall-split-daikin-amihan.png`,
    wallSplitDaikinDsmart: `${base}/aircon/wall-split-daikin-dsmart.png`,
    wallSplitPanasonic: `${base}/aircon/wall-split-panasonic.png`,
    floorStanding: `${base}/aircon/floor-standing.png`,
    ceilingCassette: `${base}/aircon/ceiling-cassette.png`,
    mideaCelest: `${base}/aircon/midea-celest.png`,
    mideaQube: `${base}/aircon/midea-qube.png`,
  },
  brands: {
    daikin: `${base}/brands/daikin.svg`,
    midea: `${base}/brands/Midea.svg`,
    panasonic: `${base}/brands/panasonic.svg`,
    samsung: `${base}/brands/samsung.png`,
    carrier: `${base}/brands/Carrier.svg`,
    lg: `${base}/brands/LG.svg`,
  },
  social: {
    messenger: `${base}/social-media/messenger.svg`,
    whatsapp: `${base}/social-media/whatsapp.svg`,
    viber: `${base}/social-media/viber.svg`,
  },
  services: {
    install01: `${base}/services/install-01.jpg`,
    install02: `${base}/services/install-02.jpg`,
    install03: `${base}/services/install-03.jpg`,
    install04: `${base}/services/install-04.jpg`,
  },
  clients: {
    commercial01: `${base}/clients/commercial-01.jpg`,
    commercial02: `${base}/clients/commercial-02.jpg`,
  },
  coolDeals: {
    heroMascot: `${base}/cool-deals/hero-mascot.png`,
    heroVisual: `${base}/cool-deals/hero-visual.png`,
    mascotLarge: `${base}/cool-deals/mascot-large.png`,
    voucherFan: `${base}/cool-deals/voucher-fan.png`,
    voucherDelivery: `${base}/cool-deals/voucher-delivery.png`,
    voucherDiscount: `${base}/cool-deals/voucher-discount.png`,
    voucherCleaning: `${base}/cool-deals/voucher-cleaning.jpg`,
    typeWindow: `${base}/cool-deals/type-window.png`,
    typeWallSplit: `${base}/cool-deals/type-wall-split.png`,
    typePackage: `${base}/cool-deals/type-package.png`,
    typeVrf: `${base}/cool-deals/type-vrf.png`,
  },
} as const;

/** Product card image by brand (uses real unit photography from media kit). */
export function productImageForBrand(brand: string, index = 0): string {
  switch (brand) {
    case 'Daikin':
      return index % 2 === 0 ? hamelAssets.aircon.wallSplitDaikinAmihan : hamelAssets.aircon.wallSplitDaikinDsmart;
    case 'Midea':
      return index % 2 === 0 ? hamelAssets.aircon.mideaCelest : hamelAssets.aircon.mideaQube;
    case 'Panasonic':
      return hamelAssets.aircon.wallSplitPanasonic;
    default:
      return hamelAssets.aircon.wallSplitDaikinAmihan;
  }
}

export const hamelBrandLogos: Record<string, string | undefined> = {
  Daikin: hamelAssets.brands.daikin,
  Midea: hamelAssets.brands.midea,
  Panasonic: hamelAssets.brands.panasonic,
  Samsung: hamelAssets.brands.samsung,
  Carrier: hamelAssets.brands.carrier,
  LG: hamelAssets.brands.lg,
};

/** Resolve a brand logo URL by catalog/display name (case-insensitive). */
export function brandLogoFor(brandName: string | undefined | null): string | undefined {
  if (!brandName?.trim()) return undefined;
  const key = brandName.trim().toLowerCase();
  const entry = Object.entries(hamelBrandLogos).find(([name]) => name.toLowerCase() === key);
  return entry?.[1];
}

/** Hero carousel slides using real Hamel photography & promos. */
export const hamelHeroSlides = [
  {
    imageUrl: hamelAssets.promo.saleBanner,
    imageAlt: 'Hamel Cool Summer sale',
    tag: '⚡ Limited Time',
    title: 'Summer Sale — Up to 20% OFF Select Models',
    subtitle: 'Free installation + delivery on all orders above ₱20,000. Valid until May 31, 2026.',
    ctaLabel: 'Shop Deals',
    ctaHref: '/cool-deals',
    linkMode: 'promo-page' as const,
    promoPageId: 'promo-summer-sale',
    overlayColor: 'linear-gradient(to right, rgba(14,165,233,0.88) 0%, rgba(14,165,233,0.55) 60%, rgba(14,165,233,0.15) 100%)',
    height: 'md' as const,
    textAlign: 'left' as const,
  },
  {
    imageUrl: hamelAssets.promo.installer,
    imageAlt: 'Professional installation',
    tag: '🔧 Promo',
    title: 'Free Professional Installation on All Units',
    subtitle: 'Book this week and get certified installation at zero cost. Metro Cebu only.',
    ctaLabel: 'Book Now',
    ctaHref: '/contact',
    overlayColor: 'linear-gradient(to right, rgba(12,74,110,0.9) 0%, rgba(14,165,233,0.65) 55%, rgba(14,165,233,0.2) 100%)',
    height: 'md' as const,
    textAlign: 'left' as const,
  },
  {
    imageUrl: hamelAssets.promo.panasonicAd,
    imageAlt: 'Panasonic aircon promotion',
    tag: '✨ Just In',
    title: '2026 Models Are Here — Be the First to Own One',
    subtitle: 'Latest inverter technology. Energy-efficient. Whisper-quiet.',
    ctaLabel: 'See New Arrivals',
    ctaHref: '/products',
    overlayColor: 'linear-gradient(to right, rgba(26,58,107,0.9) 0%, rgba(14,165,233,0.6) 55%, rgba(14,165,233,0.15) 100%)',
    height: 'md' as const,
    textAlign: 'left' as const,
  },
];

export const hamelPromoBanners = [
  {
    title: 'SUMMER',
    titleAccent: 'COOL DEALS',
    subtitle: 'Everyday Aircon Essentials at Affordable Prices',
    badge: 'Up to 20% OFF',
    ctaLabel: 'Shop Now',
    ctaHref: '/cool-deals',
    bgColor: '#0EA5E9',
    textColor: '#FFFFFF',
    accentColor: '#FFC107',
    imageUrl: hamelAssets.hero.showroom,
  },
  {
    title: 'SAME DAY',
    titleAccent: 'DELIVERY',
    subtitle: 'Order before 12nn — delivered the same day',
    badge: 'Metro Cebu',
    ctaLabel: 'Learn More',
    ctaHref: '/contact',
    linkMode: 'promo-page' as const,
    promoPageId: 'promo-same-day-delivery',
    bgColor: '#0284C7',
    textColor: '#FFFFFF',
    accentColor: '#FFC107',
    imageUrl: hamelAssets.services.install02,
  },
  {
    title: '₱500',
    titleAccent: 'OFF',
    subtitle: 'Free installation on orders above ₱20,000',
    badge: 'Limited Slots',
    ctaLabel: 'Claim Now',
    ctaHref: '/cool-deals',
    linkMode: 'promo-page' as const,
    promoPageId: 'promo-free-install',
    bgColor: '#F97316',
    textColor: '#FFFFFF',
    accentColor: '#FFFFFF',
    imageUrl: hamelAssets.promo.fan,
  },
] as const;
