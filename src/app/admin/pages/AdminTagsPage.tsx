import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { CornerTag, PromoChip } from '../../components/PromoBadge';
import { useProductTags } from '../../context/ProductTagsContext';
import { useCatalog } from '../../context/CatalogContext';
import { checkStorageBucket, DEFAULT_STORAGE_BUCKET, mediaPathFor } from '../../lib/storage';
import {
  cornerTagBgColor,
  cornerTagTextColor,
  cornerTagVariant,
  resolveProductCornerTags,
} from '../../lib/product-corner-tags';
import { getProductPromoList } from '../../lib/product-promos';
import {
  CORNER_AUTO_RULE_LABELS,
  deleteProductTag,
  getStyleColors,
  isCornerTag,
  isPromoTag,
  PROMO_BADGE_STYLE_LABELS,
  resetProductTags,
  saveProductTags,
  type ChipRenderMode,
  type CornerTagAutoRule,
  type ProductTag,
  type PromoBadgeStyle,
} from '../../data/productTags';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { IMAGE_SIZE_GUIDES } from '../lib/image-size-guides';
import { hexForColorInput } from '../../lib/color-utils';
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

const STYLE_OPTIONS = Object.keys(PROMO_BADGE_STYLE_LABELS) as PromoBadgeStyle[];

const emptyPromoTag = (): ProductTag => ({
  id: '',
  name: '',
  style: 'flash-sale',
  placement: 'promo',
  renderMode: 'composed',
  iconEmoji: '⚡',
});

const emptyCornerTag = (): ProductTag => ({
  id: '',
  name: 'SALE',
  style: 'flash-sale',
  placement: 'corner',
  autoApply: 'manual',
  textBgColor: '#EA580C',
  iconBgColor: '#FFFFFF',
});

function TagChipUploadGuide() {
  return (
    <div className={adminUi.tip}>
      <div>
        <p className="mb-2 text-sm font-semibold">Full chip image</p>
        <ul className="space-y-1.5 text-xs leading-relaxed">
          <li>
            Best as a PNG with a transparent background, around <strong>320×56</strong> px. The
            whole image is the sticker.
          </li>
          <li>
            Prefer <strong>Image chip</strong> when you have a ready graphic. Composed mode builds
            a simpler sticker from icon + colors.
          </li>
          <li>Max file size 25 MB.</li>
        </ul>
      </div>
    </div>
  );
}

function TagIconUploadGuide() {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
      <p className="mb-2 text-sm font-semibold">Small icon (composed chips only)</p>
      <ul className="space-y-1.5 text-xs leading-relaxed">
        <li>Square PNG, about 64×64 or 128×128. Shows small on the card.</li>
        <li>Not used when the chip is an uploaded image.</li>
      </ul>
    </div>
  );
}

export function AdminTagsPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const { tags, loading, error, reload } = useProductTags();
  const { products } = useCatalog();
  const [tab, setTab] = useState<'promo' | 'corner'>('promo');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductTag>(emptyPromoTag);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const result = await checkStorageBucket();
      setStorageWarning(result.ok ? null : result.message);
    })();
  }, []);

  const visibleTags = tags.filter((t) => (tab === 'corner' ? isCornerTag(t) : isPromoTag(t)));

  const usageByTagId = useMemo(() => {
    const map = new Map<string, number>();
    for (const tag of tags) {
      if (isCornerTag(tag)) {
        const count = products.filter((p) =>
          resolveProductCornerTags(p, tags).some((t) => t.id === tag.id)
        ).length;
        map.set(tag.id, count);
      } else {
        const count = products.filter((p) =>
          getProductPromoList(p).some((pr) => pr.tagId === tag.id)
        ).length;
        map.set(tag.id, count);
      }
    }
    return map;
  }, [tags, products]);

  const openCreate = () => {
    setEditingId(null);
    const base = tab === 'corner' ? emptyCornerTag() : emptyPromoTag();
    setForm({
      ...base,
      id: tab === 'corner' ? `corner-${Date.now()}` : `tag-${Date.now()}`,
    });
    setFormOpen(true);
  };

  const openEdit = (tag: ProductTag) => {
    setEditingId(tag.id);
    setForm({ ...tag });
    setFormOpen(true);
  };

  const handleSaveForm = async () => {
    if (!form.name.trim()) return;
    const next = editingId
      ? tags.map((t) => (t.id === editingId ? { ...form, name: form.name.trim() } : t))
      : [...tags, { ...form, name: form.name.trim() }];
    setSaving(true);
    setSaveError(null);
    try {
      await saveProductTags(next);
      setFormOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await reload();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save tags');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this tag?',
      description: 'Products using it will fall back to their saved label/style.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    const next = tags.filter((t) => t.id !== id);
    setSaving(true);
    setSaveError(null);
    try {
      await deleteProductTag(id);
      await saveProductTags(next);
      await reload();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to delete tag');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset all tags to defaults?',
      description: 'Custom tags will be removed. This cannot be undone.',
      confirmLabel: 'Reset',
      tone: 'danger',
    });
    if (!ok) return;
    setSaving(true);
    setSaveError(null);
    try {
      await resetProductTags();
      await reload();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to reset tags');
    } finally {
      setSaving(false);
    }
  };

  const previewColors = getStyleColors(form.style);
  const isCornerForm = isCornerTag(form);

  return (
    <div className="space-y-5">
      {confirmDialog}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={adminUi.pageIntro}>
            {tab === 'promo'
              ? 'These stickers show under the price on product cards. Upload your own image, or use the built-in style. You can put up to 4 on each product.'
              : 'Small labels above the product name, like −15% or INVERTER. Solid fills for deals, outline for specs.'}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setTab('promo')}
              className={`rounded-[11px] border px-4 py-2 text-[13.5px] font-semibold transition ${
                tab === 'promo'
                  ? 'border-[#0ea5e9] bg-[#e0f2fe] text-[#0369a1]'
                  : 'border-[#e4ebf2] bg-white text-[#516171] hover:bg-[#f7fafd]'
              }`}
            >
              Promo chips
            </button>
            <button
              type="button"
              onClick={() => setTab('corner')}
              className={`rounded-[11px] border px-4 py-2 text-[13.5px] font-semibold transition ${
                tab === 'corner'
                  ? 'border-[#0ea5e9] bg-[#e0f2fe] text-[#0369a1]'
                  : 'border-[#e4ebf2] bg-white text-[#516171] hover:bg-[#f7fafd]'
              }`}
            >
              Corner badges
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleReset} className={adminUi.btnGhost}>
            <RotateCcw className="h-4 w-4" />
            Reset defaults
          </button>
          <button type="button" onClick={openCreate} className={adminUi.btnPrimary}>
            <Plus className="h-[17px] w-[17px]" strokeWidth={2.2} />
            Add tag
          </button>
        </div>
      </div>

      {storageWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950">
          {storageWarning}
          <p className="mt-1 text-xs opacity-90">
            Upload folder: <strong>{DEFAULT_STORAGE_BUCKET}</strong>
          </p>
        </div>
      )}
      {loading && (
        <p className="text-sm text-gray-500">Loading tags from database…</p>
      )}
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            Could not load full tag schema from API: {error}. Showing cached defaults.
          </p>
          {/placement|auto_rule/i.test(error) && (
            <p className="mt-2 text-xs leading-relaxed">
              <strong>Fix:</strong> In Neon → SQL Editor, run{' '}
              <code className="rounded bg-amber-100 px-1">server/sql/001_schema.sql</code>{' '}
              (includes <code className="rounded bg-amber-100 px-1">placement</code> and{' '}
              <code className="rounded bg-amber-100 px-1">auto_rule</code> columns), then refresh this page.
            </p>
          )}
        </div>
      )}
      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{saveError}</p>
          {/placement|auto_rule/i.test(saveError) && (
            <p className="mt-2 text-xs leading-relaxed text-red-900/90">
              Run <code className="rounded bg-red-100 px-1">server/sql/001_schema.sql</code> in Neon SQL
              Editor, then try saving again.
            </p>
          )}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          Tags saved to database.
        </div>
      )}

      {formOpen && (
        <div className={`${adminUi.card} p-6`}>
          <h3 className="mb-4 text-[16px] font-bold text-[#1e2a38]">
            {editingId ? 'Edit tag' : 'New tag'}
          </h3>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  {isCornerForm ? 'Label (shown on card, e.g. SALE, BEST SELLER)' : 'Tag name (shown on card)'}
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))}
                  placeholder={isCornerForm ? 'SALE' : '15% OFF'}
                  maxLength={isCornerForm ? 14 : 40}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                />
              </label>
              {isCornerForm && (
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">When to show</span>
                  <select
                    value={form.autoApply ?? 'manual'}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        autoApply: e.target.value as CornerTagAutoRule,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  >
                    {(Object.keys(CORNER_AUTO_RULE_LABELS) as CornerTagAutoRule[]).map((key) => (
                      <option key={key} value={key}>
                        {CORNER_AUTO_RULE_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!isCornerForm && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Second line (optional)</span>
                <input
                  value={form.subtitle ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value || undefined }))}
                  placeholder="e.g. INSTALLATION"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                />
              </label>
              )}
              {!isCornerForm && (
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">
                  Description (shown when chip is clicked)
                </span>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value.trim() ? e.target.value : undefined }))
                  }
                  rows={4}
                  placeholder="Explain this offer for customers — terms, who it applies to, how to claim…"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Opens in a Special Offers popup when shoppers click this chip on product cards.
                </p>
              </label>
              )}
              {!isCornerForm && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Chip render mode</span>
                <select
                  value={form.renderMode ?? (form.chipImageUrl ? 'image' : 'composed')}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      renderMode: e.target.value as ChipRenderMode,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                >
                  <option value="composed">Composed (icon + text)</option>
                  <option value="image">Image chip (uploaded graphic)</option>
                </select>
              </label>
              )}
              {!isCornerForm && <TagChipUploadGuide />}
              {!isCornerForm && (
              <ImageUrlOrUploadField
                label="Full chip image"
                value={form.chipImageUrl ?? ''}
                onChange={(url) =>
                  setForm((f) => ({
                    ...f,
                    chipImageUrl: url || undefined,
                    renderMode: url ? 'image' : f.renderMode ?? 'composed',
                  }))
                }
                remoteUpload={{ getObjectPath: mediaPathFor('tag-icons') }}
                sizeGuide={IMAGE_SIZE_GUIDES.tagChip}
              />
              )}
              {!isCornerForm && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Badge style</span>
                <select
                  value={form.style}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      style: e.target.value as PromoBadgeStyle,
                      iconBgColor: undefined,
                      textBgColor: undefined,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                >
                  {STYLE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {PROMO_BADGE_STYLE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              )}
              {!isCornerForm && (form.renderMode ?? 'composed') !== 'image' && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Icon emoji (optional)</span>
                <input
                  value={form.iconEmoji ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, iconEmoji: e.target.value || undefined, iconUrl: undefined }))
                  }
                  placeholder="⚡ ★ ₱"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                />
                <p className="mt-1 text-xs text-gray-500">Only used when no icon image is set below.</p>
              </label>
              )}
              {!isCornerForm && (form.renderMode ?? 'composed') !== 'image' && <TagIconUploadGuide />}
              {!isCornerForm && (form.renderMode ?? 'composed') !== 'image' && (
              <ImageUrlOrUploadField
                label="Icon image (API upload)"
                value={form.iconUrl ?? ''}
                onChange={(url) =>
                  setForm((f) => ({ ...f, iconUrl: url || undefined, iconEmoji: url ? undefined : f.iconEmoji }))
                }
                remoteUpload={{ getObjectPath: mediaPathFor('tag-icons') }}
                sizeGuide={IMAGE_SIZE_GUIDES.tagIcon}
              />
              )}
              <div className="grid grid-cols-2 gap-3">
                {!isCornerForm && (form.renderMode ?? 'composed') !== 'image' && (
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Icon background</span>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      value={hexForColorInput(form.iconBgColor ?? previewColors.iconBg)}
                      onChange={(e) => setForm((f) => ({ ...f, iconBgColor: e.target.value }))}
                      className="h-9 w-9 cursor-pointer rounded border border-gray-200"
                    />
                    <input
                      type="text"
                      value={form.iconBgColor ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, iconBgColor: e.target.value || undefined }))
                      }
                      placeholder={previewColors.iconBg}
                      className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                    />
                  </div>
                </label>
                )}
                {((!isCornerForm && (form.renderMode ?? 'composed') !== 'image') || isCornerForm) && (
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">
                    {isCornerForm ? 'Badge background' : 'Text background'}
                  </span>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      value={hexForColorInput(form.textBgColor ?? previewColors.textBg)}
                      onChange={(e) => setForm((f) => ({ ...f, textBgColor: e.target.value }))}
                      className="h-9 w-9 cursor-pointer rounded border border-gray-200"
                    />
                    <input
                      type="text"
                      value={form.textBgColor ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, textBgColor: e.target.value || undefined }))
                      }
                      placeholder={previewColors.textBg}
                      className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                    />
                  </div>
                </label>
                )}
                {isCornerForm && (
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Text color</span>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      value={hexForColorInput(form.iconBgColor ?? '#FFFFFF')}
                      onChange={(e) => setForm((f) => ({ ...f, iconBgColor: e.target.value }))}
                      className="h-9 w-9 cursor-pointer rounded border border-gray-200"
                    />
                    <input
                      type="text"
                      value={form.iconBgColor ?? '#FFFFFF'}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, iconBgColor: e.target.value || undefined }))
                      }
                      className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                    />
                  </div>
                </label>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-slate-100 p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Preview
              </p>
              {isCornerForm ? (
                <div className="flex w-full max-w-[220px] flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap gap-1.5">
                    <CornerTag
                      variant={cornerTagVariant(form)}
                      label={form.name || 'SALE'}
                      color={
                        cornerTagVariant(form) === 'outline'
                          ? cornerTagBgColor(form)
                          : cornerTagTextColor(form)
                      }
                      bgColor={cornerTagBgColor(form)}
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-800">Product title preview</div>
                  <div className="text-sm font-bold text-[#0EA5E9]">₱24,225</div>
                </div>
              ) : (
                <PromoChip
                  badgeType={form.style}
                  label={form.name || 'Tag name'}
                  subtitle={form.subtitle}
                  chipImageUrl={form.chipImageUrl}
                  renderMode={form.renderMode}
                  iconUrl={form.iconUrl}
                  iconEmoji={form.iconEmoji}
                  iconBgColor={form.iconBgColor ?? previewColors.iconBg}
                  textBgColor={form.textBgColor ?? previewColors.textBg}
                  size="card"
                />
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void handleSaveForm()}
              disabled={saving}
              className={adminUi.btnAmber}
            >
              {saving ? 'Saving…' : 'Save tag'}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className={adminUi.btnGhost}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={`${adminUi.card} overflow-hidden`}>
        <div className="overflow-x-auto">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className={adminUi.tableHead}>
              <th className="px-[18px] py-3">Tag</th>
              <th className="px-3 py-3">Used</th>
              <th className="px-3 py-3">{tab === 'corner' ? 'Auto rule' : 'Style'}</th>
              {tab === 'promo' && <th className="px-3 py-3">Mode</th>}
              <th className="px-[18px] py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleTags.map((tag) => {
              const colors = getStyleColors(tag.style);
              const used = usageByTagId.get(tag.id) ?? 0;
              return (
                <tr key={tag.id} className="border-b border-slate-100">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded"
                        style={{
                          backgroundColor: isCornerTag(tag)
                            ? cornerTagBgColor(tag)
                            : tag.textBgColor ?? colors.textBg,
                        }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">{tag.name}</div>
                        <div className="mt-1.5">
                          {isCornerTag(tag) ? (
                            <CornerTag
                              variant={cornerTagVariant(tag)}
                              label={tag.name}
                              color={
                                cornerTagVariant(tag) === 'outline'
                                  ? cornerTagBgColor(tag)
                                  : cornerTagTextColor(tag)
                              }
                              bgColor={cornerTagBgColor(tag)}
                            />
                          ) : (
                            <PromoChip
                              badgeType={tag.style}
                              label={tag.name}
                              subtitle={tag.subtitle}
                              chipImageUrl={tag.chipImageUrl}
                              renderMode={tag.renderMode}
                              iconUrl={tag.iconUrl}
                              iconEmoji={tag.iconEmoji}
                              iconBgColor={tag.iconBgColor ?? colors.iconBg}
                              textBgColor={tag.textBgColor ?? colors.textBg}
                              size="card"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500">
                    {used} {used === 1 ? 'product' : 'products'}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-600">
                    {isCornerTag(tag)
                      ? CORNER_AUTO_RULE_LABELS[tag.autoApply ?? 'manual']
                      : PROMO_BADGE_STYLE_LABELS[tag.style]}
                  </td>
                  {tab === 'promo' && (
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {(tag.renderMode ?? (tag.chipImageUrl ? 'image' : 'composed')) ===
                      'image'
                        ? 'Image'
                        : 'Composed'}
                    </td>
                  )}
                  <td className="px-6 py-3.5">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(tag)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-[#0EA5E9]"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleTags.length === 0 && (
              <tr>
                <td
                  colSpan={tab === 'promo' ? 5 : 4}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No tags yet. Click Add tag to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
