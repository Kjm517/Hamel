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
  resolveHpFilterValue,
} from '../lib/catalog-product';
import {
  clearCompare,
  getCompareIds,
  isInCompare,
  MAX_COMPARE,
  toggleCompare,
} from '../lib/product-actions';
import { usePageLoading } from '../context/SiteLoadingContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';

export function ProductsPage() {
  const { products, loading, error } = useCatalog();
  usePageLoading(loading, 'products');
  const productsBanner = useBanner('products');
  const brandsConfig = useBrandsPage({ trackPageLoading: false });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const brandFromUrl = searchParams.get('brand');
  const categoryFromUrl = searchParams.get('category');
  const hpFromUrl = searchParams.get('hp');
  const pickForCompare = searchParams.get('pickForCompare') === '1';
  const [, bumpCompare] = useState(0);
  const [compareLimitOpen, setCompareLimitOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const refresh = () => bumpCompare((n) => n + 1);
    window.addEventListener('hamel-product-actions-updated', refresh);
    return () => window.removeEventListener('hamel-product-actions-updated', refresh);
  }, []);

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
    if (categoryFromUrl) {
      const match = categoryOptions.find(
        (c) => c !== 'All' && c.toLowerCase() === categoryFromUrl.toLowerCase()
      );
      if (match) setSelectedCategory(match);
    }
  }, [categoryFromUrl, categoryOptions]);

  useEffect(() => {
    if (hpFromUrl) {
      setSelectedHP(resolveHpFilterValue(hpOptions, hpFromUrl));
    }
  }, [hpFromUrl, hpOptions]);

  useEffect(() => {
    if (selectedCategory !== 'All' && !categoryOptions.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categoryOptions, selectedCategory]);

  useEffect(() => {
    if (selectedHP !== 'All' && !hpOptions.includes(selectedHP)) {
      // Keep URL-driven HP even if options briefly empty while catalog loads
      if (!hpFromUrl) setSelectedHP('All');
    }
  }, [hpOptions, selectedHP, hpFromUrl]);

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredProducts, pickForCompare, bumpCompare]
  );

  const resetFilters = () => {
    setSelectedBrand('All');
    setSelectedCategory('All');
    setSelectedHP('All');
    if (brandFromUrl || categoryFromUrl || hpFromUrl) {
      const next = new URLSearchParams(searchParams);
      next.delete('brand');
      next.delete('category');
      next.delete('hp');
      setSearchParams(next, { replace: true });
    }
  };

  const activeFilterCount = [selectedBrand, selectedCategory, selectedHP].filter(
    (v) => v !== 'All'
  ).length;

  const filterPanel = (
    <>
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
        className="w-full rounded-lg border-2 px-4 py-2 font-semibold transition-colors hover:bg-gray-50"
        style={{ borderColor: '#0EA5E9', color: '#0EA5E9' }}
      >
        Reset Filters
      </button>
    </>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
      <PageBanner config={productsBanner} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
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

        <div className="grid gap-6 lg:grid-cols-[250px_1fr] lg:gap-8">
          <aside className="hidden h-fit rounded-lg bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:block">
            <div className="mb-6 flex items-center gap-2">
              <Filter size={20} style={{ color: '#0EA5E9' }} />
              <h2 className="text-lg font-bold" style={{ color: '#0EA5E9' }}>
                Filters
              </h2>
            </div>
            {filterPanel}
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
              <p className="text-sm text-gray-600 sm:text-base">
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
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm lg:hidden"
              >
                <Filter size={16} style={{ color: '#0EA5E9' }} />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0EA5E9] px-1.5 text-[11px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-72 animate-pulse rounded-lg bg-white shadow-sm sm:h-96" />
                ))}
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center sm:p-12">
                <p className="text-base text-gray-600 sm:text-lg">
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
                  className="mt-4 rounded-full px-6 py-3 font-semibold text-gray-900 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#FFC107' }}
                >
                  Clear Filters
                </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
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

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-[min(100vw-2rem,20rem)] gap-0 bg-white p-0">
          <SheetHeader className="border-b border-gray-100 px-4 py-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-[#0EA5E9]">
              <Filter size={18} />
              Filters
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto p-4 pb-8">
            {filterPanel}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-4 w-full rounded-full py-3 font-semibold text-gray-900"
              style={{ backgroundColor: '#FFC107' }}
            >
              Show {visibleProducts.length} products
            </button>
          </div>
        </SheetContent>
      </Sheet>

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
