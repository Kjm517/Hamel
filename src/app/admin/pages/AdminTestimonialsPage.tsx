import { useEffect, useState } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import {
  defaultTestimonials,
  loadTestimonials,
  saveTestimonials,
  type Testimonial,
  type TestimonialsConfig,
} from '../../data/testimonials';
import { AdminToggle } from '../components/AdminToggle';
import { SortableList } from '../components/SortableList';
import { useAdminConfirm } from '../components/AdminConfirmDialog';
import { adminUi } from '../lib/admin-ui';

function emptyReview(): Testimonial {
  return {
    id: `review-${Date.now()}`,
    name: '',
    location: '',
    rating: 5,
    text: '',
    model: 'Recommends Hamel',
    source: 'facebook',
    enabled: true,
  };
}

export function AdminTestimonialsPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [draft, setDraft] = useState<TestimonialsConfig>(defaultTestimonials);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    void loadTestimonials().then(setDraft);
  }, []);

  const patchMeta = (next: Partial<TestimonialsConfig>) => {
    setDraft((prev) => ({ ...prev, ...next }));
  };

  const patchItem = (id: string, next: Partial<Testimonial>) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((t) => (t.id === id ? { ...t, ...next } : t)),
    }));
  };

  const addReview = () => {
    const next = emptyReview();
    setDraft((d) => ({ ...d, items: [...d.items, next] }));
    setEditingId(next.id);
  };

  const removeReview = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete this review?',
      description: `Remove ${name || 'this review'}? Remember to save after deleting.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setDraft((d) => ({
      ...d,
      items: d.items.filter((t) => t.id !== id),
    }));
    setEditingId((cur) => (cur === id ? null : cur));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const blank = draft.items.find((t) => !t.name.trim() || !t.text.trim());
      if (blank) {
        setError('Every review needs a name and review text.');
        setEditingId(blank.id);
        return;
      }
      await saveTestimonials(draft);
      setSaved(true);
      setEditingId(null);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-5">
      {confirmDialog}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className={adminUi.pageIntro}>
          Curate homepage reviews (e.g. paste quotes from Facebook). Order here is the order on the
          storefront. Facebook no longer allows live API sync of Page recommendations.
        </p>
        <button type="button" onClick={addReview} className={adminUi.btnPrimary}>
          <Plus className="h-[17px] w-[17px]" strokeWidth={2.2} />
          Add review
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Reviews saved.
        </div>
      )}

      <div className={`${adminUi.card} p-5 space-y-4`}>
        <p className={adminUi.sectionLabel}>Section settings</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={adminUi.label}>Eyebrow</span>
            <input
              className={adminUi.input}
              value={draft.sectionEyebrow}
              onChange={(e) => patchMeta({ sectionEyebrow: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={adminUi.label}>Title</span>
            <input
              className={adminUi.input}
              value={draft.sectionTitle}
              onChange={(e) => patchMeta({ sectionTitle: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={adminUi.label}>Summary line</span>
            <input
              className={adminUi.input}
              value={draft.facebookRecommendSummary}
              onChange={(e) => patchMeta({ facebookRecommendSummary: e.target.value })}
              placeholder="100% recommend · 21 reviews on Facebook"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={adminUi.label}>Facebook reviews URL</span>
            <input
              className={adminUi.input}
              value={draft.facebookReviewsUrl}
              onChange={(e) => patchMeta({ facebookReviewsUrl: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={adminUi.label}>Homepage count</span>
            <input
              type="number"
              min={1}
              max={24}
              className={adminUi.input}
              value={draft.homepageLimit}
              onChange={(e) =>
                patchMeta({ homepageLimit: Math.max(1, Number(e.target.value) || 4) })
              }
            />
          </label>
        </div>
        <div className={adminUi.tip}>
          Tip: copy a review from your Facebook Page → Reviews, paste the text here, then Save.
          Update the summary line when your recommend count changes.
        </div>
      </div>

      {draft.items.length === 0 ? (
        <div className={`${adminUi.card} px-6 py-12 text-center text-sm text-[#9aa7b5]`}>
          No reviews yet. Add one to get started.
        </div>
      ) : (
        <SortableList
          items={draft.items}
          onReorder={(items) => setDraft((d) => ({ ...d, items }))}
          rowClassName="mb-3.5"
          renderItem={(t) => {
            const editing = editingId === t.id;
            return (
              <div className={`${adminUi.card} p-5`}>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-[#1e2a38]">
                      {t.name || 'Untitled review'}
                    </div>
                    <div className="truncate text-[12px] text-[#9aa7b5]">
                      {t.location || 'No date / source line'}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#b45309]">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {t.rating}
                  </span>
                  <span className={t.enabled !== false ? adminUi.badgeGreen : adminUi.badgeGray}>
                    {t.enabled !== false ? 'Shown' : 'Hidden'}
                  </span>
                  <label className="flex items-center gap-2 text-[13px] text-[#516171]">
                    Show
                    <AdminToggle
                      checked={t.enabled !== false}
                      onChange={(checked) => patchItem(t.id, { enabled: checked })}
                    />
                  </label>
                  <button
                    type="button"
                    className={adminUi.btnSoft}
                    onClick={() => setEditingId(editing ? null : t.id)}
                  >
                    {editing ? 'Close' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    className={`${adminUi.btnSoft} text-red-600 hover:bg-red-50`}
                    onClick={() => void removeReview(t.id, t.name)}
                    aria-label="Delete review"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {!editing && (
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-[#516171]">
                    {t.text || 'No review text yet.'}
                  </p>
                )}

                {editing && (
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={adminUi.label}>Name</span>
                      <input
                        className={adminUi.input}
                        value={t.name}
                        onChange={(e) => patchItem(t.id, { name: e.target.value })}
                      />
                    </label>
                    <label className="block">
                      <span className={adminUi.label}>Date / source line</span>
                      <input
                        className={adminUi.input}
                        value={t.location}
                        onChange={(e) => patchItem(t.id, { location: e.target.value })}
                        placeholder="July 28, 2025 · Facebook"
                      />
                    </label>
                    <label className="block">
                      <span className={adminUi.label}>Rating</span>
                      <select
                        className={adminUi.select}
                        value={t.rating}
                        onChange={(e) => patchItem(t.id, { rating: Number(e.target.value) })}
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} stars
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className={adminUi.label}>Tag / product</span>
                      <input
                        className={adminUi.input}
                        value={t.model}
                        onChange={(e) => patchItem(t.id, { model: e.target.value })}
                        placeholder="Daikin Amihan 1.5HP"
                      />
                    </label>
                    <label className="block">
                      <span className={adminUi.label}>Source</span>
                      <select
                        className={adminUi.select}
                        value={t.source || 'facebook'}
                        onChange={(e) =>
                          patchItem(t.id, {
                            source: e.target.value as Testimonial['source'],
                          })
                        }
                      >
                        <option value="facebook">Facebook</option>
                        <option value="site">Site</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={adminUi.label}>Review text</span>
                      <textarea
                        className={`${adminUi.textarea} min-h-[120px]`}
                        value={t.text}
                        onChange={(e) => patchItem(t.id, { text: e.target.value })}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          }}
        />
      )}

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className={adminUi.btnAmber}
        >
          {saving ? 'Saving…' : 'Save reviews'}
        </button>
      </div>
    </div>
  );
}
