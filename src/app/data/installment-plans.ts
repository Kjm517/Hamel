import { fetchContent, getCachedContent, saveContent } from '../lib/content-api';
import type { InstallmentOption } from './products';
import { calcInstallment } from './products';

export interface CardInstallmentTerm {
  months: number;
  /** Interest percent per month (e.g. 1.5 = 1.5%/mo). Stored as decimal rate for calc: /100. */
  interestPercentPerMonth: number;
}

export interface CardInstallmentPlan {
  id: string;
  bank: string;
  logoUrl?: string;
  enabled: boolean;
  minSpend: number;
  terms: CardInstallmentTerm[];
}

export interface InstallmentPlansConfig {
  plans: CardInstallmentPlan[];
}

export const defaultInstallmentPlans: InstallmentPlansConfig = {
  plans: [
    {
      id: 'plan-bdo',
      bank: 'BDO',
      logoUrl: '/hamel/payments/BDO.svg',
      enabled: true,
      minSpend: 3000,
      terms: [
        { months: 3, interestPercentPerMonth: 0 },
        { months: 6, interestPercentPerMonth: 0 },
        { months: 12, interestPercentPerMonth: 1 },
        { months: 24, interestPercentPerMonth: 1.25 },
        { months: 36, interestPercentPerMonth: 1.5 },
      ],
    },
    {
      id: 'plan-bpi',
      bank: 'BPI',
      logoUrl: '/hamel/payments/BPI.svg',
      enabled: true,
      minSpend: 3000,
      terms: [
        { months: 3, interestPercentPerMonth: 0 },
        { months: 6, interestPercentPerMonth: 0 },
        { months: 12, interestPercentPerMonth: 1 },
        { months: 24, interestPercentPerMonth: 1.2 },
      ],
    },
    {
      id: 'plan-metrobank',
      bank: 'Metrobank',
      logoUrl: '/hamel/payments/Metrobank.svg',
      enabled: true,
      minSpend: 5000,
      terms: [
        { months: 6, interestPercentPerMonth: 0 },
        { months: 12, interestPercentPerMonth: 1.1 },
        { months: 24, interestPercentPerMonth: 1.35 },
      ],
    },
  ],
};

function normalizeConfig(raw: Partial<InstallmentPlansConfig> | null): InstallmentPlansConfig {
  if (!raw?.plans?.length) return structuredClone(defaultInstallmentPlans);
  return {
    plans: raw.plans.map((p, i) => ({
      id: p.id || `plan-${i}`,
      bank: p.bank || `Bank ${i + 1}`,
      logoUrl: p.logoUrl,
      enabled: p.enabled !== false,
      minSpend: Number(p.minSpend) || 0,
      terms: (p.terms ?? []).map((t) => ({
        months: Number(t.months) || 3,
        interestPercentPerMonth: Number(t.interestPercentPerMonth) || 0,
      })),
    })),
  };
}

export function getInstallmentPlansCached(): InstallmentPlansConfig {
  return normalizeConfig(getCachedContent<InstallmentPlansConfig>('installment_plans') ?? null);
}

export async function loadInstallmentPlans(): Promise<InstallmentPlansConfig> {
  const data = await fetchContent<InstallmentPlansConfig>(
    'installment_plans',
    defaultInstallmentPlans
  );
  return normalizeConfig(data);
}

export async function saveInstallmentPlans(config: InstallmentPlansConfig): Promise<void> {
  await saveContent('installment_plans', normalizeConfig(config));
  window.dispatchEvent(new CustomEvent('hamel-installment-plans-updated'));
}

/** Flatten active bank terms into InstallmentOption[] for a product price. */
export function resolveInstallmentOptionsForPrice(
  price: number,
  productOverride?: InstallmentOption[],
  config?: InstallmentPlansConfig
): InstallmentOption[] {
  const plans = (config ?? getInstallmentPlansCached()).plans.filter((p) => p.enabled);
  const byMonths = new Map<number, InstallmentOption>();
  for (const plan of plans) {
    if (price < plan.minSpend) continue;
    for (const term of plan.terms) {
      const rate = term.interestPercentPerMonth / 100;
      const existing = byMonths.get(term.months);

      if (!existing || rate < existing.interestRate) {
        byMonths.set(term.months, {
          months: term.months,
          interestRate: rate,
          label: `${term.months} months`,
        });
      }
    }
  }
  const bankOptions = [...byMonths.values()].sort((a, b) => a.months - b.months);



  return bankOptions.length || plans.length ? bankOptions : productOverride ?? [];
}

export function activeBankLogos(config?: InstallmentPlansConfig): { name: string; src: string }[] {
  return (config ?? getInstallmentPlansCached()).plans
    .filter((p) => p.enabled && p.logoUrl)
    .map((p) => ({ name: p.bank, src: p.logoUrl! }));
}

export function lowestMonthlyFromPlans(
  price: number,
  options: InstallmentOption[]
): { monthly: number; months: number } | null {
  if (!options.length) return null;
  const longest = [...options].sort((a, b) => b.months - a.months)[0];
  return {
    monthly: calcInstallment(price, longest.months, longest.interestRate),
    months: longest.months,
  };
}
