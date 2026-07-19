import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import {
  getCoolDealsPage,
  saveCoolDealsPage,
  resetCoolDealsPage,
  defaultCoolDealsPage,
  createSection,
  createCardGridSection,
  createVoucherCard,
  createDealCard,
  createProductColumn,
  DEAL_CARD_DEFAULT_COLORS,
  COOL_DEALS_SECTION_LABELS,
  type CoolDealsPageConfig,
  type CoolDealsSection,
  type CoolDealsSectionType,
  type CoolDealsCardGridSection,
  type CoolDealsProductMatrixSection,
  type CoolDealsProductColumn,
  type CoolDealsDealCardItem,
} from '../../../data/cool-deals-page';
import { getBanners, saveBanners, defaultBanners, type CoolDealsBannerConfig } from '../../../data/banners';
import { PAGE_BANNER_HEIGHTS } from '../../../components/PageBanner';
import { ImageUrlOrUploadField } from '../../components/ImageUrlOrUploadField';
import { BannerLinkDestinationField } from '../../components/BannerLinkDestinationField';
import { SortableList } from '../../components/SortableList';
import { AdminSaveBar } from '../../components/AdminSaveBar';
import { AdminColorField } from '../../components/AdminColorField';
import { DealTileSurface } from '../../../components/cool-deals/DealTileSurface';
import { contrastRatio, hexForColorInput } from '../../../lib/color-utils';
import { PageEditorIntro } from './PageEditorIntro';
import { useAdminConfirm } from '../../components/AdminConfirmDialog';

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

export function CoolDealsTab() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [sections, setSections] = useState<CoolDealsPageConfig>(() => getCoolDealsPage());
  const [hero, setHero] = useState<CoolDealsBannerConfig>(() => getBanners().coolDealsBanner);
  const [openId, setOpenId] = useState<string | null>(sections.sections[0]?.id ?? null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutoSave = useRef(true);
  const sectionsRef = useRef(sections);
  const heroRef = useRef(hero);
  sectionsRef.current = sections;
  heroRef.current = hero;

  type SectionPatch = Partial<CoolDealsSection> | ((section: CoolDealsSection) => Partial<CoolDealsSection>);

  const persistNow = useCallback(() => {
    void saveCoolDealsPage(sectionsRef.current);
    void saveBanners({ ...getBanners(), coolDealsBanner: heroRef.current });
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
  }, [sections, hero, queuePersist]);

  const patchSection = (id: string, patch: SectionPatch) => {
    setSections((prev) => ({
      sections: prev.sections.map((s) => {
        if (s.id !== id) return s;
        const next = typeof patch === 'function' ? patch(s) : patch;
        return { ...s, ...next } as CoolDealsSection;
      }),
    }));
  };

  const save = () => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistNow();
  };

  const sectionTitle = (s: CoolDealsSection) => {
    if (s.type === 'card-grid') return `${s.headingTitle} (${s.variant})`;
    if (s.type === 'product-matrix') return s.headingTitle;
    if (s.type === 'cta') return s.title;
    return COOL_DEALS_SECTION_LABELS[s.type];
  };

  return (
    <div className="space-y-6">
      {confirmDialog}
      <PageEditorIntro
        title="Cool Deals page"
        description="First update the top banner photo, then arrange the sections customers see below it."
        saveMode="auto"
        previewHref="/cool-deals"
        showDragTip
      />

      <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-3">
        <h3 className="text-sm font-bold text-gray-800">1. Top banner</h3>
        <p className="text-xs text-gray-500">This is the large photo at the top of the Cool Deals page.</p>
        <ImageUrlOrUploadField label="Banner photo" value={hero.bannerImageUrl} onChange={(v) => setHero((h) => ({ ...h, bannerImageUrl: v }))} />
        <BannerLinkDestinationField fields={hero} onChange={(p) => setHero((h) => ({ ...h, ...p }))} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(hero.showTextOverlay)} onChange={(e) => setHero((h) => ({ ...h, showTextOverlay: e.target.checked }))} />
          Show text on top of banner
        </label>
        {hero.showTextOverlay && (
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="Title line 1" value={hero.title} onChange={(v) => setHero((h) => ({ ...h, title: v }))} />
            <Field label="Title line 2" value={hero.titleHighlight} onChange={(v) => setHero((h) => ({ ...h, titleHighlight: v }))} />
          </div>
        )}
        {hero.bannerImageUrl && (
          <div className={`relative rounded-lg overflow-hidden w-full ${PAGE_BANNER_HEIGHTS.md}`}>
            <img src={hero.bannerImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-1 text-sm font-bold text-gray-800">2. Sections below the banner</h3>
        <p className="mb-3 text-xs text-gray-500">
          Add offer blocks, product highlights, or a contact section. Drag to change the order.
        </p>
      <div className="flex flex-wrap gap-2">
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-2"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            let section: CoolDealsSection;
            if (v === 'card-grid-deal') section = createCardGridSection('deal');
            else if (v === 'card-grid') section = createCardGridSection('voucher');
            else section = createSection(v as CoolDealsSectionType);
            setSections((p) => ({ sections: [...p.sections, section] }));
            setOpenId(section.id);
            e.target.value = '';
          }}
        >
          <option value="">+ Add a section…</option>
          <option value="card-grid">Voucher / coupon cards</option>
          <option value="card-grid-deal">Deal tiles</option>
          <option value="product-matrix">Product types & perks</option>
          <option value="trust-bar">Trust icons</option>
          <option value="cta">Contact CTA</option>
          <option value="stats-brands">Stats & brands</option>
        </select>
      </div>

      <SortableList
        items={sections.sections}
        onReorder={(next) => setSections({ sections: next })}
        renderItem={(section) => {
          const open = openId === section.id;
          return (
            <div className="pr-3 py-2">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setOpenId(open ? null : section.id)} className="flex-1 text-left text-sm font-semibold truncate">
                  {sectionTitle(section)}
                  {!section.enabled && <span className="ml-2 text-xs font-normal text-amber-600">(hidden)</span>}
                </button>
                <button type="button" onClick={() => patchSection(section.id, { enabled: !section.enabled })} className="text-gray-500">
                  {section.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      const ok = await confirm({
                        title: 'Remove this section?',
                        description: 'It will be removed from the Cool Deals page.',
                        confirmLabel: 'Remove',
                        tone: 'danger',
                      });
                      if (!ok) return;
                      setSections((p) => ({
                        sections: p.sections.filter((s) => s.id !== section.id),
                      }));
                    })();
                  }}
                  className="text-red-400"
                >
                  <Trash2 size={14} />
                </button>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {open && section.type === 'card-grid' && (
                <CardGridEditor
                  section={section}
                  onPatch={(p) => patchSection(section.id, (s) => (s.type === 'card-grid' ? { ...s, ...p } : {}))}
                  onPatchDealCard={(cardId, patch) =>
                    patchSection(section.id, (s) => {
                      if (s.type !== 'card-grid') return {};
                      return {
                        dealCards: (s.dealCards ?? []).map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
                      };
                    })
                  }
                />
              )}
              {open && section.type === 'product-matrix' && (
                <ProductMatrixEditor section={section} onChange={(p) => patchSection(section.id, p)} />
              )}
              {open && section.type === 'cta' && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <Field label="Title" value={section.title} onChange={(v) => patchSection(section.id, { title: v })} />
                  <Field label="Subtitle" value={section.subtitle} onChange={(v) => patchSection(section.id, { subtitle: v })} />
                </div>
              )}
            </div>
          );
        }}
      />
      </div>

      <AdminSaveBar
        saved={saved}
        onSave={save}
        onReset={() => {
          void (async () => {
            const ok = await confirm({
              title: 'Reset Cool Deals page?',
              description: 'Restore default sections and hero banner. Custom changes will be lost.',
              confirmLabel: 'Reset',
              tone: 'danger',
            });
            if (!ok) return;
            void resetCoolDealsPage().then(() => {
              setSections(JSON.parse(JSON.stringify(defaultCoolDealsPage)));
              setHero({ ...defaultBanners.coolDealsBanner });
            });
          })();
        }}
      />
    </div>
  );
}

function ProductMatrixEditor({
  section,
  onChange,
}: {
  section: CoolDealsProductMatrixSection;
  onChange: (p: Partial<CoolDealsProductMatrixSection>) => void;
}) {
  const patchColumn = (colId: string, patch: Partial<CoolDealsProductColumn>) => {
    onChange({
      columns: section.columns.map((c) => (c.id === colId ? { ...c, ...patch } : c)),
    });
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      <Field label="Section title" value={section.headingTitle} onChange={(v) => onChange({ headingTitle: v })} />
      <Field label="Subtitle" value={section.headingSubtitle || ''} onChange={(v) => onChange({ headingSubtitle: v })} />
      <Field label="Footnote" value={section.footnote || ''} onChange={(v) => onChange({ footnote: v })} />
      <div className="grid sm:grid-cols-2 gap-2">
        <Field label="Mechanics link text" value={section.mechanicsLinkText || ''} onChange={(v) => onChange({ mechanicsLinkText: v })} />
        <Field label="Mechanics link URL" value={section.mechanicsLinkHref || ''} onChange={(v) => onChange({ mechanicsLinkHref: v })} />
      </div>

      <p className="text-xs font-semibold text-gray-600">Product columns — drag the handle to reorder</p>
      <SortableList
        items={section.columns}
        onReorder={(columns) => onChange({ columns })}
        renderItem={(col) => (
          <div className="pr-3 py-2 space-y-2">
            <Field label="Name" value={col.name} onChange={(v) => patchColumn(col.id, { name: v })} />
            <Field label="Description" value={col.sub} onChange={(v) => patchColumn(col.id, { sub: v })} />
            <ImageUrlOrUploadField label="Image" value={col.imageUrl} onChange={(v) => patchColumn(col.id, { imageUrl: v })} />
            <BannerLinkDestinationField
              label="Card navigation"
              fields={col}
              onChange={(patch) => patchColumn(col.id, patch)}
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Perks (one per line)</label>
              <textarea
                value={col.perks.join('\n')}
                onChange={(e) =>
                  patchColumn(col.id, {
                    perks: e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <button
              type="button"
              onClick={() => onChange({ columns: section.columns.filter((c) => c.id !== col.id) })}
              className="text-xs text-red-500 font-medium"
            >
              Remove column
            </button>
          </div>
        )}
      />
      <button
        type="button"
        onClick={() => onChange({ columns: [...section.columns, createProductColumn()] })}
        className="text-xs font-semibold text-[#0EA5E9]"
      >
        + Add product column
      </button>
    </div>
  );
}

function DealTileColorFields({
  card,
  onPatch,
}: {
  card: CoolDealsDealCardItem;
  onPatch: (patch: Partial<CoolDealsDealCardItem>) => void;
}) {
  const bg = card.bgColor ?? DEAL_CARD_DEFAULT_COLORS.bg;
  const bodyLowContrast = Boolean(card.bodyColor && contrastRatio(card.bodyColor, bg) < 3);
  const ctaLowContrast = Boolean(card.ctaColor && contrastRatio(card.ctaColor, bg) < 3);

  return (
    <div className="rounded-lg bg-gray-50 p-3 space-y-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">Tile colors</p>
      {card.imageUrl && (
        <p className="text-[11px] text-gray-500 mb-2">
          The photo shows at the top; background color shades the bottom for text. Short accent labels (e.g. 0%)
          appear as a small chip on photos.
        </p>
      )}
      <div className="mb-3 rounded-lg border border-gray-200 overflow-hidden">
        <DealTileSurface card={card} compact />
      </div>
      {(bodyLowContrast || ctaLowContrast) && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 mb-2">
          {bodyLowContrast && 'Description color is hard to read on this background. '}
          {ctaLowContrast && 'Button color is hard to read on this background. '}
          Try lighter text on dark tiles, or darker text on light tiles.
        </p>
      )}
      <AdminColorField label="Background" value={card.bgColor ?? DEAL_CARD_DEFAULT_COLORS.bg} onChange={(v) => onPatch({ bgColor: v })} />
      <AdminColorField label="Title" value={card.titleColor ?? DEAL_CARD_DEFAULT_COLORS.title} onChange={(v) => onPatch({ titleColor: v })} />
      <AdminColorField label="Description" value={card.bodyColor ?? DEAL_CARD_DEFAULT_COLORS.body} onChange={(v) => onPatch({ bodyColor: v })} />
      <AdminColorField label="Button / link" value={card.ctaColor ?? DEAL_CARD_DEFAULT_COLORS.cta} onChange={(v) => onPatch({ ctaColor: v })} />
      <AdminColorField label="Accent watermark" value={card.accentColor ?? DEAL_CARD_DEFAULT_COLORS.accent} onChange={(v) => onPatch({ accentColor: v })} />
    </div>
  );
}

function CardGridEditor({
  section,
  onPatch,
  onPatchDealCard,
}: {
  section: CoolDealsCardGridSection;
  onPatch: (p: Partial<CoolDealsCardGridSection>) => void;
  onPatchDealCard: (cardId: string, patch: Partial<CoolDealsDealCardItem>) => void;
}) {
  const patchVoucherCard = (cardId: string, patch: Partial<(typeof section.cards)[0]>) => {
    onPatch({
      cards: section.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
    });
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      <Field label="Section title" value={section.headingTitle} onChange={(v) => onPatch({ headingTitle: v })} />
      {section.variant === 'deal' && (
        <div className="rounded-lg border border-gray-100 p-3 space-y-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">Section heading colors</p>
          <AdminColorField
            label="Heading"
            value={section.headingColor ?? '#0C4A6E'}
            onChange={(v) => onPatch({ headingColor: v })}
          />
          <AdminColorField
            label="Subtitle"
            value={section.headingSubtitleColor ?? '#6B7280'}
            onChange={(v) => onPatch({ headingSubtitleColor: v })}
          />
        </div>
      )}
      {section.variant === 'voucher' ? (
        <>
          <button type="button" onClick={() => onPatch({ cards: [...section.cards, createVoucherCard()] })} className="text-xs font-semibold text-[#0EA5E9]">
            + Add card
          </button>
          {section.cards.map((card) => (
            <div key={card.id} className="rounded-lg border p-3 text-sm space-y-1">
              <Field label="Title" value={card.title} onChange={(v) => patchVoucherCard(card.id, { title: v })} />
              <ImageUrlOrUploadField label="Image" value={card.imageUrl} onChange={(v) => patchVoucherCard(card.id, { imageUrl: v })} />
              <input type="color" value={hexForColorInput(card.color)} onChange={(e) => patchVoucherCard(card.id, { color: e.target.value })} />
              <BannerLinkDestinationField
                label="Card navigation"
                fields={card}
                onChange={(patch) => patchVoucherCard(card.id, patch)}
              />
            </div>
          ))}
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500">Deal tiles — drag the handle to reorder (not the form fields).</p>
          <SortableList
            items={section.dealCards ?? []}
            onReorder={(dealCards) => onPatch({ dealCards })}
            renderItem={(card) => (
              <div className="pr-3 py-2 space-y-2">
                <Field label="Title" value={card.title} onChange={(v) => onPatchDealCard(card.id, { title: v })} />
                <Field label="Description" value={card.body} onChange={(v) => onPatchDealCard(card.id, { body: v })} rows={2} />
                <Field label="Button text" value={card.cta} onChange={(v) => onPatchDealCard(card.id, { cta: v })} />
                <BannerLinkDestinationField
                  label="Tile navigation"
                  fields={card}
                  onChange={(patch) => onPatchDealCard(card.id, patch)}
                />
                <ImageUrlOrUploadField label="Background image (optional)" value={card.imageUrl || ''} onChange={(v) => onPatchDealCard(card.id, { imageUrl: v || undefined })} />
                <Field label="Accent text (e.g. 0%)" value={card.accent || ''} onChange={(v) => onPatchDealCard(card.id, { accent: v || undefined })} />
                <DealTileColorFields card={card} onPatch={(p) => onPatchDealCard(card.id, p)} />
                <button
                  type="button"
                  onClick={() =>
                    onPatchDealCard(card.id, {
                      bgColor: DEAL_CARD_DEFAULT_COLORS.bg,
                      titleColor: DEAL_CARD_DEFAULT_COLORS.title,
                      bodyColor: DEAL_CARD_DEFAULT_COLORS.body,
                      ctaColor: DEAL_CARD_DEFAULT_COLORS.cta,
                      accentColor: DEAL_CARD_DEFAULT_COLORS.accent,
                    })
                  }
                  className="text-xs text-gray-500 font-medium"
                >
                  Reset tile colors to default
                </button>
                <button
                  type="button"
                  onClick={() => onPatch({ dealCards: (section.dealCards ?? []).filter((c) => c.id !== card.id) })}
                  className="text-xs text-red-500 font-medium"
                >
                  Remove tile
                </button>
              </div>
            )}
          />
          <button type="button" onClick={() => onPatch({ dealCards: [...(section.dealCards ?? []), createDealCard()] })} className="text-xs font-semibold text-[#0EA5E9]">
            + Add tile
          </button>
        </>
      )}
    </div>
  );
}
