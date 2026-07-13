import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BannerConfig } from './PageBanner';
import type { PromoBannerItem } from '../data/banners';
import { BannerLinkWrapper, resolveBannerLinkHref } from '../lib/banner-link';

function PromoSideCard({ item }: { item: PromoBannerItem }) {
  const href = resolveBannerLinkHref(item);
  const content = (
    <div
      className={`relative overflow-hidden rounded-sm w-full h-full group ${
        href ? 'cursor-pointer' : ''
      }`}
      style={{ backgroundColor: item.bgColor }}
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-35 group-hover:opacity-45 transition-opacity duration-300"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />

      <div className="relative z-10 p-3 md:p-4 h-full flex flex-col justify-center">
        {item.badge && (
          <span
            className="inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1.5 w-fit"
            style={{ backgroundColor: item.accentColor, color: item.bgColor }}
          >
            {item.badge}
          </span>
        )}
        <div className="text-lg md:text-xl font-black leading-none" style={{ color: item.textColor }}>
          {item.title}
        </div>
        {item.titleAccent && (
          <div className="text-base md:text-lg font-black leading-tight mt-0.5" style={{ color: item.accentColor }}>
            {item.titleAccent}
          </div>
        )}
        {item.subtitle && (
          <p
            className="text-[10px] md:text-xs mt-1.5 leading-snug line-clamp-2 max-w-[90%]"
            style={{ color: item.textColor, opacity: 0.9 }}
          >
            {item.subtitle}
          </p>
        )}
        {item.ctaLabel && href && (
          <span
            className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide underline underline-offset-2 opacity-90"
            style={{ color: item.textColor }}
          >
            {item.ctaLabel}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <BannerLinkWrapper
      fields={item}
      className="h-full min-h-0 hover:opacity-[0.98] transition-opacity"
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
    <div className="relative w-full h-full min-h-[180px] md:min-h-0 rounded-sm overflow-hidden bg-gray-100">
      {slides.map((s, i) => {
        const href = resolveBannerLinkHref(s);
        const slideInner = (
          <>
            <img src={s.imageUrl} alt={s.imageAlt ?? ''} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: s.overlayColor }} />
            <div className="relative z-10 h-full flex flex-col justify-center px-5 md:px-8 max-w-xl">
              {s.tag && (
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2 w-fit"
                  style={{ backgroundColor: '#FFC107', color: '#1a1a1a' }}
                >
                  {s.tag}
                </span>
              )}
              <h2 className="text-xl md:text-3xl font-extrabold text-white leading-tight drop-shadow-sm">{s.title}</h2>
              {s.subtitle && (
                <p className="text-xs md:text-sm text-white/90 mt-2 max-w-md line-clamp-2 drop-shadow-sm">{s.subtitle}</p>
              )}
              {s.ctaLabel && href && (
                <span
                  className="inline-block mt-3 px-5 py-2 rounded-sm font-bold text-xs md:text-sm w-fit"
                  style={{ backgroundColor: '#FFC107', color: '#111' }}
                >
                  {s.ctaLabel}
                </span>
              )}
            </div>
          </>
        );

        return (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-500 ${
              href ? 'cursor-pointer' : ''
            }`}
            style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          >
            <BannerLinkWrapper
              fields={s}
              className="relative block h-full w-full"
              ariaLabel={s.title}
            >
              {slideInner}
            </BannerLinkWrapper>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  stopNavClick(e);
                  goTo(i);
                }}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === current ? 16 : 6,
                  backgroundColor: i === current ? '#fff' : 'rgba(255,255,255,0.55)',
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
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-14 md:w-9 md:h-16 bg-black/30 hover:bg-black/45 text-white transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              stopNavClick(e);
              goTo((current + 1) % slides.length);
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-14 md:w-9 md:h-16 bg-black/30 hover:bg-black/45 text-white transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}

interface MarketplaceBannerGridProps {
  carouselSlides: BannerConfig[];
  sideBanners: [PromoBannerItem, PromoBannerItem];
}

/** Shopee / Abenson-style banner row: main carousel (2/3) + two stacked promos (1/3). */
export function MarketplaceBannerGrid({ carouselSlides, sideBanners }: MarketplaceBannerGridProps) {
  return (
    <section className="bg-white pt-3 pb-1">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2 md:gap-2.5 md:h-[300px] lg:h-[320px]">
          <div className="md:min-h-0 md:h-full">
            <MainBannerCarousel slides={carouselSlides} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 md:grid-rows-2 gap-2 md:gap-2.5 h-[120px] sm:h-[140px] md:h-full md:min-h-0">
            <div className="min-h-0 h-full">
              <PromoSideCard item={sideBanners[0]} />
            </div>
            <div className="min-h-0 h-full">
              <PromoSideCard item={sideBanners[1]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
