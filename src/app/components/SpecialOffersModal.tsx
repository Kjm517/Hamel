import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { PromoChip } from './PromoBadge';
import type { ResolvedProductPromo } from '../lib/resolveProductPromo';

type SpecialOffersModalProps = {
  open: boolean;
  onClose: () => void;
  offers: ResolvedProductPromo[];
  highlightIndex?: number;
  productName?: string;
};

export function SpecialOffersModal({
  open,
  onClose,
  offers,
  highlightIndex = 0,
  productName,
}: SpecialOffersModalProps) {
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

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="special-offers-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[min(88vh,640px)] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2
              id="special-offers-title"
              className="text-base font-extrabold uppercase tracking-wide text-gray-900"
            >
              Special Offers
            </h2>
            {productName ? (
              <p className="mt-0.5 text-xs text-gray-500">{productName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto px-5 py-4">
          {offers.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No special offers on this product.</p>
          ) : (
            offers.map((offer, index) => {
              const active = index === highlightIndex;
              return (
                <div
                  key={`${offer.label}-${index}`}
                  className={`rounded-xl border p-4 ${
                    active ? 'border-[#0EA5E9] bg-[#F0F9FF]' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="mb-3">
                    <PromoChip
                      size="card"
                      badgeType={offer.badgeType}
                      label={offer.label}
                      cashPerMonth={offer.cashPerMonth}
                      chipImageUrl={offer.chipImageUrl}
                      renderMode={offer.renderMode}
                      iconUrl={offer.iconUrl}
                      iconEmoji={offer.iconEmoji}
                      iconBgColor={offer.iconBgColor}
                      textBgColor={offer.textBgColor}
                      subtitle={offer.subtitle}
                    />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {offer.subtitle ? `${offer.label} · ${offer.subtitle}` : offer.label}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                    {offer.description?.trim() ||
                      'Ask our team for full promo details when you inquire about this product.'}
                  </p>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500">
          Promo terms may change. Confirm availability when you inquire.
        </div>
      </div>
    </div>,
    document.body
  );
}
