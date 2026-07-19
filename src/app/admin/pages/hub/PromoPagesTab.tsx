import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Plus, Trash2, Copy, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import {
  createPageBlock,
  createPromoPageDraft,
  defaultPromoPages,
  ensurePageBlocks,
  getPromoPageHref,
  getPromoPages,
  getPromoPagePath,
  isExternalPromoLink,
  isReservedPromoSlug,
  loadPromoPages,
  PAGE_BLOCK_LABELS,
  savePromoPages,
  resetPromoPages,
  slugifyPromoPage,
  type PageBlock,
  type PageBlockType,
  type PromoPage,
} from '../../../data/promo-pages';
import { ImageUrlOrUploadField } from '../../components/ImageUrlOrUploadField';
import { SortableList } from '../../components/SortableList';
import { AdminSaveBar } from '../../components/AdminSaveBar';
import { useAdminConfirm } from '../../components/AdminConfirmDialog';
import { PageEditorIntro } from './PageEditorIntro';

function Field({
  label,
  value,
  onChange,
  rows,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
        />
      )}
      {hint ? <p className="mt-1 text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: PageBlock;
  onChange: (patch: Partial<PageBlock>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">
          {PAGE_BLOCK_LABELS[block.type]}
        </span>
        <button type="button" onClick={onRemove} className="text-xs text-red-500 hover:underline">
          Remove section
        </button>
      </div>

      {block.type === 'hero' && (
        <>
          <Field label="Small tag (optional)" value={block.tag || ''} onChange={(v) => onChange({ tag: v })} />
          <Field label="Headline" value={block.title} onChange={(v) => onChange({ title: v })} />
          <Field label="Short description" value={block.subtitle || ''} onChange={(v) => onChange({ subtitle: v })} rows={2} />
          <ImageUrlOrUploadField
            label="Background photo"
            value={block.imageUrl || ''}
            onChange={(v) => onChange({ imageUrl: v })}
          />
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="Button text" value={block.buttonLabel || ''} onChange={(v) => onChange({ buttonLabel: v })} />
            <Field
              label="Button goes to"
              value={block.buttonHref || ''}
              onChange={(v) => onChange({ buttonHref: v })}
              hint="Example: /products or /contact"
            />
          </div>
        </>
      )}

      {block.type === 'text' && (
        <>
          <Field label="Section title (optional)" value={block.heading || ''} onChange={(v) => onChange({ heading: v })} />
          <Field label="Your text" value={block.body} onChange={(v) => onChange({ body: v })} rows={6} />
        </>
      )}

      {block.type === 'image' && (
        <>
          <ImageUrlOrUploadField label="Photo" value={block.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
          <Field label="Caption (optional)" value={block.caption || ''} onChange={(v) => onChange({ caption: v })} />
        </>
      )}

      {block.type === 'cta' && (
        <>
          <Field label="Headline" value={block.title} onChange={(v) => onChange({ title: v })} />
          <Field label="Short line under it" value={block.subtitle || ''} onChange={(v) => onChange({ subtitle: v })} />
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="Button text" value={block.buttonLabel} onChange={(v) => onChange({ buttonLabel: v })} />
            <Field label="Button goes to" value={block.buttonHref} onChange={(v) => onChange({ buttonHref: v })} />
          </div>
        </>
      )}

      {block.type === 'faq' && (
        <>
          <Field label="Section title" value={block.heading || ''} onChange={(v) => onChange({ heading: v })} />
          {block.items.map((item, idx) => (
            <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Question {idx + 1}</span>
                <button
                  type="button"
                  className="text-xs text-red-500"
                  onClick={() =>
                    onChange({
                      items: block.items.filter((q) => q.id !== item.id),
                    } as Partial<PageBlock>)
                  }
                >
                  Remove
                </button>
              </div>
              <Field
                label="Question"
                value={item.question}
                onChange={(v) =>
                  onChange({
                    items: block.items.map((q) => (q.id === item.id ? { ...q, question: v } : q)),
                  } as Partial<PageBlock>)
                }
              />
              <Field
                label="Answer"
                value={item.answer}
                onChange={(v) =>
                  onChange({
                    items: block.items.map((q) => (q.id === item.id ? { ...q, answer: v } : q)),
                  } as Partial<PageBlock>)
                }
                rows={2}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-xs font-semibold text-[#0EA5E9]"
            onClick={() =>
              onChange({
                items: [
                  ...block.items,
                  {
                    id: `q-${Date.now()}`,
                    question: 'New question',
                    answer: 'Write the answer here.',
                  },
                ],
              } as Partial<PageBlock>)
            }
          >
            + Add question
          </button>
        </>
      )}
    </div>
  );
}

export function PromoPagesTab() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [params, setParams] = useSearchParams();
  const [pages, setPages] = useState<PromoPage[]>(() => getPromoPages());
  const [openId, setOpenId] = useState<string | null>(pages[0]?.id ?? null);
  const [focusId, setFocusId] = useState<string | null>(
    () => params.get('focus') || pages[0]?.id || null
  );
  const [openBlockId, setOpenBlockId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutoSave = useRef(true);
  const createdFromHub = useRef(false);
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  const openPage = pages.find((p) => p.id === openId) ?? null;
  const focusPage =
    pages.find((p) => p.id === focusId) ?? pages.find((p) => p.id === openId) ?? pages[0] ?? null;

  const syncFocusToUrl = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params);
      next.set('tab', 'promo');
      if (id) next.set('focus', id);
      else next.delete('focus');
      next.delete('new');
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const selectPage = (id: string, expand?: boolean) => {
    setFocusId(id);
    syncFocusToUrl(id);
    const page = pages.find((p) => p.id === id);
    const label = page
      ? page.navLabel?.trim() || page.title?.trim() || 'Untitled page'
      : null;
    if (label) {
      window.dispatchEvent(
        new CustomEvent('hamel-promo-focus', { detail: { id, label } })
      );
    }
    if (expand === true) setOpenId(id);
    else if (expand === false) setOpenId(null);
    else setOpenId((prev) => (prev === id ? null : id));
  };

  const persistNow = useCallback(async () => {
    setSaveError(null);
    try {
      await savePromoPages(pagesRef.current);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save. Check you are still signed in.');
    }
  }, []);

  const queuePersist = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void persistNow();
    }, 500);
  }, [persistNow]);

  useEffect(() => {
    void loadPromoPages().then((loaded) => {
      setPages(loaded);
      const fromUrl = params.get('focus');
      const initialPage =
        (fromUrl && loaded.find((p) => p.id === fromUrl)) || loaded[0] || null;
      if (initialPage) {
        setFocusId(initialPage.id);
        setOpenId(initialPage.id);
        syncFocusToUrl(initialPage.id);
        const label =
          initialPage.navLabel?.trim() ||
          initialPage.title?.trim() ||
          'Untitled page';
        window.dispatchEvent(
          new CustomEvent('hamel-promo-focus', {
            detail: { id: initialPage.id, label },
          })
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }
    setSaved(false);
    queuePersist();
  }, [pages, queuePersist]);

  const update = (id: string, patch: Partial<PromoPage>) => {
    setPages((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
      );
      const page = next.find((p) => p.id === id);
      if (page && (id === focusId || id === openId)) {
        const label = page.navLabel?.trim() || page.title?.trim() || 'Untitled page';
        window.dispatchEvent(
          new CustomEvent('hamel-promo-focus', { detail: { id, label } })
        );
      }
      return next;
    });
  };

  const updateBlocks = (pageId: string, blocks: PageBlock[]) => {
    update(pageId, { blocks });
  };

  const addPage = (title = 'New page') => {
    const draft = createPromoPageDraft(title);
    skipAutoSave.current = false;
    setPages((p) => [draft, ...p]);
    setFocusId(draft.id);
    setOpenId(draft.id);
    setOpenBlockId(draft.blocks?.[0]?.id ?? null);
    syncFocusToUrl(draft.id);
    window.dispatchEvent(
      new CustomEvent('hamel-promo-focus', {
        detail: { id: draft.id, label: draft.title },
      })
    );
    return draft;
  };

  const deletePage = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this page?',
      description: 'This permanently removes the page and its sections. This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;

    const remaining = pages.filter((page) => page.id !== id);
    const nextPage = remaining[0] ?? null;
    pagesRef.current = remaining;
    setPages(remaining);
    setFocusId(nextPage?.id ?? null);
    setOpenId(nextPage?.id ?? null);
    setOpenBlockId(nextPage?.blocks?.[0]?.id ?? null);
    if (nextPage) {
      syncFocusToUrl(nextPage.id);
    } else {
      setParams({ tab: 'home' }, { replace: true });
    }
    if (persistTimer.current) clearTimeout(persistTimer.current);
    void persistNow();

    if (nextPage) {
      const label = nextPage.navLabel?.trim() || nextPage.title?.trim() || 'Untitled page';
      window.dispatchEvent(
        new CustomEvent('hamel-promo-focus', { detail: { id: nextPage.id, label } })
      );
    } else {
      window.dispatchEvent(new CustomEvent('hamel-promo-pages-updated'));
    }
  };

  const deleteAllCustomPages = async () => {
    const ok = await confirm({
      title: 'Delete all custom pages?',
      description:
        'This permanently removes every custom page, its sections, and its website menu links.',
      confirmLabel: 'Delete all',
      tone: 'danger',
    });
    if (!ok) return;

    pagesRef.current = [];
    setPages([]);
    setFocusId(null);
    setOpenId(null);
    setOpenBlockId(null);
    setParams({ tab: 'home' }, { replace: true });
    if (persistTimer.current) clearTimeout(persistTimer.current);
    void persistNow();
    window.dispatchEvent(new CustomEvent('hamel-promo-pages-updated'));
  };

  const duplicatePage = (id: string) => {
    const source = pages.find((page) => page.id === id);
    if (!source) return;

    const copyId = (prefix: string) =>
      `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const copyName = `${displayName(source)} (copy)`;
    const draft = createPromoPageDraft(copyName);
    const blocks = ensurePageBlocks(source).map((block) =>
      block.type === 'faq'
        ? {
            ...block,
            id: copyId('faq'),
            items: block.items.map((item) => ({ ...item, id: copyId('question') })),
          }
        : { ...block, id: copyId(block.type) }
    ) as PageBlock[];
    const copy: PromoPage = {
      ...source,
      id: draft.id,
      slug: draft.slug,
      title: copyName,
      navLabel: copyName,
      blocks,
      updatedAt: new Date().toISOString(),
    };

    skipAutoSave.current = false;
    setPages((current) => [copy, ...current]);
    setFocusId(copy.id);
    setOpenId(copy.id);
    setOpenBlockId(copy.blocks?.[0]?.id ?? null);
    syncFocusToUrl(copy.id);
    window.dispatchEvent(
      new CustomEvent('hamel-promo-focus', {
        detail: { id: copy.id, label: copyName },
      })
    );
  };

  useEffect(() => {
    if (createdFromHub.current) return;
    if (params.get('new') === '1') {
      createdFromHub.current = true;
      addPage('New page');
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    void persistNow();
  };

  const displayName = (page: PromoPage) =>
    page.navLabel?.trim() || page.title?.trim() || 'Untitled page';

  const introTitle = focusPage ? displayName(focusPage) : 'Custom pages';
  const introDescription = focusPage
    ? focusPage.linkMode === 'url'
      ? `Where “${displayName(focusPage)}” should send people. Saves as you go, and can show in the site menu.`
      : `Edit “${displayName(focusPage)}” — add a banner, text, buttons, or FAQs.`
    : 'Create a page, then add sections like a banner, text, buttons, or FAQs.';

  return (
    <div className="space-y-5">
      {confirmDialog}
      <PageEditorIntro
        title={introTitle}
        description={introDescription}
        saveMode="auto"
        showDragTip
        actions={
          <>
            {focusPage ? (
              <>
                <button
                  type="button"
                  onClick={() => duplicatePage(focusPage.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
                >
                  <Copy size={15} /> Duplicate page
                </button>
                <button
                  type="button"
                  onClick={() => void deletePage(focusPage.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={15} /> Delete page
                </button>
              </>
            ) : null}
            {pages.length > 0 ? (
              <button
                type="button"
                onClick={() => void deleteAllCustomPages()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <Trash2 size={15} /> Delete all custom pages
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => addPage()}
              className="flex items-center gap-1 rounded-lg bg-[#0EA5E9] text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              <Plus size={16} /> Add a new page
            </button>
          </>
        }
      />

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {saveError}
        </div>
      )}

      {pages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm text-gray-600 mb-3">You don’t have any custom pages yet.</p>
          <button
            type="button"
            onClick={() => addPage()}
            className="inline-flex items-center gap-1 rounded-lg bg-[#0EA5E9] text-white px-4 py-2 text-sm font-semibold"
          >
            <Plus size={16} /> Create your first page
          </button>
        </div>
      ) : (
        <SortableList
          items={pages}
          onReorder={(next) => setPages(next)}
          renderItem={(page) => {
            const open = openId === page.id;
            const blocks = ensurePageBlocks(page);
            return (
              <div className="pr-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextOpen = openId !== page.id;
                      selectPage(page.id, nextOpen);
                      if (nextOpen) setOpenBlockId(blocks[0]?.id ?? null);
                    }}
                    className="flex-1 text-left text-sm font-semibold text-gray-800 truncate"
                  >
                    {displayName(page)}
                    {!page.published && (
                      <span className="text-xs text-gray-400 ml-2">(not on website yet)</span>
                    )}
                    {page.published && page.showInNav && (
                      <span className="text-xs text-emerald-600 ml-2">(in menu)</span>
                    )}
                    {page.published && !page.showInNav && (
                      <span className="text-xs text-sky-600 ml-2">(live, hidden from menu)</span>
                    )}
                  </button>
                  {page.published && getPromoPageHref(page) && (
                    isExternalPromoLink(page) ? (
                      <a
                        href={getPromoPageHref(page)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0EA5E9] px-1"
                      >
                        Open link <ExternalLink size={12} />
                      </a>
                    ) : (
                      <Link
                        to={getPromoPageHref(page)}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0EA5E9] px-1"
                      >
                        View page <ExternalLink size={12} />
                      </Link>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => duplicatePage(page.id)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-sky-50 hover:text-[#0284C7]"
                    title="Duplicate this entire page"
                  >
                    <Copy size={14} /> Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePage(page.id)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                    title="Delete this entire page"
                  >
                    <Trash2 size={14} /> Delete page
                  </button>
                  {open ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </div>

                {open && (
                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                      <p className="text-sm font-semibold text-gray-800">Page settings</p>
                      <Field
                        label="Page name"
                        value={page.title}
                        onChange={(v) =>
                          update(page.id, {
                            title: v,
                            navLabel: v,
                            slug:
                              (page.linkMode ?? 'page') === 'page' &&
                              (page.slug.startsWith('new-page') ||
                                page.slug === slugifyPromoPage(page.title))
                                ? slugifyPromoPage(v) || page.slug
                                : page.slug,
                          })
                        }
                      />

                      <div className="mb-2">
                        <p className="mb-1.5 text-xs font-medium text-gray-600">Where should this go?</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => update(page.id, { linkMode: 'page' })}
                            className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                            style={{
                              borderColor: (page.linkMode ?? 'page') === 'page' ? '#0EA5E9' : '#E5E7EB',
                              backgroundColor: (page.linkMode ?? 'page') === 'page' ? '#E0F2FE' : '#FFF',
                              color: (page.linkMode ?? 'page') === 'page' ? '#0369A1' : '#4B5563',
                            }}
                          >
                            This website page
                          </button>
                          <button
                            type="button"
                            onClick={() => update(page.id, { linkMode: 'url' })}
                            className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                            style={{
                              borderColor: page.linkMode === 'url' ? '#0EA5E9' : '#E5E7EB',
                              backgroundColor: page.linkMode === 'url' ? '#E0F2FE' : '#FFF',
                              color: page.linkMode === 'url' ? '#0369A1' : '#4B5563',
                            }}
                          >
                            Outside link (URL)
                          </button>
                        </div>
                      </div>

                      {(page.linkMode ?? 'page') === 'page' ? (
                        <>
                          <Field
                            label="Short link name"
                            value={page.slug}
                            onChange={(v) => update(page.id, { slug: slugifyPromoPage(v) })}
                            hint="Letters and dashes only. This becomes the page address below."
                          />
                          {isReservedPromoSlug(page.slug) ? (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                              “{page.slug}” is already used by the main site (like Home or Products).
                              Pick a different short name, for example <strong>test</strong> or{' '}
                              <strong>{slugifyPromoPage(displayName(page)) || 'my-page'}</strong>.
                            </p>
                          ) : null}
                          <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                            Page address:{' '}
                            <Link
                              to={getPromoPagePath(page)}
                              target="_blank"
                              className="font-semibold underline"
                            >
                              {getPromoPagePath(page)}
                            </Link>
                            {' '}
                            (this is not the same as the main Home page)
                          </p>
                        </>
                      ) : (
                        <Field
                          label="Website link (URL)"
                          value={page.externalUrl || ''}
                          onChange={(v) => update(page.id, { externalUrl: v.trim() })}
                          hint="Use a full address (https://…) or a site path like /products or /contact."
                        />
                      )}

                      <label className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={Boolean(page.published)}
                          onChange={(e) => update(page.id, { published: e.target.checked })}
                        />
                        <span>
                          <span className="font-semibold">Publish this page</span>
                          <span className="block text-xs text-gray-500 mt-0.5">
                            Makes this page live so links and cards can open it.
                          </span>
                        </span>
                      </label>
                      {page.published ? (
                        <>
                          <label className="flex items-start gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={Boolean(page.showInNav)}
                              onChange={(e) => update(page.id, { showInNav: e.target.checked })}
                            />
                            <span>
                              <span className="font-semibold">Show in the top bar menu</span>
                              <span className="block text-xs text-gray-500 mt-0.5">
                                Adds “{displayName(page)}” in the header between Why Hamel and Contact.
                              </span>
                            </span>
                          </label>
                          {page.showInNav ? (
                            <Field
                              label="Menu label"
                              value={page.navLabel || page.title}
                              onChange={(v) => update(page.id, { navLabel: v })}
                              hint="This name is shown only in the website header."
                            />
                          ) : null}
                        </>
                      ) : null}
                      <div className="border-t border-red-100 pt-3">
                        <p className="text-xs text-gray-500">
                          Permanently remove this custom page and its sections.
                        </p>
                        <button
                          type="button"
                          onClick={() => void deletePage(page.id)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Delete page
                        </button>
                      </div>
                    </div>

                    {(page.linkMode ?? 'page') === 'page' ? (
                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Build your page</p>
                          <p className="text-xs text-gray-500">
                            Add sections and drag to reorder. Top section usually works best as a banner.
                          </p>
                        </div>
                        <select
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          defaultValue=""
                          onChange={(e) => {
                            const type = e.target.value as PageBlockType;
                            if (!type) return;
                            const block = createPageBlock(type);
                            updateBlocks(page.id, [...blocks, block]);
                            setOpenBlockId(block.id);
                            e.target.value = '';
                          }}
                        >
                          <option value="">+ Add a section…</option>
                          {(Object.keys(PAGE_BLOCK_LABELS) as PageBlockType[]).map((type) => (
                            <option key={type} value={type}>
                              {PAGE_BLOCK_LABELS[type]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <SortableList
                        items={blocks}
                        onReorder={(next) => updateBlocks(page.id, next)}
                        renderItem={(block) => {
                          const blockOpen = openBlockId === block.id;
                          return (
                            <div className="pr-2 py-1.5">
                              <button
                                type="button"
                                onClick={() => setOpenBlockId(blockOpen ? null : block.id)}
                                className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-800"
                              >
                                <span>{PAGE_BLOCK_LABELS[block.type]}</span>
                                {blockOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              {blockOpen && (
                                <BlockEditor
                                  block={block}
                                  onChange={(patch) =>
                                    updateBlocks(
                                      page.id,
                                      blocks.map((b) =>
                                        b.id === block.id ? ({ ...b, ...patch } as PageBlock) : b
                                      )
                                    )
                                  }
                                  onRemove={() =>
                                    updateBlocks(
                                      page.id,
                                      blocks.filter((b) => b.id !== block.id)
                                    )
                                  }
                                />
                              )}
                            </div>
                          );
                        }}
                      />
                    </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-600">
                        This item opens an outside website link, so there is no page layout to build.
                        Use the menu checkbox above if you want it to appear in the header.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }}
        />
      )}

      <AdminSaveBar
        saved={saved}
        onSave={save}
        onReset={() => {
          void (async () => {
            const ok = await confirm({
              title: 'Reset all custom pages?',
              description: 'Replace everything with the starter examples. This cannot be undone.',
              confirmLabel: 'Reset',
              tone: 'danger',
            });
            if (!ok) return;
            void resetPromoPages().then(() => {
              setPages(defaultPromoPages.map((p) => ({ ...p, blocks: ensurePageBlocks(p) })));
            });
          })();
        }}
      />
    </div>
  );
}
