import { useEffect, useMemo, useState } from 'react';
import { Copy, Check, Ticket, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Link } from 'react-router';
import { findVoucherByCode, loadVouchers, type VouchersConfig } from '../data/vouchers';
import { useClaimedVouchers } from '../context/ClaimedVouchersContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { LoyaltyBadge } from './LoyaltyBadge';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatClaimedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MyVouchersModal({ open, onOpenChange }: Props) {
  const { customer } = useCustomerAuth();
  const { claims, loading, refresh } = useClaimedVouchers();
  const [config, setConfig] = useState<VouchersConfig | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void refresh();
    void loadVouchers().then(setConfig);
  }, [open, refresh]);

  const rows = useMemo(() => {
    const list = [...claims].sort(
      (a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime()
    );
    return list.map((entry) => {
      const catalog = entry.voucherCode
        ? findVoucherByCode(entry.voucherCode, config ?? undefined)
        : undefined;
      return {
        entry,
        label: catalog?.label || entry.title,
        code: entry.voucherCode || catalog?.code,
        description: catalog
          ? catalog.discountType === 'percent'
            ? `${catalog.value}% off`
            : catalog.discountType === 'fixed'
              ? `₱${catalog.value.toLocaleString('en-PH')} off`
              : catalog.discountType === 'free_install'
                ? 'Free installation'
                : undefined
          : entry.voucherCode
            ? undefined
            : 'Show this perk when you inquire — our team will honor it.',
      };
    });
  }, [claims, config]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      window.alert(`Copy this code: ${code}`);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#12303f]/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-24px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-[0_30px_70px_-30px_rgba(9,44,64,.55)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] px-6 pb-5 pt-6 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                <Ticket className="h-5 w-5" />
              </span>
              <div>
                <DialogPrimitive.Title className="m-0 text-lg font-bold leading-tight">
                  My vouchers
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="m-0 mt-0.5 text-[13px] text-white/85">
                  Saved to your Hamel account
                </DialogPrimitive.Description>
                {customer?.loyaltyTier ? (
                  <div className="mt-2">
                    <LoyaltyBadge tier={customer.loyaltyTier} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <DialogPrimitive.Close
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto px-5 py-5">
            {loading && rows.length === 0 ? (
              <p className="m-0 py-8 text-center text-sm text-[#5f7a8a]">Loading vouchers…</p>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e1e9ef] bg-[#f6f9fb] px-4 py-8 text-center">
                <Ticket className="mx-auto mb-2 h-8 w-8 text-[#93a9b6]" />
                <p className="m-0 text-sm font-semibold text-[#12303f]">No vouchers yet</p>
                <p className="mt-1 text-[13px] text-[#5f7a8a]">
                  Claim deals on Cool Deals to see them here.
                </p>
                <Link
                  to="/cool-deals"
                  onClick={() => onOpenChange(false)}
                  className="mt-4 inline-flex rounded-full bg-[#0EA5E9] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0284C7]"
                >
                  Browse Cool Deals
                </Link>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {rows.map(({ entry, label, code, description }) => (
                  <li
                    key={entry.id || entry.cardId}
                    className="rounded-2xl border border-[#e1e9ef] bg-[#f6f9fb] px-3.5 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="m-0 text-sm font-bold text-[#12303f]">{label}</p>
                        {description ? (
                          <p className="mt-0.5 text-[12px] text-[#5f7a8a]">{description}</p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-[#93a9b6]">
                          Claimed {formatClaimedAt(entry.claimedAt)}
                        </p>
                      </div>
                      {code ? (
                        <button
                          type="button"
                          onClick={() => void copyCode(code)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#BAE6FD] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#0369A1] hover:bg-[#E0F2FE]"
                          title="Copy code"
                        >
                          {copied === code ? (
                            <Check className="h-3.5 w-3.5 text-[#16A34A]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {code}
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-full bg-[#DCFCE7] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#166534]">
                          Perk
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {rows.length > 0 ? (
            <div className="border-t border-[#eef3f7] px-5 py-3.5">
              <Link
                to="/cool-deals"
                onClick={() => onOpenChange(false)}
                className="block text-center text-[13px] font-semibold text-[#0EA5E9] hover:underline"
              >
                Find more deals →
              </Link>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
