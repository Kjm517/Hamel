import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Ticket, X } from 'lucide-react';
import {
  computeVoucherDiscount,
  computeVouchersDiscount,
  customerMatchesVoucherAudience,
  findVoucherByCode,
  listVouchersForProduct,
  loadVouchers,
  VOUCHER_AUDIENCE_LABELS,
  voucherHasRemaining,
  voucherLimitLabel,
  voucherRemainingSlots,
  type StoreVoucher,
  type VouchersConfig,
} from '../data/vouchers';
import { useClaimedVouchers } from '../context/ClaimedVouchersContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

type Props = {
  subtotal: number;
  applied: StoreVoucher[];
  onApply: (vouchers: StoreVoucher[]) => void;
  /** When set, only vouchers for this product (or all-products vouchers) are shown. */
  productId?: string;
  /** Product category — used for category-scoped vouchers (e.g. Split Type free install). */
  category?: string;
};

function canUseVoucher(
  voucher: StoreVoucher,
  subtotal: number,
  loyaltyTier: 'bronze' | 'silver' | 'gold' | null | undefined
): { ok: true } | { ok: false; reason: string } {
  if (!voucherHasRemaining(voucher)) {
    return { ok: false, reason: 'This voucher has reached its customer claim limit.' };
  }
  const audienceGate = customerMatchesVoucherAudience(voucher.audience, loyaltyTier);
  if (!audienceGate.ok) return audienceGate;
  const result = computeVoucherDiscount(voucher, subtotal);
  if (result.amount <= 0 && voucher.discountType !== 'free_install') {
    return { ok: false, reason: result.label };
  }
  return { ok: true };
}

export function SelectOrEnterVoucher({ subtotal, applied, onApply, productId, category }: Props) {
  const { customer } = useCustomerAuth();
  const loyaltyTier = customer?.loyaltyTier ?? null;
  const { claims: claimed, isCodeClaimed } = useClaimedVouchers();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<VouchersConfig | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<StoreVoucher[]>([]);

  useEffect(() => {
    void loadVouchers().then(setConfig);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDraft(applied);
    setError(null);
    setCode('');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, applied]);

  const totals = useMemo(
    () => (applied.length ? computeVouchersDiscount(applied, subtotal) : null),
    [applied, subtotal]
  );

  const claimables = useMemo(
    () =>
      listVouchersForProduct(productId, config ?? undefined, {
        includeExhausted: true,
        category,
      }),
    [config, productId, category]
  );

  const claimedWallet = useMemo(() => {
    const fromCodes: StoreVoucher[] = [];
    const seen = new Set<string>();
    for (const entry of claimed) {
      const codeKey = (entry.voucherCode || '').trim().toUpperCase();
      if (!codeKey || seen.has(codeKey)) continue;
      const found = findVoucherByCode(codeKey, config ?? undefined, productId, category);
      if (found && !seen.has(found.id)) {
        seen.add(found.id);
        seen.add(codeKey);
        fromCodes.push(found);
      }
    }
    const perks = claimed.filter((e) => !(e.voucherCode || '').trim());
    return { vouchers: fromCodes, perks };
  }, [claimed, config, productId, category]);

  const draftSelectedIds = useMemo(() => new Set(draft.map((v) => v.id)), [draft]);

  // Sort: claimed platform vouchers first in the list
  const sortedClaimables = useMemo(() => {
    return [...claimables].sort((a, b) => {
      const ac = isCodeClaimed(a.code) ? 0 : 1;
      const bc = isCodeClaimed(b.code) ? 0 : 1;
      return ac - bc;
    });
  }, [claimables, claimed, isCodeClaimed]);

  const toggleDraft = (voucher: StoreVoucher) => {
    const gate = canUseVoucher(voucher, subtotal, loyaltyTier);
    if (!gate.ok) {
      setError(gate.reason);
      return;
    }
    setError(null);
    setDraft((prev) => {
      if (prev.some((v) => v.id === voucher.id)) {
        return prev.filter((v) => v.id !== voucher.id);
      }
      return [...prev, voucher];
    });
  };

  const tryAddCode = (raw: string) => {
    const found = findVoucherByCode(raw, config ?? undefined, productId, category);
    if (!found) {
      setError(
        productId
          ? 'Voucher not found, inactive, or not valid for this product.'
          : 'Voucher not found or inactive.'
      );
      return;
    }
    const gate = canUseVoucher(found, subtotal, loyaltyTier);
    if (!gate.ok) {
      setError(gate.reason);
      return;
    }
    setError(null);
    setDraft((prev) => (prev.some((v) => v.id === found.id) ? prev : [...prev, found]));
    setCode('');
  };

  const confirmDraft = () => {
    onApply(draft);
    setOpen(false);
    setCode('');
    setError(null);
  };

  const removeOne = (id: string) => {
    onApply(applied.filter((v) => v.id !== id));
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {applied.length === 0 ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <Ticket className="h-4 w-4 text-orange-500" />
            Platform Voucher
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded border border-[#93C5FD] px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"
          >
            {claimed.length > 0
              ? `Select · ${claimed.length} claimed`
              : 'Select or enter voucher'}
          </button>
        </div>
      ) : (
        <div className="space-y-2 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#2563EB]">
              <Ticket className="h-4 w-4 shrink-0" />
              Vouchers ({applied.length})
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded border border-[#93C5FD] px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"
            >
              Add or change
            </button>
          </div>
          <ul className="space-y-2">
            {totals?.breakdown.map(({ voucher, amount, label }) => (
              <li
                key={voucher.id}
                className="flex items-start justify-between gap-2 rounded-lg bg-[#F0F9FF] px-2.5 py-2 text-sm"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-gray-900">{label || voucher.label}</span>
                  <span className="mt-0.5 block text-[10px] font-medium text-gray-500">
                    {voucher.code}
                    {voucher.audience !== 'everyone'
                      ? ` · ${VOUCHER_AUDIENCE_LABELS[voucher.audience]}`
                      : ''}
                    {voucher.maxRedemptions > 0 ? ` · ${voucherLimitLabel(voucher)}` : ''}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="font-bold text-[#2563EB]">−₱{amount.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => removeOne(voucher.id)}
                    className="rounded-full p-1 text-gray-400 hover:bg-white hover:text-red-600"
                    aria-label={`Remove ${voucher.code}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-sm">
            <span className="font-medium text-gray-600">Voucher savings</span>
            <span className="font-bold text-[#2563EB]">
              −₱{(totals?.amount ?? 0).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onApply([])}
            className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            Remove all vouchers
          </button>
        </div>
      )}

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[85] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="flex w-full max-w-md flex-col rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Select vouchers</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                You can apply more than one voucher. Tap to select or deselect. Vouchers claimed on Cool
                Deals stay in your wallet on this device.
              </p>

              <div className="mb-4 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') tryAddCode(code);
                  }}
                  placeholder="Enter voucher code"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => tryAddCode(code)}
                  className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white"
                >
                  Add
                </button>
              </div>
              {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

              {(claimedWallet.vouchers.length > 0 || claimedWallet.perks.length > 0) && (
                <div className="mb-3 rounded-xl border border-green-200 bg-green-50/80 px-3 py-2.5">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-green-800">
                    My claimed vouchers
                  </p>
                  {claimedWallet.vouchers.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {claimedWallet.vouchers.map((v) => {
                        const selected = draftSelectedIds.has(v.id);
                        const gate = canUseVoucher(v, subtotal, loyaltyTier);
                        return (
                          <li key={v.id}>
                            <button
                              type="button"
                              disabled={!gate.ok}
                              onClick={() => toggleDraft(v)}
                              className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-sm ${
                                selected
                                  ? 'border-[#0EA5E9] bg-white'
                                  : 'border-green-200 bg-white hover:border-[#0EA5E9]'
                              } ${!gate.ok ? 'opacity-60' : ''}`}
                            >
                              <span className="min-w-0">
                                <span className="block font-semibold text-gray-900">{v.label}</span>
                                <span className="text-[10px] font-medium text-green-700">
                                  Claimed · {v.code}
                                </span>
                              </span>
                              <span className="shrink-0 text-[11px] font-bold text-[#0EA5E9]">
                                {selected ? 'Selected' : 'Apply'}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {claimedWallet.perks.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {claimedWallet.perks.map((p) => (
                        <li
                          key={p.cardId}
                          className="rounded-lg border border-green-100 bg-white px-2.5 py-1.5 text-xs text-gray-700"
                        >
                          <span className="font-semibold text-green-800">Claimed</span> · {p.title}
                          <span className="block text-[10px] text-gray-500">
                            Show this perk when you inquire — our team will honor it.
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {sortedClaimables.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
                    No vouchers available for this product.
                  </p>
                ) : (
                  sortedClaimables.map((v) => {
                    const d = computeVoucherDiscount(v, subtotal);
                    const exhausted = !voucherHasRemaining(v);
                    const blocked =
                      exhausted || (d.amount <= 0 && v.discountType !== 'free_install');
                    const left = voucherRemainingSlots(v);
                    const selected = draftSelectedIds.has(v.id);
                    const mine = isCodeClaimed(v.code);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={blocked}
                        onClick={() => toggleDraft(v)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                          blocked
                            ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                            : selected
                              ? 'border-[#0EA5E9] bg-[#E0F2FE] ring-1 ring-[#0EA5E9]'
                              : mine
                                ? 'border-green-300 bg-green-50/50 hover:border-[#0EA5E9]'
                                : 'border-[#BAE6FD] bg-[#F0F9FF] hover:border-[#0EA5E9]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              selected
                                ? 'border-[#0EA5E9] bg-[#0EA5E9] text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                            aria-hidden
                          >
                            {selected ? <Check size={12} strokeWidth={3} /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-bold text-gray-900">{v.label}</div>
                              {mine && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                                  In my wallet
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-gray-500">
                              Code {v.code}
                              {v.minSpend > 0 ? ` · min ₱${v.minSpend.toLocaleString()}` : ''}
                              {v.expiresAt ? ` · till ${v.expiresAt}` : ''}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-[#0369A1]">
                              {v.audience !== 'everyone' && (
                                <span>{VOUCHER_AUDIENCE_LABELS[v.audience]}</span>
                              )}
                              {left != null && (
                                <span className={left === 0 ? 'text-red-600' : ''}>
                                  {left === 0 ? 'Fully claimed' : `${left} claims left`}
                                </span>
                              )}
                            </div>
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500">
                  {draft.length === 0
                    ? 'None selected'
                    : `${draft.length} selected · −₱${computeVouchersDiscount(draft, subtotal).amount.toLocaleString()}`}
                </p>
                <button
                  type="button"
                  onClick={confirmDraft}
                  className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
