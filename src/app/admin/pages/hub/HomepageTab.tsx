import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { Plus, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import {
  getBanners,
  saveBanners,
  defaultBanners,
  type BannerStore,
  type PromoBannerItem,
} from '../../../data/banners';
import type { BannerConfig } from '../../../components/PageBanner';
import { MarketplaceBannerGrid } from '../../../components/MarketplaceBannerGrid';
import { ImageUrlOrUploadField } from '../../components/ImageUrlOrUploadField';
import { BannerLinkDestinationField } from '../../components/BannerLinkDestinationField';
import { SortableList } from '../../components/SortableList';
import { AdminSaveBar } from '../../components/AdminSaveBar';
import { useAdminConfirm } from '../../components/AdminConfirmDialog';
import { mediaPathFor } from '../../../lib/storage';
import { PageEditorIntro } from './PageEditorIntro';

type SlideRow = BannerConfig & { id: string };

function sid(): string {
  return `s-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`;
}

function ensureSlideIds(slides: BannerConfig[]): SlideRow[] {
  return slides.map((s) => ({ ...s, id: s.id ?? sid() }));
}

function Field({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
      )}
    </div>
  );
}

export function HomepageTab() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [store, setStore] = useState<BannerStore>(() => getBanners());
  const [slides, setSlides] = useState<SlideRow[]>(() => ensureSlideIds(getBanners().heroSlides));
  const [openSlideId, setOpenSlideId] = useState<string | null>(slides[0]?.id ?? null);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = () => {
    void saveBanners({ ...store, heroSlides: slides });
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2000);
  };

  const updateSlide = (id: string, patch: Partial<BannerConfig>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setSaved(false);
  };

  const updateSide = (index: 0 | 1 | 2, patch: Partial<PromoBannerItem>) => {
    setStore((prev) => {
      const promos = [...prev.promoBanners] as [PromoBannerItem, PromoBannerItem, PromoBannerItem];
      promos[index] = { ...promos[index], ...patch };
      return { ...prev, promoBanners: promos };
    });
    setSaved(false);
  };

  return (
    <div className="space-y-6">
      {confirmDialog}
      <PageEditorIntro
        title="Home page"
        description="Hero slides at the top, plus up to three offer tiles on the side."
        saveMode="manual"
        previewHref="/"
        showDragTip
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-4 py-3">
        <div className="flex items-start gap-2 text-sm text-[#0C4A6E]">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-[#0EA5E9]" />
          <p>
            Looking for <strong>Cool Summer / Birthday Sale</strong>? Manage that strip under{' '}
            <Link to="/admin/promo-event" className="font-semibold text-[#0EA5E9] underline">
              Promo event
            </Link>
            .
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-800">Live preview</p>
        <div className="rounded-xl border border-gray-200 overflow-hidden pointer-events-none opacity-90">
          <MarketplaceBannerGrid carouselSlides={slides} sideBanners={store.promoBanners} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">1. Sliding pictures</h3>
          <button
            type="button"
            onClick={() => {
              const row: SlideRow = {
                id: sid(),
                imageUrl: store.heroSlides[0]?.imageUrl ?? '',
                title: 'New slide',
                ctaLabel: 'Learn more',
                ctaHref: '/products',
                overlayColor: store.heroSlides[0]?.overlayColor,
                height: 'md',
                textAlign: 'left',
              };
              setSlides((p) => [...p, row]);
              setOpenSlideId(row.id);
              setSaved(false);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-[#0EA5E9]"
          >
            <Plus size={14} /> Add picture
          </button>
        </div>
        <p className="mb-3 text-xs text-gray-500">
          The first picture in the list shows first. Click a picture to edit its text and image.
        </p>

        <SortableList
          items={slides}
          onReorder={(next) => {
            setSlides(next);
            setSaved(false);
          }}
          renderItem={(slide) => {
            const open = openSlideId === slide.id;
            return (
              <div className="pr-3 py-2">
                <button
                  type="button"
                  onClick={() => setOpenSlideId(open ? null : slide.id)}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-800"
                >
                  <span className="truncate">{slide.title || 'Untitled'}</span>
                  {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {open && (
                  <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                    <BannerLinkDestinationField fields={slide} onChange={(p) => updateSlide(slide.id, p)} />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Headline" value={slide.title} onChange={(v) => updateSlide(slide.id, { title: v })} />
                      <Field label="Button text" value={slide.ctaLabel || ''} onChange={(v) => updateSlide(slide.id, { ctaLabel: v })} />
                      <Field label="Short line under title" value={slide.subtitle || ''} onChange={(v) => updateSlide(slide.id, { subtitle: v })} rows={2} />
                    </div>
                    <ImageUrlOrUploadField
                      label="Image"
                      value={slide.imageUrl}
                      onChange={(v) => updateSlide(slide.id, { imageUrl: v })}
                      remoteUpload={{ getObjectPath: mediaPathFor('banners') }}
                    />
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-gray-600">Color overlay (smoke)</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateSlide(slide.id, { overlayColor: undefined })}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                            !slide.overlayColor
                              ? 'border-[#0EA5E9] bg-[#E0F2FE] text-[#0369A1]'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          None — image only
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSlide(slide.id, {
                              overlayColor:
                                'linear-gradient(90deg, rgba(14,90,180,0.92) 0%, rgba(14,165,233,0.75) 45%, rgba(14,165,233,0.25) 100%)',
                            })
                          }
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                            slide.overlayColor
                              ? 'border-[#0EA5E9] bg-[#E0F2FE] text-[#0369A1]'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          Soft blue
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400">
                        Use <strong>None</strong> when Marketing’s artwork already includes text (no smoke).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (slides.length <= 1) return;
                        setSlides((p) => p.filter((s) => s.id !== slide.id));
                        setSaved(false);
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove picture
                    </button>
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>

      <div>
        <h3 className="mb-1 text-sm font-bold text-gray-800">2. Side offers</h3>
        <p className="mb-3 text-xs text-gray-500">
          Add up to three smaller tiles beside the sliding pictures. Turn off any offer you do not want to show.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
        {([0, 1, 2] as const).map((idx) => {
          const b = store.promoBanners[idx];
          return (
            <div key={idx} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-gray-800">Offer {idx + 1}</h3>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={b.enabled !== false}
                    onChange={(e) => updateSide(idx, { enabled: e.target.checked })}
                  />
                  Show on homepage
                </label>
              </div>
              <Field label="Title line 1" value={b.title} onChange={(v) => updateSide(idx, { title: v })} />
              <Field label="Title accent / pill" value={b.titleAccent || ''} onChange={(v) => updateSide(idx, { titleAccent: v })} />
              <Field label="Badge" value={b.badge || ''} onChange={(v) => updateSide(idx, { badge: v })} />
              <Field label="Subtitle" value={b.subtitle || ''} onChange={(v) => updateSide(idx, { subtitle: v })} />
              <Field label="CTA label" value={b.ctaLabel || ''} onChange={(v) => updateSide(idx, { ctaLabel: v })} />
              <div className="mb-3 grid grid-cols-3 gap-2">
                <label className="block text-xs">
                  <span className="font-medium text-gray-600">Background</span>
                  <input
                    type="color"
                    value={b.bgColor || '#0EA5E9'}
                    onChange={(e) => updateSide(idx, { bgColor: e.target.value })}
                    className="mt-1 h-9 w-full cursor-pointer rounded border border-gray-200"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-medium text-gray-600">Text</span>
                  <input
                    type="color"
                    value={b.textColor || '#FFFFFF'}
                    onChange={(e) => updateSide(idx, { textColor: e.target.value })}
                    className="mt-1 h-9 w-full cursor-pointer rounded border border-gray-200"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-medium text-gray-600">Accent</span>
                  <input
                    type="color"
                    value={b.accentColor || '#FFC107'}
                    onChange={(e) => updateSide(idx, { accentColor: e.target.value })}
                    className="mt-1 h-9 w-full cursor-pointer rounded border border-gray-200"
                  />
                </label>
              </div>
              <ImageUrlOrUploadField
                label="Image"
                value={b.imageUrl || ''}
                onChange={(v) => updateSide(idx, { imageUrl: v })}
                remoteUpload={{ getObjectPath: mediaPathFor('promo-banners') }}
              />
              <BannerLinkDestinationField fields={b} onChange={(p) => updateSide(idx, p)} />
            </div>
          );
        })}
        </div>
      </div>

      <AdminSaveBar
        saved={saved}
        onSave={save}
        onReset={() => {
          void (async () => {
            const ok = await confirm({
              title: 'Reset homepage banners?',
              description: 'Restore default hero slides and offer tiles. This cannot be undone.',
              confirmLabel: 'Reset',
              tone: 'danger',
            });
            if (!ok) return;
            const d = defaultBanners;
            setStore(d);
            setSlides(ensureSlideIds(d.heroSlides));
            setSaved(false);
          })();
        }}
      />
    </div>
  );
}
