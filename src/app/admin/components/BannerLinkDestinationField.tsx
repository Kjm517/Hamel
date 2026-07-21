import { Link } from 'react-router';
import {
  isExternalHref,
  normalizeBannerHref,
  type BannerLinkFields,
  type BannerLinkMode,
} from '../../lib/banner-link';
import { getPromoPageById, getPromoPagePath } from '../../data/promo-pages';
import { usePromoPages } from '../../hooks/usePromoPages';

/** Built-in storefront routes for "Link" navigation. */
const SITE_LINK_PRESETS: { label: string; href: string }[] = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Brands', href: '/brands' },
  { label: 'Cool Deals', href: '/cool-deals' },
  { label: 'Why Hamel', href: '/why-hamel' },
  { label: 'Contact', href: '/contact' },
];

export type BannerNavigateType = 'none' | 'page' | 'link';

interface BannerLinkDestinationFieldProps {
  fields: BannerLinkFields;
  onChange: (patch: Partial<BannerLinkFields>) => void;
  label?: string;
}

function toNavigateType(fields: BannerLinkFields): BannerNavigateType {
  const mode: BannerLinkMode =
    fields.linkMode ??
    (fields.promoPageId ? 'promo-page' : fields.linkHref?.trim() || fields.ctaHref?.trim() ? 'custom' : 'none');

  if (mode === 'promo-page') return 'page';
  if (mode === 'custom') return 'link';
  return 'none';
}

function applyNavigateType(
  type: BannerNavigateType,
  fields: BannerLinkFields,
  promoPages: { id: string }[]
): Partial<BannerLinkFields> {
  if (type === 'none') {
    return { linkMode: 'none', promoPageId: undefined, linkHref: '', ctaHref: '' };
  }
  if (type === 'page') {
    return {
      linkMode: 'promo-page',
      promoPageId: fields.promoPageId || promoPages[0]?.id,
      linkHref: '',
      ctaHref: fields.ctaHref || '',
    };
  }
  return {
    linkMode: 'custom',
    promoPageId: undefined,
    linkHref: fields.linkHref || fields.ctaHref || '/products',
    ctaHref: fields.linkHref || fields.ctaHref || '/products',
  };
}

export function BannerLinkDestinationField({
  fields,
  onChange,
  label = 'Banner navigation',
}: BannerLinkDestinationFieldProps) {
  const promoPages = usePromoPages();
  const navigateType = toNavigateType(fields);
  const selectedPage = fields.promoPageId ? getPromoPageById(fields.promoPageId) : undefined;
  const linkValue = fields.linkHref?.trim() || fields.ctaHref?.trim() || '';

  return (
    <div className="mb-4 rounded-lg border-2 border-[#0EA5E9]/20 bg-[#F0F9FF]/50 p-4">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
        {label}
      </label>

      <div className="grid grid-cols-1 gap-2 mb-4 sm:grid-cols-3">
        {(
          [
            { id: 'none' as const, label: 'None', desc: 'Not clickable' },
            { id: 'page' as const, label: 'Page', desc: 'Promo landing page' },
            { id: 'link' as const, label: 'Link', desc: 'URL or site route' },
          ] as const
        ).map(({ id, label, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(applyNavigateType(id, fields, promoPages))}
            className="flex flex-col items-center rounded-lg border-2 px-2 py-2.5 text-center transition-colors"
            style={{
              borderColor: navigateType === id ? '#0EA5E9' : '#E5E7EB',
              backgroundColor: navigateType === id ? '#E0F2FE' : '#FFF',
            }}
          >
            <span
              className="text-sm font-bold"
              style={{ color: navigateType === id ? '#0369A1' : '#374151' }}
            >
              {label}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">{desc}</span>
          </button>
        ))}
      </div>

      {navigateType === 'page' && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-600">Select promo page</label>
          <select
            value={fields.promoPageId || ''}
            onChange={(e) =>
              onChange({
                linkMode: 'promo-page',
                promoPageId: e.target.value || undefined,
                linkHref: '',
              })
            }
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white"
          >
            <option value="">Choose a page…</option>
            {promoPages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {!p.published ? ' (draft)' : ''}
              </option>
            ))}
          </select>
          {promoPages.length === 0 && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              No promo pages yet.{' '}
              <Link to="/admin/pages?tab=promo" className="font-semibold underline">
                Create one
              </Link>
            </p>
          )}
          {selectedPage && (
            <p className="text-xs text-gray-600">
              Visitors go to:{' '}
              <Link
                to={getPromoPagePath(selectedPage)}
                target="_blank"
                className="font-semibold text-[#0EA5E9] hover:underline"
              >
                {getPromoPagePath(selectedPage)}
              </Link>
              {!selectedPage.published && (
                <span className="text-amber-700"> — publish this page for it to work on the site</span>
              )}
            </p>
          )}
        </div>
      )}

      {navigateType === 'link' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quick site pages</label>
            <div className="flex flex-wrap gap-1.5">
              {SITE_LINK_PRESETS.map((preset) => (
                <button
                  key={preset.href}
                  type="button"
                  onClick={() =>
                    onChange({
                      linkMode: 'custom',
                      promoPageId: undefined,
                      linkHref: preset.href,
                      ctaHref: preset.href,
                      linkExternal: false,
                      ctaExternal: false,
                    })
                  }
                  className="px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors"
                  style={{
                    borderColor: linkValue === preset.href ? '#0EA5E9' : '#E5E7EB',
                    backgroundColor: linkValue === preset.href ? '#E0F2FE' : '#FFF',
                    color: linkValue === preset.href ? '#0369A1' : '#4B5563',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Or custom link</label>
            <input
              type="text"
              value={linkValue}
              onChange={(e) => {
                const raw = e.target.value;
                const external = Boolean(raw.trim()) && isExternalHref(raw);
                onChange({
                  linkMode: 'custom',
                  promoPageId: undefined,
                  linkHref: raw,
                  ctaHref: raw,
                  linkExternal: external,
                  ctaExternal: external,
                });
              }}
              placeholder="/products, www.google.com, or https://wa.me/..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white font-mono"
            />
            {linkValue.trim() && (
              <p className="mt-1.5 text-xs text-gray-600">
                {isExternalHref(linkValue) ? (
                  <>
                    Opens external site:{' '}
                    <span className="font-mono text-[#0369A1]">{normalizeBannerHref(linkValue)}</span>
                  </>
                ) : (
                  <>
                    In-app route:{' '}
                    <span className="font-mono text-[#0369A1]">{normalizeBannerHref(linkValue)}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {navigateType === 'none' && (
        <p className="text-xs text-gray-600">This banner will not navigate when clicked.</p>
      )}
    </div>
  );
}
