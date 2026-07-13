import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { storefrontProducts } from '../lib/catalog-product';
import {
  clearCompare,
  getCompareIds,
  MAX_COMPARE,
  removeFromCompare,
  toggleCompare,
} from '../lib/product-actions';
import type { Product } from '../data/products';
import { getHpUnitPrice } from '../data/products';

function CompareSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <div className="mt-2 mb-5 h-px bg-gray-200" />
      {children}
    </section>
  );
}

function productSummary(product: Product): string {
  return (
    product.compare?.summary?.trim() ||
    product.description?.trim() ||
    `${product.brand} ${product.model} — quality cooling for Filipino homes.`
  );
}

function productHighlights(product: Product): { key: string; value: string }[] {
  if (product.compare?.highlights?.length) return product.compare.highlights;
  const fromSpecs = product.specifications.slice(0, 8);
  if (fromSpecs.length) return fromSpecs.map((s) => ({ key: s.label, value: s.value }));
  return [
    { key: 'Brand', value: product.brand },
    { key: 'Category', value: product.category },
    { key: 'Cooling Capacity (HP)', value: product.hp.join(', ') || '—' },
    { key: 'Price from', value: `₱${product.priceStart.toLocaleString()}` },
  ];
}

function whatsInBox(product: Product): string[] {
  if (product.compare?.whatsInBox?.length) return product.compare.whatsInBox;
  return ['Indoor unit', 'Outdoor unit', 'Remote control', 'User manual', 'Warranty card'];
}

function productFeatures(product: Product): string[] {
  if (product.compare?.productFeatures?.length) return product.compare.productFeatures;
  if (product.features.length) return product.features;
  return ['Inverter technology', 'Energy efficient cooling', 'Quiet operation'];
}

export function ComparePage() {
  const { products } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [compareIds, setCompareIds] = useState<string[]>(() => getCompareIds());
  const [queries, setQueries] = useState<string[]>(['', '', '']);

  useEffect(() => {
    const fromUrl = params.get('ids');
    if (fromUrl) {
      const ids = fromUrl
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_COMPARE);
      ids.forEach((id) => {
        if (!getCompareIds().includes(id)) toggleCompare(id);
      });
      setCompareIds(getCompareIds());
    }
    const refresh = () => setCompareIds(getCompareIds());
    window.addEventListener('hamel-product-actions-updated', refresh);
    return () => window.removeEventListener('hamel-product-actions-updated', refresh);
  }, [params]);

  const catalog = useMemo(() => storefrontProducts(products), [products]);
  const selected = compareIds
    .map((id) => catalog.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const slots = Array.from({ length: MAX_COMPARE }, (_, i) => selected[i] ?? null);

  const syncUrl = (ids: string[]) => {
    const next = new URLSearchParams(params);
    if (ids.length) next.set('ids', ids.join(','));
    else next.delete('ids');
    setParams(next, { replace: true });
  };

  const pickProduct = (productId: string, slotIndex: number) => {
    const current = getCompareIds();
    const without = current.filter((id) => id !== productId);
    const next = [...without];
    if (slotIndex < next.length) next[slotIndex] = productId;
    else if (next.length < MAX_COMPARE) next.push(productId);
    clearCompare();
    next.forEach((id) => toggleCompare(id));
    const ids = getCompareIds();
    setCompareIds(ids);
    syncUrl(ids);
    setQueries((q) => q.map((v, i) => (i === slotIndex ? '' : v)));
  };

  const clearSlot = (productId: string) => {
    const ids = removeFromCompare(productId);
    setCompareIds(ids);
    syncUrl(ids);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compare products</h1>
            <p className="mt-1 text-sm text-gray-600">
              Compare up to {MAX_COMPARE} aircons side by side — summary, highlights, box contents, and
              features.
            </p>
          </div>
          <Link to="/products?pickForCompare=1" className="text-sm font-semibold text-[#0EA5E9] hover:underline">
            Browse products
          </Link>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {slots.map((product, index) => {
            const query = queries[index]?.trim().toLowerCase() || '';
            const suggestions =
              query.length >= 1
                ? catalog
                    .filter(
                      (p) =>
                        !compareIds.includes(p.id) &&
                        `${p.brand} ${p.model}`.toLowerCase().includes(query)
                    )
                    .slice(0, 6)
                : [];

            return (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                {product ? (
                  <>
                    <div className="mb-3 flex items-start gap-2">
                      <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                          value={`${product.brand} ${product.model}`}
                          readOnly
                          className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-8 text-xs text-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => clearSlot(product.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-600"
                          aria-label="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="mb-3 flex aspect-square items-center justify-center rounded-lg bg-gray-50 p-4">
                      <img
                        src={product.image}
                        alt={product.model}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {product.brand} {product.model}
                    </p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      ₱{getHpUnitPrice(product).toLocaleString()}
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Link
                        to={`/product/${product.id}`}
                        className="rounded-full bg-[#0EA5E9] py-2 text-center text-sm font-semibold text-white hover:bg-[#0284C7]"
                      >
                        View product
                      </Link>
                      <Link
                        to={`/product/${product.id}`}
                        className="rounded-full bg-[#FFC107] py-2 text-center text-sm font-semibold text-gray-900 hover:opacity-90"
                      >
                        Inquire Now
                      </Link>
                      <Link
                        to={`/product/${product.id}`}
                        className="text-center text-sm font-semibold text-[#0EA5E9] underline"
                      >
                        Learn More
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative mb-3">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <input
                        value={queries[index]}
                        onChange={(e) =>
                          setQueries((prev) =>
                            prev.map((v, i) => (i === index ? e.target.value : v))
                          )
                        }
                        placeholder="Search..."
                        className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm"
                      />
                      {suggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                          {suggestions.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => pickProduct(p.id, index)}
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-[#F0F9FF]"
                            >
                              {p.brand} {p.model}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mb-3 flex aspect-square items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
                      Product image
                    </div>
                    <Link
                      to="/products?pickForCompare=1"
                      className="block rounded-full border-2 border-[#0EA5E9] py-2 text-center text-sm font-semibold text-[#0EA5E9] hover:bg-[#F0F9FF]"
                    >
                      Browse Products
                    </Link>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {selected.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-600">
            Add products from a product page with <strong>Compare</strong>, or search above.
          </p>
        ) : (
          <>
            <CompareSection title="Summary">
              <div className="grid gap-4 md:grid-cols-3">
                {slots.map((product, index) =>
                  product ? (
                    <div
                      key={`summary-${product.id}`}
                      className="text-sm leading-relaxed text-gray-700"
                    >
                      <p className="mb-2 font-bold text-gray-900">
                        {product.brand} {product.model}
                      </p>
                      <p>{productSummary(product)}</p>
                    </div>
                  ) : (
                    <div key={`summary-empty-${index}`} aria-hidden className="hidden md:block" />
                  )
                )}
              </div>
            </CompareSection>

            <CompareSection title="Product Highlights">
              <div className="grid gap-4 md:grid-cols-3">
                {slots.map((product, index) =>
                  product ? (
                    <dl key={`hl-${product.id}`} className="space-y-3 text-sm">
                      {productHighlights(product).map((row) => (
                        <div key={row.key}>
                          <dt className="font-semibold text-gray-900">{row.key}</dt>
                          <dd className="text-gray-600">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <div key={`hl-empty-${index}`} aria-hidden className="hidden md:block" />
                  )
                )}
              </div>
            </CompareSection>

            <CompareSection title="What’s in the Box">
              <div className="grid gap-4 md:grid-cols-3">
                {slots.map((product, index) =>
                  product ? (
                    <ul
                      key={`box-${product.id}`}
                      className="list-disc space-y-1 pl-5 text-sm text-gray-700"
                    >
                      {whatsInBox(product).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div key={`box-empty-${index}`} aria-hidden className="hidden md:block" />
                  )
                )}
              </div>
            </CompareSection>

            <CompareSection title="Product Features">
              <div className="grid gap-4 md:grid-cols-3">
                {slots.map((product, index) =>
                  product ? (
                    <ul key={`feat-${product.id}`} className="space-y-1.5 text-sm text-gray-700">
                      {productFeatures(product).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div key={`feat-empty-${index}`} aria-hidden className="hidden md:block" />
                  )
                )}
              </div>
            </CompareSection>
          </>
        )}
      </div>
    </div>
  );
}
