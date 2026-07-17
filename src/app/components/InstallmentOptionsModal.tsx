import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, X } from 'lucide-react';
import type { InstallmentOption } from '../data/products';
import { calcInstallment } from '../data/products';
import {
  activeBankLogos,
  getInstallmentPlansCached,
  loadInstallmentPlans,
} from '../data/installment-plans';

type InstallmentOptionsModalProps = {
  open: boolean;
  onClose: () => void;
  price: number;
  options: InstallmentOption[];
  productName?: string;
};

function formatMoney(amount: number): string {
  return `₱${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

const FALLBACK_LOGOS = [
  { name: 'BDO', src: '/hamel/payments/BDO.svg' },
  { name: 'BPI', src: '/hamel/payments/BPI.svg' },
  { name: 'Metrobank', src: '/hamel/payments/Metrobank.svg' },
  { name: 'Visa', src: '/hamel/payments/visa.svg' },
  { name: 'Mastercard', src: '/hamel/payments/mastercard.svg' },
];

export function InstallmentOptionsModal({
  open,
  onClose,
  price,
  options,
  productName,
}: InstallmentOptionsModalProps) {
  const [logos, setLogos] = useState(() => activeBankLogos(getInstallmentPlansCached()));

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void loadInstallmentPlans().then((cfg) => {
        if (!cancelled) setLogos(activeBankLogos(cfg));
      });
    };
    refresh();
    window.addEventListener('hamel-installment-plans-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-installment-plans-updated', refresh);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const sorted = [...options].sort((a, b) => b.months - a.months);
  const bankLogos = logos.length ? logos : FALLBACK_LOGOS;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="installment-options-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 id="installment-options-title" className="text-lg font-bold text-gray-900">
              Installment Options
            </h2>
            {productName ? <p className="mt-0.5 text-xs text-gray-500">{productName}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-2">
          <div className="flex items-center justify-between border-b border-gray-100 py-3.5">
            <span className="text-sm text-gray-600">Installment Price</span>
            <span className="text-sm font-bold text-gray-900">{formatMoney(price)}</span>
          </div>
          {sorted.map((opt) => {
            const monthly = calcInstallment(price, opt.months, opt.interestRate);
            return (
              <div
                key={opt.months}
                className="flex items-center justify-between border-b border-gray-100 py-3.5 last:border-b-0"
              >
                <span className="text-sm text-gray-700">
                  {opt.months} months
                  {opt.interestRate === 0 ? (
                    <span className="ml-1.5 text-xs font-semibold text-emerald-600">0%</span>
                  ) : (
                    <span className="ml-1.5 text-xs text-gray-400">
                      {(opt.interestRate * 100).toFixed(2)}%/mo
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatMoney(monthly)}/mo
                </span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <p className="mb-1 text-sm font-semibold text-gray-800">Valid Payments</p>
          <p className="mb-3 text-xs text-gray-500">
            Up to {Math.max(0, ...options.map((o) => o.months))} months installment based on
            installment price. Credit and debit cards accepted. Subject to bank approval.
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {bankLogos.map((bank) => (
              <img
                key={bank.name}
                src={bank.src}
                alt={bank.name}
                title={bank.name}
                className="h-7 w-auto max-w-[72px] object-contain"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border-2 border-[#0EA5E9] bg-white py-2.5 text-sm font-bold text-[#0EA5E9] hover:bg-[#F0F9FF]"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

type InstallmentChipProps = {
  price: number;
  options: InstallmentOption[];
  onClick: () => void;
  size?: 'card' | 'detail';
};

export function InstallmentChip({ price, options, onClick, size = 'detail' }: InstallmentChipProps) {
  if (!options.length) return null;
  const longest = [...options].sort((a, b) => b.months - a.months)[0];
  const monthly = calcInstallment(price, longest.months, longest.interestRate);
  const isCard = size === 'card';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex max-w-full items-center gap-1 font-semibold text-[#0369A1] transition hover:border-[#0EA5E9] hover:bg-[#E0F2FE] ${
        isCard
          ? 'w-full justify-between rounded-md border border-[#BAE6FD]/60 bg-[#F0F9FF] px-2.5 py-1.5 text-[11px] leading-tight'
          : 'rounded-full border border-[#BAE6FD] bg-[#EFF6FF] px-3 py-1.5 text-sm'
      }`}
      title="View installment options"
    >
      <span className="truncate">
        {isCard
          ? `${formatMoney(monthly)}/mo · ${longest.months} mos`
          : `As low as ${formatMoney(monthly)}/mo for ${longest.months} mos`}
      </span>
      <ChevronRight size={isCard ? 14 : 16} className="shrink-0 opacity-70" />
    </button>
  );
}
