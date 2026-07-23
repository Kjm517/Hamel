import {
  getCoolDealsPage,
  loadCoolDealsPage,
  saveCoolDealsPage,
  type CoolDealsDealOfDaySection,
  type CoolDealsPageConfig,
} from '../data/cool-deals-page';
import type { Product } from '../data/products';
import { findDealCatalogProduct } from './deal-catalog-product';

/**
 * When a catalog product is saved, auto-link it to Deal of the Day if Cool Deals
 * already shows that unit by name/brand but has no productId yet.
 * Live “Only N left” then follows product.stockQty.
 */
export async function syncDealOfDayProductLink(product: Product): Promise<void> {
  try {
    await loadCoolDealsPage();
  } catch {
    /* use cache / defaults below */
  }

  const page = getCoolDealsPage();
  let changed = false;
  const sections = page.sections.map((section) => {
    if (section.type !== 'deal-of-day') return section;
    const deal = section as CoolDealsDealOfDaySection;
    if (deal.productId === product.id) return section;
    if (deal.productId) return section;

    const match = findDealCatalogProduct(deal, [product]);
    if (!match || match.id !== product.id) return section;

    changed = true;
    return { ...deal, productId: product.id };
  });

  if (!changed) return;
  await saveCoolDealsPage({ sections } as CoolDealsPageConfig);
}
