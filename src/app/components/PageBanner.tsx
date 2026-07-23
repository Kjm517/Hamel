import { Link } from 'react-router';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface BannerConfig {
  id?: string;
  imageUrl: string;
  imageAlt?: string;
  tag?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
  /** Whole-banner click target; falls back to `ctaHref` when empty. */
  linkHref?: string;
  linkExternal?: boolean;
  linkMode?: 'none' | 'promo-page' | 'custom';
  promoPageId?: string;
  overlayColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  height?: 'sm' | 'md' | 'lg';
}

interface PageBannerProps {
  config: BannerConfig;
  className?: string;
}

/** Shared banner heights — use on page headers and Cool Deals hero. */
export const PAGE_BANNER_HEIGHTS = {
  sm: 'h-36 md:h-48',
  md: 'h-52 md:h-72',
  lg: 'h-64 md:h-96',
} as const;

const heights = PAGE_BANNER_HEIGHTS;

const alignClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

export function PageBanner({ config, className = '' }: PageBannerProps) {
  const {
    imageUrl,
    imageAlt = '',
    tag,
    title,
    subtitle,
    ctaLabel,
    ctaHref,
    ctaExternal,
    overlayColor,
    textAlign = 'left',
    height = 'md',
  } = config;

  const contentAlign = alignClasses[textAlign];

  return (
    <div className={`relative overflow-hidden w-full ${heights[height]} ${className}`}>
      {}
      <ImageWithFallback
        src={imageUrl}
        alt={imageAlt}
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {}
      {overlayColor ? <div className="absolute inset-0" style={{ background: overlayColor }} /> : null}

      {}
      <div className={`relative z-10 h-full flex flex-col justify-center px-6 md:px-12 max-w-7xl mx-auto w-full ${contentAlign}`}>
        {tag && (
          <div
            className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full mb-3"
            style={{ backgroundColor: '#FFC107', color: '#1a1a1a' }}
          >
            {tag}
          </div>
        )}
        <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-2 drop-shadow">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm md:text-lg text-white/90 mb-4 max-w-xl drop-shadow">
            {subtitle}
          </p>
        )}
        {ctaLabel && ctaHref && (
          ctaExternal ? (
            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity w-fit"
              style={{ backgroundColor: '#FFC107', color: '#111' }}
            >
              {ctaLabel}
            </a>
          ) : (
            <Link
              to={ctaHref}
              className="inline-block px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity w-fit"
              style={{ backgroundColor: '#FFC107', color: '#111' }}
            >
              {ctaLabel}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
