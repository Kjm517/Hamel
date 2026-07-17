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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Admin › Payments › Card Installments
          </p>
          <h2 className="text-2xl font-bold text-gray-900">Card Installment Plans</h2>
          <p className="mt-1 text-sm text-gray-600">
            Admins adjust bank plans that feed the storefront installment modal — months offered,
            interest, minimum spend. Toggle a plan on/off live.
          </p>
          <p className="mt-2 text-sm font-medium text-[#0369A1]">
            {activeCount} of {draft.plans.length} plans active on storefront
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft((prev) => ({ plans: [...prev.plans, newPlan()] }))}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0284C7]"
        >
          <Plus className="h-4 w-4" />
          Add card plan
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          Installment plans saved.
        </div>
      )}

      <div className="space-y-4">
        {draft.plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border bg-white p-5 shadow-sm border-gray-200 ${
              !plan.enabled ? 'opacity-60' : ''
            }`}
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {plan.logoUrl ? (
                <img src={plan.logoUrl} alt="" className="h-8 w-auto max-w-[80px] object-contain" />
              ) : (
                <div className="flex h-8 w-16 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
                  LOGO
                </div>
              )}
              <input
                value={plan.bank}
                onChange={(e) => patchPlan(plan.id, { bank: e.target.value })}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold"
              />
              <span className="rounded-full bg-[#E0F2FE] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#0369A1]">
                Card installment
              </span>
              <label className="ml-auto flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={plan.enabled}
                  onChange={(e) => patchPlan(plan.id, { enabled: e.target.checked })}
                />
                Active
              </label>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({ plans: prev.plans.filter((p) => p.id !== plan.id) }))
                }
                className="text-red-600 hover:underline"
                aria-label="Delete plan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-gray-600">
                Min. spend ₱
                <input
                  type="number"
                  min={0}
                  value={plan.minSpend}
                  onChange={(e) => patchPlan(plan.id, { minSpend: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <ImageUrlOrUploadField
                label="Bank logo"
                value={plan.logoUrl || ''}
                onChange={(v) => patchPlan(plan.id, { logoUrl: v })}
              />
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Interest per month · set per term
            </p>
            <div className="space-y-2">
              {plan.terms.map((term, ti) => (
                <div key={ti} className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={term.months}
                    onChange={(e) => {
                      const months = Number(e.target.value) || 1;
                      const terms = plan.terms.map((t, i) => (i === ti ? { ...t, months } : t));
                      patchPlan(plan.id, { terms });
                    }}
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  <span className="text-sm text-gray-600">months</span>
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
                    className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  <span className="text-sm text-gray-600">% /mo</span>
                  <button
                    type="button"
                    onClick={() =>
                      patchPlan(plan.id, { terms: plan.terms.filter((_, i) => i !== ti) })
                    }
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
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
                className="text-xs font-semibold text-[#0EA5E9] hover:underline"
              >
                ＋ term
              </button>
            </div>
          </div>
        ))}
      </div>

      {dirty && (
        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
          <p className="text-sm text-amber-900">Unsaved changes are highlighted</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const parsed = JSON.parse(baseline) as InstallmentPlansConfig;
                setDraft(parsed);
              }}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-amber-500 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
