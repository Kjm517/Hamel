import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Trash2, ChevronDown, ChevronUp, Eye, EyeOff, Wrench } from 'lucide-react';
import {
  getCoolDealsPage,
  saveCoolDealsPage,
  resetCoolDealsPage,
  defaultCoolDealsPage,
  createSection,
  createCardGridSection,
  createVoucherCard,
  createDealCard,
  createProductColumn,
  createBundleItem,
  DEAL_CARD_DEFAULT_COLORS,
  COOL_DEALS_SECTION_LABELS,
  type CoolDealsPageConfig,
  type CoolDealsSection,
  type CoolDealsSectionType,
  type CoolDealsCardGridSection,
  type CoolDealsProductMatrixSection,
  type CoolDealsProductColumn,
  type CoolDealsDealCardItem,
  type CoolDealsPromoStripSection,
  type CoolDealsDealOfDaySection,
  type CoolDealsServiceStickySection,
  type CoolDealsBestSellersSection,
  type CoolDealsFlashDealsSection,
  type CoolDealsFinderSection,
  type CoolDealsFinancingSection,
  type CoolDealsBundlesSection,
  type CoolDealsBrandsSection,
  type CoolDealsRecommendedSection,
  type CoolDealsTrustBarSection,
  type CoolDealsStatsBrandsSection,
  type CoolDealsBundleItem,
} from '../../../data/cool-deals-page';
import { getBanners, saveBanners, defaultBanners, type CoolDealsBannerConfig } from '../../../data/banners';
import { PAGE_BANNER_HEIGHTS } from '../../../components/PageBanner';
import { ImageUrlOrUploadField } from '../../components/ImageUrlOrUploadField';
import { IMAGE_SIZE_GUIDES } from '../../lib/image-size-guides';
import { BannerLinkDestinationField } from '../../components/BannerLinkDestinationField';
import { AmbientEffectFields } from '../../../components/AmbientEffectFields';
import { SortableList } from '../../components/SortableList';
import { AdminSaveBar } from '../../components/AdminSaveBar';
import { AdminColorField } from '../../components/AdminColorField';
import { DealTileSurface } from '../../../components/cool-deals/DealTileSurface';
import { contrastRatio, hexForColorInput } from '../../../lib/color-utils';
import { mediaPathFor, resolveStorageImageUrl } from '../../../lib/storage';
import { PageEditorIntro } from './PageEditorIntro';
import { useAdminConfirm } from '../../components/AdminConfirmDialog';
import { useCatalog } from '../../../context/CatalogContext';
import { findDealCatalogProduct } from '../../../lib/deal-catalog-product';
import { getProductDisplayPrices } from '../../../lib/product-promos';
import type { Product } from '../../../data/products';
import { Link } from 'react-router';

function Field({
  label,
  value,
  onChange,
  rows,
  type = 'text',
  disabled,
  min,
  max,
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  rows?: number;
  type?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {rows ? (
        <textarea
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          min={min}
          max={max}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        />
      )}
      {hint ? <p className="mt-1 text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

/** Number field that lets you type freely, then commits a valid hours value on blur. */
function HoursThresholdField({
  label,
  value,
  fallback,
  onCommit,
  disabled,
  hint,
}: {
  label: string;
  value: number;
  fallback: number;
  onCommit: (hours: number) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const n = Number(draft);
    const next = Number.isFinite(n) && n > 0 ? Math.min(720, Math.round(n)) : fallback;
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        min={1}
        max={720}
        step={1}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      />
      {hint ? <p className="mt-1 text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

function SearchableProductSelect({
  label,
  value,
  onChange,
  onPickProduct,
  allowEmpty,
  emptyLabel = '— None —',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Called with the full product when a catalog item is chosen (not when cleared). */
  onPickProduct?: (product: Product | null) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  const { products } = useCatalog();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    const active = products.filter((p) => p.isActive !== false);
    const q = query.trim().toLowerCase();
    if (!q) return active;
    return active.filter(
      (p) =>
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        `${p.brand} ${p.model}`.toLowerCase().includes(q)
    );
  }, [products, query]);

  const selected = useMemo(
    () => products.find((p) => p.id === value),
    [products, value]
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (id: string) => {
    onChange(id);
    const product = products.find((p) => p.id === id) ?? null;
    onPickProduct?.(product);
    setOpen(false);
    setQuery('');
  };

  const clear = () => {
    onChange('');
    onPickProduct?.(null);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="mb-2" ref={rootRef}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-left flex items-center justify-between gap-2 hover:border-gray-300"
        >
          <span className={selected ? 'text-gray-900 truncate' : 'text-gray-400'}>
            {selected ? `${selected.brand} ${selected.model}` : emptyLabel}
          </span>
          <span className="text-gray-400 text-xs shrink-0">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search brand or model…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <div className="max-h-56 overflow-auto">
              {allowEmpty && (
                <button
                  type="button"
                  onClick={clear}
                  className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                >
                  {emptyLabel}
                </button>
              )}
              {options.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">No products match</div>
              )}
              {options.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick(p.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#E0F2FE] flex items-center gap-2 ${
                    p.id === value ? 'bg-[#F0F9FF] font-semibold text-[#0EA5E9]' : 'text-gray-800'
                  }`}
                >
                  {p.image ? (
                    <img
                      src={resolveStorageImageUrl(p.image) || p.image}
                      alt=""
                      className="w-8 h-8 rounded object-contain bg-gray-50 shrink-0"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded bg-gray-100 shrink-0" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate">{p.brand} {p.model}</span>
                    <span className="block text-[11px] text-gray-400">
                      ₱{(p.priceStart || 0).toLocaleString('en-PH')}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductIdsEditor({
  ids,
  onChange,
  max,
  hps,
  onChangeHps,
}: {
  ids: string[];
  onChange: (ids: string[]) => void;
  /** When set, selecting more than this shows an error and blocks the extra pick. */
  max?: number;
  hps?: Record<string, string>;
  onChangeHps?: (hps: Record<string, string>) => void;
}) {
  const { products } = useCatalog();
  const [query, setQuery] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);
  const options = useMemo(() => {
    const active = products.filter((p) => p.isActive !== false);
    const q = query.trim().toLowerCase();
    if (!q) return active;
    return active.filter(
      (p) =>
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        `${p.brand} ${p.model}`.toLowerCase().includes(q)
    );
  }, [products, query]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const maxAllowed = typeof max === 'number' && max > 0 ? max : undefined;
  const overLimit = maxAllowed != null && ids.length > maxAllowed;

  useEffect(() => {
    if (overLimit) {
      setLimitError(
        `Too many pinned products (${ids.length}). Max is ${maxAllowed}. Uncheck extras or raise Max products.`
      );
    } else {
      setLimitError(null);
    }
  }, [overLimit, ids.length, maxAllowed]);

  return (
    <div className="mb-2 space-y-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Pinned products (order = display)
        {maxAllowed != null ? (
          <span className="ml-1 font-normal text-gray-400">
            · {ids.length}/{maxAllowed}
          </span>
        ) : null}
      </label>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products…"
        className="w-full mb-2 px-3 py-2 text-sm border border-gray-200 rounded-lg"
      />
      <div
        className={`max-h-40 overflow-auto border rounded-lg p-2 space-y-1 ${
          limitError ? 'border-red-300 bg-red-50/40' : 'border-gray-200'
        }`}
      >
        {options.map((p) => {
          const checked = ids.includes(p.id);
          const atCap = maxAllowed != null && !checked && ids.length >= maxAllowed;
          return (
            <label
              key={p.id}
              className={`flex items-center gap-2 text-xs ${atCap ? 'opacity-50' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={atCap}
                onChange={() => {
                  if (checked) {
                    onChange(ids.filter((x) => x !== p.id));
                    if (onChangeHps && hps) {
                      const next = { ...hps };
                      delete next[p.id];
                      onChangeHps(next);
                    }
                    setLimitError(null);
                    return;
                  }
                  if (maxAllowed != null && ids.length >= maxAllowed) {
                    setLimitError(`You can only pin up to ${maxAllowed} products (Max products).`);
                    return;
                  }
                  onChange([...ids, p.id]);
                  if (onChangeHps && p.hp[0]) {
                    onChangeHps({ ...(hps ?? {}), [p.id]: p.hp[0] });
                  }
                  setLimitError(null);
                }}
              />
              {p.brand} {p.model}
            </label>
          );
        })}
        {options.length === 0 && <p className="text-xs text-gray-400 py-2 text-center">No matches</p>}
      </div>
      {limitError ? <p className="text-xs font-medium text-red-600">{limitError}</p> : null}
      {onChangeHps && ids.length > 0 && (
        <div className="rounded-lg border border-gray-100 bg-[#f9fbfd] p-2.5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            HP for ranking (opens product on that size)
          </p>
          {ids.map((id, index) => {
            const p = byId.get(id);
            if (!p) return null;
            const hpOpts = p.hp?.length ? p.hp : [];
            return (
              <div key={id} className="flex items-center gap-2 text-xs">
                <span className="w-5 shrink-0 font-bold text-[#0EA5E9]">#{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-gray-700">
                  {p.brand} {p.model}
                </span>
                <select
                  value={hps?.[id] || ''}
                  onChange={(e) => {
                    const next = { ...(hps ?? {}) };
                    if (e.target.value) next[id] = e.target.value;
                    else delete next[id];
                    onChangeHps(next);
                  }}
                  className="max-w-[110px] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
                >
                  <option value="">All HP (range)</option>
                  {hpOpts.map((hp) => (
                    <option key={hp} value={hp}>
                      {hp}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CoolDealsTab() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [sections, setSections] = useState<CoolDealsPageConfig>(() => getCoolDealsPage());
  const [hero, setHero] = useState<CoolDealsBannerConfig>(() => getBanners().coolDealsBanner);
  const [openId, setOpenId] = useState<string | null>(sections.sections[0]?.id ?? null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutoSave = useRef(true);
  const sectionsRef = useRef(sections);
  const heroRef = useRef(hero);
  sectionsRef.current = sections;
  heroRef.current = hero;

  type SectionPatch = Partial<CoolDealsSection> | ((section: CoolDealsSection) => Partial<CoolDealsSection>);

  const persistNow = useCallback(() => {
    void saveCoolDealsPage(sectionsRef.current);
    void saveBanners({ ...getBanners(), coolDealsBanner: heroRef.current });
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  const queuePersist = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(persistNow, 400);
  }, [persistNow]);

  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }
    queuePersist();
  }, [sections, hero, queuePersist]);

  const patchSection = (id: string, patch: SectionPatch) => {
    setSections((prev) => ({
      sections: prev.sections.map((s) => {
        if (s.id !== id) return s;
        const next = typeof patch === 'function' ? patch(s) : patch;
        return { ...s, ...next } as CoolDealsSection;
      }),
    }));
  };

  const save = () => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistNow();
  };

  const sectionTitle = (s: CoolDealsSection) => {
    if (s.type === 'card-grid') return `${s.headingTitle} (${s.variant})`;
    if (s.type === 'product-matrix' || s.type === 'best-sellers' || s.type === 'flash-deals' || s.type === 'bundles' || s.type === 'brands' || s.type === 'recommended') {
      return s.headingTitle;
    }
    if (s.type === 'cta' || s.type === 'finder' || s.type === 'financing' || s.type === 'deal-of-day' || s.type === 'service-sticky') {
      return s.title.replace(/\n/g, ' ');
    }
    if (s.type === 'promo-strip') return s.badge || COOL_DEALS_SECTION_LABELS[s.type];
    return COOL_DEALS_SECTION_LABELS[s.type];
  };

  return (
    <div className="space-y-6">
      {confirmDialog}
      <PageEditorIntro
        title="Cool Deals page"
        description="Optional photo banner on top, then redesign sections (promo strip, deal of the day, service sticky bar, vouchers…). Drag to reorder. Use the eye icon to hide a section — including the bottom Request a Service bar."
        saveMode="auto"
        previewHref="/cool-deals"
        showDragTip
      />

      <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-3">
        <h3 className="text-sm font-bold text-gray-800">1. Optional photo banner</h3>
        <p className="text-xs text-gray-500">
          Leave empty to use the navy Deal of the Day hero from the sections below (recommended for the new design).
        </p>
        <ImageUrlOrUploadField
          label="Banner photo"
          value={hero.bannerImageUrl}
          onChange={(v) => setHero((h) => ({ ...h, bannerImageUrl: v }))}
          remoteUpload={{ getObjectPath: mediaPathFor('cool-deals') }}
          sizeGuide={IMAGE_SIZE_GUIDES.coolDealsBanner}
        />
        <BannerLinkDestinationField fields={hero} onChange={(p) => setHero((h) => ({ ...h, ...p }))} />
        <AmbientEffectFields
          value={hero}
          accentColor={hero.highlightColor}
          hint="Plays over the Cool Deals hero banner. Set how many seconds it stays, or Continuous."
          onChange={(patch) => setHero((h) => ({ ...h, ...patch }))}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(hero.showTextOverlay)}
            onChange={(e) => setHero((h) => ({ ...h, showTextOverlay: e.target.checked }))}
          />
          Show text on top of banner
        </label>
        {hero.showTextOverlay && (
          <div className="space-y-2">
            <Field
              label="Badge (e.g. LIMITED TIME ONLY!)"
              value={hero.badge || ''}
              onChange={(v) => setHero((h) => ({ ...h, badge: v }))}
            />
            <div className="grid sm:grid-cols-2 gap-2">
              <Field label="Title line 1" value={hero.title} onChange={(v) => setHero((h) => ({ ...h, title: v }))} />
              <Field
                label="Title line 2"
                value={hero.titleHighlight}
                onChange={(v) => setHero((h) => ({ ...h, titleHighlight: v }))}
              />
            </div>
            <Field
              label="Subtitle (Enjoy exclusive…)"
              value={hero.subtitle || ''}
              onChange={(v) => setHero((h) => ({ ...h, subtitle: v }))}
              rows={2}
            />
            <p className="text-[11px] text-gray-500">
              Default: “Enjoy exclusive vouchers and freebies when you buy your new aircon from Hamel!”
            </p>
          </div>
        )}
        {hero.bannerImageUrl && (
          <div className={`relative rounded-lg overflow-hidden w-full ${PAGE_BANNER_HEIGHTS.md}`}>
            <img
              src={resolveStorageImageUrl(hero.bannerImageUrl)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-1 text-sm font-bold text-gray-800">2. Page sections</h3>
        <p className="mb-3 text-xs text-gray-500">Add, reorder, show/hide, or edit each block of the Cool Deals redesign.</p>
        <div className="flex flex-wrap gap-2">
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              let section: CoolDealsSection;
              if (v === 'card-grid-deal') section = createCardGridSection('deal');
              else if (v === 'card-grid') section = createCardGridSection('voucher');
              else section = createSection(v as CoolDealsSectionType);
              setSections((p) => ({ sections: [...p.sections, section] }));
              setOpenId(section.id);
              e.target.value = '';
            }}
          >
            <option value="">+ Add a section…</option>
            <option value="promo-strip">Promo countdown strip</option>
            <option value="deal-of-day">Deal of the Day hero</option>
            <option value="service-sticky">Service sticky bar</option>
            <option value="card-grid">Claimable vouchers</option>
            <option value="best-sellers">Best sellers ranking</option>
            <option value="flash-deals">Flash deals</option>
            <option value="finder">Aircon finder quiz</option>
            <option value="financing">Financing calculator</option>
            <option value="bundles">Value bundles</option>
            <option value="brands">Shop by brand</option>
            <option value="recommended">Recommended products</option>
            <option value="card-grid-deal">Deal tiles</option>
            <option value="product-matrix">Product types & perks</option>
            <option value="trust-bar">Trust icons</option>
            <option value="cta">Contact section</option>
            <option value="stats-brands">Stats & brands</option>
          </select>
        </div>

        <SortableList
          items={sections.sections}
          onReorder={(next) => setSections({ sections: next })}
          renderItem={(section) => {
            const open = openId === section.id;
            return (
              <div className="pr-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : section.id)}
                    className="flex-1 text-left text-sm font-semibold truncate"
                  >
                    {sectionTitle(section)}
                    {!section.enabled && (
                      <span className="ml-2 text-xs font-normal text-amber-600">(hidden)</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => patchSection(section.id, { enabled: !section.enabled })}
                    className="text-gray-500"
                  >
                    {section.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        const ok = await confirm({
                          title: 'Remove this section?',
                          description: 'It will be removed from the Cool Deals page.',
                          confirmLabel: 'Remove',
                          tone: 'danger',
                        });
                        if (!ok) return;
                        setSections((p) => ({
                          sections: p.sections.filter((s) => s.id !== section.id),
                        }));
                      })();
                    }}
                    className="text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                  {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>

                {open && section.type === 'promo-strip' && (
                  <PromoStripEditor section={section} onChange={(p) => patchSection(section.id, p)} />
                )}
                {open && section.type === 'deal-of-day' && (
                  <DealOfDayEditor section={section} onChange={(p) => patchSection(section.id, p)} />
                )}
                {open && section.type === 'service-sticky' && (
                  <ServiceStickyEditor section={section} onChange={(p) => patchSection(section.id, p)} />
                )}
                {open && section.type === 'card-grid' && (
                  <CardGridEditor
                    section={section}
                    onPatch={(p) => patchSection(section.id, (s) => (s.type === 'card-grid' ? { ...s, ...p } : {}))}
                    onPatchDealCard={(cardId, patch) =>
                      patchSection(section.id, (s) => {
                        if (s.type !== 'card-grid') return {};
                        return {
                          dealCards: (s.dealCards ?? []).map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
                        };
                      })
                    }
                  />
                )}
                {open && (section.type === 'best-sellers' || section.type === 'flash-deals' || section.type === 'recommended') && (
                  <CatalogListEditor
                    section={section}
                    onChange={(p) => patchSection(section.id, p)}
                  />
                )}
                {open && section.type === 'finder' && (
                  <FinderEditor section={section} onChange={(p) => patchSection(section.id, p)} />
                )}
                {open && section.type === 'financing' && (
                  <FinancingEditor section={section} onChange={(p) => patchSection(section.id, p)} />
                )}
                {open && section.type === 'bundles' && (
                  <BundlesEditor section={section} onChange={(p) => patchSection(section.id, p)} />
                )}
                {open && section.type === 'brands' && (
                  <BrandsEditor section={section} onChange={(p) => patchSection(section.id, p)} />
                )}
                {open && section.type === 'product-matrix' && (
                  <ProductMatrixEditor section={section} onChange={(p) => patchSection(section.id, p)} />
                )}
                {open && section.type === 'trust-bar' && (
                  <TrustBarEditor section={section} onChange={(p) => patchSection(section.id, p)} />
                )}
                {open && section.type === 'cta' && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <Field label="Title" value={section.title} onChange={(v) => patchSection(section.id, { title: v })} />
                    <Field
                      label="Subtitle"
                      value={section.subtitle}
                      onChange={(v) => patchSection(section.id, { subtitle: v })}
                      rows={2}
                    />
                  </div>
                )}
                {open && section.type === 'stats-brands' && (
                  <StatsBrandsEditor section={section} onChange={(p) => patchSection(section.id, p)} />
                )}
              </div>
            );
          }}
        />
      </div>

      <AdminSaveBar
        saved={saved}
        onSave={save}
        onReset={() => {
          void (async () => {
            const ok = await confirm({
              title: 'Reset Cool Deals page?',
              description: 'Restore the new design defaults and clear the optional photo banner. Custom changes will be lost.',
              confirmLabel: 'Reset',
              tone: 'danger',
            });
            if (!ok) return;
            void resetCoolDealsPage().then(() => {
              setSections(JSON.parse(JSON.stringify(defaultCoolDealsPage)));
              setHero({ ...defaultBanners.coolDealsBanner, bannerImageUrl: '' });
              void saveBanners({
                ...getBanners(),
                coolDealsBanner: { ...defaultBanners.coolDealsBanner, bannerImageUrl: '' },
              });
            });
          })();
        }}
      />
    </div>
  );
}

function PromoStripEditor({
  section,
  onChange,
}: {
  section: CoolDealsPromoStripSection;
  onChange: (p: Partial<CoolDealsPromoStripSection>) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <Field label="Badge" value={section.badge} onChange={(v) => onChange({ badge: v })} />
      <Field label="Message" value={section.text} onChange={(v) => onChange({ text: v })} rows={2} />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={section.showCountdown}
          onChange={(e) => onChange({ showCountdown: e.target.checked })}
        />
        Show end-of-day countdown
      </label>
    </div>
  );
}

function DealOfDayEditor({
  section,
  onChange,
}: {
  section: CoolDealsDealOfDaySection;
  onChange: (p: Partial<CoolDealsDealOfDaySection>) => void;
}) {
  const { products } = useCatalog();
  const linked = findDealCatalogProduct(section, products);
  const liveQty = linked?.stockQty;
  const liveCap = linked?.stockCapacity;
  const needsLink = Boolean(linked && !section.productId);

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <Field label="Eyebrow" value={section.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
      <Field
        label="Headline (use line break for two lines)"
        value={section.title}
        onChange={(v) => onChange({ title: v })}
        rows={2}
      />
      <Field label="Subtitle" value={section.subtitle} onChange={(v) => onChange({ subtitle: v })} rows={3} />
      <div className="grid sm:grid-cols-2 gap-2">
        <Field label="Main button text" value={section.primaryCta} onChange={(v) => onChange({ primaryCta: v })} />
        <Field label="Second button text" value={section.secondaryCta} onChange={(v) => onChange({ secondaryCta: v })} />
      </div>
      <Field
        label="Secondary link (#finder or URL)"
        value={section.secondaryHref}
        onChange={(v) => onChange({ secondaryHref: v })}
      />
      <Field label="Trust line" value={section.trustLine} onChange={(v) => onChange({ trustLine: v })} rows={2} />
      <SearchableProductSelect
        label="Deal product"
        value={section.productId || ''}
        allowEmpty
        emptyLabel="— Choose a product —"
        onChange={(v) => onChange({ productId: v || undefined })}
        onPickProduct={(product) => {
          if (!product) {
            onChange({ productId: undefined });
            return;
          }
          const prices = getProductDisplayPrices(product);
          const save = Math.max(0, prices.listStart - prices.saleStart);
          onChange({
            productId: product.id,
            brand: product.brand.toUpperCase(),
            productName: product.model,
            imageUrl: product.image,
            priceNow: prices.saleStart || product.priceStart || undefined,
            priceWas: prices.listStart > prices.saleStart ? prices.listStart : undefined,
            tag: section.tag || 'INVERTER',
            badge: save > 0 ? `SAVE ₱${save.toLocaleString('en-PH')}` : section.badge,
          });
        }}
      />
      {section.productId && (
        <p className="text-[11px] text-gray-500 -mt-1 mb-2">
          Selected: <span className="font-semibold text-gray-700">{section.brand} {section.productName}</span>
          {' · '}Prices and image fill from the catalog (you can still tweak below).
        </p>
      )}
      {needsLink && linked && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-[12px] text-sky-950 mb-1">
          <p className="font-semibold">Matched catalog product (not linked yet)</p>
          <p className="mt-1 text-[11px]">
            Found <strong>{linked.brand} {linked.model}</strong>
            {liveQty !== undefined ? (
              <>
                {' '}
                with <strong>{liveQty}</strong> in stock
              </>
            ) : null}
            . Link it so Cool Deals always uses this product’s live inventory.
          </p>
          <button
            type="button"
            className="mt-2 rounded-md bg-[#0554C2] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0449a8]"
            onClick={() => {
              const prices = getProductDisplayPrices(linked);
              const save = Math.max(0, prices.listStart - prices.saleStart);
              onChange({
                productId: linked.id,
                brand: linked.brand.toUpperCase(),
                productName: linked.model,
                imageUrl: linked.image || section.imageUrl,
                priceNow: prices.saleStart || linked.priceStart || section.priceNow,
                priceWas:
                  prices.listStart > prices.saleStart
                    ? prices.listStart
                    : section.priceWas,
                badge: save > 0 ? `SAVE ₱${save.toLocaleString('en-PH')}` : section.badge,
              });
            }}
          >
            Link “{linked.model}”
          </button>
        </div>
      )}
      <ImageUrlOrUploadField
        label="Deal image"
        value={section.imageUrl || ''}
        onChange={(v) => onChange({ imageUrl: v })}
        remoteUpload={{ getObjectPath: mediaPathFor('cool-deals') }}
        sizeGuide={IMAGE_SIZE_GUIDES.coolDealsCard}
      />
      <div className="grid sm:grid-cols-3 gap-2">
        <Field
          label="Price now"
          type="number"
          value={section.priceNow ?? ''}
          onChange={(v) => onChange({ priceNow: v === '' ? undefined : Number(v) })}
        />
        <Field
          label="Price was"
          type="number"
          value={section.priceWas ?? ''}
          onChange={(v) => onChange({ priceWas: v === '' ? undefined : Number(v) })}
        />
        <Field
          label="Months (0%)"
          type="number"
          value={section.months ?? 36}
          onChange={(v) => onChange({ months: Number(v) || 36 })}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <Field label="Save badge" value={section.badge || ''} onChange={(v) => onChange({ badge: v })} />
        <Field label="Tag chip" value={section.tag || ''} onChange={(v) => onChange({ tag: v })} />
      </div>
      {linked ? (
        liveQty !== undefined ? (
          <div className="rounded-lg border border-[#DDE6F0] bg-[#FBFBFD] px-3 py-2.5 text-[12px] text-[#535763]">
            <p className="font-semibold text-[#0E1C3A]">Live inventory (from product)</p>
            <p className="mt-1">
              Units left: <span className="font-bold text-[#E3790B]">{liveQty}</span>
              {liveCap != null ? (
                <>
                  {' '}
                  · Capacity: <span className="font-semibold">{liveCap}</span>
                </>
              ) : null}
              {!section.productId ? (
                <span className="text-amber-700"> · Link the product above to keep this in sync</span>
              ) : null}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              Edit in{' '}
              <Link
                to={`/admin/products/${linked.id}/edit`}
                className="font-semibold text-[#0554C2] hover:underline"
              >
                Admin → Products → {linked.model}
              </Link>
              . Cool Deals “Only N left” follows this automatically.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-900">
            <p className="font-semibold">Deal product linked — stock not set yet</p>
            <p className="mt-1 text-[11px]">
              Open{' '}
              <Link
                to={`/admin/products/${linked.id}/edit`}
                className="font-semibold text-[#0554C2] hover:underline"
              >
                {linked.model}
              </Link>
              , set <strong>Units in stock</strong>, then click <strong>Save</strong>.
            </p>
          </div>
        )
      ) : (
        <>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-900 mb-1">
            <p className="font-semibold">No deal product linked</p>
            <p className="mt-1 text-[11px]">
              Choose a <strong>Deal product</strong> above, set its <strong>Units in stock</strong>, and{' '}
              <strong>Save</strong> the product. Until then, fallback numbers below are used (currently
              “Only {section.stockLeft ?? 7} left”).
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Field
              label="Units left (fallback)"
              type="number"
              value={section.stockLeft ?? 7}
              onChange={(v) => {
                const stockLeft = Math.max(0, Number(v) || 0);
                const capacity = Math.max(section.stockCapacity || 20, stockLeft || 1);
                const soldPct = Math.round(((capacity - Math.min(stockLeft, capacity)) / capacity) * 100);
                onChange({
                  stockLeft,
                  stockCapacity: capacity,
                  stockLabel: stockLeft === 0 ? 'Sold out' : `Only ${stockLeft} left`,
                  stockPct: Math.min(100, Math.max(5, soldPct)),
                });
              }}
            />
            <Field
              label="Stock capacity (fallback)"
              type="number"
              value={section.stockCapacity ?? 20}
              onChange={(v) => {
                const stockLeft = Math.max(0, section.stockLeft ?? 7);
                const stockCapacity = Math.max(stockLeft || 1, Number(v) || 20);
                const soldPct = Math.round(
                  ((stockCapacity - Math.min(stockLeft, stockCapacity)) / stockCapacity) * 100
                );
                onChange({
                  stockCapacity,
                  stockLabel: stockLeft === 0 ? 'Sold out' : `Only ${stockLeft} left`,
                  stockPct: Math.min(100, Math.max(5, soldPct)),
                });
              }}
            />
          </div>
        </>
      )}
      <Field
        label="Inquire button"
        value={section.inquireCta || ''}
        onChange={(v) => onChange({ inquireCta: v })}
      />
      <div className="space-y-2.5 rounded-[11px] border border-[#fee2e2] bg-[#fff7f7] p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#ff1a1a]">
          Urgent red timer (#ff1a1a)
        </p>
        <p className="text-[11px] text-gray-400">
          Counts down to the end of each day. Same rules as Flash Deals.
        </p>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#516171]">
          <input
            type="checkbox"
            checked={section.forceBlink === true}
            onChange={(e) => onChange({ forceBlink: e.target.checked })}
          />
          Always use urgent red
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#516171]">
          <input
            type="checkbox"
            checked={section.blinkWhenUrgent !== false}
            onChange={(e) => onChange({ blinkWhenUrgent: e.target.checked })}
            disabled={section.forceBlink === true}
          />
          Auto urgent red when ending soon
        </label>
        <HoursThresholdField
          label="Auto urgent when under (hours)"
          value={section.urgencyThresholdHours ?? 24}
          fallback={24}
          disabled={section.forceBlink === true || section.blinkWhenUrgent === false}
          onCommit={(hours) => onChange({ urgencyThresholdHours: hours })}
          hint={
            section.forceBlink
              ? 'Turn off “Always use urgent red” to use this threshold.'
              : section.blinkWhenUrgent === false
                ? 'Enable “Auto urgent red when ending soon” to use this threshold.'
                : 'Timer boxes turn #ff1a1a only when remaining time is under this many hours.'
          }
        />
        <p className="text-[11px] text-gray-400">
          {section.forceBlink
            ? 'Always red is on — timer stays #ff1a1a until the day ends.'
            : 'Turns #ff1a1a only when remaining time is under this many hours. Above that it stays normal.'}
        </p>
      </div>
    </div>
  );
}

function ServiceStickyEditor({
  section,
  onChange,
}: {
  section: CoolDealsServiceStickySection;
  onChange: (p: Partial<CoolDealsServiceStickySection>) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t space-y-3">
      <p className="text-xs text-[#7a8899]">
        Fixed bottom bar on Cool Deals. Toggle the eye icon to show or hide it. Edit copy and colors
        below.
      </p>
      <Field label="Eyebrow" value={section.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
      <Field label="Title" value={section.title} onChange={(v) => onChange({ title: v })} />
      <Field
        label="Subtitle"
        value={section.subtitle}
        onChange={(v) => onChange({ subtitle: v })}
        rows={2}
      />
      <Field label="Button label" value={section.ctaLabel} onChange={(v) => onChange({ ctaLabel: v })} />
      <div className="grid sm:grid-cols-2 gap-2">
        <AdminColorField
          label="Bar gradient start"
          value={section.bgFrom}
          onChange={(v) => onChange({ bgFrom: v })}
        />
        <AdminColorField
          label="Bar gradient end"
          value={section.bgTo}
          onChange={(v) => onChange({ bgTo: v })}
        />
        <AdminColorField
          label="Title color"
          value={section.titleColor}
          onChange={(v) => onChange({ titleColor: v })}
        />
        <AdminColorField
          label="Subtitle color"
          value={section.subtitleColor}
          onChange={(v) => onChange({ subtitleColor: v })}
        />
        <AdminColorField
          label="Accent / wrench"
          value={section.accentColor}
          onChange={(v) => onChange({ accentColor: v })}
        />
        <AdminColorField
          label="Button background"
          value={section.ctaBg}
          onChange={(v) => onChange({ ctaBg: v })}
        />
        <AdminColorField
          label="Button text"
          value={section.ctaText}
          onChange={(v) => onChange({ ctaText: v })}
        />
      </div>
      <div
        className="rounded-xl p-3.5 flex items-center gap-3 flex-wrap border border-white/20"
        style={{
          background: `linear-gradient(135deg, ${section.bgFrom} 0%, ${section.bgTo} 100%)`,
        }}
      >
        <span
          className="grid h-10 w-10 place-items-center rounded-lg"
          style={{ background: 'rgba(255,255,255,0.16)', color: section.accentColor }}
        >
          <Wrench size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: section.accentColor }}>
            {section.eyebrow || 'Eyebrow'}
          </div>
          <div className="text-sm font-extrabold" style={{ color: section.titleColor }}>
            {section.title || 'Title'}
          </div>
          <div className="text-[11px]" style={{ color: section.subtitleColor }}>
            {section.subtitle || 'Subtitle'}
          </div>
        </div>
        <span
          className="rounded-lg px-3 py-2 text-xs font-extrabold"
          style={{ background: section.ctaBg, color: section.ctaText }}
        >
          {section.ctaLabel || 'Button'}
        </span>
      </div>
    </div>
  );
}

function CatalogListEditor({
  section,
  onChange,
}: {
  section: CoolDealsBestSellersSection | CoolDealsFlashDealsSection | CoolDealsRecommendedSection;
  onChange: (p: Record<string, unknown>) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      {'eyebrow' in section && (
        <Field label="Eyebrow" value={section.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
      )}
      <Field label="Heading" value={section.headingTitle} onChange={(v) => onChange({ headingTitle: v })} />
      {'headingSubtitle' in section && (
        <Field
          label="Subtitle"
          value={section.headingSubtitle}
          onChange={(v) => onChange({ headingSubtitle: v })}
        />
      )}
      {'seeAllHref' in section && (
        <Field label="See all URL" value={section.seeAllHref} onChange={(v) => onChange({ seeAllHref: v })} />
      )}
      {'showCountdown' in section && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={section.showCountdown}
            onChange={(e) => onChange({ showCountdown: e.target.checked })}
          />
          Show countdown
        </label>
      )}
      {section.type === 'flash-deals' && section.showCountdown && (
        <div className="space-y-2.5 rounded-[11px] border border-[#fee2e2] bg-[#fff7f7] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#ff1a1a]">
            Urgent red timer (#ff1a1a)
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sale ends at</label>
            <input
              type="datetime-local"
              value={section.endsAt ?? ''}
              onChange={(e) => onChange({ endsAt: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Leave empty to count down to the end of each day.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#516171]">
            <input
              type="checkbox"
              checked={section.forceBlink === true}
              onChange={(e) => onChange({ forceBlink: e.target.checked })}
            />
            Always use urgent red
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#516171]">
            <input
              type="checkbox"
              checked={section.blinkWhenUrgent !== false}
              onChange={(e) => onChange({ blinkWhenUrgent: e.target.checked })}
              disabled={section.forceBlink === true}
            />
            Auto urgent red when ending soon
          </label>
          <HoursThresholdField
            label="Auto urgent when under (hours)"
            value={section.urgencyThresholdHours ?? 72}
            fallback={72}
            disabled={section.forceBlink === true || section.blinkWhenUrgent === false}
            onCommit={(hours) => onChange({ urgencyThresholdHours: hours })}
            hint={
              section.forceBlink
                ? 'Turn off “Always use urgent red” to use this threshold.'
                : section.blinkWhenUrgent === false
                  ? 'Enable “Auto urgent red when ending soon” to use this threshold.'
                  : 'Boxes turn #ff1a1a only when remaining time is under this many hours (e.g. 12). Above that they stay blue.'
            }
          />
          <p className="text-[11px] text-gray-400">
            {section.forceBlink
              ? 'Always red is on — timer boxes stay #ff1a1a until the sale ends.'
              : 'This does not change the countdown numbers — only when they turn red vs blue. Set “Sale ends at” to change the timer length.'}
          </p>
        </div>
      )}
      <div className="mb-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Product source</label>
        <select
          value={section.source}
          onChange={(e) => onChange({ source: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
        >
          <option value="catalog">Auto from catalog</option>
          <option value="manual">Manual product list</option>
        </select>
      </div>
      <Field
        label="Max products"
        type="number"
        value={section.limit}
        onChange={(v) => onChange({ limit: Number(v) || 4 })}
      />
      {section.source === 'manual' && (
        <ProductIdsEditor
          ids={section.productIds}
          onChange={(productIds) => onChange({ productIds })}
          max={section.limit}
          {...(section.type === 'best-sellers'
            ? {
                hps: section.productHps ?? {},
                onChangeHps: (productHps: Record<string, string>) => onChange({ productHps }),
              }
            : {})}
        />
      )}
      {section.type === 'best-sellers' && section.source === 'catalog' && (
        <p className="text-[11px] text-gray-500">
          Switch to Manual product list to pin ranking order and choose an HP per unit (opens that size on
          the product page).
        </p>
      )}
    </div>
  );
}

function FinderEditor({
  section,
  onChange,
}: {
  section: CoolDealsFinderSection;
  onChange: (p: Partial<CoolDealsFinderSection>) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <Field label="Eyebrow" value={section.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
      <Field label="Title" value={section.title} onChange={(v) => onChange({ title: v })} />
      <Field label="Subtitle" value={section.subtitle} onChange={(v) => onChange({ subtitle: v })} rows={3} />
    </div>
  );
}

function FinancingEditor({
  section,
  onChange,
}: {
  section: CoolDealsFinancingSection;
  onChange: (p: Partial<CoolDealsFinancingSection>) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <Field label="Eyebrow" value={section.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
      <Field label="Title" value={section.title} onChange={(v) => onChange({ title: v })} />
      <Field label="Body" value={section.body} onChange={(v) => onChange({ body: v })} rows={3} />
      <Field
        label="Bullets (one per line)"
        value={section.bullets.join('\n')}
        onChange={(v) =>
          onChange({
            bullets: v
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        rows={3}
      />
      <Field label="Button text" value={section.ctaLabel} onChange={(v) => onChange({ ctaLabel: v })} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field
          label="Min months"
          type="number"
          value={section.minMonths}
          onChange={(v) => onChange({ minMonths: Number(v) || 3 })}
        />
        <Field
          label="Max months"
          type="number"
          value={section.maxMonths}
          onChange={(v) => onChange({ maxMonths: Number(v) || 36 })}
        />
        <Field
          label="Step"
          type="number"
          value={section.stepMonths}
          onChange={(v) => onChange({ stepMonths: Number(v) || 3 })}
        />
        <Field
          label="Default"
          type="number"
          value={section.defaultMonths}
          onChange={(v) => onChange({ defaultMonths: Number(v) || 24 })}
        />
      </div>
      <p className="text-xs text-gray-500 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2">
        Calculator options are automatic: all catalog units plus Value bundles from this page. No manual model list
        needed.
      </p>
    </div>
  );
}

function BundlesEditor({
  section,
  onChange,
}: {
  section: CoolDealsBundlesSection;
  onChange: (p: Partial<CoolDealsBundlesSection>) => void;
}) {
  const patchItem = (id: string, patch: Partial<CoolDealsBundleItem>) => {
    onChange({ items: section.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  };

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <Field label="Eyebrow" value={section.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
      <Field label="Heading" value={section.headingTitle} onChange={(v) => onChange({ headingTitle: v })} />
      <Field
        label="Subtitle"
        value={section.headingSubtitle}
        onChange={(v) => onChange({ headingSubtitle: v })}
        rows={2}
      />
      <SortableList
        items={section.items}
        onReorder={(items) => onChange({ items })}
        renderItem={(item) => (
          <div className="pr-3 py-2 space-y-2">
            <Field label="Name" value={item.name} onChange={(v) => patchItem(item.id, { name: v })} />
            <Field label="Subtitle" value={item.sub} onChange={(v) => patchItem(item.id, { sub: v })} />
            <ImageUrlOrUploadField
              label="Image"
              value={item.imageUrl}
              onChange={(v) => patchItem(item.id, { imageUrl: v })}
              remoteUpload={{ getObjectPath: mediaPathFor('cool-deals') }}
              sizeGuide={IMAGE_SIZE_GUIDES.coolDealsCard}
            />
            <div className="grid sm:grid-cols-2 gap-2">
              <Field
                label="Price now"
                type="number"
                value={item.priceNow}
                onChange={(v) => patchItem(item.id, { priceNow: Number(v) || 0 })}
              />
              <Field
                label="Price was"
                type="number"
                value={item.priceWas}
                onChange={(v) => patchItem(item.id, { priceWas: Number(v) || 0 })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(item.featured)}
                onChange={(e) => patchItem(item.id, { featured: e.target.checked })}
              />
              Featured / popular
            </label>
            <Field label="Badge" value={item.badge || ''} onChange={(v) => patchItem(item.id, { badge: v })} />
            <Field
              label="Includes (one per line)"
              value={item.includes.join('\n')}
              onChange={(v) =>
                patchItem(item.id, {
                  includes: v
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              rows={4}
            />
            <Field
              label="Button text"
              value={item.ctaLabel || ''}
              onChange={(v) => patchItem(item.id, { ctaLabel: v })}
            />
            <button
              type="button"
              className="text-xs text-red-500"
              onClick={() => onChange({ items: section.items.filter((x) => x.id !== item.id) })}
            >
              Remove bundle
            </button>
          </div>
        )}
      />
      <button
        type="button"
        className="text-xs font-semibold text-[#0EA5E9]"
        onClick={() => onChange({ items: [...section.items, createBundleItem()] })}
      >
        + Add bundle
      </button>
    </div>
  );
}

function BrandsEditor({
  section,
  onChange,
}: {
  section: CoolDealsBrandsSection;
  onChange: (p: Partial<CoolDealsBrandsSection>) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <Field label="Eyebrow" value={section.eyebrow} onChange={(v) => onChange({ eyebrow: v })} />
      <Field label="Heading" value={section.headingTitle} onChange={(v) => onChange({ headingTitle: v })} />
      <Field
        label="Brand names (one per line; leave empty for default logos)"
        value={(section.brandNames || []).join('\n')}
        onChange={(v) =>
          onChange({
            brandNames: v
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        rows={6}
      />
    </div>
  );
}

function TrustBarEditor({
  section,
  onChange,
}: {
  section: CoolDealsTrustBarSection;
  onChange: (p: Partial<CoolDealsTrustBarSection>) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      {(section.items || []).map((item, i) => (
        <div key={item.id} className="rounded-lg border p-2 grid sm:grid-cols-3 gap-2">
          <Field
            label="Title"
            value={item.title}
            onChange={(v) => {
              const items = section.items.map((x, j) => (j === i ? { ...x, title: v } : x));
              onChange({ items });
            }}
          />
          <Field
            label="Subtitle"
            value={item.sub}
            onChange={(v) => {
              const items = section.items.map((x, j) => (j === i ? { ...x, sub: v } : x));
              onChange({ items });
            }}
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
            <select
              value={item.icon}
              onChange={(e) => {
                const items = section.items.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x));
                onChange({ items });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            >
              <option value="award">Award</option>
              <option value="wrench">Wrench</option>
              <option value="shield">Shield</option>
              <option value="package">Package</option>
              <option value="headset">Headset</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsBrandsEditor({
  section,
  onChange,
}: {
  section: CoolDealsStatsBrandsSection;
  onChange: (p: Partial<CoolDealsStatsBrandsSection>) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <Field
        label="Brands label"
        value={section.brandsLabel}
        onChange={(v) => onChange({ brandsLabel: v })}
      />
      {(section.stats || []).map((st, i) => (
        <div key={st.id} className="grid sm:grid-cols-2 gap-2">
          <Field
            label="Value"
            value={st.value}
            onChange={(v) => {
              const stats = section.stats.map((x, j) => (j === i ? { ...x, value: v } : x));
              onChange({ stats });
            }}
          />
          <Field
            label="Label"
            value={st.label}
            onChange={(v) => {
              const stats = section.stats.map((x, j) => (j === i ? { ...x, label: v } : x));
              onChange({ stats });
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ProductMatrixEditor({
  section,
  onChange,
}: {
  section: CoolDealsProductMatrixSection;
  onChange: (p: Partial<CoolDealsProductMatrixSection>) => void;
}) {
  const patchColumn = (colId: string, patch: Partial<CoolDealsProductColumn>) => {
    onChange({
      columns: section.columns.map((c) => (c.id === colId ? { ...c, ...patch } : c)),
    });
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      <Field label="Section title" value={section.headingTitle} onChange={(v) => onChange({ headingTitle: v })} />
      <Field
        label="Subtitle"
        value={section.headingSubtitle || ''}
        onChange={(v) => onChange({ headingSubtitle: v })}
      />
      <Field label="Footnote" value={section.footnote || ''} onChange={(v) => onChange({ footnote: v })} />
      <div className="grid sm:grid-cols-2 gap-2">
        <Field
          label="Mechanics link text"
          value={section.mechanicsLinkText || ''}
          onChange={(v) => onChange({ mechanicsLinkText: v })}
        />
        <Field
          label="Mechanics link URL"
          value={section.mechanicsLinkHref || ''}
          onChange={(v) => onChange({ mechanicsLinkHref: v })}
        />
      </div>

      <p className="text-xs font-semibold text-gray-600">Product columns — drag the handle to reorder</p>
      <SortableList
        items={section.columns}
        onReorder={(columns) => onChange({ columns })}
        renderItem={(col) => (
          <div className="pr-3 py-2 space-y-2">
            <Field label="Name" value={col.name} onChange={(v) => patchColumn(col.id, { name: v })} />
            <Field label="Description" value={col.sub} onChange={(v) => patchColumn(col.id, { sub: v })} />
            <ImageUrlOrUploadField
              label="Image"
              value={col.imageUrl}
              onChange={(v) => patchColumn(col.id, { imageUrl: v })}
              remoteUpload={{ getObjectPath: mediaPathFor('cool-deals') }}
              sizeGuide={IMAGE_SIZE_GUIDES.coolDealsCard}
            />
            <BannerLinkDestinationField
              label="Card navigation"
              fields={col}
              onChange={(patch) => patchColumn(col.id, patch)}
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Perks (one per line)</label>
              <textarea
                value={col.perks.join('\n')}
                onChange={(e) =>
                  patchColumn(col.id, {
                    perks: e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <button
              type="button"
              onClick={() => onChange({ columns: section.columns.filter((c) => c.id !== col.id) })}
              className="text-xs text-red-500 font-medium"
            >
              Remove column
            </button>
          </div>
        )}
      />
      <button
        type="button"
        onClick={() => onChange({ columns: [...section.columns, createProductColumn()] })}
        className="text-xs font-semibold text-[#0EA5E9]"
      >
        + Add product column
      </button>
    </div>
  );
}

function DealTileColorFields({
  card,
  onPatch,
}: {
  card: CoolDealsDealCardItem;
  onPatch: (patch: Partial<CoolDealsDealCardItem>) => void;
}) {
  const bg = card.bgColor ?? DEAL_CARD_DEFAULT_COLORS.bg;
  const bodyLowContrast = Boolean(card.bodyColor && contrastRatio(card.bodyColor, bg) < 3);
  const ctaLowContrast = Boolean(card.ctaColor && contrastRatio(card.ctaColor, bg) < 3);

  return (
    <div className="rounded-lg bg-gray-50 p-3 space-y-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">Tile colors</p>
      <div className="mb-3 rounded-lg border border-gray-200 overflow-hidden">
        <DealTileSurface card={card} compact />
      </div>
      {(bodyLowContrast || ctaLowContrast) && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 mb-2">
          {bodyLowContrast && 'Description color is hard to read on this background. '}
          {ctaLowContrast && 'Button color is hard to read on this background. '}
        </p>
      )}
      <AdminColorField
        label="Background"
        value={card.bgColor ?? DEAL_CARD_DEFAULT_COLORS.bg}
        onChange={(v) => onPatch({ bgColor: v })}
      />
      <AdminColorField
        label="Title"
        value={card.titleColor ?? DEAL_CARD_DEFAULT_COLORS.title}
        onChange={(v) => onPatch({ titleColor: v })}
      />
      <AdminColorField
        label="Description"
        value={card.bodyColor ?? DEAL_CARD_DEFAULT_COLORS.body}
        onChange={(v) => onPatch({ bodyColor: v })}
      />
      <AdminColorField
        label="Button / link"
        value={card.ctaColor ?? DEAL_CARD_DEFAULT_COLORS.cta}
        onChange={(v) => onPatch({ ctaColor: v })}
      />
      <AdminColorField
        label="Accent watermark"
        value={card.accentColor ?? DEAL_CARD_DEFAULT_COLORS.accent}
        onChange={(v) => onPatch({ accentColor: v })}
      />
    </div>
  );
}

function CardGridEditor({
  section,
  onPatch,
  onPatchDealCard,
}: {
  section: CoolDealsCardGridSection;
  onPatch: (p: Partial<CoolDealsCardGridSection>) => void;
  onPatchDealCard: (cardId: string, patch: Partial<CoolDealsDealCardItem>) => void;
}) {
  const patchVoucherCard = (cardId: string, patch: Partial<(typeof section.cards)[0]>) => {
    onPatch({
      cards: section.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
    });
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {section.variant === 'voucher' && (
        <Field
          label="Eyebrow"
          value={section.headingEyebrow || ''}
          onChange={(v) => onPatch({ headingEyebrow: v })}
        />
      )}
      <Field label="Section title" value={section.headingTitle} onChange={(v) => onPatch({ headingTitle: v })} />
      <Field
        label="Subtitle"
        value={section.headingSubtitle || ''}
        onChange={(v) => onPatch({ headingSubtitle: v })}
        rows={2}
      />
      {section.variant === 'deal' && (
        <div className="rounded-lg border border-gray-100 p-3 space-y-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">Section heading colors</p>
          <AdminColorField
            label="Heading"
            value={section.headingColor ?? '#0C4A6E'}
            onChange={(v) => onPatch({ headingColor: v })}
          />
          <AdminColorField
            label="Subtitle"
            value={section.headingSubtitleColor ?? '#6B7280'}
            onChange={(v) => onPatch({ headingSubtitleColor: v })}
          />
        </div>
      )}
      {section.variant === 'voucher' ? (
        <>
          <button
            type="button"
            onClick={() => onPatch({ cards: [...section.cards, createVoucherCard()] })}
            className="text-xs font-semibold text-[#0EA5E9]"
          >
            + Add card
          </button>
          {section.cards.map((card) => (
            <div key={card.id} className="rounded-lg border p-3 text-sm space-y-1">
              <Field label="Title" value={card.title} onChange={(v) => patchVoucherCard(card.id, { title: v })} />
              <Field
                label="Description"
                value={card.body}
                onChange={(v) => patchVoucherCard(card.id, { body: v })}
                rows={2}
              />
              <Field
                label="Platform voucher code (optional)"
                value={card.voucherCode || ''}
                onChange={(v) =>
                  patchVoucherCard(card.id, { voucherCode: v.trim().toUpperCase() || undefined })
                }
              />
              <p className="text-[11px] text-gray-500 -mt-1">
                Link to Admin → Vouchers (e.g. COOL1500). Claimed cards stay claimed and show under
                Platform Voucher on product/inquire.
              </p>
              <ImageUrlOrUploadField
                label="Image"
                value={card.imageUrl}
                onChange={(v) => patchVoucherCard(card.id, { imageUrl: v })}
                remoteUpload={{ getObjectPath: mediaPathFor('cool-deals') }}
                sizeGuide={IMAGE_SIZE_GUIDES.coolDealsCard}
              />
              <input
                type="color"
                value={hexForColorInput(card.color)}
                onChange={(e) => patchVoucherCard(card.id, { color: e.target.value })}
              />
              <BannerLinkDestinationField
                label="Card navigation"
                fields={card}
                onChange={(patch) => patchVoucherCard(card.id, patch)}
              />
              <button
                type="button"
                className="text-xs text-red-500"
                onClick={() => onPatch({ cards: section.cards.filter((c) => c.id !== card.id) })}
              >
                Remove
              </button>
            </div>
          ))}
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500">Deal tiles — drag the handle to reorder.</p>
          <SortableList
            items={section.dealCards ?? []}
            onReorder={(dealCards) => onPatch({ dealCards })}
            renderItem={(card) => (
              <div className="pr-3 py-2 space-y-2">
                <Field label="Title" value={card.title} onChange={(v) => onPatchDealCard(card.id, { title: v })} />
                <Field
                  label="Description"
                  value={card.body}
                  onChange={(v) => onPatchDealCard(card.id, { body: v })}
                  rows={2}
                />
                <Field label="Button text" value={card.cta} onChange={(v) => onPatchDealCard(card.id, { cta: v })} />
                <BannerLinkDestinationField
                  label="Tile navigation"
                  fields={card}
                  onChange={(patch) => onPatchDealCard(card.id, patch)}
                />
                <ImageUrlOrUploadField
                  label="Background image (optional)"
                  value={card.imageUrl || ''}
                  onChange={(v) => onPatchDealCard(card.id, { imageUrl: v || undefined })}
                  remoteUpload={{ getObjectPath: mediaPathFor('cool-deals') }}
                  sizeGuide={IMAGE_SIZE_GUIDES.coolDealsDealBg}
                />
                <Field
                  label="Accent text (e.g. 0%)"
                  value={card.accent || ''}
                  onChange={(v) => onPatchDealCard(card.id, { accent: v || undefined })}
                />
                <DealTileColorFields card={card} onPatch={(p) => onPatchDealCard(card.id, p)} />
                <button
                  type="button"
                  onClick={() => onPatch({ dealCards: (section.dealCards ?? []).filter((c) => c.id !== card.id) })}
                  className="text-xs text-red-500 font-medium"
                >
                  Remove tile
                </button>
              </div>
            )}
          />
          <button
            type="button"
            onClick={() => onPatch({ dealCards: [...(section.dealCards ?? []), createDealCard()] })}
            className="text-xs font-semibold text-[#0EA5E9]"
          >
            + Add tile
          </button>
        </>
      )}
    </div>
  );
}
