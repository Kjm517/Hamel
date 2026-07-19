import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Trash2, Upload } from 'lucide-react';
import {
  getBrandsPage,
  loadBrandsPage,
  saveBrandsPage,
  resetBrandsPage,
  defaultBrandsPage,
  createBrandCard,
  brandProductsHref,
  brandCatalogKey,
  countProductsForBrand,
  formatModelCount,
  defaultCtaLabel,
  enabledBrands,
  type BrandsPageConfig,
  type BrandCardConfig,
} from '../../../data/brands-page';
import { useCatalog } from '../../../context/CatalogContext';
import { ImageUrlOrUploadField } from '../../components/ImageUrlOrUploadField';
import { SortableList } from '../../components/SortableList';
import { AdminSaveBar } from '../../components/AdminSaveBar';
import { AdminToggle } from '../../components/AdminToggle';
import { PageEditorIntro } from './PageEditorIntro';
import { useAdminConfirm } from '../../components/AdminConfirmDialog';
import { uploadToPublicStorage } from '../../../lib/storage';

function Field({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="mb-2">
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}

export function BrandsTab() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const { products, loading: catalogLoading } = useCatalog();
  const [config, setConfig] = useState<BrandsPageConfig>(() => getBrandsPage());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutoSave = useRef(true);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const configRef = useRef(config);
  configRef.current = config;

  const visibleBrands = useMemo(() => enabledBrands(config), [config]);
  const selected = config.brands.find((b) => b.id === selectedId) ?? null;

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
    let cancelled = false;
    void loadBrandsPage().then((data) => {
      if (cancelled) return;
      skipAutoSave.current = true;
      setConfig(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const addBrand = () => {
    const name = newName.trim();
    if (!name) return;
    const item = {
      ...createBrandCard(),
      name,
      logoImageUrl: newLogoUrl || undefined,
      ctaHref: `/products?brand=${encodeURIComponent(name)}`,
    };
    setConfig((prev) => ({ brands: [...prev.brands, item] }));
    setSelectedId(item.id);
    setNewName('');
    setNewLogoUrl('');
  };

  const onQuickLogo = async (file: File | undefined) => {
    if (!file) return;
    setAdding(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const safe = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) ? ext : 'png';
      const path = `brand-logos/${Date.now()}.${safe}`;
      const url = await uploadToPublicStorage(file, path);
      setNewLogoUrl(url);
    } catch {
      // ignore — admin can still add without logo
    } finally {
      setAdding(false);
    }
  };

  const save = () => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistNow();
  };

  return (
    <div className="space-y-5">
      {confirmDialog}
      <PageEditorIntro
        title="Brands admin"
        description="Add brands customers can browse. New ones show up on the brands page and in the product filter."
        saveMode="auto"
        previewHref="/products"
        showDragTip
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addBrand();
            }
          }}
          placeholder="New brand name (e.g. Hitachi)"
          className="min-w-[220px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void onQuickLogo(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          disabled={adding}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Upload className="h-4 w-4" />
          {newLogoUrl ? 'Logo ready' : 'Logo'}
        </button>
        <button
          type="button"
          onClick={addBrand}
          disabled={!newName.trim()}
          className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add brand
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <SortableList
            items={config.brands}
            onReorder={(brands) => setConfig({ brands })}
            rowClassName="!p-0 overflow-hidden"
            renderItem={(brand) => {
              const isSelected = selectedId === brand.id;
              return (
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : brand.id)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                      isSelected ? 'bg-[#F0F9FF]' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border bg-white p-2 ${
                        brand.enabled ? 'border-gray-200' : 'border-gray-100 opacity-40 grayscale'
                      }`}
                    >
                      {brand.logoImageUrl ? (
                        <img
                          src={brand.logoImageUrl}
                          alt=""
                          className="max-h-10 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-400">
                          {brand.name.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{brand.name}</p>
                      <p
                        className={`mt-0.5 text-xs font-semibold ${
                          brand.enabled ? 'text-[#0EA5E9]' : 'text-gray-400'
                        }`}
                      >
                        {brand.enabled ? 'Visible' : 'Hidden'}
                      </p>
                    </div>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <AdminToggle
                        checked={brand.enabled}
                        onChange={(checked) => patchBrand(brand.id, { enabled: checked })}
                        label={brand.enabled ? 'Hide brand' : 'Show brand'}
                      />
                    </div>
                  </button>

                  {isSelected && (
                    <div className="space-y-2 border-t border-[#BAE6FD] bg-[#F8FBFF] px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#0369A1]">
                          Edit brand
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            void (async () => {
                              const ok = await confirm({
                                title: `Remove "${brand.name}"?`,
                                description: 'This brand card will be removed from the brands page.',
                                confirmLabel: 'Remove',
                                tone: 'danger',
                              });
                              if (!ok) return;
                              setConfig((p) => ({
                                brands: p.brands.filter((b) => b.id !== brand.id),
                              }));
                              setSelectedId(null);
                            })();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-500"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                      <Field
                        label="Brand name"
                        value={brand.name}
                        onChange={(v) => patchBrand(brand.id, { name: v })}
                      />
                      <Field
                        label="Catalog brand name (optional)"
                        value={brand.catalogBrandName ?? ''}
                        onChange={(v) =>
                          patchBrand(brand.id, { catalogBrandName: v.trim() || undefined })
                        }
                        placeholder="Must match product.brand in catalog"
                      />
                      <p className="text-[11px] text-gray-500">
                        {catalogLoading
                          ? 'Counting products from database…'
                          : (() => {
                              const n = countProductsForBrand(products, brand);
                              const key = brandCatalogKey(brand);
                              return (
                                <>
                                  <strong>{formatModelCount(n)}</strong> in catalog
                                  {key ? <> (products where brand = &quot;{key}&quot;)</> : null}
                                  {n === 0 && key
                                    ? ' — add products in Admin → Products or fix the name to match.'
                                    : null}
                                </>
                              );
                            })()}
                      </p>
                      <Field
                        label="Description"
                        value={brand.description}
                        onChange={(v) => patchBrand(brand.id, { description: v })}
                        rows={3}
                      />
                      <ImageUrlOrUploadField
                        label="Logo image"
                        value={brand.logoImageUrl || ''}
                        onChange={(v) => patchBrand(brand.id, { logoImageUrl: v || undefined })}
                        remoteUpload={{
                          getObjectPath: (file) => {
                            const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
                            return `brand-logos/${brand.id}-${Date.now()}.${ext}`;
                          },
                        }}
                      />
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Features (one per line)
                        </label>
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
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>

        <aside className="h-fit rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-4 xl:sticky xl:top-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#0369A1]">
            Storefront preview · brand filter
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">Shop by brand</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {visibleBrands.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-2 rounded-lg border border-white bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 shadow-sm"
              >
                {b.logoImageUrl ? (
                  <img src={b.logoImageUrl} alt="" className="h-5 w-5 object-contain" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-[9px]">
                    {b.name.slice(0, 1)}
                  </span>
                )}
                {b.name}
              </span>
            ))}
            {visibleBrands.length === 0 && (
              <span className="text-xs text-gray-500">No enabled brands yet.</span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            Enabled brands appear on Products only when they have active catalog products.
            Category and HP options also update from the database as filters change.
          </p>
          {selected && (
            <p className="mt-3 rounded-lg bg-white/80 px-2.5 py-2 text-[11px] text-gray-600">
              Editing <strong>{selected.name}</strong>
              {!selected.enabled ? ' (currently hidden)' : ''}
            </p>
          )}
        </aside>
      </div>

      <AdminSaveBar
        saved={saved}
        onSave={save}
        onReset={() => {
          void (async () => {
            const ok = await confirm({
              title: 'Reset all brand cards?',
              description: 'Restore the default brand list. Custom brands will be lost.',
              confirmLabel: 'Reset',
              tone: 'danger',
            });
            if (!ok) return;
            void resetBrandsPage().then(() => {
              skipAutoSave.current = true;
              setConfig(JSON.parse(JSON.stringify(defaultBrandsPage)));
              setSelectedId(null);
            });
          })();
        }}
        resetLabel="Reset brands"
      />
    </div>
  );
}
