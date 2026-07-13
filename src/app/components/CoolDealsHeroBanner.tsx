import { ImageWithFallback } from './figma/ImageWithFallback';
import { PAGE_BANNER_HEIGHTS } from './PageBanner';
import type { CoolDealsBannerConfig } from '../data/banners';
import { BannerLinkWrapper } from '../lib/banner-link';

interface CoolDealsHeroBannerProps {
  config: CoolDealsBannerConfig;
}

/** Full-width banner — same height as other page headers (PageBanner md). */
export function CoolDealsHeroBanner({ config }: CoolDealsHeroBannerProps) {
  const hasOverlay =
    config.showTextOverlay &&
    (config.badge || config.title || config.titleHighlight || config.subtitle);

  const inner = (
    <div className={`relative w-full overflow-hidden ${PAGE_BANNER_HEIGHTS.md}`}>
      <ImageWithFallback
        src={config.bannerImageUrl}
        alt={config.title || 'Cool Deals promotion'}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {hasOverlay && (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/55 to-transparent"
            aria-hidden
          />
          <div className="relative z-10 flex h-full flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto w-full">
            <div className="max-w-xl">
              {config.badge && (
                <span className="inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-md bg-red-500 text-white mb-3">
                  {config.badge}
                </span>
              )}
              {(config.title || config.titleHighlight) && (
                <h1 className="text-2xl md:text-4xl font-extrabold leading-tight drop-shadow-sm">
                  {config.title && <span style={{ color: config.titleColor }}>{config.title} </span>}
                  {config.titleHighlight && (
                    <span style={{ color: config.highlightColor }}>{config.titleHighlight}</span>
                  )}
                </h1>
              )}
              {config.subtitle && (
                <p className="text-gray-700 mt-2 text-sm md:text-lg max-w-lg leading-relaxed">
                  {config.subtitle}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <section className="w-full">
      <BannerLinkWrapper fields={config} className="block w-full" ariaLabel={config.title}>
        {inner}
      </BannerLinkWrapper>
    </section>
  );
}
