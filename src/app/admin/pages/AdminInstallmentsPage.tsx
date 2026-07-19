import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  defaultInstallmentPlans,
  loadInstallmentPlans,
  saveInstallmentPlans,
  type CardInstallmentPlan,
  type InstallmentPlansConfig,
} from '../../data/installment-plans';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { AdminToggle } from '../components/AdminToggle';
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

const LOGO_COLORS = ['#1e3a8a', '#b91c1c', '#0f766e', '#7c3aed', '#0369a1', '#b45309'];

function logoColorFor(bank: string): string {
  let h = 0;
  for (let i = 0; i < bank.length; i++) h = (h + bank.charCodeAt(i) * (i + 1)) % LOGO_COLORS.length;
  return LOGO_COLORS[h] ?? LOGO_COLORS[0];
}

function logoTextFor(bank: string): string {
  const trimmed = bank.trim();
  if (!trimmed) return 'LOGO';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return parts
      .slice(0, 2)
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase();
  }
  return trimmed.slice(0, 5).toUpperCase();
}

function newPlan(): CardInstallmentPlan {
  return {
    id: `plan-${Date.now()}`,
    bank: 'New bank',
    logoUrl: '',
    enabled: true,
    minSpend: 3000,
    terms: [
      { months: 3, interestPercentPerMonth: 0 },
      { months: 6, interestPercentPerMonth: 0 },
      { months: 12, interestPercentPerMonth: 1 },
    ],
  };
}

export function AdminInstallmentsPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [draft, setDraft] = useState<InstallmentPlansConfig>(defaultInstallmentPlans);
  const [baseline, setBaseline] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadInstallmentPlans().then((cfg) => {
      setDraft(cfg);
      setBaseline(JSON.stringify(cfg));
    });
  }, []);

  const dirty = JSON.stringify(draft) !== baseline;
  const activeCount = draft.plans.filter((p) => p.enabled).length;

  const patchPlan = (id: string, patch: Partial<CardInstallmentPlan>) => {
    setDraft((prev) => ({
      plans: prev.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const removePlan = async (id: string, bank: string) => {
    const ok = await confirm({
      title: 'Delete this installment plan?',
      description: `Remove ${bank || 'this plan'}? Remember to save after deleting.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setDraft((prev) => ({ plans: prev.plans.filter((p) => p.id !== id) }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveInstallmentPlans(draft);
      setBaseline(JSON.stringify(draft));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {confirmDialog}
    <div className="mx-auto max-w-[900px]">
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[560px]">
          <p className={adminUi.pageIntro}>
            Card installment options customers see on the site: banks, months, rates, and minimum
            spend. Turn a plan off anytime.
          </p>
          <p className="mt-2 text-[13.5px] font-bold text-[#0369a1]">
            {activeCount} of {draft.plans.length} plans shown on the site
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft((prev) => ({ plans: [...prev.plans, newPlan()] }))}
          className={`${adminUi.btnPrimary} shrink-0`}
        >
          <Plus className="h-[17px] w-[17px]" strokeWidth={2.2} />
          Add card plan
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {saved && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Installment plans saved.
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {draft.plans.map((plan) => (
          <div
            key={plan.id}
            className={`${adminUi.card} p-5 ${!plan.enabled ? 'opacity-60' : ''}`}
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {plan.logoUrl ? (
                <span className="flex h-[34px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e8eef4] bg-[#f7fafd]">
                  <img
                    src={plan.logoUrl}
                    alt=""
                    className="max-h-full max-w-full object-contain p-0.5"
                  />
                </span>
              ) : (
                <span
                  className="flex h-[34px] w-[60px] shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold text-white"
                  style={{ background: logoColorFor(plan.bank) }}
                >
                  {logoTextFor(plan.bank)}
                </span>
              )}
              <input
                value={plan.bank}
                onChange={(e) => patchPlan(plan.id, { bank: e.target.value })}
                className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-bold text-[#1e2a38] focus:outline-none sm:flex-none"
              />
              <span className="inline-flex items-center rounded-full bg-[#e0f2fe] px-2.5 py-[3px] text-[10.5px] font-extrabold uppercase tracking-[0.04em] text-[#0369a1]">
                Card installment
              </span>
              <label className="ml-auto flex cursor-pointer items-center gap-2.5 text-[13px] text-[#516171]">
                Active
                <AdminToggle
                  checked={plan.enabled}
                  onChange={(enabled) => patchPlan(plan.id, { enabled })}
                  label="Active"
                />
              </label>
              <button
                type="button"
                onClick={() => void removePlan(plan.id, plan.bank)}
                className="text-[#9aa7b5] hover:text-red-500"
                aria-label="Delete plan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 grid gap-3.5 sm:grid-cols-2">
              <label className="block">
                <span className={adminUi.labelMuted}>Min. spend</span>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa7b5]">
                    ₱
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={plan.minSpend}
                    onChange={(e) =>
                      patchPlan(plan.id, { minSpend: Number(e.target.value) || 0 })
                    }
                    className="h-10 w-full rounded-[10px] border border-[#e4ebf2] bg-[#f7fafd] py-0 pl-6 pr-3 text-[14px] text-[#1e2a38] focus:border-sky-300 focus:bg-white focus:outline-none"
                  />
                </div>
              </label>
              <ImageUrlOrUploadField
                label="Bank logo URL"
                value={plan.logoUrl || ''}
                onChange={(v) => patchPlan(plan.id, { logoUrl: v })}
                placeholder="/hamel/banks/…"
              />
            </div>

            <p className={`mb-2.5 ${adminUi.sectionLabel}`}>Interest per month · set per term</p>
            <div className="flex flex-wrap gap-2">
              {plan.terms.map((term, ti) => (
                <div
                  key={ti}
                  className="flex items-center gap-[7px] rounded-[10px] border border-[#e8eef4] bg-[#f9fbfd] px-3 py-2"
                >
                  <input
                    type="number"
                    min={1}
                    value={term.months}
                    onChange={(e) => {
                      const months = Number(e.target.value) || 1;
                      const terms = plan.terms.map((t, i) => (i === ti ? { ...t, months } : t));
                      patchPlan(plan.id, { terms });
                    }}
                    className="w-10 border-0 bg-transparent text-center text-[15px] font-extrabold text-[#1e2a38] focus:outline-none"
                  />
                  <span className="text-[12px] text-[#7a8899]">mo</span>
                  <span className="h-4 w-px bg-[#e4ebf2]" />
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={term.interestPercentPerMonth}
                    onChange={(e) => {
                      const interestPercentPerMonth = Number(e.target.value) || 0;
                      const terms = plan.terms.map((t, i) =>
                        i === ti ? { ...t, interestPercentPerMonth } : t
                      );
                      patchPlan(plan.id, { terms });
                    }}
                    className={`w-12 border-0 bg-transparent text-center text-[13.5px] font-bold focus:outline-none ${
                      term.interestPercentPerMonth === 0 ? 'text-[#16a34a]' : 'text-[#1e2a38]'
                    }`}
                  />
                  <span className="text-[12px] text-[#7a8899]">/mo</span>
                  <button
                    type="button"
                    onClick={() =>
                      patchPlan(plan.id, { terms: plan.terms.filter((_, i) => i !== ti) })
                    }
                    className="ml-0.5 text-[12px] font-bold text-[#9aa7b5] hover:text-red-500"
                    aria-label="Remove term"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patchPlan(plan.id, {
                    terms: [...plan.terms, { months: 18, interestPercentPerMonth: 1 }],
                  })
                }
                className="inline-flex items-center gap-[5px] rounded-[10px] border-2 border-dashed border-[#d6e2ee] bg-white px-3 py-2 text-[12.5px] font-bold text-[#0ea5e9] transition hover:border-sky-300"
              >
                ＋ term
              </button>
            </div>
          </div>
        ))}
      </div>

      {dirty && (
        <div className="sticky bottom-4 mt-[18px] flex items-center justify-between gap-3 rounded-[14px] border border-[#fde68a] bg-[#fffbeb] px-[18px] py-[13px] shadow-[0_12px_28px_-14px_rgba(180,140,20,0.4)]">
          <p className="m-0 text-[13.5px] text-[#92600a]">Unsaved changes are highlighted</p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                const parsed = JSON.parse(baseline) as InstallmentPlansConfig;
                setDraft(parsed);
              }}
              className={adminUi.btnGhost}
            >
              Discard
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className={adminUi.btnAmber}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
