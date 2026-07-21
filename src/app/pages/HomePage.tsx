import { ProductCard } from '../components/ProductCard';
import { useCatalog } from '../context/CatalogContext';
import { homepageTestimonials, FACEBOOK_REVIEWS_URL, FACEBOOK_RECOMMEND_SUMMARY } from '../data/testimonials';
import { FEATURED_PRODUCT_LIMIT } from '../data/banners';
import { Shield, Wrench, Headset, Star, Truck, MessageCircle, Award, CheckCircle, ClipboardList, ChevronRight, ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ContactOptionsModal } from '../components/ContactOptionsModal';
import { MarketplaceBannerGrid } from '../components/MarketplaceBannerGrid';
import { FeaturedEventCountdown } from '../components/PromoCountdownBanner';
import { PromoAmbientLayer } from '../components/PromoAmbientLayer';
import { useHeroSlides, useFeaturedCollection, usePromoBanners } from '../hooks/useBanner';
import { useBrandsPage } from '../hooks/useBrandsPage';
import { brandProductsHref, enabledBrands } from '../data/brands-page';
import { isPromoCountdownActive } from '../lib/product-promos';
import { isStorefrontProduct } from '../lib/catalog-product';
import { resolveStorageImageUrl } from '../lib/storage';
import { promoAnimationClass } from '../lib/promo-animations';

const TRUST_BADGES = [
  { icon: <Award size={16} />, label: 'Licensed Installer' },
  { icon: <Shield size={16} />, label: 'Warranty Supported' },
  { icon: <Truck size={16} />, label: 'Cebu-wide Delivery' },
  { icon: <CheckCircle size={16} />, label: 'Free Site Assessment' },
  { icon: <ClipboardList size={16} />, label: 'Easy Ordering' },
];

export function HomePage() {
  const { products } = useCatalog();
  const heroSlides = useHeroSlides();
  const featuredCollection = useFeaturedCollection();
  const promoBanners = usePromoBanners();
  const brandsConfig = useBrandsPage({ trackPageLoading: false });
  const homepageBrands = useMemo(() => enabledBrands(brandsConfig).slice(0, 6), [brandsConfig]);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const storefront = useMemo(() => products.filter(isStorefrontProduct), [products]);

  const featuredProducts = useMemo(() => {
    const ids = (featuredCollection.productIds ?? []).filter(Boolean);
    if (ids.length) {
      return ids
        .map((id) => storefront.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, FEATURED_PRODUCT_LIMIT);
    }
    return storefront.slice(0, FEATURED_PRODUCT_LIMIT);
  }, [featuredCollection.productIds, storefront]);

  const seeAllHref = featuredCollection.seeAllHref?.trim() || '/products';
  const seeAllLabel = featuredCollection.seeAllLabel?.trim() || 'See All Products';
  const seeAllExternal = Boolean(featuredCollection.seeAllExternal);
  const showCountdown =
    Boolean(featuredCollection.countdownEndsAt) &&
    isPromoCountdownActive(featuredCollection.countdownEndsAt!);
  const featuredBgImage =
    resolveStorageImageUrl(featuredCollection.bgImageUrl) ||
    featuredCollection.bgImageUrl?.trim() ||
    '';

  return (
    <div className="bg-white">
      {/* Shopee / Abenson-style banners: carousel + side promos */}
      <MarketplaceBannerGrid
        carouselSlides={heroSlides}
        sideBanners={promoBanners}
      />

      {/* Trust strip — below banners */}
      <section className="border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="-mx-4 flex items-stretch gap-0 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:justify-around md:divide-x md:divide-gray-100 md:overflow-visible md:px-0">
            {TRUST_BADGES.map(({ icon, label }) => (
              <div
                key={label}
                className="flex shrink-0 items-center gap-2 border-r border-gray-100 px-4 py-3 last:border-r-0 md:border-r-0 md:px-5 md:py-3.5"
              >
                <span className="text-[#0EA5E9]">{icon}</span>
                <span className="whitespace-nowrap text-xs font-semibold tracking-wide text-gray-700">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo event section (Cool Summer / Birthday Sale / etc.) */}
      {featuredCollection.enabled !== false && featuredProducts.length > 0 ? (
      <section
        className={`relative overflow-hidden py-10 ${promoAnimationClass(featuredCollection.animation)}`}
        style={{ backgroundColor: featuredCollection.bgColor }}
      >
        {featuredBgImage ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${featuredBgImage})` }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundColor: featuredCollection.bgColor,
                opacity:
                  typeof featuredCollection.bgImageOverlay === 'number'
                    ? featuredCollection.bgImageOverlay
                    : 0.2,
              }}
              aria-hidden
            />
          </>
        ) : null}
        <PromoAmbientLayer
          effect={featuredCollection.ambientEffect}
          intensity={featuredCollection.ambientIntensity}
          durationSec={featuredCollection.ambientDurationSec}
          direction={featuredCollection.ambientDirection}
          accentColor={featuredCollection.highlightColor}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <h2 className="text-2xl font-black leading-none tracking-tight sm:text-3xl md:text-5xl">
                  <span style={{ color: featuredCollection.titleColor }}>{featuredCollection.title} </span>
                  <span style={{ color: featuredCollection.highlightColor }}>{featuredCollection.titleHighlight}</span>
                </h2>
                {showCountdown ? (
                  <FeaturedEventCountdown
                    endsAt={featuredCollection.countdownEndsAt!}
                    label={featuredCollection.countdownLabel || 'ENDS IN'}
                    labelColor={featuredCollection.titleColor}
                  />
                ) : null}
              </div>
              {featuredCollection.subtitle && (
                <p className="text-sm mt-1.5" style={{ color: featuredCollection.titleColor, opacity: 0.8 }}>
                  {featuredCollection.subtitle}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              {seeAllExternal ? (
                <a
                  href={seeAllHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1 text-sm font-bold hover:opacity-80 transition-opacity"
                  style={{ color: featuredCollection.highlightColor }}
                >
                  See All <ChevronRight size={15} />
                </a>
              ) : (
                <Link
                  to={seeAllHref}
                  className="hidden md:inline-flex items-center gap-1 text-sm font-bold hover:opacity-80 transition-opacity"
                  style={{ color: featuredCollection.highlightColor }}
                >
                  See All <ChevronRight size={15} />
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-6">
            {seeAllExternal ? (
              <a
                href={seeAllHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: featuredCollection.highlightColor, color: '#111' }}
              >
                {seeAllLabel} <ChevronRight size={15} />
              </a>
            ) : (
              <Link
                to={seeAllHref}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: featuredCollection.highlightColor, color: '#111' }}
              >
                {seeAllLabel} <ChevronRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </section>
      ) : null}

      {/* Why Choose Hamel */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FFC107' }}>Since 2010</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0EA5E9' }}>
              Why Cebu Families Trust Hamel
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Shield size={24} />, title: 'Certified & Licensed', body: 'All installers are TESDA-certified and fully insured for your peace of mind.' },
              { icon: <Wrench size={24} />, title: 'Expert Installation', body: "Proper installation extends your aircon's life. We do it right the first time." },
              { icon: <Headset size={24} />, title: 'After-Sales Support', body: "We don't disappear after the sale. Call anytime for maintenance and support." },
              { icon: <Star size={24} />, title: 'Top Brands Only', body: 'We carry Samsung, Carrier, Panasonic, Daikin, Midea, and LG — all authentic.' },
              { icon: <Truck size={24} />, title: 'Cebu-wide Delivery', body: 'Same-week delivery and installation available across Metro Cebu.' },
              { icon: <MessageCircle size={24} />, title: 'Personal Service', body: 'Talk directly with our team — no bots, no call centers. Real people who care.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#E0F2FE', color: '#0EA5E9' }}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ color: '#0C4A6E' }}>{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FFC107' }}>Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0EA5E9' }}>
              How to Get Your Aircon
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5" style={{ backgroundColor: '#BAE6FD', zIndex: 0 }} />
            {[
              { icon: <ClipboardList size={20} />, label: 'Browse', sub: 'Pick your unit from our catalog' },
              { icon: <MessageCircle size={20} />, label: 'Inquire', sub: 'Chat with our team or AI' },
              { icon: <CheckCircle size={20} />, label: 'Confirm', sub: 'We finalise & schedule together' },
              { icon: <Wrench size={20} />, label: 'Install', sub: 'Delivery + pro installation', accent: true },
            ].map(({ icon, label, sub, accent }) => (
              <div key={label} className="relative flex flex-col items-center text-center z-10">
                <div
                  className="w-20 h-20 rounded-full flex flex-col items-center justify-center mb-4 shadow-md"
                  style={{ backgroundColor: accent ? '#FFC107' : '#0EA5E9', color: '#fff' }}
                >
                  {icon}
                  <span className="text-xs font-bold mt-0.5">{label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-snug max-w-[100px]">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      {homepageBrands.length > 0 ? (
        <section className="py-12" style={{ backgroundColor: '#F0F9FF' }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FFC107' }}>Authorized Dealer</p>
              <h2 className="text-3xl font-bold" style={{ color: '#0EA5E9' }}>Brands We Carry</h2>
              <p className="text-sm text-gray-500 mt-1">All units come with official manufacturer warranty</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {homepageBrands.map((brand) => {
                const logo = brand.logoImageUrl;
                return (
                  <Link
                    key={brand.id}
                    to={brandProductsHref(brand)}
                    className="flex h-20 w-[calc((100%-1rem)/2)] items-center justify-center rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-[#BAE6FD] hover:shadow-md group sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-5rem)/6)]"
                  >
                    {logo ? (
                      <img
                        src={logo}
                        alt={brand.name}
                        className="max-h-10 w-full max-w-[110px] object-contain opacity-90 transition-opacity group-hover:opacity-100"
                      />
                    ) : (
                      <span className="text-base font-extrabold tracking-tight text-[#0C4A6E]">
                        {brand.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Testimonials — from Facebook reviews */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#FFC107' }}>Happy Customers</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0EA5E9' }}>What Cebu Families Say</h2>
            <p className="mt-2 text-sm text-gray-500">{FACEBOOK_RECOMMEND_SUMMARY}</p>
          </div>
          <div
            className={`grid gap-6 ${
              homepageTestimonials.length >= 3
                ? 'md:grid-cols-2 lg:grid-cols-4'
                : 'md:grid-cols-2 max-w-4xl mx-auto'
            }`}
          >
            {homepageTestimonials.map((t, index) => {
              const avatarColors = ['#0EA5E9', '#0284C7', '#0369A1', '#0C4A6E'];
              return (
                <div
                  key={t.id}
                  className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    {t.source === 'facebook' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1877F2]">
                        Facebook
                      </span>
                    )}
                  </div>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-700 line-clamp-6">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
                    >
                      {t.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-900">{t.name}</div>
                      <div className="truncate text-xs text-gray-500">{t.location}</div>
                    </div>
                    <div
                      className="max-w-[40%] shrink-0 truncate rounded-full px-2 py-1 text-xs font-semibold"
                      style={{ backgroundColor: '#FFF9E6', color: '#B45309' }}
                      title={t.model}
                    >
                      {t.model}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <a
              href={FACEBOOK_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1877F2] hover:underline"
            >
              Read more reviews on Facebook
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16" style={{ backgroundColor: '#0EA5E9' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Ready to Stay Cool, Cebu?
          </h2>
          <p className="text-blue-100 mb-8 text-lg max-w-xl mx-auto">
            Get expert advice, free site assessment, and same-week installation — all from one trusted team.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-gray-900 shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#FFC107' }}
            >
              Shop Aircons <ArrowRight size={18} />
            </Link>
            <button
              onClick={() => setIsContactOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white border-2 border-white/70 hover:bg-white hover:text-[#0EA5E9] transition-colors"
            >
              <MessageCircle size={18} /> Talk to Our Team
            </button>
          </div>
        </div>
      </section>

      <ContactOptionsModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
}
