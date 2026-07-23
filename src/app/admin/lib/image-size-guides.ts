/**
 * Recommended upload dimensions for admin image fields.
 * Shown via ImageUrlOrUploadField `sizeGuide`.
 */
export const IMAGE_SIZE_GUIDES = {
  productMain: '1200×1200 px (square)',
  productGallery: '1200×1200 px or 1600×1200 px',
  brandLogo: '400×200 px (or square up to 512×512)',
  heroBanner: '1920×800 px (wide)',
  pageHeader: '1920×480 px (wide)',
  coolDealsBanner: '1600×600 px (wide)',
  coolDealsCard: '800×800 px (square)',
  coolDealsDealBg: '1200×800 px',
  promoSideBanner: '600×800 px (portrait)',
  promoPageHero: '1920×800 px (wide)',
  promoPageBlock: '1200×800 px',
  promoPagePhoto: '1200×900 px',
  promoEvent: '1920×600 px (wide)',
  bankLogo: '240×80 px (wide logo)',
  profileAvatar: '400×400 px (square)',
  tagChip: '320×56 px (wide PNG)',
  tagIcon: '128×128 px (square)',
  popupPoster: '1582×2048 px (portrait)',
  popupSplit: '800×1200 px (2:3 portrait)',
  popupCentered: '800×800 px (square)',
  authPromoImage: '960×540 px (16:9 landscape)',
} as const;
