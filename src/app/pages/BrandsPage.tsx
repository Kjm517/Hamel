import { Link } from 'react-router';
import { useCatalog } from '../context/CatalogContext';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { ContactOptionsModal } from '../components/ContactOptionsModal';
import { PageBanner } from '../components/PageBanner';
import { useBanner } from '../hooks/useBanner';
import { useBrandsPage } from '../hooks/useBrandsPage';
import { brandProductsHref, countProductsForBrand, defaultCtaLabel, formatModelCount } from '../data/brands-page';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { usePageLoading } from '../context/SiteLoadingContext';

export function BrandsPage() {
  const { products, loading: catalogLoading } = useCatalog();
  const brandsBanner = useBanner('brands');
  const { brands } = useBrandsPage();
  const [isContactOpen, setIsContactOpen] = useState(false);
  usePageLoading(catalogLoading, 'brands');

  const visibleBrands = brands.filter((b) => b.enabled);

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageBanner config={brandsBanner} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg p-8 mb-12 shadow-sm">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#0EA5E9' }}>
            Why Buy Authorized Brands from Hamel?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <CheckCircle className="mb-3" style={{ color: '#FFC107' }} size={32} />
              <h3 className="font-bold mb-2">Official Warranty</h3>
              <p className="text-gray-700">All units come with manufacturer's warranty honored nationwide.</p>
            </div>
            <div>
              <CheckCircle className="mb-3" style={{ color: '#FFC107' }} size={32} />
              <h3 className="font-bold mb-2">Genuine Parts</h3>
              <p className="text-gray-700">100% authentic units with original spare parts availability.</p>
            </div>
            <div>
              <CheckCircle className="mb-3" style={{ color: '#FFC107' }} size={32} />
              <h3 className="font-bold mb-2">Certified Service</h3>
              <p className="text-gray-700">Installation and service by brand-certified technicians.</p>
            </div>
          </div>
        </div>

        {visibleBrands.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No brands to display yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleBrands.map((brand) => {
              const productCount = countProductsForBrand(products, brand);
              const ctaHref = brand.ctaHref || brandProductsHref(brand);
              const ctaLabel = brand.ctaLabel || defaultCtaLabel(brand.name);

              return (
                <div key={brand.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    {brand.logoImageUrl ? (
                      <ImageWithFallback
                        src={brand.logoImageUrl}
                        alt={brand.name}
                        className="h-14 w-24 object-contain shrink-0"
                      />
                    ) : (
                      <div
                        className="h-14 w-24 shrink-0 flex items-center justify-center rounded-lg bg-[#E0F2FE] text-xl font-bold"
                        style={{ color: '#0EA5E9' }}
                      >
                        {brand.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-bold" style={{ color: '#0EA5E9' }}>
                        {brand.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {catalogLoading ? 'Loading models…' : formatModelCount(productCount)}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">{brand.description}</p>

                  {brand.features.length > 0 && (
                    <div className="space-y-2 mb-6">
                      {brand.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2">
                          <CheckCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#0EA5E9' }} />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link
                    to={ctaHref}
                    className="block w-full text-center px-4 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity text-gray-900"
                    style={{ backgroundColor: '#FFC107' }}
                  >
                    {ctaLabel}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 bg-white rounded-lg p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#0EA5E9' }}>
            Can't decide which brand?
          </h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Our team can help you choose the perfect aircon based on your budget, room size, and preferences.
          </p>
          <button
            type="button"
            onClick={() => setIsContactOpen(true)}
            className="inline-block px-8 py-4 rounded-full font-bold hover:opacity-90 transition-opacity text-gray-900"
            style={{ backgroundColor: '#FFC107' }}
          >
            Chat with Our Experts
          </button>
        </div>
      </div>

      <ContactOptionsModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
}
