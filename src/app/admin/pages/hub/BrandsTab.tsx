import { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import {
  getBrandsPage,
  saveBrandsPage,
  resetBrandsPage,
  defaultBrandsPage,
  createBrandCard,
  brandProductsHref,
  brandCatalogKey,
  countProductsForBrand,
  formatModelCount,
  defaultCtaLabel,
  type BrandsPageConfig,
  type BrandCardConfig,
} from '../../../data/brands-page';
import { useCatalog } from '../../../context/CatalogContext';
import { ImageUrlOrUploadField } from '../../components/ImageUrlOrUploadField';
import { SortableList } from '../../components/SortableList';
import { AdminSaveBar } from '../../components/AdminSaveBar';
import { PageEditorIntro } from './PageEditorIntro';

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

export function BrandsTab() {
  const { products, loading: catalogLoading } = useCatalog();
  const [config, setConfig] = useState<BrandsPageConfig>(() => getBrandsPage());
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutoSave = useRef(true);
  const configRef = useRef(config);
  configRef.current = config;

  const persistNow = useCallback(() => {
    void saveBrandsPage(configRef.current);
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
  }, [config, queuePersist]);

  const patchBrand = (id: string, patch: Partial<BrandCardConfig>) => {
    setConfig((prev) => ({
      brands: prev.brands.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const save = () => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistNow();
  };

  return (
    <div className="space-y-5">
      <PageEditorIntro
        title="Brands page"
        description="Arrange the brand cards customers see. Hide a brand if you don’t want it shown. The model count updates from your products automatically."
        saveMode="auto"
        previewHref="/brands"
        showDragTip
      />

      <SortableList
        items={config.brands}
        onReorder={(brands) => setConfig({ brands })}
        renderItem={(brand) => (
          <div className="pr-3 py-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-800 truncate">{brand.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => patchBrand(brand.id, { enabled: !brand.enabled })} className="text-gray-500" title={brand.enabled ? 'Hide on site' : 'Show on site'}>
                  {brand.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(`Remove "${brand.name}"?`)) return;
                    setConfig((p) => ({ brands: p.brands.filter((b) => b.id !== brand.id) }));
                  }}
                  className="text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <Field label="Brand name" value={brand.name} onChange={(v) => patchBrand(brand.id, { name: v })} />
            <Field
              label="Catalog brand name (optional)"
              value={brand.catalogBrandName ?? ''}
              onChange={(v) => patchBrand(brand.id, { catalogBrandName: v.trim() || undefined })}
            />
            <p className="text-[11px] text-gray-500 -mt-1 mb-2">
              {catalogLoading
                ? 'Counting products from database…'
                : (() => {
                    const n = countProductsForBrand(products, brand);
                    const key = brandCatalogKey(brand);
                    return (
                      <>
                        <strong>{formatModelCount(n)}</strong> in catalog
                        {key ? (
                          <>
                            {' '}
                            (products where brand = &quot;{key}&quot;)
                          </>
                        ) : null}
                        {n === 0 && key ? ' — add products in Admin → Products or fix the name to match.' : null}
                      </>
                    );
                  })()}
            </p>
            <Field label="Description" value={brand.description} onChange={(v) => patchBrand(brand.id, { description: v })} rows={3} />
            <ImageUrlOrUploadField
              label="Logo image"
              value={brand.logoImageUrl || ''}
              onChange={(v) => patchBrand(brand.id, { logoImageUrl: v || undefined })}
            />
            {brand.logoImageUrl && (
              <button type="button" onClick={() => patchBrand(brand.id, { logoImageUrl: undefined })} className="text-xs text-gray-500 hover:text-red-500">
                Remove logo image
              </button>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Features (one per line)</label>
              <textarea
                value={brand.features.join('\n')}
                onChange={(e) =>
                  patchBrand(brand.id, {
                    features: e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <Field
              label="Button text"
              value={brand.ctaLabel ?? defaultCtaLabel(brand.name)}
              onChange={(v) => patchBrand(brand.id, { ctaLabel: v })}
            />
            <Field
              label="Button link"
              value={brand.ctaHref ?? brandProductsHref(brand)}
              onChange={(v) => patchBrand(brand.id, { ctaHref: v })}
            />
            {!brand.enabled && <p className="text-xs text-amber-600">Hidden on the public Brands page.</p>}
          </div>
        )}
      />

      <button
        type="button"
        onClick={() => setConfig((p) => ({ brands: [...p.brands, createBrandCard()] }))}
        className="text-sm font-semibold text-[#0EA5E9]"
      >
        + Add brand
      </button>

      <AdminSaveBar
        saved={saved}
        onSave={save}
        onReset={() => {
          if (!confirm('Reset all brand cards to defaults?')) return;
          void resetBrandsPage().then(() => {
            setConfig(JSON.parse(JSON.stringify(defaultBrandsPage)));
          });
        }}
        resetLabel="Reset brands"
      />
    </div>
  );
}
