import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { CornerTag, PromoBadge } from '../../components/PromoBadge';
import { useProductTags } from '../../context/ProductTagsContext';
import { checkStorageBucket, DEFAULT_STORAGE_BUCKET } from '../../lib/storage';
import {
  cornerTagBgColor,
  cornerTagTextColor,
} from '../../lib/product-corner-tags';
import {
  CORNER_AUTO_RULE_LABELS,
  deleteProductTag,
  getStyleColors,
  isCornerTag,
  isPromoTag,
  PROMO_BADGE_STYLE_LABELS,
  resetProductTags,
  saveProductTags,
  type CornerTagAutoRule,
  type ProductTag,
  type PromoBadgeStyle,
} from '../../data/productTags';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { hexForColorInput } from '../../lib/color-utils';

const STYLE_OPTIONS = Object.keys(PROMO_BADGE_STYLE_LABELS) as PromoBadgeStyle[];

const emptyPromoTag = (): ProductTag => ({
  id: '',
  name: '',
  style: 'flash-sale',
  placement: 'promo',
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

function TagIconUploadGuide() {
  return (
    <div className="rounded-lg border border-[#BAE6FD] bg-[#F0F9FF] px-4 py-3 text-[#0C4A6E]">
      <p className="mb-2 text-sm font-semibold">Icon image guide</p>
      <ul className="space-y-1.5 text-xs leading-relaxed">
        <li>
          <span className="font-medium">Recommended size:</span> 64×64 px or 128×128 px, square.
          Displays at about 18×18 px on product cards.
        </li>
        <li>
          <span className="font-medium">Format:</span> PNG (transparent background works best). Icons
          show in <strong>full color</strong>. Simple graphics read better at chip size (~18×18 px)
          than detailed photos.
        </li>
        <li>
          <span className="font-medium">Max file size:</span> 3 MB.
        </li>
        <li>
          <span className="font-medium">Upload:</span> Drag and drop or click below — the file name is
          created automatically (e.g. <span className="font-mono">tag-icons/name-abc12345.png</span>).
          Folder: <span className="font-mono">{DEFAULT_STORAGE_BUCKET}</span>.
        </li>
        <li>
          <span className="font-medium">Already uploaded?</span> Paste the public URL (e.g.{' '}
          <span className="font-mono">/uploads/…</span>).
        </li>
        <li>
          <span className="font-medium">Emoji vs image:</span> If you upload or paste an image, the emoji
          field is ignored. Use one or the other.
        </li>
        <li>
          Click <span className="font-medium">Save tag</span> when finished so the homepage and product
          cards update.
        </li>
      </ul>
    </div>
  );
}

export function AdminTagsPage() {
  const { tags, loading, error, reload } = useProductTags();
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
    if (!window.confirm('Delete this tag? Products using it will fall back to their saved label/style.')) return;
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
    if (!window.confirm('Reset all tags to defaults?')) return;
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product tags</h2>
          <p className="text-gray-600">
            {tab === 'promo'
              ? 'Promo stickers on the product image (e.g. 15% OFF). Assign up to 4 per product.'
              : 'Corner badges (SALE, INV, TOP) on the top-right of the card. Use auto rules or pick per product.'}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setTab('promo')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold border-2 transition-colors ${
                tab === 'promo' ? 'border-[#0EA5E9] bg-[#E0F2FE] text-[#0369A1]' : 'border-gray-200 text-gray-600'
              }`}
            >
              Promo chips
            </button>
            <button
              type="button"
              onClick={() => setTab('corner')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold border-2 transition-colors ${
                tab === 'corner' ? 'border-[#0EA5E9] bg-[#E0F2FE] text-[#0369A1]' : 'border-gray-200 text-gray-600'
              }`}
            >
              Corner badges
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset defaults
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0284C7]"
          >
            <Plus className="h-4 w-4" />
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
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">
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
              {!isCornerForm && (
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
              {!isCornerForm && <TagIconUploadGuide />}
              {!isCornerForm && (
              <ImageUrlOrUploadField
                label="Icon image (API upload)"
                value={form.iconUrl ?? ''}
                onChange={(url) =>
                  setForm((f) => ({ ...f, iconUrl: url || undefined, iconEmoji: url ? undefined : f.iconEmoji }))
                }
                remoteUpload={{}}
              />
              )}
              <div className="grid grid-cols-2 gap-3">
                {!isCornerForm && (
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
            <div className="flex flex-col items-center justify-center rounded-lg bg-gray-100 p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Preview</p>
              {isCornerForm ? (
                <CornerTag
                  label={form.name || 'SALE'}
                  color={cornerTagTextColor(form)}
                  bgColor={cornerTagBgColor(form)}
                />
              ) : (
                <PromoBadge
                  badgeType={form.style}
                  label={form.name || 'Tag name'}
                  subtitle={form.subtitle}
                  iconUrl={form.iconUrl}
                  iconEmoji={form.iconEmoji}
                  iconBgColor={form.iconBgColor ?? previewColors.iconBg}
                  textBgColor={form.textBgColor ?? previewColors.textBg}
                  size="md"
                />
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void handleSaveForm()}
              disabled={saving}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-amber-500 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save tag'}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-500">Preview</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-500">Name</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-500">
                {tab === 'corner' ? 'Auto rule' : 'Style'}
              </th>
              {tab === 'promo' && (
                <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-500">Icon</th>
              )}
              <th className="px-6 py-3 text-xs font-semibold uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleTags.map((tag) => {
              const colors = getStyleColors(tag.style);
              return (
                <tr key={tag.id} className="border-b border-gray-100">
                  <td className="px-6 py-4">
                    {isCornerTag(tag) ? (
                      <CornerTag
                        label={tag.name}
                        color={cornerTagTextColor(tag)}
                        bgColor={cornerTagBgColor(tag)}
                      />
                    ) : (
                      <PromoBadge
                        badgeType={tag.style}
                        label={tag.name}
                        subtitle={tag.subtitle}
                        iconUrl={tag.iconUrl}
                        iconEmoji={tag.iconEmoji}
                        iconBgColor={tag.iconBgColor ?? colors.iconBg}
                        textBgColor={tag.textBgColor ?? colors.textBg}
                        size="sm"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{tag.name}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {isCornerTag(tag)
                      ? CORNER_AUTO_RULE_LABELS[tag.autoApply ?? 'manual']
                      : PROMO_BADGE_STYLE_LABELS[tag.style]}
                  </td>
                  {tab === 'promo' && (
                  <td className="px-6 py-4 text-gray-600">
                    {tag.iconUrl ? (
                      <img src={tag.iconUrl} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      tag.iconEmoji ?? '—'
                    )}
                  </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(tag)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#0EA5E9] hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
