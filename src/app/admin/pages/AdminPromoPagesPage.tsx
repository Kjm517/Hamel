import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { Plus, Save, RotateCcw, Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import {
  createPromoPageDraft,
  defaultPromoPages,
  getPromoPagePath,
  getPromoPages,
  savePromoPages,
  resetPromoPages,
  slugifyPromoPage,
  type PromoPage,
} from '../../data/promo-pages';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';

function FieldEditor({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] resize-y min-h-[100px]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
        />
      )}
    </div>
  );
}

export function AdminPromoPagesPage() {
  const [pages, setPages] = useState<PromoPage[]>(() => getPromoPages());
  const [expandedId, setExpandedId] = useState<string | null>(pages[0]?.id ?? null);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePage = (id: string, patch: Partial<PromoPage>) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
      )
    );
    setSaved(false);
  };

  const handleSave = () => {
    void savePromoPages(pages);
    setSaved(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 2500);
  };

  const handleAdd = () => {
    const draft = createPromoPageDraft();
    setPages((prev) => [draft, ...prev]);
    setExpandedId(draft.id);
    setSaved(false);
  };

  const handleRemove = (id: string) => {
    if (!confirm('Delete this promo page? Banners linked to it will stop navigating.')) return;
    setPages((prev) => prev.filter((p) => p.id !== id));
    setSaved(false);
  };

  const handleReset = () => {
    if (!confirm('Reset all promo pages to defaults?')) return;
    void resetPromoPages();
    setPages(defaultPromoPages.map((p) => ({ ...p })));
    setSaved(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promo pages</h2>
          <p className="text-gray-600">
            Full promotion details at <code className="text-sm bg-gray-100 px-1 rounded">/promo/your-slug</code> — link from homepage banners.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-lg border border-[#0EA5E9] px-3 py-1.5 text-sm font-semibold text-[#0EA5E9] hover:bg-[#E0F2FE]"
          >
            <Plus size={14} />
            New page
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold hover:opacity-90"
            style={{ backgroundColor: saved ? '#10B981' : '#FFC107', color: saved ? '#FFF' : '#111' }}
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        Create a promo page with the full offer text, then in <Link to="/admin/banners" className="font-semibold underline">Banners</Link> choose{' '}
        <strong>Promo page (full details)</strong> as the click destination. Keep homepage banners short; put terms and bullets here.
      </div>

      <div className="space-y-3">
        {pages.map((page) => {
          const open = expandedId === page.id;
          return (
            <div key={page.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : page.id)}
                  className="flex flex-1 items-center gap-2 text-left min-w-0"
                >
                  <span className="font-semibold text-gray-900 truncate">{page.title || 'Untitled'}</span>
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      page.published ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {page.published ? 'Published' : 'Draft'}
                  </span>
                  {open ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </button>
                {page.published && (
                  <Link
                    to={getPromoPagePath(page)}
                    target="_blank"
                    className="shrink-0 p-1.5 text-[#0EA5E9] hover:bg-[#E0F2FE] rounded"
                    title="View live page"
                  >
                    <ExternalLink size={16} />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(page.id)}
                  className="shrink-0 p-1.5 text-red-400 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {open && (
                <div className="p-5 grid md:grid-cols-2 gap-x-6">
                  <div>
                    <FieldEditor label="Page title" value={page.title} onChange={(v) => updatePage(page.id, { title: v })} />
                    <FieldEditor
                      label="URL slug"
                      value={page.slug}
                      onChange={(v) => updatePage(page.id, { slug: slugifyPromoPage(v) })}
                      placeholder="summer-sale-2026"
                    />
                    <FieldEditor label="Tag / pill" value={page.tag || ''} onChange={(v) => updatePage(page.id, { tag: v })} />
                    <FieldEditor
                      label="Short summary (under title on page)"
                      value={page.summary || ''}
                      onChange={(v) => updatePage(page.id, { summary: v })}
                      rows={2}
                    />
                    <FieldEditor
                      label="Full content"
                      value={page.body}
                      onChange={(v) => updatePage(page.id, { body: v })}
                      placeholder="Use blank lines between paragraphs. Start lines with • for bullets."
                      rows={12}
                    />
                  </div>
                  <div>
                    <ImageUrlOrUploadField
                      label="Hero image"
                      value={page.heroImageUrl || ''}
                      onChange={(v) => updatePage(page.id, { heroImageUrl: v })}
                    />
                    <FieldEditor label="Bottom CTA label" value={page.ctaLabel || ''} onChange={(v) => updatePage(page.id, { ctaLabel: v })} />
                    <FieldEditor label="Bottom CTA link" value={page.ctaHref || ''} onChange={(v) => updatePage(page.id, { ctaHref: v })} />
                    <label className="flex items-center gap-2 mb-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={page.published}
                        onChange={(e) => updatePage(page.id, { published: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Published (visible on site)</span>
                    </label>
                    <p className="text-xs text-gray-500 rounded-lg bg-gray-50 p-3 border border-gray-100">
                      Live URL:{' '}
                      <span className="font-mono text-[#0EA5E9]">
                        {page.published ? getPromoPagePath(page) : '(publish to enable)'}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
