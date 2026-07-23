import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, ChevronUp, ExternalLink, Plus, X } from 'lucide-react';
import {
  defaultBanners,
  FEATURED_PRODUCT_LIMIT,
  getBanners,
  loadBanners,
  saveBanners,
  type FeaturedCollectionConfig,
} from '../../data/banners';
import { useCatalog } from '../../context/CatalogContext';
import {
  fromDatetimeLocalValue,
  isPromoCountdownActive,
  toDatetimeLocalValue,
} from '../../lib/product-promos';
import { storefrontProducts } from '../../lib/catalog-product';
import { mediaPathFor, resolveStorageImageUrl } from '../../lib/storage';
import { AdminSaveBar } from '../components/AdminSaveBar';
import { AdminToggle } from '../components/AdminToggle';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { IMAGE_SIZE_GUIDES } from '../lib/image-size-guides';
import {
  PROMO_ANIMATION_OPTIONS,
  normalizePromoAnimation,
} from '../../lib/promo-animations';
import { AmbientEffectFields } from '../../components/AmbientEffectFields';
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

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
    <label className="block">
      <span className={adminUi.label}>{label}</span>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className={adminUi.textarea}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={adminUi.input}
        />
      )}
    </label>
  );
}

function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 text-center">
      <input
        type="color"
        value={hexForColorInput(value)}
        onChange={(e) => onChange(e.target.value)}
        className="h-[34px] w-full cursor-pointer rounded-lg border border-[#d6e2ee] bg-transparent p-0"
        aria-label={label}
      />
      <span className="mt-1 block text-[10.5px] text-[#9aa7b5]">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-[#e4ebf2] bg-[#f7fafd] px-1.5 py-1 text-center font-mono text-[10px] text-[#516171]"
        placeholder="#0EA5E9"
      />
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
    ambientEffect: 'cool-mist',
    ambientIntensity: 'medium',
    ambientDurationSec: 10,
    ambientDirection: 'down',
  },
  {
    label: 'Hot Deals',
    title: 'HOT',
    titleHighlight: 'DEALS',
    bgColor: '#EA580C',
    titleColor: '#FFFFFF',
    highlightColor: '#FFC107',
    subtitle: 'Limited-time savings on best-selling aircons.',
    ambientEffect: 'sparkles',
    ambientIntensity: 'medium',
    ambientDurationSec: 10,
    ambientDirection: 'down',
  },
  {
    label: 'Birthday Sale',
    title: 'BIRTHDAY',
    titleHighlight: 'BUNDLE',
    bgColor: '#38BDF8',
    titleColor: '#0C4A6E',
    highlightColor: '#EA580C',
    subtitle: 'Celebrate with exclusive bundles and vouchers.',
    ambientEffect: 'balloons',
    ambientIntensity: 'medium',
    ambientDurationSec: 15,
    ambientDirection: 'up',
  },
  {
    label: 'Winter Sale',
    title: 'WINTER',
    titleHighlight: 'SALE',
    bgColor: '#1E3A5F',
    titleColor: '#FFFFFF',
    highlightColor: '#7DD3FC',
    subtitle: 'Cooler prices for the season — shop selected models.',
    ambientEffect: 'snow',
    ambientIntensity: 'medium',
    ambientDurationSec: 12,
    ambientDirection: 'down',
  },
];

/** Admin page for the homepage promo event strip (Cool Summer / Birthday Sale / etc.). */
export function AdminPromoEventPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const { products } = useCatalog();
  const [featured, setFeatured] = useState<FeaturedCollectionConfig>(
    () => getBanners().featuredCollection
  );
  const [productSearch, setProductSearch] = useState('');
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutoSave = useRef(true);
  const featuredRef = useRef(featured);
  featuredRef.current = featured;

  useEffect(() => {
    let cancelled = false;
    void loadBanners().then((store) => {
      if (cancelled) return;
      skipAutoSave.current = true;
      setFeatured(store.featuredCollection);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistNow = () => {
    const store = getBanners();
    void saveBanners({ ...store, featuredCollection: featuredRef.current });
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2000);
  };

  const updateFeatured = (patch: Partial<FeaturedCollectionConfig>) => {
    setFeatured((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(persistNow, 450);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [featured]);

  const save = () => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistNow();
  };

  const catalogDefaultProducts = useMemo(
    () => storefrontProducts(products).slice(0, FEATURED_PRODUCT_LIMIT),
    [products]
  );
  const usesCatalogDefault = (featured.productIds?.length ?? 0) === 0;

  const selectedProducts = useMemo(() => {
    if (usesCatalogDefault) return catalogDefaultProducts;
    const ids = featured.productIds ?? [];
    return ids
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [usesCatalogDefault, catalogDefaultProducts, featured.productIds, products]);

  const searchableProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const selected = new Set(selectedProducts.map((p) => p.id));
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
  }, [products, selectedProducts, productSearch]);

  const addProduct = (id: string) => {
    const current = usesCatalogDefault
      ? catalogDefaultProducts.map((p) => p.id)
      : featured.productIds ?? [];
    if (current.includes(id) || current.length >= FEATURED_PRODUCT_LIMIT) return;
    updateFeatured({ productIds: [...current, id] });
  };

  const removeProduct = (id: string) => {
    const current = usesCatalogDefault
      ? catalogDefaultProducts.map((p) => p.id)
      : featured.productIds ?? [];
    updateFeatured({ productIds: current.filter((x) => x !== id) });
  };

  const moveProduct = (id: string, dir: -1 | 1) => {
    const list = [
      ...(usesCatalogDefault
        ? catalogDefaultProducts.map((p) => p.id)
        : featured.productIds ?? []),
    ];
    const i = list.indexOf(id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    updateFeatured({ productIds: list });
  };

  const featuredBgPreview =
    resolveStorageImageUrl(featured.bgImageUrl) || featured.bgImageUrl?.trim() || '';
  const countdownActive =
    Boolean(featured.countdownEndsAt) && isPromoCountdownActive(featured.countdownEndsAt);

  return (
    <div className="mx-auto max-w-[940px] space-y-5">
      {confirmDialog}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className={adminUi.pageIntro}>
          The featured sale strip on the homepage. Change the title, colors, products, countdown,
          and the “See all” button.
        </p>
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className={adminUi.btnGhost}
        >
          Preview homepage <ExternalLink size={14} />
        </Link>
      </div>

      <div className={`${adminUi.card} p-[22px]`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="m-0 text-[15.5px] font-bold text-[#1e2a38]">Event settings</h3>
            <p className="mt-0.5 text-[12.5px] text-[#9aa7b5]">
              Changes appear on the storefront homepage after you save.
            </p>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-[#516171]">
            <span>Show on homepage</span>
            <AdminToggle
              checked={featured.enabled !== false}
              onChange={(enabled) => updateFeatured({ enabled })}
              label="Show on homepage"
            />
          </div>
        </div>

        <div
          className="relative mb-5 overflow-hidden rounded-[14px] px-[26px] py-[26px]"
          style={{
            background: featuredBgPreview
              ? featured.bgColor
              : `linear-gradient(120deg, ${featured.bgColor}, ${featured.bgColor}cc)`,
            backgroundColor: featured.bgColor,
          }}
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
          {countdownActive ? (
            <span className="absolute right-[22px] top-5 z-10 text-[11px] font-bold uppercase tracking-[0.05em] text-white/90">
              {featured.countdownLabel || 'Ends in'} · timer active
            </span>
          ) : null}
          <div className="relative z-10">
            <div className="text-[36px] font-black leading-none tracking-[-0.02em]">
              <span style={{ color: featured.titleColor }}>{featured.title} </span>
              <span style={{ color: featured.highlightColor }}>{featured.titleHighlight}</span>
            </div>
            {featured.subtitle ? (
              <p className="mt-2 text-[13.5px]" style={{ color: featured.titleColor, opacity: 0.85 }}>
                {featured.subtitle}
              </p>
            ) : null}
            <p className="mt-3 text-[11px] text-white/75">
              {usesCatalogDefault
                ? `Automatically showing the first ${selectedProducts.length} active catalog products`
                : `${selectedProducts.length} curated product${selectedProducts.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        <div className="mb-[18px]">
          <div className="mb-2 text-xs font-semibold text-[#9aa7b5]">Quick event presets</div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {EVENT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const { label: _label, ...rest } = preset;
                  updateFeatured(rest);
                }}
                className="rounded-[11px] border-2 border-transparent p-3 text-left transition hover:opacity-90"
                style={{
                  backgroundColor: preset.bgColor,
                  color: preset.titleColor,
                }}
              >
                <span className="text-[13.5px] font-extrabold" style={{ color: preset.titleColor }}>
                  {preset.title}{' '}
                </span>
                <span
                  className="text-[13.5px] font-extrabold"
                  style={{ color: preset.highlightColor }}
                >
                  {preset.titleHighlight}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-x-[22px] gap-y-[18px] md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Field
              label="Title — first word"
              value={featured.title}
              onChange={(v) => updateFeatured({ title: v })}
            />
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
            <div>
              <label className="block">
                <span className={adminUi.label}>Countdown ends at</span>
                <input
                  type="datetime-local"
                  value={toDatetimeLocalValue(featured.countdownEndsAt)}
                  onChange={(e) =>
                    updateFeatured({ countdownEndsAt: fromDatetimeLocalValue(e.target.value) })
                  }
                  className={adminUi.input}
                />
              </label>
              {featured.countdownEndsAt ? (
                <button
                  type="button"
                  onClick={() => updateFeatured({ countdownEndsAt: undefined })}
                  className="mt-1.5 text-xs text-red-500 hover:underline"
                >
                  Clear
                </button>
              ) : null}
              <p className="mt-1 text-[11px] text-[#9aa7b5]">
                Sets the live days / hours / mins / secs timer under the promo title. Leave empty to
                hide.
              </p>
            </div>
            {featured.countdownEndsAt ? (
              <div className="rounded-[11px] border border-[#fee2e2] bg-[#fff7f7] p-3 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#ff1a1a]">
                  Urgent red timer (#ff1a1a)
                </p>
                <div className="flex items-center justify-between gap-3 text-[13px] font-semibold text-[#516171]">
                  <span>Always use urgent red</span>
                  <AdminToggle
                    checked={featured.forceUrgentRed === true}
                    onChange={(forceUrgentRed) => updateFeatured({ forceUrgentRed })}
                    label="Always use urgent red"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-[13px] font-semibold text-[#516171]">
                  <span>Auto urgent red when ending soon</span>
                  <AdminToggle
                    checked={featured.urgentWhenEndingSoon !== false}
                    onChange={(urgentWhenEndingSoon) => updateFeatured({ urgentWhenEndingSoon })}
                    label="Auto urgent red when ending soon"
                    disabled={featured.forceUrgentRed === true}
                  />
                </div>
                <label className="block">
                  <span className={adminUi.label}>Auto urgent when under (hours)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={featured.urgencyThresholdHours ?? 72}
                    onChange={(e) =>
                      updateFeatured({
                        urgencyThresholdHours: Math.max(1, Number(e.target.value) || 72),
                      })
                    }
                    className={adminUi.input}
                    disabled={featured.forceUrgentRed === true}
                  />
                </label>
                <p className="text-[11px] text-[#9aa7b5]">
                  {featured.forceUrgentRed
                    ? 'Always red is on — timer boxes stay #ff1a1a for this post until the countdown ends.'
                    : 'e.g. 24 = boxes turn #ff1a1a only under 24 hours left. Above that they stay normal.'}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <span className={adminUi.label}>Colors</span>
              <div className="mt-2 flex gap-2.5">
                <ColorSwatch
                  label="Background"
                  value={featured.bgColor}
                  onChange={(v) => updateFeatured({ bgColor: v })}
                />
                <ColorSwatch
                  label="Title"
                  value={featured.titleColor}
                  onChange={(v) => updateFeatured({ titleColor: v })}
                />
                <ColorSwatch
                  label="Accent"
                  value={featured.highlightColor}
                  onChange={(v) => updateFeatured({ highlightColor: v })}
                />
              </div>
            </div>

            <AmbientEffectFields
              value={featured}
              accentColor={featured.highlightColor}
              hint="Plays over the homepage promo strip when visitors land. Set how many seconds it stays, or Continuous."
              onChange={updateFeatured}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-x-[22px] gap-y-3 border-t border-[#eef3f8] pt-4 md:grid-cols-2">
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
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-[#516171]">
            <span>Open See All in a new tab</span>
            <AdminToggle
              checked={Boolean(featured.seeAllExternal)}
              onChange={(seeAllExternal) => updateFeatured({ seeAllExternal })}
              label="Open See All in a new tab"
            />
          </div>
          <Field
            label="Countdown label"
            value={featured.countdownLabel || ''}
            onChange={(v) => updateFeatured({ countdownLabel: v })}
          />
          <div>
            <ImageUrlOrUploadField
              label="Background image (optional)"
              value={featured.bgImageUrl || ''}
              onChange={(v) => updateFeatured({ bgImageUrl: v })}
              remoteUpload={{ getObjectPath: mediaPathFor('promo-events') }}
              sizeGuide={IMAGE_SIZE_GUIDES.promoEvent}
            />
            <p className="mt-1 text-[11px] text-[#9aa7b5]">
              Upload campaign art or a wave pattern. Color still shows as a tint underneath.
            </p>
          </div>
          <div>
            <label className="block">
              <span className={adminUi.label}>Section animation</span>
              <select
                value={normalizePromoAnimation(featured.animation)}
                onChange={(e) =>
                  updateFeatured({
                    animation: e.target.value as FeaturedCollectionConfig['animation'],
                  })
                }
                className={adminUi.select}
              >
                {PROMO_ANIMATION_OPTIONS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.desc}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {featured.bgImageUrl?.trim() ? (
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-[#516171]">
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
              <p className="mt-1 text-[11px] text-[#9aa7b5]">
                Higher = more of the background color over the image (easier to read titles).
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-[18px] border-t border-[#eef3f8] pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className={adminUi.sectionLabel}>
              Featured products ({selectedProducts.length} / {FEATURED_PRODUCT_LIMIT})
            </h4>
            {usesCatalogDefault ? (
              <button
                type="button"
                onClick={() =>
                  updateFeatured({ productIds: catalogDefaultProducts.map((product) => product.id) })
                }
                className="text-xs font-medium text-[#0EA5E9] hover:underline"
              >
                Customize automatic list
              </button>
            ) : (
              <button
                type="button"
                onClick={() => updateFeatured({ productIds: [] })}
                className="text-xs text-gray-500 hover:underline"
              >
                Clear list (use catalog default)
              </button>
            )}
          </div>

          {usesCatalogDefault ? (
            <p className="mb-3 text-xs text-[#9aa7b5]">
              Showing the first active products from the catalog. Customize to lock this list and
              change its order.
            </p>
          ) : null}

          {selectedProducts.length > 0 ? (
            <div className="mb-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
              {selectedProducts.map((p, index) => (
                <div
                  key={p.id}
                  className="rounded-[11px] border border-[#e8eef4] p-3 text-center"
                >
                  <img
                    src={p.image}
                    alt=""
                    className="mx-auto h-14 w-14 rounded bg-white object-contain"
                  />
                  <div className="mt-1.5 truncate text-xs font-bold text-[#1e2a38]">{p.brand}</div>
                  <div className="truncate text-[11px] text-[#9aa7b5]">{p.model}</div>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveProduct(p.id, -1)}
                      disabled={index === 0}
                      className="rounded p-1 text-gray-500 hover:bg-[#f7fafd] disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(p.id, 1)}
                      disabled={index === selectedProducts.length - 1}
                      className="rounded p-1 text-gray-500 hover:bg-[#f7fafd] disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(p.id)}
                      className="rounded p-1 text-red-500 hover:bg-[#f7fafd]"
                      aria-label="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-3 text-xs text-[#9aa7b5]">
              No curated products yet. Homepage will show the first {FEATURED_PRODUCT_LIMIT} catalog
              items until you pick some.
            </p>
          )}

          {selectedProducts.length < FEATURED_PRODUCT_LIMIT ? (
            <div>
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search catalog to add…"
                className={`${adminUi.input} mb-2`}
              />
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[#eef3f8] p-1">
                {searchableProducts.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-[#9aa7b5]">No matching products</p>
                ) : (
                  searchableProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[#E0F2FE]"
                    >
                      <img src={p.image} alt="" className="h-8 w-8 rounded bg-white object-contain" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#1e2a38]">
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
          void (async () => {
            const ok = await confirm({
              title: 'Reset promo event?',
              description: 'Restore the default Cool Summer settings. Unsaved customizations will be lost.',
              confirmLabel: 'Reset',
              tone: 'danger',
            });
            if (!ok) return;
            setFeatured({ ...defaultBanners.featuredCollection });
            setSaved(false);
          })();
        }}
      />
    </div>
  );
}
