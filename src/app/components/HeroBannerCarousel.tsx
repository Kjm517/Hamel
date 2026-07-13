import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import type { BannerConfig } from './PageBanner';

interface HeroBannerCarouselProps {
  slides: BannerConfig[];
  className?: string;
}

const heights = {
  sm: 'h-36 md:h-48',
  md: 'h-52 md:h-72',
  lg: 'h-64 md:h-96',
};

export function HeroBannerCarousel({ slides, className = '' }: HeroBannerCarouselProps) {
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length]);

  if (!slides.length) return null;

  const goTo = (index: number) => {
    setCurrent(index);
    resetTimer();
  };

  const slide = slides[current];
  const height = heights[slide.height ?? 'sm'];

  return (
    <div className={`relative overflow-hidden w-full ${height} ${className}`}>
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
        >
          <img
            src={s.imageUrl}
            alt={s.imageAlt ?? ''}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: s.overlayColor }} />
          <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto w-full items-start text-left">
            {s.tag && (
              <div
                className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full mb-3"
                style={{ backgroundColor: '#FFC107', color: '#1a1a1a' }}
              >
                {s.tag}
              </div>
            )}
            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-2 drop-shadow">
              {s.title}
            </h2>
            {s.subtitle && (
              <p className="text-sm md:text-lg text-white/90 mb-4 max-w-xl drop-shadow">
                {s.subtitle}
              </p>
            )}
            {s.ctaLabel && s.ctaHref && (
              s.ctaExternal ? (
                <a
                  href={s.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity w-fit"
                  style={{ backgroundColor: '#FFC107', color: '#111' }}
                >
                  {s.ctaLabel}
                </a>
              ) : (
                <Link
                  to={s.ctaHref}
                  className="inline-block px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity w-fit"
                  style={{ backgroundColor: '#FFC107', color: '#111' }}
                >
                  {s.ctaLabel}
                </Link>
              )
            )}
          </div>
        </div>
      ))}

      {/* Dot navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor: i === current ? '#FFC107' : 'rgba(255,255,255,0.5)',
                transform: i === current ? 'scale(1.3)' : 'scale(1)',
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Arrow navigation */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo((current - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goTo((current + 1) % slides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}
