import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { CompareLimitModal } from '../components/CompareLimitModal';
import { useCatalog } from '../context/CatalogContext';
import { Filter } from 'lucide-react';
import { PageBanner } from '../components/PageBanner';
import { useBanner } from '../hooks/useBanner';
import { useBrandsPage } from '../hooks/useBrandsPage';
import { deriveBrandFilterOptionsFromCatalog } from '../data/brands-page';
import {
  deriveCategoryFilterOptions,
  deriveHpFilterOptions,
  filterStorefrontProducts,
  resolveBrandFilterValue,
} from '../lib/catalog-product';
import {
  clearCompare,
  getCompareIds,
  isInCompare,
  MAX_COMPARE,
  toggleCompare,
} from '../lib/product-actions';
import { usePageLoading } from '../context/SiteLoadingContext';

export function ProductsPage() {
  const { products, loading, error } = useCatalog();
  usePageLoading(loading, 'products');
  const productsBanner = useBanner('products');
  const brandsConfig = useBrandsPage({ trackPageLoading: false });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const brandFromUrl = searchParams.get('brand');
  const pickForCompare = searchParams.get('pickForCompare') === '1';
  const [, bumpCompare] = useState(0);
  const [compareLimitOpen, setCompareLimitOpen] = useState(false);

  useEffect(() => {
    const refresh = () => bumpCompare((n) => n + 1);
    window.addEventListener('hamel-product-actions-updated', refresh);
    return () => window.removeEventListener('hamel-product-actions-updated', refresh);
  }, []);

  // Comparison selections are only kept while using the dedicated
  // “Choose for Compare” flow. Returning to the regular product catalogue
  // starts a normal browsing session, so product details do not remain marked
  // as “In compare” from a previous comparison.
  useEffect(() => {
    if (!pickForCompare && getCompareIds().length > 0) {
      clearCompare();
    }
  }, [pickForCompare]);

  const catalogProducts = useMemo(() => products, [products]);

  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedHP, setSelectedHP] = useState('All');

  const brandOptions = useMemo(
    () => deriveBrandFilterOptionsFromCatalog(catalogProducts, brandsConfig),
    [catalogProducts, brandsConfig]
  );

  /** Category options from products matching the selected brand. */
  const categoryOptions = useMemo(
    () =>
      deriveCategoryFilterOptions(
        filterStorefrontProducts(catalogProducts, {
          brand: selectedBrand,
          category: 'All',
          hp: 'All',
        })
      ),
    [catalogProducts, selectedBrand]
  );

  /** HP options from products matching the selected brand + category. */
  const hpOptions = useMemo(
    () =>
      deriveHpFilterOptions(
        filterStorefrontProducts(catalogProducts, {
          brand: selectedBrand,
          category: selectedCategory,
          hp: 'All',
        })
      ),
    [catalogProducts, selectedBrand, selectedCategory]
  );

  useEffect(() => {
    if (brandFromUrl) {
      setSelectedBrand(resolveBrandFilterValue(brandOptions, brandFromUrl));
    }
  }, [brandFromUrl, brandOptions]);

  useEffect(() => {
    if (selectedCategory !== 'All' && !categoryOptions.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categoryOptions, selectedCategory]);

  useEffect(() => {
    if (selectedHP !== 'All' && !hpOptions.includes(selectedHP)) {
      setSelectedHP('All');
    }
  }, [hpOptions, selectedHP]);

  const filteredProducts = useMemo(
    () =>
      filterStorefrontProducts(catalogProducts, {
        brand: selectedBrand,
        category: selectedCategory,
        hp: selectedHP,
      }),
    [catalogProducts, selectedBrand, selectedCategory, selectedHP]
  );

  const visibleProducts = useMemo(
    () =>
      pickForCompare
        ? filteredProducts.filter((product) => !isInCompare(product.id))
        : filteredProducts,
    // bumpCompare refreshes when compare list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredProducts, pickForCompare, bumpCompare]
  );

  const resetFilters = () => {
    setSelectedBrand('All');
    setSelectedCategory('All');
    setSelectedHP('All');
    if (brandFromUrl) {
      const next = new URLSearchParams(searchParams);
      next.delete('brand');
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
      <PageBanner config={productsBanner} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {pickForCompare && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-4 py-3">
            <div>
              <p className="text-sm font-bold text-[#0369A1]">Choosing a product for Compare</p>
              <p className="text-xs text-[#0C4A6E]">
                Click an aircon to add it and return to the compare page.
              </p>
            </div>
            <Link
              to="/compare"
              className="rounded-lg border border-[#0EA5E9] bg-white px-3 py-1.5 text-sm font-semibold text-[#0EA5E9] hover:bg-[#E0F2FE]"
            >
              Back to Compare
            </Link>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Could not load the full catalog from the database. Showing cached or sample data. ({error})
          </div>
        )}

        <div className="grid lg:grid-cols-[250px_1fr] gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm h-fit lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-6">
              <Filter size={20} style={{ color: '#0EA5E9' }} />
              <h2 className="font-bold text-lg" style={{ color: '#0EA5E9' }}>
                Filters
              </h2>
            </div>

            <FilterGroup
              label="Brand"
              options={brandOptions}
              selected={selectedBrand}
              onSelect={setSelectedBrand}
            />
            <FilterGroup
              label="Category"
              options={categoryOptions}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
            <FilterGroup
              label="Horsepower"
              options={hpOptions}
              selected={selectedHP}
              onSelect={setSelectedHP}
            />

            <button
              type="button"
              onClick={resetFilters}
              className="w-full px-4 py-2 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#0EA5E9', color: '#0EA5E9' }}
            >
              Reset Filters
            </button>
          </div>

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <p className="text-gray-600">
                {loading ? (
                  'Loading products…'
                ) : (
                  <>
                    Showing <span className="font-semibold text-gray-900">{visibleProducts.length}</span> of{' '}
                    <span className="font-semibold text-gray-900">
                      {filterStorefrontProducts(catalogProducts, {
                        brand: 'All',
                        category: 'All',
                        hp: 'All',
                      }).length}
                    </span>{' '}
                    active products
                    {pickForCompare ? ' available to add' : ''}
                  </>
                )}
              </p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-lg h-96 animate-pulse shadow-sm" />
                ))}
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-600 text-lg">
                  {pickForCompare
                    ? 'No more products to add — everything matching your filters is already in compare.'
                    : 'No products match your filters.'}
                </p>
                {pickForCompare ? (
                  <Link
                    to="/compare"
                    className="mt-4 inline-block rounded-full px-6 py-3 font-semibold text-white"
                    style={{ backgroundColor: '#0EA5E9' }}
                  >
                    Back to Compare
                  </Link>
                ) : (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity text-gray-900"
                  style={{ backgroundColor: '#FFC107' }}
                >
                  Clear Filters
                </button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    pickLabel={pickForCompare ? 'Add to compare' : undefined}
                    onPick={
                      pickForCompare
                        ? (picked) => {
                            const result = toggleCompare(picked.id);
                            if (result.full && !result.added) {
                              setCompareLimitOpen(true);
                              return;
                            }
                            navigate(`/compare?ids=${result.ids.join(',')}`);
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      <CompareLimitModal
        isOpen={compareLimitOpen}
        onClose={() => setCompareLimitOpen(false)}
        maxProducts={MAX_COMPARE}
      />
    </>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  if (options.length <= 1) return null;

  return (
    <div className="mb-6">
      <label className="block font-semibold mb-3 text-gray-800">{label}</label>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`w-full text-left px-3 py-2 rounded transition-colors text-sm ${
              selected === option ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={selected === option ? { backgroundColor: '#0EA5E9' } : {}}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
