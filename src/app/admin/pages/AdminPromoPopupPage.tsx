import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  defaultSitePromoPopups,
  emptyPromoPopup,
  loadSitePromoPopups,
  PROMO_POPUP_FREQUENCY_LABELS,
  PROMO_POPUP_PAGE_SCOPE_LABELS,
  saveSitePromoPopups,
  type PromoPopupFrequency,
  type PromoPopupLayout,
  type PromoPopupPageScope,
  type PromoPopupPurpose,
  type SitePromoPopupItem,
  type SitePromoPopupsConfig,
} from '../../data/site-promo-popup';
import {
  PROMO_ANIMATION_OPTIONS,
  normalizePromoAnimation,
  promoAnimationClass,
  type PromoAnimationStyle,
} from '../../lib/promo-animations';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { SortableList } from '../components/SortableList';
import { useCatalog } from '../../context/CatalogContext';
import { isStorefrontProduct } from '../../lib/catalog-product';

const LAYOUTS: { id: PromoPopupLayout; label: string; hint: string }[] = [
  { id: 'centered', label: 'PM-A · Centered · announcement', hint: 'Centered message with image or mascot' },
  { id: 'split', label: 'PM-B · Split · product image', hint: 'Image left, campaign details right' },
  { id: 'coupon', label: 'PM-C · Coupon ticket', hint: 'Ticket-style welcome gift' },
  { id: 'poster', label: 'PM-D · Full image ad', hint: 'Large uploaded creative with an optional CTA' },
];

const PURPOSES: { id: PromoPopupPurpose; label: string; hint: string }[] = [
  { id: 'voucher', label: 'Voucher / deal', hint: 'Share a copyable promo code' },
  { id: 'product', label: 'Product spotlight', hint: 'Send shoppers to a catalog product' },
  { id: 'announcement', label: 'Announcement', hint: 'Share a service, event, or store update' },
];

const PATH_PRESETS = ['/', '/cool-deals', '/products', '/brands', '/about', '/contact'];

const IMAGE_UPLOAD_GUIDES: Record<
  PromoPopupLayout,
  { label: string; hint: string; detail: string }
> = {
  poster: {
    label: 'Poster image or MP4 video',
    hint: 'Images: maximum 1582 × 2048 px (portrait) · images up to 25 MB · MP4 up to 300 MB.',
    detail:
      'This matches the supplied poster style. Use this maximum size or a smaller image with the same tall portrait proportion. MP4 videos play muted and loop. Keep important text away from the top-right corner for the close button.',
  },
  split: {
    label: 'Product image',
    hint: 'Recommended: 800 × 1200 px (2:3 portrait) · up to 25 MB.',
    detail:
      'Use a clean product photo with the unit centered. This image fills the narrow left panel, so detailed text should go in the headline and body fields instead.',
  },
  centered: {
    label: 'Image / mascot',
    hint: 'Recommended: 800 × 800 px (1:1 square) · up to 25 MB.',
    detail:
      'The image appears in a circular frame. Keep the subject centered and avoid text near the edges.',
  },
  coupon: {
    label: 'Coupon ticket',
    hint: 'This layout does not display an uploaded image.',
    detail:
      'Use the voucher code, headline, and body fields for the offer. Choose Full image ad if you need to display a complete promotional artwork.',
  },
};

/** Mirrors the storefront popup shapes so layout choices are visible before saving. */
function PopupLayoutPreview({ popup }: { popup: SitePromoPopupItem }) {
  const anim = promoAnimationClass(popup.animation);
  const showCode = popup.purpose === 'voucher' && Boolean(popup.code);
  const eyebrow =
    popup.purpose === 'product'
      ? 'Featured product'
      : popup.purpose === 'announcement'
        ? 'Hamel update'
        : '⚡ Flash deal ends soon';

  if (popup.layout === 'poster') {
    return (
      <div className={`mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl bg-white shadow-lg ${anim}`}>
        {popup.imageUrl ? (
          <div className="relative aspect-[791/1024] w-full overflow-hidden bg-slate-900">
            {popup.mediaType === 'video' ? (
              <video
                src={popup.imageUrl}
                className="block h-full w-full object-contain"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={popup.imageUrl}
                alt={popup.headline || 'Promotion'}
                className="block h-full w-full object-contain"
              />
            )}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center bg-[#0EA5E9] p-4 text-center text-sm font-black text-white">
            Upload a full campaign image
          </div>
        )}
        {(popup.headline || popup.body) && (
          <div className="px-4 pt-3 text-center">
            {popup.headline && <h3 className="text-lg font-black text-gray-900">{popup.headline}</h3>}
            {popup.body && <p className="mt-1 line-clamp-2 text-xs text-gray-600">{popup.body}</p>}
          </div>
        )}
        <div className="p-3">
          <span className="flex w-full items-center justify-center rounded-full bg-[#0EA5E9] py-2 text-xs font-bold text-white">
            {popup.ctaLabel || 'Learn more'}
          </span>
        </div>
      </div>
    );
  }

  if (popup.layout === 'split') {
    return (
      <div className={`mx-auto flex w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg ${anim}`}>
        <div className="relative hidden min-h-[220px] w-2/5 bg-[#0EA5E9] sm:block">
          {popup.imageUrl ? (
            <img src={popup.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-3 text-center text-xs font-black text-white">
              FLASH DEAL
            </div>
          )}
        </div>
        <div className="relative min-w-0 flex-1 p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-orange-500">
            {eyebrow}
          </span>
          <h3 className="mt-1 text-lg font-black leading-tight text-gray-900">
            {popup.headline || 'Up to 20% OFF'}
          </h3>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-gray-600">
            {popup.body || 'Select aircon models · this week only'}
          </p>
          {showCode ? (
            <div className="mt-3 rounded-md border border-dashed border-[#0EA5E9] bg-[#F0F9FF] px-2.5 py-1.5">
              <span className="font-mono text-sm font-black text-gray-900">{popup.code}</span>
            </div>
          ) : null}
          <span className="mt-3 flex w-full items-center justify-center rounded-full bg-[#0EA5E9] py-2 text-xs font-bold text-white">
            {popup.ctaLabel || 'Claim & Shop'}
          </span>
        </div>
      </div>
    );
  }

  if (popup.layout === 'coupon' && popup.purpose === 'voucher') {
    return (
      <div className={`mx-auto w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-lg ${anim}`}>
        <div className="bg-gradient-to-br from-[#0EA5E9] to-[#0369A1] px-4 py-5 text-white">
          <span className="text-[9px] font-bold uppercase tracking-widest text-sky-100">
            Hamel welcome gift
          </span>
          <h3 className="mt-2 text-xl font-black leading-tight">{popup.headline || 'Up to 20% OFF'}</h3>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-sky-50">
            {popup.body || 'Select aircon models · this week only'}
          </p>
        </div>
        <div className="border-t border-dashed border-gray-300 px-4 py-3.5">
          <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500">Use code</span>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-mono text-lg font-black text-gray-900">{popup.code || 'COOL1500'}</span>
            <span className="rounded-full border border-[#0EA5E9] px-2.5 py-1 text-[10px] font-bold text-[#0EA5E9]">
              Copy
            </span>
          </div>
          <span className="mt-3 flex w-full items-center justify-center rounded-full bg-amber-400 py-2 text-xs font-bold text-gray-900">
            {popup.ctaLabel || 'Redeem Now'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-lg ${anim}`}>
      <div className="bg-[#0EA5E9] px-4 pb-5 pt-4 text-center text-white">
        {popup.imageUrl ? (
          <img
            src={popup.imageUrl}
            alt=""
            className="mx-auto mb-2.5 h-16 w-16 rounded-full object-cover ring-4 ring-white/30"
          />
        ) : (
          <div className="mx-auto mb-2.5 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-black text-[#0EA5E9]">
            H
          </div>
        )}
        <h3 className="text-xl font-black">{popup.headline || 'Up to 20% OFF'}</h3>
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-sky-50">
          {popup.body || 'Select aircon models · this week only'}
        </p>
      </div>
      <div className="p-3.5">
        {showCode ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-[#0EA5E9] bg-[#F0F9FF] px-3 py-2">
            <span className="font-mono text-sm font-black text-gray-900">{popup.code}</span>
            <span className="text-[10px] font-bold text-[#0EA5E9]">Copy</span>
          </div>
        ) : null}
        <span className="mt-2.5 flex w-full items-center justify-center rounded-full bg-[#0EA5E9] py-2 text-xs font-bold text-white">
          {popup.ctaLabel || 'Shop the sale'}
        </span>
        <span className="mt-1.5 block text-center text-[10px] text-gray-500">
          {popup.dismissLabel || 'No thanks, maybe later'}
        </span>
      </div>
    </div>
  );
}

export function AdminPromoPopupPage() {
  const { products } = useCatalog();
  const [draft, setDraft] = useState<SitePromoPopupsConfig>(defaultSitePromoPopups);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [pathDraft, setPathDraft] = useState('');
  const storefrontProducts = useMemo(() => products.filter(isStorefrontProduct), [products]);

  useEffect(() => {
    void loadSitePromoPopups().then((cfg) => {
      setDraft(cfg);
      setSelectedId(cfg.popups[0]?.id ?? null);
    });
  }, []);

  const selected =
    draft.popups.find((p) => p.id === selectedId) ?? draft.popups[0] ?? null;
  const orderedPopups = useMemo(
    () => draft.popups.slice().sort((a, b) => a.priority - b.priority),
    [draft.popups]
  );
  const selectedQueuePosition = selected
    ? orderedPopups.findIndex((popup) => popup.id === selected.id) + 1
    : 0;

  const patch = (id: string, next: Partial<SitePromoPopupItem>) => {
    setDraft((prev) => ({
      popups: prev.popups.map((p) => (p.id === id ? { ...p, ...next } : p)),
    }));
  };

  const reorderPopups = (popups: SitePromoPopupItem[]) => {
    setDraft({
      popups: popups.map((popup, index) => ({
        ...popup,
        priority: index + 1,
      })),
    });
  };

  const setPurpose = (purpose: PromoPopupPurpose) => {
    if (!selected) return;
    patch(selected.id, {
      purpose,
      layout: purpose === 'voucher' ? 'coupon' : 'poster',
      code: purpose === 'voucher' ? selected.code : '',
      productId: purpose === 'product' ? selected.productId : undefined,
    });
  };

  const selectProduct = (productId: string) => {
    if (!selected) return;
    const product = storefrontProducts.find((item) => item.id === productId);
    if (!product) return;

    patch(selected.id, {
      purpose: 'product',
      productId: product.id,
      layout: 'poster',
      code: '',
      headline: `${product.brand} ${product.model}`,
      body: product.description || `${product.category} · ${product.hp.join(', ')}`,
      imageUrl: product.image,
      mediaType: 'image',
      ctaLabel: 'View product',
      ctaHref: `/product/${encodeURIComponent(product.id)}`,
    });
  };

  const addPopup = () => {
    const item = emptyPromoPopup({
      id: `popup-${Date.now()}`,
      name: `Promo ${draft.popups.length + 1}`,
      priority: draft.popups.length + 1,
      enabled: true,
    });
    setDraft((prev) => ({ popups: [...prev.popups, item] }));
    setSelectedId(item.id);
  };

  const removePopup = (id: string) => {
    setDraft((prev) => {
      const popups = prev.popups.filter((p) => p.id !== id);
      return { popups };
    });
    setSelectedId((cur) => {
      if (cur !== id) return cur;
      const remaining = draft.popups.filter((p) => p.id !== id);
      return remaining[0]?.id ?? null;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const invalid = draft.popups.find(
        (p) => p.pageScope === 'selected' && p.pagePaths.length === 0
      );
      if (invalid) {
        setError(
          `"${invalid.name}" is set to selected pages but no paths were added.`
        );
        return;
      }
      await saveSitePromoPopups({
        popups: draft.popups.map((p) => ({
          ...p,
          animation: normalizePromoAnimation(p.animation),
        })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const pickAnimation = (id: PromoAnimationStyle) => {
    if (!selected) return;
    patch(selected.id, { animation: id });
    setPreviewKey((k) => k + 1);
  };

  const addPath = (raw: string) => {
    if (!selected) return;
    let path = raw.trim();
    if (!path) return;
    if (!path.startsWith('/')) path = `/${path}`;
    if (selected.pagePaths.includes(path)) return;
    patch(selected.id, { pagePaths: [...selected.pagePaths, path] });
    setPathDraft('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promo pop-ups</h2>
          <p className="text-sm text-gray-600">
            Create voucher offers, product spotlights, and store announcements. Choose when each
            shows — first visit, every visit, homepage only, or selected pages. When several match,
            they show one after another (lowest priority number first).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addPopup}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add popup
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-amber-500 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          Popup settings saved.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3">
          <p className="px-1 text-xs font-bold uppercase tracking-wide text-gray-500">
            Popups ({draft.popups.length})
          </p>
          {draft.popups.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs text-gray-500">No popups yet.</p>
          ) : (
            <>
              <p className="px-1 text-[11px] text-gray-500">Drag the handle to set popup priority.</p>
              <SortableList
                items={orderedPopups}
                onReorder={reorderPopups}
                rowClassName="!border-transparent !bg-transparent"
                renderItem={(p, index) => (
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm ${
                      selected?.id === p.id
                        ? 'border-[#0EA5E9] bg-[#E0F2FE] font-semibold text-[#0369A1]'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block truncate">{p.name || p.headline || 'Untitled'}</span>
                    <span className="mt-0.5 block text-[10px] font-normal text-gray-500">
                      {p.enabled ? 'On' : 'Off'} · P{index + 1} ·{' '}
                      {PROMO_POPUP_PAGE_SCOPE_LABELS[p.pageScope]}
                    </span>
                  </button>
                )}
              />
            </>
          )}
        </div>

        {!selected ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
            Add a popup to configure content and show conditions.
          </div>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* Content / rules — scrolls independently of preview */}
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <input
                    type="checkbox"
                    checked={selected.enabled}
                    onChange={(e) => patch(selected.id, { enabled: e.target.checked })}
                  />
                  Enabled
                </label>
                <button
                  type="button"
                  onClick={() => removePopup(selected.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>

              <label className="block text-sm">
                <span className="font-medium text-gray-700">Admin name</span>
                <input
                  value={selected.name}
                  onChange={(e) => patch(selected.id, { name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>

              <div className="space-y-3 rounded-lg border border-sky-100 bg-[#F0F9FF] p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[#0369A1]">
                  When to show
                </p>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Frequency</span>
                  <select
                    value={selected.frequency}
                    onChange={(e) =>
                      patch(selected.id, {
                        frequency: e.target.value as PromoPopupFrequency,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    {(Object.keys(PROMO_POPUP_FREQUENCY_LABELS) as PromoPopupFrequency[]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {PROMO_POPUP_FREQUENCY_LABELS[key]}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Pages</span>
                  <select
                    value={selected.pageScope}
                    onChange={(e) =>
                      patch(selected.id, {
                        pageScope: e.target.value as PromoPopupPageScope,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    {(Object.keys(PROMO_POPUP_PAGE_SCOPE_LABELS) as PromoPopupPageScope[]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {PROMO_POPUP_PAGE_SCOPE_LABELS[key]}
                        </option>
                      )
                    )}
                  </select>
                </label>
                {selected.pageScope === 'selected' && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {PATH_PRESETS.map((path) => (
                        <button
                          key={path}
                          type="button"
                          onClick={() => addPath(path)}
                          className="rounded-full border border-[#BAE6FD] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#0369A1] hover:bg-[#E0F2FE]"
                        >
                          + {path === '/' ? 'Home' : path}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={pathDraft}
                        onChange={(e) => setPathDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addPath(pathDraft);
                          }
                        }}
                        placeholder="/custom-path"
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => addPath(pathDraft)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Add
                      </button>
                    </div>
                    {selected.pagePaths.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {selected.pagePaths.map((path) => (
                          <li
                            key={path}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-mono text-xs text-gray-800 ring-1 ring-gray-200"
                          >
                            {path}
                            <button
                              type="button"
                              onClick={() =>
                                patch(selected.id, {
                                  pagePaths: selected.pagePaths.filter((p) => p !== path),
                                })
                              }
                              className="text-gray-400 hover:text-red-600"
                              aria-label={`Remove ${path}`}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <span className="block text-sm font-medium text-gray-700">Queue priority</span>
                    <span className="mt-1 block text-lg font-bold text-[#0369A1]">P{selectedQueuePosition}</span>
                    <span className="mt-1 block text-[11px] text-gray-500">
                      Drag this popup in the left queue to change its order.
                    </span>
                  </div>
                  <label className="block text-sm">
                    <span className="font-medium text-gray-700">Delay (ms)</span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={selected.delayMs}
                      onChange={(e) =>
                        patch(selected.id, {
                          delayMs: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                    />
                  </label>
                </div>
              </div>

              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Campaign type</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {PURPOSES.map((purpose) => (
                  <button
                    key={purpose.id}
                    type="button"
                    onClick={() => setPurpose(purpose.id)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm ${
                      selected.purpose === purpose.id
                        ? 'border-[#0EA5E9] bg-[#E0F2FE] font-semibold text-[#0369A1]'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {purpose.label}
                    <span className="mt-0.5 block text-xs font-normal text-gray-500">{purpose.hint}</span>
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Layout</p>
              <div className="space-y-2">
                {LAYOUTS.filter(
                  (layout) =>
                    (selected.purpose === 'voucher' || layout.id !== 'coupon') &&
                    (selected.mediaType !== 'video' || layout.id === 'poster')
                ).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => patch(selected.id, { layout: l.id })}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm ${
                      selected.layout === l.id
                        ? 'border-[#0EA5E9] bg-[#E0F2FE] font-semibold text-[#0369A1]'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {l.label}
                    <span className="mt-0.5 block text-xs font-normal text-gray-500">{l.hint}</span>
                  </button>
                ))}
              </div>

              <label className="block text-sm">
                <span className="font-medium text-gray-700">Headline</span>
                <input
                  value={selected.headline}
                  onChange={(e) => patch(selected.id, { headline: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Body</span>
                <textarea
                  value={selected.body}
                  onChange={(e) => patch(selected.id, { body: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>
              {selected.purpose === 'product' ? (
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Catalog product</span>
                  <select
                    value={selected.productId || ''}
                    onChange={(e) => selectProduct(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    <option value="">Choose a product to populate this spotlight…</option>
                    {storefrontProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.brand} {product.model}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[11px] text-gray-500">
                    Selecting a product fills the image, copy, and link; you can edit them afterward.
                  </span>
                </label>
              ) : null}
              {selected.purpose === 'voucher' ? (
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Voucher code</span>
                  <input
                    value={selected.code}
                    onChange={(e) => patch(selected.id, { code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 font-mono"
                  />
                </label>
              ) : null}
              {selected.layout === 'coupon' ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-gray-700">
                    {IMAGE_UPLOAD_GUIDES.coupon.label}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{IMAGE_UPLOAD_GUIDES.coupon.detail}</p>
                </div>
              ) : (
                <>
                  {selected.layout === 'poster' ? (
                    <label className="block text-sm">
                      <span className="font-medium text-gray-700">Media type</span>
                      <select
                        value={selected.mediaType}
                        onChange={(e) =>
                          patch(selected.id, {
                            mediaType: e.target.value === 'video' ? 'video' : 'image',
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                      >
                        <option value="image">Image</option>
                        <option value="video">MP4 video</option>
                      </select>
                    </label>
                  ) : null}
                  <div className="rounded-lg border border-[#BAE6FD] bg-[#F0F9FF] px-3 py-2.5">
                    <p className="text-xs font-semibold text-[#0369A1]">
                      Image size guide · {IMAGE_UPLOAD_GUIDES[selected.layout].hint}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {IMAGE_UPLOAD_GUIDES[selected.layout].detail}
                    </p>
                  </div>
                  <ImageUrlOrUploadField
                    label={IMAGE_UPLOAD_GUIDES[selected.layout].label}
                    value={selected.imageUrl || ''}
                    onChange={(v) => patch(selected.id, { imageUrl: v })}
                    remoteUpload={{
                      getObjectPath: (file) => {
                        const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
                        const base =
                          file.name
                            .replace(/\.[^.]+$/, '')
                            .replace(/[^a-zA-Z0-9_-]+/g, '-')
                            .slice(0, 48) || 'campaign';
                        return `promo-popups/${base}-${Date.now()}.${extension}`;
                      },
                    }}
                    allowVideo={selected.layout === 'poster'}
                    previewAsVideo={selected.layout === 'poster' && selected.mediaType === 'video'}
                    onMediaTypeChange={(mediaType) =>
                      patch(selected.id, { mediaType })
                    }
                    hint={IMAGE_UPLOAD_GUIDES[selected.layout].hint}
                  />
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">CTA label</span>
                  <input
                    value={selected.ctaLabel}
                    onChange={(e) => patch(selected.id, { ctaLabel: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">CTA link</span>
                  <input
                    value={selected.ctaHref}
                    onChange={(e) => patch(selected.id, { ctaHref: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Dismiss label</span>
                <input
                  value={selected.dismissLabel}
                  onChange={(e) => patch(selected.id, { dismissLabel: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>
            </div>

            {/* Preview + animations stay together while the left form scrolls */}
            <aside className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
              <div className="space-y-4 rounded-xl border border-[#BAE6FD] bg-[#E0F2FE]/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Live preview
                  </p>
                  <button
                    type="button"
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#0EA5E9] shadow-sm ring-1 ring-[#BAE6FD] hover:bg-[#F0F9FF]"
                  >
                    ↻ Replay
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl bg-[#0C4A6E]/10 p-4">
                  <PopupLayoutPreview
                    key={`${previewKey}-${selected.layout}-${selected.animation}-${selected.id}`}
                    popup={selected}
                  />
                </div>

                <dl className="space-y-1 text-xs text-gray-600">
                  <div>
                    <dt className="inline font-semibold text-gray-800">Shows: </dt>
                    <dd className="inline">
                      {PROMO_POPUP_FREQUENCY_LABELS[selected.frequency]}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-gray-800">On: </dt>
                    <dd className="inline">
                      {selected.pageScope === 'selected'
                        ? selected.pagePaths.join(', ') || 'No paths'
                        : PROMO_POPUP_PAGE_SCOPE_LABELS[selected.pageScope]}
                    </dd>
                  </div>
                </dl>

                <div className="border-t border-[#BAE6FD] pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Animation style
                  </p>
                  <p className="mb-2 text-[11px] text-gray-500">
                    Click a style — the preview above replays immediately.
                  </p>
                  <div className="grid max-h-[min(360px,40vh)] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1">
                    {PROMO_ANIMATION_OPTIONS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => pickAnimation(a.id)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          normalizePromoAnimation(selected.animation) === a.id
                            ? 'border-[#0EA5E9] bg-white text-[#0C4A6E] shadow-sm'
                            : 'border-transparent bg-white/70 hover:border-gray-200 hover:bg-white'
                        }`}
                      >
                        <span className="mr-1">{a.icon}</span>
                        <span className="font-semibold">{a.name}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">{a.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
