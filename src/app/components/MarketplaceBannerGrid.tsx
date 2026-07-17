import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BannerConfig } from './PageBanner';
import type { PromoBannerItem } from '../data/banners';
import { BannerLinkWrapper, resolveBannerLinkHref } from '../lib/banner-link';

function PromoSideCard({ item }: { item: PromoBannerItem }) {
  const href = resolveBannerLinkHref(item);
  const content = (
    <div
      className={`relative overflow-hidden rounded-2xl w-full h-full group transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg ${
        href ? 'cursor-pointer' : ''
      }`}
      style={{ backgroundColor: item.bgColor }}
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      )}

      <div className="relative z-10 p-3.5 md:p-4 h-full flex flex-col justify-center">
        {item.badge && (
          <span
            className="inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 w-fit"
            style={{ backgroundColor: item.accentColor, color: item.bgColor }}
          >
            {item.badge}
          </span>
        )}
        <div className="flex flex-wrap items-baseline gap-2">
          <div className="text-lg md:text-xl font-black leading-none" style={{ color: item.textColor }}>
            {item.title}
          </div>
          {item.titleAccent && (
            <span
              className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ backgroundColor: item.textColor, color: item.bgColor }}
            >
              {item.titleAccent}
            </span>
          )}
        </div>
        {item.subtitle && (
          <p
            className="text-[10px] md:text-xs mt-1.5 leading-snug line-clamp-2 max-w-[95%]"
            style={{ color: item.textColor, opacity: 0.92 }}
          >
            {item.subtitle}
          </p>
        )}
        {(item.ctaLabel || href) && (
          <span
            className="inline-block mt-2 text-[11px] font-bold tracking-wide"
            style={{ color: item.accentColor }}
          >
            {item.ctaLabel || 'Learn more'} →
          </span>
        )}
      </div>
    </div>
  );

  return (
    <BannerLinkWrapper
      fields={item}
      className="h-full min-h-0"
      ariaLabel={[item.title, item.titleAccent].filter(Boolean).join(' ')}
    >
      {content}
    </BannerLinkWrapper>
  );
}

function MainBannerCarousel({ slides }: { slides: BannerConfig[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  if (!slides.length) return null;

  const goTo = (index: number) => {
    setCurrent(index);
    resetTimer();
  };

  const stopNavClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="relative w-full h-full min-h-[200px] md:min-h-0 rounded-2xl overflow-hidden shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md">
      {slides.map((s, i) => {
        const href = resolveBannerLinkHref(s);
        const slideInner = (
          <>
            <img
              src={s.imageUrl}
              alt={s.imageAlt ?? ''}
              className="absolute inset-0 w-full h-full object-cover object-right"
            />
            {/* Only apply color/smoke overlay when admin set one (empty = image only) */}
            {s.overlayColor ? (
              <div className="absolute inset-0" style={{ background: s.overlayColor }} />
            ) : null}
            {(s.tag || s.title || s.subtitle || (s.ctaLabel && href)) && (
              <div
                className={`relative z-10 h-full flex flex-col justify-center px-5 md:px-8 max-w-[58%] ${
                  s.overlayColor ? '' : 'drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]'
                }`}
              >
                {s.tag && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2.5 w-fit bg-[#FFC107] text-gray-900">
                    ⚡ {s.tag}
                  </span>
                )}
                {s.title ? (
                  <h2 className="text-xl md:text-3xl lg:text-[2rem] font-extrabold text-white leading-tight drop-shadow-sm">
                    {s.title}
                  </h2>
                ) : null}
                {s.subtitle && (
                  <p className="text-xs md:text-sm text-white/95 mt-2 max-w-md line-clamp-3 drop-shadow-sm">
                    {s.subtitle}
                  </p>
                )}
                {s.ctaLabel && href && (
                  <span className="inline-block mt-4 px-5 py-2.5 rounded-full font-bold text-xs md:text-sm w-fit bg-[#FFC107] text-gray-900 shadow-sm">
                    {s.ctaLabel} →
                  </span>
                )}
              </div>
            )}
          </>
        );

        return (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-500 ${href ? 'cursor-pointer' : ''}`}
            style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          >
            <BannerLinkWrapper fields={s} className="relative block h-full w-full" ariaLabel={s.title}>
              {slideInner}
            </BannerLinkWrapper>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-3 left-5 md:left-8 flex gap-1.5 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  stopNavClick(e);
                  goTo(i);
                }}
                className="h-2 rounded-full transition-all"
                style={{
                  width: i === current ? 18 : 8,
                  backgroundColor: i === current ? '#FFC107' : 'rgba(255,255,255,0.55)',
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => {
              stopNavClick(e);
              goTo((current - 1 + slides.length) % slides.length);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 text-white transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              stopNavClick(e);
              goTo((current + 1) % slides.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 text-white transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}

interface MarketplaceBannerGridProps {
  carouselSlides: BannerConfig[];
  sideBanners: PromoBannerItem[];
}

/** Homepage promo grid: large carousel + up to three optional side offers. */
export function MarketplaceBannerGrid({ carouselSlides, sideBanners }: MarketplaceBannerGridProps) {
  const visibleSideBanners = sideBanners.filter((banner) => banner.enabled !== false).slice(0, 3);
  const sideGridClass =
    visibleSideBanners.length === 1
      ? 'grid-cols-1 md:grid-cols-1 md:grid-rows-1 h-[130px] sm:h-[150px] md:h-full'
      : visibleSideBanners.length === 2
        ? 'grid-cols-2 md:grid-cols-1 md:grid-rows-2 h-[130px] sm:h-[150px] md:h-full'
        : 'grid-cols-2 md:grid-cols-1 md:grid-rows-3 h-[200px] sm:h-[220px] md:h-full';

  return (
    <section className="bg-white pt-3 pb-2">
      <div className="max-w-7xl mx-auto px-4">
        <div
          className={`flex flex-col gap-2.5 md:gap-3 md:h-[300px] lg:h-[328px] ${
            visibleSideBanners.length ? 'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : ''
          }`}
        >
          <div className="md:min-h-0 md:h-full">
            <MainBannerCarousel slides={carouselSlides} />
          </div>
          {visibleSideBanners.length ? (
            <div className={`grid gap-2.5 md:gap-3 md:min-h-0 ${sideGridClass}`}>
              {visibleSideBanners.map((banner, index) => (
                <div key={`${banner.title}-${index}`} className="min-h-0 h-full">
                  <PromoSideCard item={banner} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
