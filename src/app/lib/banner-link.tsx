import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { getPromoPageById, getPromoPagePath } from '../data/promo-pages';

export type BannerLinkMode = 'none' | 'promo-page' | 'custom';

export interface BannerLinkFields {
  linkMode?: BannerLinkMode;
  promoPageId?: string;
  linkHref?: string;
  linkExternal?: boolean;
  ctaHref?: string;
  ctaExternal?: boolean;
}

/** True when the URL should open outside React Router (http(s), mail, tel, or hostname). */
export function isExternalHref(href: string): boolean {
  const h = href.trim();
  if (!h || h.startsWith('/')) return false;
  if (/^(https?:|mailto:|tel:)/i.test(h)) return true;
  if (h.startsWith('//')) return true;
  // www.google.com, google.com, wa.me/123, etc.
  return /^([a-z0-9](?:[-a-z0-9]*[a-z0-9])?\.)+[a-z]{2,}(\/|$)/i.test(h) || /^www\./i.test(h);
}

/** Normalize custom links: add https:// for external hosts; ensure leading / for internal paths. */
export function normalizeBannerHref(href: string): string {
  const h = href.trim();
  if (!h) return h;
  if (/^(mailto:|tel:)/i.test(h)) return h;
  if (/^https?:/i.test(h)) return h;
  if (h.startsWith('//')) return `https:${h}`;
  if (isExternalHref(h)) return `https://${h.replace(/^\/+/, '')}`;
  if (!h.startsWith('/')) return `/${h}`;
  return h;
}

/** URL used when the whole banner is clicked. */
export function resolveBannerLinkHref(fields: BannerLinkFields): string | undefined {
  if (fields.linkMode === 'none') return undefined;

  if (fields.linkMode === 'promo-page' || fields.promoPageId) {
    const page = fields.promoPageId ? getPromoPageById(fields.promoPageId) : undefined;
    if (page?.published) return getPromoPagePath(page);
    if (fields.linkMode === 'promo-page') return undefined;
  }

  const raw = fields.linkHref?.trim() || fields.ctaHref?.trim();
  if (!raw) return undefined;
  return normalizeBannerHref(raw);
}

export function isBannerLinkExternal(fields: BannerLinkFields): boolean {
  const href = resolveBannerLinkHref(fields);
  if (!href) return false;
  if (fields.linkMode === 'promo-page' || (fields.promoPageId && href.startsWith('/promo/'))) {
    return false;
  }
  if (fields.linkExternal || fields.ctaExternal) return true;
  return isExternalHref(href);
}

interface BannerLinkWrapperProps {
  fields: BannerLinkFields;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}

/** Wraps banner content in a router link or anchor when a target URL is set. */
export function BannerLinkWrapper({ fields, className = '', children, ariaLabel }: BannerLinkWrapperProps) {
  const href = resolveBannerLinkHref(fields);
  if (!href) {
    return <div className={className}>{children}</div>;
  }

  const external = isBannerLinkExternal(fields);
  const label = ariaLabel || 'View promotion';

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${className}`.trim()}
        aria-label={label}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={`block ${className}`.trim()} aria-label={label}>
      {children}
    </Link>
  );
}
