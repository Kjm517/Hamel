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
import { IMAGE_SIZE_GUIDES } from '../lib/image-size-guides';
import { SortableList } from '../components/SortableList';
import { AdminToggle } from '../components/AdminToggle';
import { useCatalog } from '../../context/CatalogContext';
import { isStorefrontProduct } from '../../lib/catalog-product';
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

const LAYOUTS: { id: PromoPopupLayout; label: string; hint: string }[] = [
  { id: 'centered', label: 'PM-A · Centered · announcement', hint: 'Centered message with image or mascot' },
  { id: 'split', label: 'PM-B · Split · product image', hint: 'Image left, campaign details right' },
  { id: 'coupon', label: 'PM-C · Coupon ticket', hint: 'Ticket-style welcome gift' },
  { id: 'poster', label: 'PM-D · Full image ad', hint: 'Large uploaded creative with an optional button' },
];

const PURPOSES: { id: PromoPopupPurpose; label: string; hint: string }[] = [
  { id: 'voucher', label: 'Voucher / deal', hint: 'Share a copyable code' },
  { id: 'product', label: 'Product spotlight', hint: 'Send to a product' },
  { id: 'announcement', label: 'Announcement', hint: 'Store update' },
];

const PATH_PRESETS = ['/', '/cool-deals', '/products', '/brands', '/about', '/contact'];

const IMAGE_UPLOAD_GUIDES: Record<
  PromoPopupLayout,
  { label: string; hint: string; detail: string; sizeGuide?: string }
> = {
  poster: {
    label: 'Poster image or MP4 video',
    hint: 'Images: maximum 1582 × 2048 px (portrait) · images up to 25 MB · MP4 up to 300 MB.',
    detail:
      'This matches the supplied poster style. Use this maximum size or a smaller image with the same tall portrait proportion. MP4 videos play muted and loop. Keep important text away from the top-right corner for the close button.',
    sizeGuide: IMAGE_SIZE_GUIDES.popupPoster,
  },
  split: {
    label: 'Product image',
    hint: 'Recommended: 800 × 1200 px (2:3 portrait) · up to 25 MB.',
    detail:
      'Use a clean product photo with the unit centered. This image fills the narrow left panel, so detailed text should go in the headline and body fields instead.',
    sizeGuide: IMAGE_SIZE_GUIDES.popupSplit,
  },
  centered: {
    label: 'Image / mascot',
    hint: 'Recommended: 800 × 800 px (1:1 square) · up to 25 MB.',
    detail:
      'The image appears in a circular frame. Keep the subject centered and avoid text near the edges.',
    sizeGuide: IMAGE_SIZE_GUIDES.popupCentered,
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
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
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

  const removePopup = async (id: string) => {
    const item = draft.popups.find((p) => p.id === id);
    const ok = await confirm({
      title: 'Delete this promo pop-up?',
      description: `Remove "${item?.name || 'this pop-up'}"? Remember to save after deleting.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
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
    <div className="space-y-5">
      {confirmDialog}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className={`${adminUi.pageIntro} max-w-[640px]`}>
          Pop-ups for deals, product highlights, or store notices. Set how often they appear and
          which pages they show on.
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className={adminUi.btnAmber}
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save all'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)_340px]">
        {}
        <div className={`${adminUi.card} flex flex-col p-3`}>
          <p className={`px-1.5 pb-2 pt-1 ${adminUi.sectionLabel}`}>
            Popups ({draft.popups.length})
          </p>
          {draft.popups.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs text-[#9aa7b5]">No popups yet.</p>
          ) : (
            <>
              <p className="mb-1.5 px-1 text-[11px] text-[#9aa7b5]">
                Drag the handle to set popup priority.
              </p>
              <SortableList
                items={orderedPopups}
                onReorder={reorderPopups}
                rowClassName="!border-transparent !bg-transparent"
                renderItem={(p, index) => (
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full rounded-[10px] border px-3 py-2.5 text-left transition ${
                      selected?.id === p.id
                        ? 'border-[#0ea5e9] bg-[#e0f2fe]'
                        : 'border-[#e4ebf2] bg-white hover:bg-[#f7fafd]'
                    }`}
                  >
                    <span
                      className={`block truncate text-[13px] font-bold ${
                        selected?.id === p.id ? 'text-[#0369a1]' : 'text-[#1e2a38]'
                      }`}
                    >
                      {p.name || p.headline || 'Untitled'}
                    </span>
                    <span
                      className={`mt-0.5 block text-[10.5px] font-medium opacity-80 ${
                        selected?.id === p.id ? 'text-[#0369a1]' : 'text-[#9aa7b5]'
                      }`}
                    >
                      {p.enabled ? 'On' : 'Off'} · P{index + 1} ·{' '}
                      {PROMO_POPUP_PAGE_SCOPE_LABELS[p.pageScope]}
                    </span>
                  </button>
                )}
              />
            </>
          )}
          <button
            type="button"
            onClick={addPopup}
            className="mt-2.5 inline-flex h-[38px] w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0ea5e9] text-[13px] font-bold text-white transition hover:bg-[#0284c7]"
          >
            <Plus className="h-[15px] w-[15px]" strokeWidth={2.2} />
            Add popup
          </button>
        </div>

        {}
        {!selected ? (
          <div className={`${adminUi.card} border-dashed p-8 text-center text-sm text-[#9aa7b5]`}>
            Add a popup to configure content and show conditions.
          </div>
        ) : (
          <div className={`${adminUi.card} flex flex-col gap-4 p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-[13px] font-semibold text-[#516171]">
                <span>Enabled</span>
                <AdminToggle
                  checked={selected.enabled}
                  onChange={(enabled) => patch(selected.id, { enabled })}
                  label="Enabled"
                />
              </div>
              <button
                type="button"
                onClick={() => void removePopup(selected.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>

            <label className="block">
              <span className={adminUi.label}>Admin name</span>
              <input
                value={selected.name}
                onChange={(e) => patch(selected.id, { name: e.target.value })}
                className={adminUi.input}
              />
            </label>

            <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-3.5">
              <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#0369a1]">
                When to show
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={adminUi.label}>Frequency</span>
                  <select
                    value={selected.frequency}
                    onChange={(e) =>
                      patch(selected.id, {
                        frequency: e.target.value as PromoPopupFrequency,
                      })
                    }
                    className={`${adminUi.select} bg-white`}
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
                <label className="block">
                  <span className={adminUi.label}>Pages</span>
                  <select
                    value={selected.pageScope}
                    onChange={(e) =>
                      patch(selected.id, {
                        pageScope: e.target.value as PromoPopupPageScope,
                      })
                    }
                    className={`${adminUi.select} bg-white`}
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
              </div>
              {selected.pageScope === 'selected' && (
                <div className="mt-3 space-y-2">
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
                      className={`${adminUi.input} mt-0 flex-1 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => addPath(pathDraft)}
                      className={adminUi.btnSoft}
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
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#e4ebf2] bg-white px-3 py-2">
                  <span className="block text-[12.5px] font-semibold text-[#516171]">
                    Queue priority
                  </span>
                  <span className="mt-1 block text-lg font-bold text-[#0369A1]">
                    P{selectedQueuePosition}
                  </span>
                  <span className="mt-1 block text-[11px] text-[#9aa7b5]">
                    Drag this popup in the left queue to change its order.
                  </span>
                </div>
                <label className="block">
                  <span className={adminUi.label}>Delay (ms)</span>
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
                    className={`${adminUi.input} bg-white`}
                  />
                </label>
              </div>
            </div>

            <div>
              <div className={`mb-2 ${adminUi.sectionLabel}`}>Campaign type</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {PURPOSES.map((purpose) => (
                  <button
                    key={purpose.id}
                    type="button"
                    onClick={() => setPurpose(purpose.id)}
                    className={`rounded-[10px] border-[1.5px] p-[11px] text-left transition ${
                      selected.purpose === purpose.id
                        ? 'border-[#0ea5e9] bg-[#e0f2fe]'
                        : 'border-[#e4ebf2] bg-white hover:bg-[#f7fafd]'
                    }`}
                  >
                    <div
                      className={`text-[12.5px] font-bold ${
                        selected.purpose === purpose.id ? 'text-[#0369a1]' : 'text-[#1e2a38]'
                      }`}
                    >
                      {purpose.label}
                    </div>
                    <div
                      className={`mt-0.5 text-[11px] ${
                        selected.purpose === purpose.id ? 'text-[#38607a]' : 'text-[#9aa7b5]'
                      }`}
                    >
                      {purpose.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={adminUi.label}>Headline</span>
                <input
                  value={selected.headline}
                  onChange={(e) => patch(selected.id, { headline: e.target.value })}
                  className={adminUi.input}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={adminUi.label}>Body</span>
                <textarea
                  value={selected.body}
                  onChange={(e) => patch(selected.id, { body: e.target.value })}
                  rows={2}
                  className={adminUi.textarea}
                />
              </label>
              {selected.purpose === 'voucher' ? (
                <label className="block">
                  <span className={adminUi.label}>Voucher code</span>
                  <input
                    value={selected.code}
                    onChange={(e) => patch(selected.id, { code: e.target.value.toUpperCase() })}
                    className={`${adminUi.input} font-mono font-bold`}
                  />
                </label>
              ) : null}
              <label className={`block ${selected.purpose === 'voucher' ? '' : 'sm:col-span-2'}`}>
                <span className={adminUi.label}>Button text</span>
                <input
                  value={selected.ctaLabel}
                  onChange={(e) => patch(selected.id, { ctaLabel: e.target.value })}
                  className={adminUi.input}
                />
              </label>
            </div>

            {selected.purpose === 'product' ? (
              <label className="block">
                <span className={adminUi.label}>Catalog product</span>
                <select
                  value={selected.productId || ''}
                  onChange={(e) => selectProduct(e.target.value)}
                  className={adminUi.select}
                >
                  <option value="">Choose a product to populate this spotlight…</option>
                  {storefrontProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.brand} {product.model}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[11px] text-[#9aa7b5]">
                  Selecting a product fills the image, copy, and link; you can edit them afterward.
                </span>
              </label>
            ) : null}

            <div>
              <div className={`mb-2 ${adminUi.sectionLabel}`}>Layout</div>
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
                    className={`w-full rounded-[10px] border px-3 py-2.5 text-left text-sm transition ${
                      selected.layout === l.id
                        ? 'border-[#0ea5e9] bg-[#e0f2fe] font-semibold text-[#0369a1]'
                        : 'border-[#e4ebf2] hover:bg-[#f7fafd]'
                    }`}
                  >
                    {l.label}
                    <span className="mt-0.5 block text-xs font-normal text-[#9aa7b5]">{l.hint}</span>
                  </button>
                ))}
              </div>
            </div>

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
                  <label className="block">
                    <span className={adminUi.label}>Media type</span>
                    <select
                      value={selected.mediaType}
                      onChange={(e) =>
                        patch(selected.id, {
                          mediaType: e.target.value === 'video' ? 'video' : 'image',
                        })
                      }
                      className={adminUi.select}
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
                  sizeGuide={IMAGE_UPLOAD_GUIDES[selected.layout].sizeGuide}
                />
              </>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={adminUi.label}>Button link</span>
                <input
                  value={selected.ctaHref}
                  onChange={(e) => patch(selected.id, { ctaHref: e.target.value })}
                  className={adminUi.input}
                />
              </label>
              <label className="block">
                <span className={adminUi.label}>Dismiss label</span>
                <input
                  value={selected.dismissLabel}
                  onChange={(e) => patch(selected.id, { dismissLabel: e.target.value })}
                  className={adminUi.input}
                />
              </label>
            </div>
          </div>
        )}

        {}
        {selected ? (
          <aside className="rounded-2xl border border-[#bae6fd] bg-[#e0f2fe] p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className={adminUi.sectionLabel}>Live preview</span>
              <button
                type="button"
                onClick={() => setPreviewKey((k) => k + 1)}
                className="h-7 rounded-lg border border-[#bae6fd] bg-white px-2.5 text-[11.5px] font-bold text-[#0ea5e9] transition hover:bg-[#f0f9ff]"
              >
                ↻ Replay
              </button>
            </div>

            <div className="flex justify-center overflow-hidden rounded-[14px] bg-[rgba(12,74,110,0.12)] p-[18px]">
              <PopupLayoutPreview
                key={`${previewKey}-${selected.layout}-${selected.animation}-${selected.id}`}
                popup={selected}
              />
            </div>

            <dl className="mt-3 space-y-1 text-xs text-[#516171]">
              <div>
                <dt className="inline font-semibold text-[#1e2a38]">Shows: </dt>
                <dd className="inline">
                  {PROMO_POPUP_FREQUENCY_LABELS[selected.frequency]}
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold text-[#1e2a38]">On: </dt>
                <dd className="inline">
                  {selected.pageScope === 'selected'
                    ? selected.pagePaths.join(', ') || 'No paths'
                    : PROMO_POPUP_PAGE_SCOPE_LABELS[selected.pageScope]}
                </dd>
              </div>
            </dl>

            <div className="mt-3.5 border-t border-[#bae6fd] pt-3">
              <div className={`mb-2 ${adminUi.sectionLabel}`}>Animation style</div>
              <p className="mb-2 text-[11px] text-[#7a8899]">
                Click a style — the preview above replays immediately.
              </p>
              <div className="flex flex-col gap-1.5">
                {PROMO_ANIMATION_OPTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => pickAnimation(a.id)}
                    className={`rounded-[10px] border px-3 py-2 text-left transition ${
                      normalizePromoAnimation(selected.animation) === a.id
                        ? 'border-[#0ea5e9] bg-white shadow-sm'
                        : 'border-transparent bg-white/70 hover:border-[#e4ebf2] hover:bg-white'
                    }`}
                  >
                    <span className="text-[12.5px] font-bold text-[#1e2a38]">
                      <span className="mr-1">{a.icon}</span>
                      {a.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#7a8899]">{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        ) : (
          <div className="hidden lg:block" />
        )}
      </div>
    </div>
  );
}
