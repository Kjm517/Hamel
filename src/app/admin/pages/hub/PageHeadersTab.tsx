import { useState, useRef } from 'react';
import { getBanners, saveBanners, defaultBanners, PAGE_LABELS, type BannerStore, type PageKey } from '../../../data/banners';
import type { BannerConfig } from '../../../components/PageBanner';
import { PageBanner } from '../../../components/PageBanner';
import { ImageUrlOrUploadField } from '../../components/ImageUrlOrUploadField';
import { IMAGE_SIZE_GUIDES } from '../../lib/image-size-guides';
import { BannerLinkDestinationField } from '../../components/BannerLinkDestinationField';
import { AdminSaveBar } from '../../components/AdminSaveBar';
import { useAdminConfirm } from '../../components/AdminConfirmDialog';
import { mediaPathFor } from '../../../lib/storage';
import { PageEditorIntro } from './PageEditorIntro';

const PAGE_KEYS: PageKey[] = ['products', 'brands', 'why-hamel', 'contact'];

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

export function PageHeadersTab() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [store, setStore] = useState<BannerStore>(() => getBanners());
  const [active, setActive] = useState<PageKey>('products');
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const banner = store[active];

  const patch = (patch: Partial<BannerConfig>) => {
    setStore((prev) => ({ ...prev, [active]: { ...prev[active], ...patch } }));
    setSaved(false);
  };

  const save = () => {
    void saveBanners(store);
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      {confirmDialog}
      <PageEditorIntro
        title="Other page headers"
        description="Top banner photo and text for Products, Brands, Why Hamel, and Contact. Pick a page, edit, then save."
        saveMode="manual"
        previewHref={`/${active === 'why-hamel' ? 'why-hamel' : active}`}
      />

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-800">1. Pick a page</p>
        <div className="flex flex-wrap gap-2">
        {PAGE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors"
            style={{
              borderColor: active === key ? '#0EA5E9' : '#E5E7EB',
              backgroundColor: active === key ? '#E0F2FE' : '#FFF',
              color: active === key ? '#0369A1' : '#4B5563',
            }}
          >
            {PAGE_LABELS[key].replace(' Page', '')}
          </button>
        ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-800">2. Preview</p>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <PageBanner config={banner} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-5 bg-white space-y-3">
        <p className="text-sm font-semibold text-gray-800">3. Edit this banner</p>
        <BannerLinkDestinationField fields={banner} onChange={patch} />
        <Field label="Headline" value={banner.title} onChange={(v) => patch({ title: v })} />
        <Field label="Short description" value={banner.subtitle || ''} onChange={(v) => patch({ subtitle: v })} rows={2} />
        <Field label="Button text" value={banner.ctaLabel || ''} onChange={(v) => patch({ ctaLabel: v })} />
        <ImageUrlOrUploadField
          label="Background photo"
          value={banner.imageUrl}
          onChange={(v) => patch({ imageUrl: v })}
          remoteUpload={{ getObjectPath: mediaPathFor('page-headers') }}
          sizeGuide={IMAGE_SIZE_GUIDES.pageHeader}
        />
      </div>

      <AdminSaveBar
        saved={saved}
        onSave={save}
        onReset={() => {
          void (async () => {
            const ok = await confirm({
              title: 'Reset all page headers?',
              description: 'Restore default header banners for Products, Brands, Why Hamel, and Contact.',
              confirmLabel: 'Reset',
              tone: 'danger',
            });
            if (!ok) return;
            const next = { ...getBanners() };
            for (const k of PAGE_KEYS) next[k] = { ...defaultBanners[k] };
            setStore(next);
            setSaved(false);
          })();
        }}
      />
    </div>
  );
}
