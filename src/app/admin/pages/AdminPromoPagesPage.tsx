import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router';
import { Plus, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  createPromoPageDraft,
  getPromoPagePath,
  loadPromoPages,
  savePromoPages,
  slugifyPromoPage,
  type PromoPage,
} from '../../data/promo-pages';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

function Field({
  label,
  value,
  onChange,
  placeholder,
  rows,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#9aa7b5]">
        {label}
      </span>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={`${adminUi.textarea} ${mono ? 'font-mono text-[13.5px]' : ''}`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${adminUi.input} ${mono ? 'font-mono text-[13.5px]' : ''}`}
        />
      )}
    </label>
  );
}

export function AdminPromoPagesPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [pages, setPages] = useState<PromoPage[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void loadPromoPages().then((loaded) => {
      setPages(loaded);
      setExpandedId(loaded[0]?.id ?? null);
      setLoading(false);
    });
  }, []);

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
    const draft = createPromoPageDraft('New promo page');
    setPages((prev) => [draft, ...prev]);
    setExpandedId(draft.id);
    setSaved(false);
  };

  const handleRemove = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this promo page?',
      description: 'Banners linked to it will stop navigating. Remember to save after deleting.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setPages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (expandedId === id) setExpandedId(next[0]?.id ?? null);
      return next;
    });
    setSaved(false);
  };

  if (loading) {
    return <p className="text-sm text-[#9aa7b5]">Loading promo pages…</p>;
  }

  return (
    <div className="mx-auto max-w-[900px]">
      {confirmDialog}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <p className="m-0 max-w-[520px] text-[14px] leading-relaxed text-[#7a8899]">
          Campaign landing pages at{' '}
          <span className="rounded-[5px] bg-[#eef3f8] px-1.5 py-px font-mono text-[12.5px] text-[#0369a1]">
            /promo/your-slug
          </span>
          . Point banners here when you want a full promo page.
        </p>
        <div className="flex shrink-0 gap-2.5">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex h-[42px] items-center gap-1.5 rounded-[11px] border border-[#0ea5e9] bg-white px-[15px] text-[13.5px] font-bold text-[#0ea5e9] hover:bg-[#e0f2fe]"
          >
            <Plus size={15} strokeWidth={2.2} />
            New page
          </button>
          <button type="button" onClick={handleSave} className={adminUi.btnAmber}>
            <Save size={15} />
            {saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {pages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d6e2ee] bg-white px-6 py-12 text-center">
            <p className="mb-3 text-sm text-[#7a8899]">No promo pages yet.</p>
            <button type="button" onClick={handleAdd} className={adminUi.btnPrimary}>
              <Plus size={16} /> Create your first page
            </button>
          </div>
        ) : (
          pages.map((page) => {
            const open = expandedId === page.id;
            return (
              <div
                key={page.id}
                className="overflow-hidden rounded-2xl border border-[#e8eef4] bg-white shadow-[0_1px_2px_rgba(30,42,56,0.03)]"
              >
                <div
                  className={`flex items-center gap-2.5 px-[18px] py-3.5 ${
                    open ? 'border-b border-[#eef3f8] bg-[#f9fbfd]' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : page.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <span className="truncate text-[14px] font-bold text-[#1e2a38]">
                      {page.title || 'Untitled'}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.04em] ${
                        page.published
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : 'bg-[#f1f5f9] text-[#64748b]'
                      }`}
                    >
                      {page.published ? 'Published' : 'Draft'}
                    </span>
                    {open ? (
                      <ChevronUp size={16} className="ml-auto shrink-0 text-[#b4c0cc]" />
                    ) : (
                      <ChevronDown size={16} className="ml-auto shrink-0 text-[#b4c0cc]" />
                    )}
                  </button>
                  {!open && (
                    <button
                      type="button"
                      onClick={() => void handleRemove(page.id)}
                      className="shrink-0 text-[#b4c0cc] hover:text-red-500"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {open && (
                  <div className="grid gap-x-[22px] gap-y-[18px] p-5 md:grid-cols-2">
                    <div className="flex flex-col gap-3">
                      <Field
                        label="Page title"
                        value={page.title}
                        onChange={(v) => updatePage(page.id, { title: v })}
                      />
                      <Field
                        label="URL slug"
                        value={page.slug}
                        onChange={(v) => updatePage(page.id, { slug: slugifyPromoPage(v) })}
                        placeholder="summer-sale-2026"
                        mono
                      />
                      <Field
                        label="Short summary"
                        value={page.summary || ''}
                        onChange={(v) => updatePage(page.id, { summary: v })}
                        rows={2}
                      />
                      <Field
                        label="Full content"
                        value={page.body || ''}
                        onChange={(v) => updatePage(page.id, { body: v })}
                        placeholder="• Up to 30% off…&#10;Offer valid until…"
                        rows={6}
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#9aa7b5]">
                          Hero image
                        </span>
                        <div className="mt-1.5">
                          <ImageUrlOrUploadField
                            label=""
                            value={page.heroImageUrl || ''}
                            onChange={(v) => updatePage(page.id, { heroImageUrl: v })}
                          />
                        </div>
                      </div>
                      <Field
                        label="Bottom CTA label"
                        value={page.ctaLabel || ''}
                        onChange={(v) => updatePage(page.id, { ctaLabel: v })}
                      />
                      <Field
                        label="Bottom CTA link"
                        value={page.ctaHref || ''}
                        onChange={(v) => updatePage(page.id, { ctaHref: v })}
                        mono
                      />
                      <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] font-semibold text-[#1e2a38]">
                        <input
                          type="checkbox"
                          checked={page.published}
                          onChange={(e) =>
                            updatePage(page.id, { published: e.target.checked })
                          }
                          className="h-[17px] w-[17px] accent-[#0ea5e9]"
                        />
                        Published (visible on site)
                      </label>
                      <div className="rounded-[10px] border border-[#eef3f8] bg-[#f7fafd] px-3 py-2.5 text-xs text-[#7a8899]">
                        Live URL:{' '}
                        {page.published ? (
                          <Link
                            to={getPromoPagePath(page)}
                            target="_blank"
                            className="font-mono text-[#0ea5e9] hover:underline"
                          >
                            {getPromoPagePath(page)}
                          </Link>
                        ) : (
                          <span className="font-mono text-[#9aa7b5]">(publish to enable)</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemove(page.id)}
                        className="inline-flex items-center gap-1 self-start text-[12.5px] font-semibold text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                        Delete page
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
