import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, ChevronUp, ExternalLink, Plus, Sparkles, X } from 'lucide-react';
import {
  defaultBanners,
  FEATURED_PRODUCT_LIMIT,
  getBanners,
  saveBanners,
  type FeaturedCollectionConfig,
} from '../../data/banners';
import { useCatalog } from '../../context/CatalogContext';
import {
  fromDatetimeLocalValue,
  isPromoCountdownActive,
  toDatetimeLocalValue,
} from '../../lib/product-promos';
import { resolveStorageImageUrl } from '../../lib/storage';
import { AdminSaveBar } from '../components/AdminSaveBar';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';

function hexForColorInput(value: string): string {
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return '#0EA5E9';
}

function Field({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="mb-2">
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexForColorInput(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded border border-gray-200"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="#0EA5E9"
        />
      </div>
    </div>
  );
}

const EVENT_PRESETS: Array<
  Partial<FeaturedCollectionConfig> & { label: string; title: string; titleHighlight: string }
> = [
  {
    label: 'Cool Summer',
    title: 'COOL',
    titleHighlight: 'SUMMER',
    bgColor: '#0EA5E9',
    titleColor: '#FFFFFF',
    highlightColor: '#FFC107',
    subtitle: 'Beat the heat with our top-selling cooling solutions.',
  },
  {
    label: 'Hot Deals',
    title: 'HOT',
    titleHighlight: 'DEALS',
    bgColor: '#EA580C',
    titleColor: '#FFFFFF',
    highlightColor: '#FFC107',
    subtitle: 'Limited-time savings on best-selling aircons.',
  },
  {
    label: 'Birthday Sale',
    title: 'BIRTHDAY',
    titleHighlight: 'BUNDLE',
    bgColor: '#38BDF8',
    titleColor: '#0C4A6E',
    highlightColor: '#EA580C',
    subtitle: 'Celebrate with exclusive bundles and vouchers.',
  },
  {
    label: 'Winter Sale',
    title: 'WINTER',
    titleHighlight: 'SALE',
    bgColor: '#1E3A5F',
    titleColor: '#FFFFFF',
    highlightColor: '#7DD3FC',
    subtitle: 'Cooler prices for the season — shop selected models.',
  },
];

/** Admin page for the homepage promo event strip (Cool Summer / Birthday Sale / etc.). */
export function AdminPromoEventPage() {
  const { products } = useCatalog();
  const [featured, setFeatured] = useState<FeaturedCollectionConfig>(
    () => getBanners().featuredCollection
  );
  const [productSearch, setProductSearch] = useState('');
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFeatured = (patch: Partial<FeaturedCollectionConfig>) => {
    setFeatured((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const save = () => {
    const store = getBanners();
    void saveBanners({ ...store, featuredCollection: featured });
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2000);
  };

  const selectedProducts = useMemo(() => {
    const ids = featured.productIds ?? [];
    return ids
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [featured.productIds, products]);

  const searchableProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const selected = new Set(featured.productIds ?? []);
    return products
      .filter((p) => !selected.has(p.id))
      .filter((p) => {
        if (!q) return true;
        return (
          p.brand.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [products, featured.productIds, productSearch]);

  const addProduct = (id: string) => {
    const current = featured.productIds ?? [];
    if (current.includes(id) || current.length >= FEATURED_PRODUCT_LIMIT) return;
    updateFeatured({ productIds: [...current, id] });
  };

  const removeProduct = (id: string) => {
    updateFeatured({ productIds: (featured.productIds ?? []).filter((x) => x !== id) });
  };

  const moveProduct = (id: string, dir: -1 | 1) => {
    const list = [...(featured.productIds ?? [])];
    const i = list.indexOf(id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    updateFeatured({ productIds: list });
  };

  const featuredBgPreview =
    resolveStorageImageUrl(featured.bgImageUrl) || featured.bgImageUrl?.trim() || '';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[#0EA5E9]">
            <Sparkles size={18} />
            <span className="text-xs font-bold uppercase tracking-wide">Homepage</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Promo event</h2>
          <p className="mt-1 text-sm text-gray-500">
            Control the homepage strip (Cool Summer, Birthday Sale, Winter Sale, etc.) — title,
            colors, products, countdown, and See All link.
          </p>
        </div>
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
        >
          Preview homepage <ExternalLink size={14} />
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Event settings</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Changes appear on the storefront homepage after you save.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={featured.enabled !== false}
              onChange={(e) => updateFeatured({ enabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            Show on homepage
          </label>
        </div>

        <div
          className="relative mb-5 overflow-hidden rounded-lg px-5 py-5"
          style={{ backgroundColor: featured.bgColor }}
        >
          {featuredBgPreview ? (
            <>
              <div
                className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${featuredBgPreview})` }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundColor: featured.bgColor,
                  opacity:
                    typeof featured.bgImageOverlay === 'number' ? featured.bgImageOverlay : 0.2,
                }}
                aria-hidden
              />
            </>
          ) : null}
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-black tracking-tight sm:text-4xl">
                <span style={{ color: featured.titleColor }}>{featured.title} </span>
                <span style={{ color: featured.highlightColor }}>{featured.titleHighlight}</span>
              </div>
              {featured.subtitle ? (
                <p className="mt-1 text-sm" style={{ color: featured.titleColor, opacity: 0.85 }}>
                  {featured.subtitle}
                </p>
              ) : null}
            </div>
            {featured.countdownEndsAt && isPromoCountdownActive(featured.countdownEndsAt) ? (
              <span className="text-xs font-bold uppercase tracking-wide text-white/90">
                {featured.countdownLabel || 'ENDS IN'} · timer active
              </span>
            ) : null}
          </div>
          <p className="relative z-10 mt-3 text-[11px] text-white/75">
            {selectedProducts.length
              ? `${selectedProducts.length} curated product${selectedProducts.length === 1 ? '' : 's'}`
              : `No products picked — homepage will show the first ${FEATURED_PRODUCT_LIMIT} from the catalog`}
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">Quick event presets</label>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {EVENT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const { label: _label, ...rest } = preset;
                  updateFeatured(rest);
                }}
                className="rounded border px-3 py-2 text-left text-xs font-medium transition hover:opacity-90"
                style={{
                  backgroundColor: preset.bgColor,
                  color: preset.titleColor,
                  borderColor: 'transparent',
                }}
              >
                <span style={{ color: preset.titleColor }}>{preset.title} </span>
                <span style={{ color: preset.highlightColor }}>{preset.titleHighlight}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-x-6 md:grid-cols-2">
          <div>
            <Field label="Title — first word" value={featured.title} onChange={(v) => updateFeatured({ title: v })} />
            <Field
              label="Title — highlighted word"
              value={featured.titleHighlight}
              onChange={(v) => updateFeatured({ titleHighlight: v })}
            />
            <Field
              label="Subtitle"
              value={featured.subtitle || ''}
              onChange={(v) => updateFeatured({ subtitle: v })}
              rows={2}
            />
            <Field
              label="See All button label"
              value={featured.seeAllLabel || ''}
              onChange={(v) => updateFeatured({ seeAllLabel: v })}
            />
            <Field
              label="See All link (e.g. /products or /cool-deals)"
              value={featured.seeAllHref || ''}
              onChange={(v) => updateFeatured({ seeAllHref: v })}
            />
            <label className="mb-3 inline-flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={Boolean(featured.seeAllExternal)}
                onChange={(e) => updateFeatured({ seeAllExternal: e.target.checked })}
                className="rounded border-gray-300"
              />
              Open See All in a new tab
            </label>
          </div>
          <div>
            <ColorField label="Background color" value={featured.bgColor} onChange={(v) => updateFeatured({ bgColor: v })} />
            <div className="mb-3">
              <ImageUrlOrUploadField
                label="Background image (optional)"
                value={featured.bgImageUrl || ''}
                onChange={(v) => updateFeatured({ bgImageUrl: v })}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Upload campaign art or a wave pattern. Color still shows as a tint underneath.
              </p>
            </div>
            {featured.bgImageUrl?.trim() ? (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Image tint strength ({Math.round((featured.bgImageOverlay ?? 0.2) * 100)}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={Math.round((featured.bgImageOverlay ?? 0.2) * 100)}
                  onChange={(e) =>
                    updateFeatured({ bgImageOverlay: Number(e.target.value) / 100 })
                  }
                  className="w-full"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Higher = more of the background color over the image (easier to read titles).
                </p>
              </div>
            ) : null}
            <ColorField label="Title color" value={featured.titleColor} onChange={(v) => updateFeatured({ titleColor: v })} />
            <ColorField
              label="Highlight / accent color"
              value={featured.highlightColor}
              onChange={(v) => updateFeatured({ highlightColor: v })}
            />
            <Field
              label="Countdown label"
              value={featured.countdownLabel || ''}
              onChange={(v) => updateFeatured({ countdownLabel: v })}
            />
            <div className="mb-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Section countdown ends at (optional)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="datetime-local"
                  value={toDatetimeLocalValue(featured.countdownEndsAt)}
                  onChange={(e) =>
                    updateFeatured({ countdownEndsAt: fromDatetimeLocalValue(e.target.value) })
                  }
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                {featured.countdownEndsAt ? (
                  <button
                    type="button"
                    onClick={() => updateFeatured({ countdownEndsAt: undefined })}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Leave empty to hide the timer on the homepage.</p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-600">
              Featured products ({selectedProducts.length}/{FEATURED_PRODUCT_LIMIT})
            </h4>
            {(featured.productIds?.length ?? 0) > 0 ? (
              <button
                type="button"
                onClick={() => updateFeatured({ productIds: [] })}
                className="text-xs text-gray-500 hover:underline"
              >
                Clear list (use catalog default)
              </button>
            ) : null}
          </div>

          {selectedProducts.length > 0 ? (
            <ul className="mb-3 space-y-1.5">
              {selectedProducts.map((p, index) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2"
                >
                  <img src={p.image} alt="" className="h-9 w-9 rounded bg-white object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-gray-800">
                      {p.brand} · {p.model}
                    </p>
                    <p className="text-[10px] text-gray-400">#{index + 1}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => moveProduct(p.id, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-gray-500 hover:bg-white disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProduct(p.id, 1)}
                    disabled={index === selectedProducts.length - 1}
                    className="rounded p-1 text-gray-500 hover:bg-white disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(p.id)}
                    className="rounded p-1 text-red-500 hover:bg-white"
                    aria-label="Remove"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-xs text-gray-500">
              No curated products yet. Homepage will show the first {FEATURED_PRODUCT_LIMIT} catalog
              items until you pick some.
            </p>
          )}

          {(featured.productIds?.length ?? 0) < FEATURED_PRODUCT_LIMIT ? (
            <div>
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search catalog to add…"
                className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-1">
                {searchableProducts.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-gray-400">No matching products</p>
                ) : (
                  searchableProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[#E0F2FE]"
                    >
                      <img src={p.image} alt="" className="h-8 w-8 rounded bg-white object-contain" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-800">
                        {p.brand} · {p.model}
                      </span>
                      <Plus size={14} className="shrink-0 text-[#0EA5E9]" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <AdminSaveBar
        saved={saved}
        onSave={save}
        onReset={() => {
          if (!confirm('Reset promo event to default (Cool Summer)?')) return;
          setFeatured({ ...defaultBanners.featuredCollection });
          setSaved(false);
        }}
      />
    </div>
  );
}
