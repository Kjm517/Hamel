import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router';
import type { InstallmentOption, Product } from '../data/products';
import { calcInstallment } from '../data/products';
import {
  loadInstallmentPlans,
  resolveInstallmentOptionsForPrice,
} from '../data/installment-plans';
import { PromoChip, CornerTag } from './PromoBadge';
import { PromoCountdownInline } from './PromoCountdownBanner';
import { brandLogoFor } from '../data/hamelAssets';
import { SpecialOffersModal } from './SpecialOffersModal';
import { InstallmentChip, InstallmentOptionsModal } from './InstallmentOptionsModal';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useProductTags } from '../context/ProductTagsContext';
import {
  cornerTagBgColor,
  cornerTagTextColor,
  cornerTagVariant,
  formatCornerTagLabel,
  resolveProductCornerTags,
} from '../lib/product-corner-tags';
import {
  getProductDisplayPrices,
  getPromoCountdownEndsAt,
  isPromoCountdownActive,
  productHasPromos,
  resolveProductPromos,
} from '../lib/product-promos';
import { getPriceColor } from '../lib/product-price-color';

interface ProductCardProps {
  product: Product;
  /** When set, clicking the card runs this instead of opening product details. */
  onPick?: (product: Product) => void;
  pickLabel?: string;
  /** Grey out and disable picking (e.g. already in compare). */
  pickDisabled?: boolean;
}

function getTierLabel(tier: Product['tier']): { label: string; color: string; bg: string } | null {
  if (tier === 'premium') return { label: 'Premium Quality', color: '#FFF', bg: '#0EA5E9' };
  if (tier === 'budget')  return { label: 'Best Value', color: '#111', bg: '#FFC107' };
  if (tier === 'flash-sale') return { label: 'Flash Deal', color: '#FFF', bg: '#EA580C' };
  return null;
}

export function ProductCard({ product, onPick, pickLabel, pickDisabled }: ProductCardProps) {
  const { tags: tagCatalog } = useProductTags();
  const [offersOpen, setOffersOpen] = useState(false);
  const [offerFocus, setOfferFocus] = useState(0);
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>(() =>
    resolveInstallmentOptionsForPrice(product.priceStart, product.installmentOptions)
  );
  const { listStart, listEnd, saleStart: discountedStart, saleEnd: discountedEnd, hasDiscount } =
    getProductDisplayPrices(product);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void loadInstallmentPlans().then((cfg) => {
        if (!cancelled) {
          setInstallmentOptions(
            resolveInstallmentOptionsForPrice(discountedStart, product.installmentOptions, cfg)
          );
        }
      });
    };
    refresh();
    window.addEventListener('hamel-installment-plans-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-installment-plans-updated', refresh);
    };
  }, [discountedStart, product.installmentOptions]);

  const hasInstallments = installmentOptions.length > 0;
  const lowestMonthly = (() => {
    if (!hasInstallments) return null;
    const longest = [...installmentOptions].sort((a, b) => b.months - a.months)[0];
    return calcInstallment(discountedStart, longest.months, longest.interestRate);
  })();

  const priceColor = getPriceColor(product.tier, productHasPromos(product));
  const tierLabel = getTierLabel(product.tier);
  const resolvedPromos = resolveProductPromos(product, tagCatalog).slice(0, 4);
  const cornerTags = resolveProductCornerTags(product, tagCatalog);
  const countdownEndsAt = getPromoCountdownEndsAt(product);
  const disabled = Boolean(onPick && pickDisabled);

  const cardBody = (
      <div
        className={`flex h-full flex-col rounded-lg shadow-sm transition-all duration-200 overflow-hidden group border border-gray-200 ${
          disabled
            ? 'bg-gray-100 opacity-70'
            : 'bg-white hover:shadow-xl'
        }`}
        style={{ borderRadius: '8px' }}
      >
        {}
        <div className="relative flex aspect-square shrink-0 items-center justify-center bg-gray-50 p-3 sm:p-4">
          <ImageWithFallback
            src={product.image}
            alt={product.model}
            loading="lazy"
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {}
        <div className="flex min-h-0 flex-1 flex-col p-2.5 sm:p-4">
          {}
          {cornerTags.length > 0 && (
            <div className="mb-2 flex min-h-[22px] shrink-0 flex-wrap gap-1.5">
              {cornerTags.map((tag) => {
                const label = formatCornerTagLabel(product, tag);
                if (!label) return null;
                const variant = cornerTagVariant(tag);
                const bg = cornerTagBgColor(tag);
                return (
                  <CornerTag
                    key={tag.id}
                    variant={variant}
                    label={label}
                    color={variant === 'outline' ? bg : cornerTagTextColor(tag)}
                    bgColor={
                      variant === 'outline'
                        ? bg === '#EA580C' || bg === '#EF4444'
                          ? '#0EA5E9'
                          : bg
                        : bg
                    }
                  />
                );
              })}
            </div>
          )}

          {}
          <div className="mb-1.5 flex h-8 shrink-0 items-center">
            {(() => {
              const logo = brandLogoFor(product.brand);
              const isSamsung = product.brand.trim().toLowerCase() === 'samsung';
              return logo ? (
                <img
                  src={logo}
                  alt={product.brand}
                  className={
                    isSamsung
                      ? 'h-auto w-full max-w-[90px] max-h-6 object-contain object-left sm:max-h-7 sm:max-w-[118px]'
                      : 'h-5 w-auto max-w-[80px] object-contain object-left sm:h-6 sm:max-w-[100px]'
                  }
                />
              ) : (
                <span className="text-xs uppercase tracking-wide text-gray-500">{product.brand}</span>
              );
            })()}
          </div>

          {}
          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] shrink-0 text-xs font-bold leading-snug text-gray-900 sm:mb-3 sm:min-h-[2.75rem] sm:text-sm">
            {product.model}
          </h3>

          {}
          <div className="mb-2 flex min-h-5 shrink-0 flex-wrap items-center gap-0.5">
            {product.hp.slice(0, 4).map((hp) => (
              <span
                key={hp}
                className="shrink-0 rounded border border-[#BFDBFE] bg-[#EFF6FF] px-1 py-px text-[9px] font-semibold leading-none text-[#0369A1]"
              >
                {hp}
              </span>
            ))}
          </div>

          {}
          <div className="mb-1 flex min-h-[2.75rem] shrink-0 flex-col justify-end gap-0.5 sm:h-[3.25rem] sm:min-h-0">
            <div className="h-4 text-[10px] leading-4 text-gray-400 line-through sm:text-xs">
              {hasDiscount
                ? listStart === listEnd
                  ? `₱${listStart.toLocaleString()}`
                  : `₱${listStart.toLocaleString()} – ₱${listEnd.toLocaleString()}`
                : '\u00A0'}
            </div>
            <div
              className="text-sm font-bold leading-tight sm:truncate sm:text-lg"
              style={{ color: priceColor }}
              title={
                hasDiscount
                  ? discountedStart === discountedEnd
                    ? `₱${discountedStart.toLocaleString()}`
                    : `₱${discountedStart.toLocaleString()} – ₱${discountedEnd.toLocaleString()}`
                  : listStart === listEnd
                    ? `₱${listStart.toLocaleString()}`
                    : `₱${listStart.toLocaleString()} – ₱${listEnd.toLocaleString()}`
              }
            >
              {hasDiscount
                ? discountedStart === discountedEnd
                  ? `₱${discountedStart.toLocaleString()}`
                  : `₱${discountedStart.toLocaleString()} – ₱${discountedEnd.toLocaleString()}`
                : listStart === listEnd
                  ? `₱${listStart.toLocaleString()}`
                  : `₱${listStart.toLocaleString()} – ₱${listEnd.toLocaleString()}`}
            </div>
          </div>

          {}
          {resolvedPromos.length > 0 && (
            <div className="-mx-0.5 mb-2 flex min-h-7 shrink-0 items-center gap-1 overflow-x-auto px-0.5 sm:h-8 sm:min-h-0 sm:overflow-hidden">
              {resolvedPromos.map((promo, i) => (
                <PromoChip
                  key={`${promo.chipImageUrl ?? promo.label}-${promo.badgeType}-${i}`}
                  size="card"
                  badgeType={promo.badgeType}
                  label={promo.label}
                  cashPerMonth={promo.cashPerMonth}
                  chipImageUrl={promo.chipImageUrl}
                  renderMode={promo.renderMode}
                  iconUrl={promo.iconUrl}
                  iconEmoji={promo.iconEmoji}
                  iconBgColor={promo.iconBgColor}
                  textBgColor={promo.textBgColor}
                  subtitle={promo.subtitle}
                  onClick={
                    onPick || disabled
                      ? undefined
                      : (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOfferFocus(i);
                          setOffersOpen(true);
                        }
                  }
                />
              ))}
            </div>
          )}

          {}
          <div className="mb-1.5 flex min-h-5 shrink-0 flex-wrap items-center gap-1">
            {tierLabel && (
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{ backgroundColor: tierLabel.bg, color: tierLabel.color }}
              >
                {tierLabel.label}
              </span>
            )}
            {countdownEndsAt && isPromoCountdownActive(countdownEndsAt) ? (
              <PromoCountdownInline endsAt={countdownEndsAt} />
            ) : null}
          </div>

          {}
          <div className="mb-3 min-h-8 shrink-0">
            {hasInstallments && lowestMonthly != null ? (
              onPick ? (
                <span className="flex w-full items-center justify-between rounded-md border border-[#BAE6FD]/60 bg-[#F0F9FF] px-2.5 py-1.5 text-[11px] font-semibold leading-tight text-[#0369A1]">
                  <span className="truncate">₱{lowestMonthly.toLocaleString()}/mo</span>
                </span>
              ) : (
                <InstallmentChip
                  size="card"
                  price={discountedStart}
                  options={installmentOptions}
                  onClick={() => setInstallmentsOpen(true)}
                />
              )
            ) : null}
          </div>

          {}
          <div className="mb-2 flex h-5 shrink-0 items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">({product.reviews})</span>
          </div>

          <div className="min-h-0 flex-1" aria-hidden />

          {}
          <div
            className={`w-full shrink-0 py-3 text-center text-sm font-semibold transition-opacity ${
              disabled
                ? 'cursor-not-allowed text-gray-500'
                : 'text-gray-900 group-hover:opacity-90'
            }`}
            style={{
              backgroundColor: disabled ? '#D1D5DB' : '#FFC107',
              borderRadius: '24px',
            }}
          >
            {onPick ? pickLabel || 'Add to compare' : 'Inquire Now'}
          </div>
        </div>
      </div>
  );

  return (
    <>
      {onPick ? (
        <div
          role={disabled ? undefined : 'button'}
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          onClick={() => {
            if (disabled) return;
            onPick(product);
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPick(product);
            }
          }}
          className={`block h-full w-full text-left ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {cardBody}
        </div>
      ) : (
        <Link to={`/product/${product.id}`} className="block h-full">
          {cardBody}
        </Link>
      )}
      <SpecialOffersModal
        open={offersOpen}
        onClose={() => setOffersOpen(false)}
        offers={resolvedPromos}
        highlightIndex={offerFocus}
        productName={`${product.brand} ${product.model}`}
      />
      <InstallmentOptionsModal
        open={installmentsOpen}
        onClose={() => setInstallmentsOpen(false)}
        price={discountedStart}
        options={installmentOptions}
        productName={`${product.brand} ${product.model}`}
      />
    </>
  );
}
