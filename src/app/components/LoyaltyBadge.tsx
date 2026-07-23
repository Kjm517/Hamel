import type { Customer } from '../lib/customer-api';

export type LoyaltyTier = NonNullable<Customer['loyaltyTier']>;

const STYLES: Record<LoyaltyTier, string> = {
  bronze: 'bg-[#f5e6d3] text-[#8b5a2b]',
  silver: 'bg-[#e8eef4] text-[#475569]',
  gold: 'bg-[#fef3c7] text-[#b45309]',
};

const LABELS: Record<LoyaltyTier, string> = {
  bronze: 'Bronze member',
  silver: 'Silver member',
  gold: 'Gold member',
};

const SHORT: Record<LoyaltyTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

export function LoyaltyBadge({
  tier,
  compact = false,
}: {
  tier: LoyaltyTier | null | undefined;
  compact?: boolean;
}) {
  if (!tier) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold uppercase tracking-wide ${
        compact ? 'text-[10px]' : 'text-[11px]'
      } ${STYLES[tier]}`}
    >
      {compact ? SHORT[tier] : LABELS[tier]}
    </span>
  );
}
