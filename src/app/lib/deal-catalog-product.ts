import type { CoolDealsDealOfDaySection } from '../data/cool-deals-page';
import type { Product } from '../data/products';

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Strip HP size tokens so "Amihan Inverter 1.5HP" ≈ "Amihan Inverter". */
function stripHpToken(value: string): string {
  return value
    .replace(/\b\d+(\.\d+)?\s*-?\s*hp\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve the catalog product for Deal of the Day.
 * Prefer explicit `productId`; otherwise fuzzy-match brand + product name
 * so live stock works before the deal is linked in Cool Deals admin.
 */
export function findDealCatalogProduct(
  section: Pick<CoolDealsDealOfDaySection, 'productId' | 'brand' | 'productName'>,
  products: Product[]
): Product | undefined {
  const active = products.filter((p) => p.isActive !== false);
  if (section.productId) {
    const byId = active.find((p) => p.id === section.productId);
    if (byId) return byId;
  }

  const brand = normalizeName(section.brand || '');
  const name = normalizeName(section.productName || '');
  const nameNoHp = stripHpToken(name);
  if (!name && !brand) return undefined;

  const scored = active
    .map((p) => {
      const pb = normalizeName(p.brand);
      const model = normalizeName(p.model);
      const modelNoHp = stripHpToken(model);
      const full = `${pb} ${model}`;
      const fullNoHp = stripHpToken(full);
      let score = 0;
      if (brand && pb === brand) score += 2;
      if (name) {
        if (model === name || full === name || modelNoHp === nameNoHp || fullNoHp === nameNoHp) {
          score += 5;
        } else if (
          name.includes(model) ||
          model.includes(nameNoHp) ||
          nameNoHp.includes(modelNoHp) ||
          modelNoHp.includes(nameNoHp)
        ) {
          score += 3;
        } else {
          const tokens = nameNoHp.split(/\s+/).filter((t) => t.length > 3 && !/^\d/.test(t));
          for (const token of tokens) {
            if (model.includes(token) || modelNoHp.includes(token)) {
              score += 2;
              break;
            }
          }
        }
      }
      return { p, score };
    })
    .filter((x) => x.score >= 4)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.p;
}
