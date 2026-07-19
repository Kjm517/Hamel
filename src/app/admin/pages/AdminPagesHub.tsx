import { useSearchParams, Link } from 'react-router';
import { useEffect, useState } from 'react';
import {
  Layout,
  Home,
  FileText,
  Snowflake,
  Building2,
  ChevronRight,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { HomepageTab } from './hub/HomepageTab';
import { PageHeadersTab } from './hub/PageHeadersTab';
import { PromoPagesTab } from './hub/PromoPagesTab';
import { CoolDealsTab } from './hub/CoolDealsTab';
import { BrandsTab } from './hub/BrandsTab';
import { getPromoPages } from '../../data/promo-pages';
import { adminUi } from '../lib/admin-ui';

const PAGES = [
  {
    id: 'home',
    label: 'Home page',
    desc: 'Big sliding pictures and the two offers on the right',
    icon: Home,
    preview: '/',
  },
  {
    id: 'headers',
    label: 'Other page headers',
    desc: 'Top banner on Products, Brands, Why Hamel, and Contact',
    icon: Layout,
    preview: '/products',
  },
  {
    id: 'brands',
    label: 'Brands admin',
    desc: 'Toggleable brand tiles + storefront brand filter',
    icon: Building2,
    preview: '/brands',
  },
  {
    id: 'cool-deals',
    label: 'Cool Deals page',
    desc: 'Top banner and deal sections on the Cool Deals page',
    icon: Snowflake,
    preview: '/cool-deals',
  },
  {
    id: 'promo',
    label: 'Custom pages',
    desc: 'Add and design your own pages — sales, campaigns, or info',
    icon: FileText,
    preview: undefined,
  },
] as const;

type TabId = (typeof PAGES)[number]['id'];

function labelForFocus(focusId: string | null): string | null {
  if (!focusId) return null;
  const page = getPromoPages().find((p) => p.id === focusId);
  if (!page) return null;
  return page.navLabel?.trim() || page.title?.trim() || null;
}

export function AdminPagesHub() {
  const [params, setParams] = useSearchParams();
  const [liveLabel, setLiveLabel] = useState<string | null>(null);
  const [, bump] = useState(0);
  const tab = (params.get('tab') as TabId) || 'home';
  const focusId = params.get('focus');
  const active = PAGES.find((p) => p.id === tab) ?? PAGES[0];
  const focusedLabel = liveLabel || labelForFocus(focusId);
  const hasCustomPages = getPromoPages().length > 0;
  const creatingCustomPage = tab === 'promo' && params.get('new') === '1';

  useEffect(() => {
    const refresh = () => {
      bump((n) => n + 1);
      setLiveLabel(labelForFocus(params.get('focus')));
    };
    const onFocus = (e: Event) => {
      const detail = (e as CustomEvent<{ id?: string; label?: string }>).detail;
      if (detail?.label) setLiveLabel(detail.label);
      bump((n) => n + 1);
    };
    window.addEventListener('hamel-promo-pages-updated', refresh);
    window.addEventListener('hamel-promo-focus', onFocus);
    setLiveLabel(labelForFocus(focusId));
    return () => {
      window.removeEventListener('hamel-promo-pages-updated', refresh);
      window.removeEventListener('hamel-promo-focus', onFocus);
    };
  }, [focusId, params]);

  const editingLabel = tab === 'promo' && focusedLabel ? focusedLabel : active.label;

  return (
    <div className="mx-auto max-w-5xl space-y-[18px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className={adminUi.pageIntro}>
          Choose a page to update, or create a brand-new page and design it yourself. For the full
          homepage carousel and page-header banner tools, use{' '}
          <Link to="/admin/banners" className="font-semibold text-[#0ea5e9] hover:underline">
            Banners
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => setParams({ tab: 'promo', new: '1' })}
          className={adminUi.btnPrimary}
        >
          <Plus size={17} strokeWidth={2.2} />
          Add a new page
        </button>
      </div>

      <div>
        <p className="mb-3 text-[13px] font-bold text-[#1e2a38]">Which page are you updating?</p>
        <div className="flex flex-col gap-2.5">
          {PAGES.filter((page) => page.id !== 'promo' || hasCustomPages).map(
            ({ id, label, desc, icon: Icon, preview }) => {
              const selected = tab === id;
              const showingFocusedCustomPage = id === 'promo' && focusedLabel;
              const shownLabel = showingFocusedCustomPage ? focusedLabel : label;
              const shownDesc = showingFocusedCustomPage
                ? 'Your custom page — edit settings and content below'
                : desc;
              return (
                <div
                  key={id}
                  className="flex items-stretch rounded-[14px] border transition-colors"
                  style={{
                    borderColor: selected ? '#bfe6fb' : '#e8eef4',
                    backgroundColor: selected ? '#f0f9ff' : '#fff',
                    boxShadow: '0 1px 2px rgba(30,42,56,0.03)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const next: Record<string, string> = { tab: id };
                      if (focusId) next.focus = focusId;
                      setParams(next);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3.5 px-4 py-3.5 text-left"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        selected ? 'bg-[#0EA5E9] text-white' : 'bg-[#f1f5f9] text-[#7a8899]'
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-bold text-[#1e2a38]">
                        {shownLabel}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-[#7a8899]">{shownDesc}</span>
                    </span>
                    <ChevronRight
                      size={18}
                      className={`shrink-0 ${selected ? 'text-[#0EA5E9]' : 'text-[#d0d8e0]'}`}
                    />
                  </button>
                  {preview ? (
                    <Link
                      to={preview}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 border-l border-[#e8eef4] px-4 text-xs font-semibold text-[#9aa7b5] hover:text-[#0369a1]"
                      title="Preview on site"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={14} />
                      <span className="hidden sm:inline">Preview</span>
                    </Link>
                  ) : null}
                </div>
              );
            }
          )}
        </div>
      </div>

      {active.id !== 'promo' || hasCustomPages || creatingCustomPage ? (
        <div className={`${adminUi.card} p-[22px]`}>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[#9aa7b5]">
            Editing · {editingLabel}
          </p>
          {active.id === 'home' && (
            <div className="mb-5 rounded-xl border border-[#d6ecfb] bg-[#eff8ff] px-4 py-3 text-[13px] text-[#38607a]">
              Tip: the dedicated{' '}
              <Link to="/admin/banners" className="font-bold text-[#0ea5e9] underline">
                Banners
              </Link>{' '}
              page has the full hero carousel, side offers, page headers, and Cool Deals hero
              tools matching the new admin design.
            </div>
          )}
          {active.id === 'home' && <HomepageTab />}
          {active.id === 'headers' && <PageHeadersTab />}
          {active.id === 'brands' && <BrandsTab />}
          {active.id === 'promo' && <PromoPagesTab />}
          {active.id === 'cool-deals' && <CoolDealsTab />}
        </div>
      ) : null}
    </div>
  );
}
