import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { RotateCcw, Save, ArrowLeftRight, Eye, EyeOff, ChevronDown, ChevronUp, Plus, Trash2, Layers, Palette } from 'lucide-react';
import {
  getBanners, saveBanners, resetBanners,
  defaultBanners, PAGE_LABELS,
  type BannerStore, type PageKey, type FeaturedCollectionConfig, type PromoBannerItem,
  type CoolDealsBannerConfig,
} from '../../data/banners';
import { PageBanner } from '../../components/PageBanner';
import type { BannerConfig } from '../../components/PageBanner';
import { PAGE_BANNER_HEIGHTS } from '../../components/PageBanner';
import { MarketplaceBannerGrid } from '../../components/MarketplaceBannerGrid';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { PromoSideBannerEditor } from '../components/PromoSideBannerEditor';
import { BannerLinkDestinationField } from '../components/BannerLinkDestinationField';
import { hexForColorInput } from '../../lib/color-utils';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

const PAGE_KEYS: PageKey[] = ['home', 'products', 'brands', 'why-hamel', 'contact'];

const OVERLAY_PRESETS: { label: string; value: string }[] = [
  { label: 'None (image only)', value: '' },
  { label: 'Blue (Brand)', value: 'linear-gradient(to right, rgba(14,165,233,0.93) 0%, rgba(14,165,233,0.65) 55%, rgba(14,165,233,0.15) 100%)' },
  { label: 'Dark Navy', value: 'linear-gradient(to right, rgba(26,58,107,0.95) 0%, rgba(14,165,233,0.75) 55%, rgba(14,165,233,0.2) 100%)' },
  { label: 'Orange (Flash)', value: 'linear-gradient(to right, rgba(234,88,12,0.93) 0%, rgba(249,115,22,0.75) 55%, rgba(249,115,22,0.3) 100%)' },
  { label: 'Red (Sale)', value: 'linear-gradient(to right, rgba(185,28,28,0.93) 0%, rgba(220,38,38,0.7) 55%, rgba(220,38,38,0.2) 100%)' },
  { label: 'Green (Promo)', value: 'linear-gradient(to right, rgba(6,95,70,0.93) 0%, rgba(5,150,105,0.7) 55%, rgba(5,150,105,0.2) 100%)' },
  { label: 'Purple (Premium)', value: 'linear-gradient(to right, rgba(91,33,182,0.93) 0%, rgba(124,58,237,0.7) 55%, rgba(124,58,237,0.2) 100%)' },
];

interface FieldEditorProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  type?: string;
}
function FieldEditor({ label, value, onChange, placeholder, rows, type = 'text' }: FieldEditorProps) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
        />
      )}
    </div>
  );
}

function SlideEditor({
  slide,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  slide: BannerConfig;
  index: number;
  onChange: (patch: Partial<BannerConfig>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left flex-1 text-sm font-semibold text-gray-800"
        >
          <span className="w-5 h-5 rounded-full bg-[#0EA5E9] text-white text-xs flex items-center justify-center shrink-0">{index + 1}</span>
          <span className="truncate">{slide.title || 'Untitled Slide'}</span>
          {expanded ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
        </button>
        {canRemove && (
          <button
            onClick={onRemove}
            className="ml-3 p-1.5 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
            title="Remove slide"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {expanded && (
        <div className="p-4 space-y-4">
          <BannerLinkDestinationField fields={slide} onChange={onChange} />
          <div className="grid md:grid-cols-2 gap-x-6">
            <div>
              <FieldEditor label="Tag / Pill Label" value={slide.tag || ''} onChange={(v) => onChange({ tag: v })} placeholder="e.g. ⚡ Limited Time" />
              <FieldEditor label="Headline" value={slide.title} onChange={(v) => onChange({ title: v })} rows={2} placeholder="Main headline text" />
              <FieldEditor label="Subheadline" value={slide.subtitle || ''} onChange={(v) => onChange({ subtitle: v })} rows={2} placeholder="Supporting text" />
              <FieldEditor label="CTA Button Label" value={slide.ctaLabel || ''} onChange={(v) => onChange({ ctaLabel: v })} placeholder="e.g. Shop Now (shown on banner)" />
            </div>
            <div>
              <ImageUrlOrUploadField
                label="Background image"
                value={slide.imageUrl}
                onChange={(v) => onChange({ imageUrl: v })}
                placeholder="https://... or /hamel/..."
              />
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Overlay Color Theme</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {OVERLAY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onChange({ overlayColor: preset.value || undefined })}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded border text-xs hover:bg-gray-50 transition-colors text-left"
                      style={{
                        borderColor:
                          (preset.value === '' && !slide.overlayColor) ||
                          slide.overlayColor === preset.value
                            ? '#0EA5E9'
                            : '#E5E7EB',
                        backgroundColor:
                          (preset.value === '' && !slide.overlayColor) ||
                          slide.overlayColor === preset.value
                            ? '#E0F2FE'
                            : undefined,
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-sm shrink-0 border border-gray-200"
                        style={{
                          background: preset.value || 'linear-gradient(45deg,#fff 40%,#e5e7eb 40%)',
                        }}
                      />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {slide.imageUrl && (
            <div className="mt-2 h-14 rounded-lg overflow-hidden border border-gray-200 relative">
              <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
              {slide.overlayColor ? (
                <div className="absolute inset-0" style={{ background: slide.overlayColor }} />
              ) : null}
              <div className="absolute inset-0 flex items-center px-4">
                <span className="text-white font-bold text-sm drop-shadow line-clamp-1">{slide.title}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const newSlideTemplate: BannerConfig = {
  imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1400&h=300&fit=crop',
  imageAlt: 'New slide',
  tag: '',
  title: 'New Slide — Edit Your Headline Here',
  subtitle: '',
  ctaLabel: 'Shop Now',
  ctaHref: '/products',
  overlayColor: undefined,
  height: 'sm',
  textAlign: 'left',
};

export function AdminBannersPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [banners, setBanners] = useState<BannerStore>(() => getBanners());
  const [saved, setSaved] = useState(false);
  const [swapSource, setSwapSource] = useState<PageKey | null>(null);
  const [previewPage, setPreviewPage] = useState<PageKey | null>(null);
  const [expanded, setExpanded] = useState<PageKey | null>('home');
  const [homeGridOpen, setHomeGridOpen] = useState(true);
  const [featuredSectionOpen, setFeaturedSectionOpen] = useState(false);
  const [coolDealsSectionOpen, setCoolDealsSectionOpen] = useState(false);
  const [homeGridPreview, setHomeGridPreview] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateBanner = (page: PageKey, patch: Partial<BannerConfig>) => {
    setBanners((prev) => ({ ...prev, [page]: { ...prev[page], ...patch } }));
    setSaved(false);
  };

  const updateSlide = (index: number, patch: Partial<BannerConfig>) => {
    setBanners((prev) => {
      const slides = [...prev.heroSlides];
      slides[index] = { ...slides[index], ...patch };
      return { ...prev, heroSlides: slides };
    });
    setSaved(false);
  };

  const addSlide = () => {
    setBanners((prev) => ({ ...prev, heroSlides: [...prev.heroSlides, { ...newSlideTemplate }] }));
    setSaved(false);
  };

  const removeSlide = async (index: number) => {
    const ok = await confirm({
      title: 'Remove this hero slide?',
      description: 'Remember to save banners after removing a slide.',
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    setBanners((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, i) => i !== index),
    }));
    setSaved(false);
  };

  const updateFeatured = (patch: Partial<FeaturedCollectionConfig>) => {
    setBanners((prev) => ({ ...prev, featuredCollection: { ...prev.featuredCollection, ...patch } }));
    setSaved(false);
  };

  const updatePromoBanner = (index: 0 | 1 | 2, patch: Partial<PromoBannerItem>) => {
    setBanners((prev) => {
      const next = [...prev.promoBanners] as [PromoBannerItem, PromoBannerItem, PromoBannerItem];
      next[index] = { ...next[index], ...patch };
      return { ...prev, promoBanners: next };
    });
    setSaved(false);
  };

  const updateCoolDealsBanner = (patch: Partial<CoolDealsBannerConfig>) => {
    setBanners((prev) => ({ ...prev, coolDealsBanner: { ...prev.coolDealsBanner, ...patch } }));
    setSaved(false);
  };

  const handleSave = () => {
    void saveBanners(banners);
    setSaved(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset all banners to defaults?',
      description: 'Homepage hero, page headers, promos, and Cool Deals hero will be restored. This cannot be undone.',
      confirmLabel: 'Reset',
      tone: 'danger',
    });
    if (!ok) return;
    void resetBanners();
    setBanners({ ...defaultBanners });
    setSaved(false);
  };

  const handleSwap = (page: PageKey) => {
    if (!swapSource) { setSwapSource(page); return; }
    if (swapSource === page) { setSwapSource(null); return; }
    setBanners((prev) => ({
      ...prev,
      [swapSource]: { ...prev[page] },
      [page]: { ...prev[swapSource] },
    }));
    setSwapSource(null);
    setSaved(false);
  };

  const handleResetOne = (page: PageKey) => {
    setBanners((prev) => ({ ...prev, [page]: { ...defaultBanners[page] } }));
    setSaved(false);
  };

  return (
    <div className="space-y-[18px]">
      {confirmDialog}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[560px]">
          <p className="m-0 text-[14px] leading-relaxed text-[#7a8899]">
            Homepage hero carousel, page headers, promos, and the Cool Deals hero. Each banner
            links to a promo page or a site route.
          </p>
          {swapSource && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
              <ArrowLeftRight size={12} />
              Swap mode — click another banner to exchange
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-[42px] items-center gap-1.5 rounded-[11px] border border-[#e4ebf2] bg-white px-[15px] text-[13.5px] font-semibold text-[#516171] hover:bg-[#f7fafd]"
          >
            <RotateCcw size={15} />
            Reset all
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-[42px] items-center gap-1.5 rounded-[11px] bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] px-[18px] text-[13.5px] font-bold text-[#422006] shadow-[0_6px_16px_-8px_rgba(245,158,11,0.75)]"
          >
            <Save size={16} />
            {saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </div>

      <div>
        <div className="mb-[18px] flex gap-2.5 rounded-xl border border-[#d6ecfb] bg-[#eff8ff] px-4 py-3 text-[13px] leading-relaxed text-[#38607a]">
          <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-sky-300 text-[11px] font-bold text-[#0ea5e9]">
            i
          </span>
          <p className="m-0">
            <strong>Banner navigation:</strong> under each banner choose <strong>Page</strong> (a
            promo landing page from{' '}
            <Link to="/admin/pages?tab=promo" className="font-semibold text-[#0ea5e9] underline">
              Promo Pages
            </Link>
            ) or <strong>Link</strong> (a route like /products or any URL).
          </p>
        </div>

        {/* ── Homepage marketplace grid (carousel + 2 side banners) ── */}
        <div className="mb-4 overflow-hidden rounded-2xl border-2 border-[#bfe6fb] bg-white shadow-[0_1px_2px_rgba(30,42,56,0.03)]">
          <div className="flex items-center justify-between border-b border-[#eef3f8] bg-[#f9fbfd] px-[18px] py-3.5">
            <button
              onClick={() => setHomeGridOpen(!homeGridOpen)}
              className="flex flex-1 items-center gap-2.5 text-left"
            >
              <Layers size={17} className="text-[#0EA5E9]" />
              <span className="text-[14px] font-extrabold text-[#1e2a38]">Homepage hero banners</span>
              <span className="text-xs text-[#9aa7b5]">carousel + right promos</span>
              {homeGridOpen ? (
                <ChevronUp size={16} className="ml-auto text-[#9aa7b5]" />
              ) : (
                <ChevronDown size={16} className="ml-auto text-[#9aa7b5]" />
              )}
            </button>
            <div className="ml-4 flex shrink-0 items-center gap-2">
              <Link
                to="/"
                target="_blank"
                className="text-xs font-bold text-[#0EA5E9] hover:underline"
              >
                View homepage ↗
              </Link>
              <button
                type="button"
                onClick={() => setHomeGridPreview(!homeGridPreview)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 hover:bg-gray-100 text-gray-600"
              >
                {homeGridPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                {homeGridPreview ? 'Hide' : 'Preview'}
              </button>
            </div>
          </div>

          {homeGridPreview && (
            <div className="border-b bg-gray-50/80 pointer-events-none">
              <MarketplaceBannerGrid
                carouselSlides={banners.heroSlides}
                sideBanners={banners.promoBanners}
              />
            </div>
          )}

          {homeGridOpen && (
            <div className="p-5 space-y-6">
              <p className="text-xs text-gray-500">
                Matches the top of the homepage: large rotating banner on the left and up to three optional promos on the right. Visitors can click anywhere on a banner to open its link.
              </p>

              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Main carousel (left)</h4>
                <div className="space-y-3">
                  {banners.heroSlides.map((slide, i) => (
                    <SlideEditor
                      key={i}
                      slide={slide}
                      index={i}
                      onChange={(patch) => updateSlide(i, patch)}
                      onRemove={() => void removeSlide(i)}
                      canRemove={banners.heroSlides.length > 1}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={addSlide}
                    className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-colors"
                  >
                    <Plus size={16} />
                    Add carousel slide
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Right side offers (maximum 3)</h4>
                {banners.promoBanners.map((banner, index) => (
                  <PromoSideBannerEditor
                    key={index}
                    label={`Side offer ${index + 1}`}
                    badgeNumber={index + 1}
                    item={banner}
                    onChange={(patch) => updatePromoBanner(index as 0 | 1 | 2, patch)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Featured Collection Section ── */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm mb-4">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
            <button
              onClick={() => setFeaturedSectionOpen(!featuredSectionOpen)}
              className="flex items-center gap-2 text-left flex-1"
            >
              <Palette size={16} className="text-[#0EA5E9]" />
              <span className="font-bold text-gray-900 text-sm">Featured Collection (e.g. "Cool Summer")</span>
              {featuredSectionOpen ? <ChevronUp size={16} className="text-gray-400 ml-auto" /> : <ChevronDown size={16} className="text-gray-400 ml-auto" />}
            </button>
          </div>

          {featuredSectionOpen && (
            <div className="p-5">
              <p className="text-xs text-gray-500 mb-4">This is the featured product collection section on the homepage. Customize the title and color scheme.</p>

              {/* Live preview */}
              <div
                className="rounded-lg py-6 px-8 mb-5 text-center"
                style={{ backgroundColor: banners.featuredCollection.bgColor }}
              >
                <div className="text-4xl font-black tracking-tight">
                  <span style={{ color: banners.featuredCollection.titleColor }}>{banners.featuredCollection.title} </span>
                  <span style={{ color: banners.featuredCollection.highlightColor }}>{banners.featuredCollection.titleHighlight}</span>
                </div>
                {banners.featuredCollection.subtitle && (
                  <p className="mt-1 text-sm" style={{ color: banners.featuredCollection.titleColor, opacity: 0.85 }}>
                    {banners.featuredCollection.subtitle}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-x-6">
                <div>
                  <FieldEditor
                    label="Title — First Word (plain)"
                    value={banners.featuredCollection.title}
                    onChange={(v) => updateFeatured({ title: v })}
                    placeholder="e.g. COOL"
                  />
                  <FieldEditor
                    label="Title — Highlighted Word (colored)"
                    value={banners.featuredCollection.titleHighlight}
                    onChange={(v) => updateFeatured({ titleHighlight: v })}
                    placeholder="e.g. SUMMER"
                  />
                  <FieldEditor
                    label="Subtitle"
                    value={banners.featuredCollection.subtitle || ''}
                    onChange={(v) => updateFeatured({ subtitle: v })}
                    placeholder="Optional supporting text"
                    rows={2}
                  />
                </div>
                <div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={hexForColorInput(banners.featuredCollection.bgColor)}
                        onChange={(e) => updateFeatured({ bgColor: e.target.value })}
                        className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={banners.featuredCollection.bgColor}
                        onChange={(e) => updateFeatured({ bgColor: e.target.value })}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                        placeholder="#0EA5E9"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Title Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={hexForColorInput(banners.featuredCollection.titleColor)}
                        onChange={(e) => updateFeatured({ titleColor: e.target.value })}
                        className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={banners.featuredCollection.titleColor}
                        onChange={(e) => updateFeatured({ titleColor: e.target.value })}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Highlight / Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={hexForColorInput(banners.featuredCollection.highlightColor)}
                        onChange={(e) => updateFeatured({ highlightColor: e.target.value })}
                        className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={banners.featuredCollection.highlightColor}
                        onChange={(e) => updateFeatured({ highlightColor: e.target.value })}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                        placeholder="#FFC107"
                      />
                    </div>
                  </div>

                  {/* Quick presets */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quick Presets</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'Cool Summer', bgColor: '#0EA5E9', titleColor: '#FFFFFF', highlightColor: '#FFC107' },
                        { label: 'Hot Deals', bgColor: '#EA580C', titleColor: '#FFFFFF', highlightColor: '#FFC107' },
                        { label: 'Midnight Sale', bgColor: '#1E1B4B', titleColor: '#FFFFFF', highlightColor: '#A78BFA' },
                        { label: 'Fresh Green', bgColor: '#065F46', titleColor: '#FFFFFF', highlightColor: '#34D399' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => updateFeatured(preset)}
                          className="px-3 py-1.5 rounded border text-xs font-medium hover:opacity-90 transition-opacity text-left"
                          style={{ backgroundColor: preset.bgColor, color: preset.titleColor, borderColor: 'transparent' }}
                        >
                          <span style={{ color: preset.titleColor }}>{preset.label.split(' ')[0]} </span>
                          <span style={{ color: preset.highlightColor }}>{preset.label.split(' ')[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Cool Deals Page Banner ── */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm mb-4">
          <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
            <button
              onClick={() => setCoolDealsSectionOpen(!coolDealsSectionOpen)}
              className="flex items-center gap-2 text-left flex-1"
            >
              <Layers size={16} className="text-[#0EA5E9]" />
              <span className="font-bold text-gray-900 text-sm">Cool Deals Page Banner</span>
              {coolDealsSectionOpen ? <ChevronUp size={16} className="text-gray-400 ml-auto" /> : <ChevronDown size={16} className="text-gray-400 ml-auto" />}
            </button>
            <Link to="/cool-deals" target="_blank" className="text-xs text-[#0EA5E9] font-semibold hover:underline ml-3">
              View page ↗
            </Link>
          </div>

          {coolDealsSectionOpen && (
            <div className="p-5 space-y-5">
              <p className="text-xs text-gray-500">
                Upload <strong>one wide banner image</strong> — it stretches edge-to-edge on <strong>/cool-deals</strong>.
                If your image already has all the text, leave overlay off. Otherwise enable overlay to add headline on top.
              </p>

              <ImageUrlOrUploadField
                label="Banner image (full width)"
                value={banners.coolDealsBanner.bannerImageUrl}
                onChange={(v) => updateCoolDealsBanner({ bannerImageUrl: v })}
                placeholder="Wide banner — recommended ~1600×600px or similar"
              />

              <BannerLinkDestinationField
                fields={banners.coolDealsBanner}
                onChange={(patch) => updateCoolDealsBanner(patch)}
              />

              {banners.coolDealsBanner.bannerImageUrl && (
                <div className={`relative rounded-lg border border-gray-200 overflow-hidden w-full ${PAGE_BANNER_HEIGHTS.md}`}>
                  <img
                    src={banners.coolDealsBanner.bannerImageUrl}
                    alt="Banner preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={Boolean(banners.coolDealsBanner.showTextOverlay)}
                  onChange={(e) => updateCoolDealsBanner({ showTextOverlay: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Add text overlay on the banner (badge, headline, subtitle)
                </span>
              </label>

              {banners.coolDealsBanner.showTextOverlay && (
                <div className="grid md:grid-cols-2 gap-x-6 border-t border-gray-100 pt-5">
                  <div>
                    <FieldEditor
                      label="Badge"
                      value={banners.coolDealsBanner.badge}
                      onChange={(v) => updateCoolDealsBanner({ badge: v })}
                    />
                    <FieldEditor
                      label="Title — line 1"
                      value={banners.coolDealsBanner.title}
                      onChange={(v) => updateCoolDealsBanner({ title: v })}
                    />
                    <FieldEditor
                      label="Title — line 2 (highlight)"
                      value={banners.coolDealsBanner.titleHighlight}
                      onChange={(v) => updateCoolDealsBanner({ titleHighlight: v })}
                    />
                    <FieldEditor
                      label="Subtitle"
                      value={banners.coolDealsBanner.subtitle}
                      onChange={(v) => updateCoolDealsBanner({ subtitle: v })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Overlay text colors</p>
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Line 1</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={hexForColorInput(banners.coolDealsBanner.titleColor)}
                          onChange={(e) => updateCoolDealsBanner({ titleColor: e.target.value })}
                          className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={banners.coolDealsBanner.titleColor}
                          onChange={(e) => updateCoolDealsBanner({ titleColor: e.target.value })}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Line 2</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={hexForColorInput(banners.coolDealsBanner.highlightColor)}
                          onChange={(e) => updateCoolDealsBanner({ highlightColor: e.target.value })}
                          className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={banners.coolDealsBanner.highlightColor}
                          onChange={(e) => updateCoolDealsBanner({ highlightColor: e.target.value })}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Page Banners ── */}
        <div className="space-y-4">
          {PAGE_KEYS.map((page) => {
            const banner = banners[page];
            const isExpanded = expanded === page;
            const isSwapSelected = swapSource === page;

            return (
              <div
                key={page}
                className="bg-white rounded-xl border-2 overflow-hidden shadow-sm transition-all"
                style={{ borderColor: isSwapSelected ? '#7C3AED' : '#E5E7EB' }}
              >
                <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : page)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    <span className="font-bold text-gray-900 text-sm">{PAGE_LABELS[page]}</span>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => setPreviewPage(previewPage === page ? null : page)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 hover:bg-gray-100 text-gray-600"
                    >
                      {previewPage === page ? <EyeOff size={12} /> : <Eye size={12} />}
                      {previewPage === page ? 'Hide' : 'Preview'}
                    </button>
                    <button
                      onClick={() => handleSwap(page)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border font-semibold transition-all"
                      style={isSwapSelected
                        ? { backgroundColor: '#7C3AED', color: '#FFF', borderColor: '#7C3AED' }
                        : { borderColor: '#E5E7EB', color: '#6B7280' }
                      }
                    >
                      <ArrowLeftRight size={12} />
                      {isSwapSelected ? 'Cancel Swap' : 'Swap'}
                    </button>
                    <button
                      onClick={() => handleResetOne(page)}
                      className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 hover:bg-gray-50 text-gray-500"
                      title="Reset to default"
                    >
                      ↺ Reset
                    </button>
                  </div>
                </div>

                {previewPage === page && (
                  <div className="border-b">
                    <PageBanner config={banner} />
                  </div>
                )}

                {isExpanded && (
                  <div className="p-5 space-y-4">
                    <BannerLinkDestinationField fields={banner} onChange={(patch) => updateBanner(page, patch)} />
                    <div className="grid md:grid-cols-2 gap-x-6">
                      <div>
                        <FieldEditor label="Tag / Pill Label" value={banner.tag || ''} onChange={(v) => updateBanner(page, { tag: v })} placeholder="e.g. Summer 2026" />
                        <FieldEditor label="Headline" value={banner.title} onChange={(v) => updateBanner(page, { title: v })} rows={2} placeholder="Main headline text" />
                        <FieldEditor label="Subheadline" value={banner.subtitle || ''} onChange={(v) => updateBanner(page, { subtitle: v })} rows={2} placeholder="Supporting text below headline" />
                        <FieldEditor label="CTA Button Label" value={banner.ctaLabel || ''} onChange={(v) => updateBanner(page, { ctaLabel: v })} placeholder="e.g. Shop Now" />
                      </div>
                      <div>
                        <ImageUrlOrUploadField
                          label="Background image"
                          value={banner.imageUrl}
                          onChange={(v) => updateBanner(page, { imageUrl: v })}
                        />
                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Overlay Color Theme</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {OVERLAY_PRESETS.map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() =>
                                  updateBanner(page, { overlayColor: preset.value || undefined })
                                }
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded border text-xs hover:bg-gray-50 transition-colors text-left"
                                style={{
                                  borderColor:
                                    (preset.value === '' && !banner.overlayColor) ||
                                    banner.overlayColor === preset.value
                                      ? '#0EA5E9'
                                      : '#E5E7EB',
                                  backgroundColor:
                                    (preset.value === '' && !banner.overlayColor) ||
                                    banner.overlayColor === preset.value
                                      ? '#E0F2FE'
                                      : undefined,
                                }}
                              >
                                <div
                                  className="w-3 h-3 rounded-sm shrink-0 border border-gray-200"
                                  style={{
                                    background:
                                      preset.value || 'linear-gradient(45deg,#fff 40%,#e5e7eb 40%)',
                                  }}
                                />
                                <span className="truncate">{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Banner Height</label>
                          <div className="flex gap-2">
                            {(['sm', 'md', 'lg'] as const).map((h) => (
                              <button
                                key={h}
                                onClick={() => updateBanner(page, { height: h })}
                                className="flex-1 py-1.5 text-xs rounded border font-medium transition-colors"
                                style={{
                                  borderColor: banner.height === h ? '#0EA5E9' : '#E5E7EB',
                                  backgroundColor: banner.height === h ? '#E0F2FE' : undefined,
                                  color: banner.height === h ? '#0EA5E9' : '#6B7280',
                                }}
                              >
                                {h === 'sm' ? 'Small' : h === 'md' ? 'Medium' : 'Large'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    {banner.imageUrl && (
                      <div className="mt-2 h-16 rounded-lg overflow-hidden border border-gray-200 relative">
                        <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: banner.overlayColor }} />
                        <div className="absolute inset-0 flex items-center px-4">
                          <span className="text-white font-bold text-sm drop-shadow line-clamp-1">{banner.title}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom save bar */}
        <div className="mt-8 flex items-center justify-between bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-sm text-gray-500">Changes are not saved automatically — click Save Changes to apply.</p>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold hover:opacity-90 transition-all"
            style={{ backgroundColor: saved ? '#10B981' : '#FFC107', color: saved ? '#FFF' : '#111' }}
          >
            <Save size={16} />
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
