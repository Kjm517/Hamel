import { useState, useRef } from 'react';
import { Link } from 'react-router';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  getCoolDealsPage,
  saveCoolDealsPage,
  resetCoolDealsPage,
  defaultCoolDealsPage,
  createSection,
  createCardGridSection,
  createVoucherCard,
  createDealCard,
  COOL_DEALS_SECTION_LABELS,
  type CoolDealsPageConfig,
  type CoolDealsSection,
  type CoolDealsSectionType,
  type CoolDealsCardGridSection,
} from '../../data/cool-deals-page';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { hexForColorInput } from '../../lib/color-utils';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

function FieldEditor({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
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
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
        />
      )}
    </div>
  );
}

export function AdminCoolDealsPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [config, setConfig] = useState<CoolDealsPageConfig>(() => getCoolDealsPage());
  const [expandedId, setExpandedId] = useState<string | null>(config.sections[0]?.id ?? null);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSections = (sections: CoolDealsSection[]) => {
    setConfig({ sections });
    setSaved(false);
  };

  const patchSection = (id: string, patch: Partial<CoolDealsSection>) => {
    setConfig((prev) => ({
      sections: prev.sections.map((s) => (s.id === id ? ({ ...s, ...patch } as CoolDealsSection) : s)),
    }));
    setSaved(false);
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= config.sections.length) return;
    const sections = [...config.sections];
    [sections[index], sections[next]] = [sections[next], sections[index]];
    updateSections(sections);
  };

  const removeSection = async (id: string) => {
    const ok = await confirm({
      title: 'Remove this section?',
      description: 'It will be removed from the Cool Deals page. Remember to save after deleting.',
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    updateSections(config.sections.filter((s) => s.id !== id));
  };

  const handleSave = () => {
    void saveCoolDealsPage(config);
    setSaved(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset Cool Deals to defaults?',
      description: 'All custom sections will be replaced. This cannot be undone.',
      confirmLabel: 'Reset',
      tone: 'danger',
    });
    if (!ok) return;
    void resetCoolDealsPage();
    setConfig(JSON.parse(JSON.stringify(defaultCoolDealsPage)));
    setSaved(false);
  };

  const sectionLabel = (s: CoolDealsSection) => {
    if (s.type === 'card-grid') {
      return `${COOL_DEALS_SECTION_LABELS[s.type]} (${s.variant}) — ${s.headingTitle}`;
    }
    if (s.type === 'product-matrix') return `${COOL_DEALS_SECTION_LABELS[s.type]} — ${s.headingTitle}`;
    if (s.type === 'cta') return `${COOL_DEALS_SECTION_LABELS[s.type]} — ${s.title}`;
    return COOL_DEALS_SECTION_LABELS[s.type];
  };

  return (
    <div className="space-y-6">
      {confirmDialog}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cool Deals page</h2>
          <p className="text-gray-600">
            Reorder sections or add new blocks. Hero banner is under{' '}
            <Link to="/admin/banners" className="text-[#0EA5E9] font-semibold hover:underline">
              Banners
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/cool-deals" target="_blank" className="text-sm text-[#0EA5E9] font-semibold hover:underline">
            View page ↗
          </Link>
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
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: saved ? '#10B981' : '#FFC107', color: saved ? '#FFF' : '#111' }}
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        Use <strong>↑ ↓</strong> to change section order on the live page. Add extra <strong>Card grid</strong> sections for more voucher or deal rows.
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            if (v === 'card-grid-deal') {
              updateSections([...config.sections, createCardGridSection('deal')]);
            } else if (v === 'card-grid') {
              updateSections([...config.sections, createCardGridSection('voucher')]);
            } else {
              updateSections([...config.sections, createSection(v as CoolDealsSectionType)]);
            }
            e.target.value = '';
          }}
        >
          <option value="">+ Add section…</option>
          <option value="card-grid">Card grid (voucher cards)</option>
          <option value="card-grid-deal">Card grid (deal tiles)</option>
          <option value="product-matrix">Product types & perks</option>
          <option value="trust-bar">Trust icons bar</option>
          <option value="cta">Contact CTA</option>
          <option value="stats-brands">Stats & brands</option>
        </select>
      </div>

      <div className="space-y-3">
        {config.sections.map((section, index) => {
          const open = expandedId === section.id;

          return (
            <div
              key={section.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm ${section.enabled ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}
            >
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <GripVertical size={16} className="text-gray-300 shrink-0" />
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : section.id)}
                  className="flex-1 text-left text-sm font-semibold text-gray-900 truncate"
                >
                  {index + 1}. {sectionLabel(section)}
                </button>
                <button
                  type="button"
                  onClick={() => patchSection(section.id, { enabled: !section.enabled })}
                  className="p-1.5 rounded text-gray-500 hover:bg-gray-100"
                  title={section.enabled ? 'Hide on site' : 'Show on site'}
                >
                  {section.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveSection(index, -1)}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  disabled={index === config.sections.length - 1}
                  onClick={() => moveSection(index, 1)}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => void removeSection(section.id)}
                  className="p-1.5 rounded text-red-400 hover:bg-red-50"
                  aria-label="Delete section"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {open && (
                <div className="p-5">
                  {section.type === 'card-grid' && (
                    <CardGridSectionEditor
                      section={section}
                      onChange={(patch) => patchSection(section.id, patch)}
                    />
                  )}
                  {section.type === 'product-matrix' && (
                    <>
                      <FieldEditor
                        label="Section title"
                        value={section.headingTitle}
                        onChange={(v) => patchSection(section.id, { headingTitle: v })}
                      />
                      <FieldEditor
                        label="Subtitle"
                        value={section.headingSubtitle || ''}
                        onChange={(v) => patchSection(section.id, { headingSubtitle: v })}
                      />
                      <FieldEditor
                        label="Footnote"
                        value={section.footnote || ''}
                        onChange={(v) => patchSection(section.id, { footnote: v })}
                      />
                    </>
                  )}
                  {section.type === 'cta' && (
                    <>
                      <FieldEditor label="Title" value={section.title} onChange={(v) => patchSection(section.id, { title: v })} />
                      <FieldEditor
                        label="Subtitle"
                        value={section.subtitle}
                        onChange={(v) => patchSection(section.id, { subtitle: v })}
                        rows={2}
                      />
                    </>
                  )}
                  {(section.type === 'trust-bar' || section.type === 'stats-brands') && (
                    <p className="text-sm text-gray-500">This block uses fixed content. Reorder it or hide it with the eye icon.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardGridSectionEditor({
  section,
  onChange,
}: {
  section: CoolDealsCardGridSection;
  onChange: (patch: Partial<CoolDealsCardGridSection>) => void;
}) {
  return (
    <div className="space-y-4">
      <FieldEditor label="Section title" value={section.headingTitle} onChange={(v) => onChange({ headingTitle: v })} />
      <FieldEditor
        label="Subtitle"
        value={section.headingSubtitle || ''}
        onChange={(v) => onChange({ headingSubtitle: v })}
      />
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Background</label>
        <select
          value={section.background}
          onChange={(e) => onChange({ background: e.target.value as 'white' | 'gray' })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
        >
          <option value="white">White</option>
          <option value="gray">Light gray</option>
        </select>
      </div>

      {section.variant === 'voucher' ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase">Voucher cards</p>
            <button
              type="button"
              onClick={() => onChange({ cards: [...section.cards, createVoucherCard()] })}
              className="flex items-center gap-1 text-xs font-semibold text-[#0EA5E9]"
            >
              <Plus size={14} /> Add card
            </button>
          </div>
          {section.cards.map((card, i) => (
            <div key={card.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Card {i + 1}</span>
                <button
                  type="button"
                  onClick={() => onChange({ cards: section.cards.filter((c) => c.id !== card.id) })}
                  className="text-red-400 text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
              <FieldEditor label="Title" value={card.title} onChange={(v) => {
                const cards = section.cards.map((c) => (c.id === card.id ? { ...c, title: v } : c));
                onChange({ cards });
              }} />
              <FieldEditor label="Description" value={card.body} onChange={(v) => {
                const cards = section.cards.map((c) => (c.id === card.id ? { ...c, body: v } : c));
                onChange({ cards });
              }} rows={2} />
              <ImageUrlOrUploadField label="Image" value={card.imageUrl} onChange={(v) => {
                const cards = section.cards.map((c) => (c.id === card.id ? { ...c, imageUrl: v } : c));
                onChange({ cards });
              }} />
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Accent color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={hexForColorInput(card.color)}
                    onChange={(e) => {
                      const cards = section.cards.map((c) => (c.id === card.id ? { ...c, color: e.target.value } : c));
                      onChange({ cards });
                    }}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={card.color}
                    onChange={(e) => {
                      const cards = section.cards.map((c) => (c.id === card.id ? { ...c, color: e.target.value } : c));
                      onChange({ cards });
                    }}
                    className="flex-1 px-2 py-1.5 text-sm border rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase">Deal tiles</p>
            <button
              type="button"
              onClick={() => onChange({ dealCards: [...(section.dealCards ?? []), createDealCard()] })}
              className="flex items-center gap-1 text-xs font-semibold text-[#0EA5E9]"
            >
              <Plus size={14} /> Add tile
            </button>
          </div>
          {(section.dealCards ?? []).map((card, i) => (
            <div key={card.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Tile {i + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ dealCards: (section.dealCards ?? []).filter((c) => c.id !== card.id) })
                  }
                  className="text-red-400 text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
              <FieldEditor label="Title" value={card.title} onChange={(v) => {
                const dealCards = (section.dealCards ?? []).map((c) => (c.id === card.id ? { ...c, title: v } : c));
                onChange({ dealCards });
              }} />
              <FieldEditor label="Description" value={card.body} onChange={(v) => {
                const dealCards = (section.dealCards ?? []).map((c) => (c.id === card.id ? { ...c, body: v } : c));
                onChange({ dealCards });
              }} rows={2} />
              <FieldEditor label="Button label" value={card.cta} onChange={(v) => {
                const dealCards = (section.dealCards ?? []).map((c) => (c.id === card.id ? { ...c, cta: v } : c));
                onChange({ dealCards });
              }} />
              <FieldEditor label="Link" value={card.href} onChange={(v) => {
                const dealCards = (section.dealCards ?? []).map((c) => (c.id === card.id ? { ...c, href: v } : c));
                onChange({ dealCards });
              }} />
              <ImageUrlOrUploadField label="Background image (optional)" value={card.imageUrl || ''} onChange={(v) => {
                const dealCards = (section.dealCards ?? []).map((c) => (c.id === card.id ? { ...c, imageUrl: v } : c));
                onChange({ dealCards });
              }} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
