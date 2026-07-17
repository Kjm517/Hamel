import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ticket, X } from 'lucide-react';
import {
  computeVoucherDiscount,
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

type Props = {
  subtotal: number;
  applied: StoreVoucher | null;
  onApply: (voucher: StoreVoucher | null) => void;
  /** When set, only vouchers for this product (or all-products vouchers) are shown. */
  productId?: string;
};

export function SelectOrEnterVoucher({ subtotal, applied, onApply, productId }: Props) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<VouchersConfig | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadVouchers().then(setConfig);
  }, []);

  const discount = useMemo(
    () => (applied ? computeVoucherDiscount(applied, subtotal) : null),
    [applied, subtotal]
  );

  const claimables = useMemo(
    () =>
      listVouchersForProduct(productId, config ?? undefined, { includeExhausted: true }),
    [config, productId]
  );

  const tryApplyCode = (raw: string) => {
    const found = findVoucherByCode(raw, config ?? undefined, productId);
    if (!found) {
      setError(
        productId
          ? 'Voucher not found, inactive, or not valid for this product.'
          : 'Voucher not found or inactive.'
      );
      return;
    }
    if (!voucherHasRemaining(found)) {
      setError('This voucher has reached its customer claim limit.');
      return;
    }
    const result = computeVoucherDiscount(found, subtotal);
    if (result.amount <= 0 && found.discountType !== 'free_install') {
      setError(result.label);
      return;
    }
    onApply(found);
    setError(null);
    setOpen(false);
    setCode('');
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {!applied ? (
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
            Select or enter voucher
          </button>
        </div>
      ) : (
        <div className="space-y-2 px-3 py-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="inline-flex min-w-0 flex-col gap-0.5 font-semibold text-[#2563EB]">
              <span className="inline-flex items-center gap-1.5">
                <Ticket className="h-4 w-4 shrink-0" />
                Voucher
                <span className="truncate font-medium text-gray-600">
                  {discount?.label || applied.label}
                </span>
              </span>
              {applied.audience !== 'everyone' && (
                <span className="pl-5 text-[10px] font-medium text-gray-500">
                  {VOUCHER_AUDIENCE_LABELS[applied.audience]}
                </span>
              )}
              {applied.maxRedemptions > 0 && (
                <span className="pl-5 text-[10px] font-medium text-gray-500">
                  {voucherLimitLabel(applied)}
                </span>
              )}
            </span>
            <span className="shrink-0 font-bold text-[#2563EB]">
              −₱{(discount?.amount ?? 0).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onApply(null)}
            className="w-full rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            Remove voucher
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
              className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Select voucher</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter voucher code"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => tryApplyCode(code)}
                  className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white"
                >
                  Apply
                </button>
              </div>
              {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {claimables.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
                    No vouchers available for this product.
                  </p>
                ) : (
                  claimables.map((v) => {
                    const d = computeVoucherDiscount(v, subtotal);
                    const exhausted = !voucherHasRemaining(v);
                    const blocked =
                      exhausted || (d.amount <= 0 && v.discountType !== 'free_install');
                    const left = voucherRemainingSlots(v);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={blocked}
                        onClick={() => tryApplyCode(v.code)}
                        className={`w-full rounded-xl border px-3 py-3 text-left ${
                          blocked
                            ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                            : 'border-[#BAE6FD] bg-[#F0F9FF] hover:border-[#0EA5E9]'
                        }`}
                      >
                        <div className="text-sm font-bold text-gray-900">{v.label}</div>
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
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
