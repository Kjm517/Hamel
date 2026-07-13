import { useState } from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router';
import type { Product } from '../data/products';
import { PromoChip, CornerTag } from './PromoBadge';
import { PromoCountdownInline } from './PromoCountdownBanner';
import { brandLogoFor } from '../data/hamelAssets';
import { SpecialOffersModal } from './SpecialOffersModal';
import { InstallmentChip, InstallmentOptionsModal } from './InstallmentOptionsModal';
import { useProductTags } from '../context/ProductTagsContext';
import {
  cornerTagBgColor,
  cornerTagTextColor,
  resolveProductCornerTags,
} from '../lib/product-corner-tags';
import {
  getDiscountedPrice,
  getPromoCountdownEndsAt,
  isPromoCountdownActive,
  productHasPromos,
  resolveProductPromos,
} from '../lib/product-promos';
import { calcInstallment } from '../data/products';

interface ProductCardProps {
  product: Product;
  /** When set, clicking the card runs this instead of opening product details. */
  onPick?: (product: Product) => void;
  pickLabel?: string;
  /** Grey out and disable picking (e.g. already in compare). */
  pickDisabled?: boolean;
}

// Returns the price label color based on product tier
function getPriceColor(tier: Product['tier'], hasPromo: boolean): string {
  if (tier === 'flash-sale' && hasPromo) return '#EA580C'; // orange — flash sale
  if (tier === 'budget') return '#D97706';                 // amber/gold — budget
  return '#0EA5E9';                                        // blue — premium
}

// Returns the tier label text for display (optional, shown as small tag below price)
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
  const discountedStart = getDiscountedPrice(product, product.priceStart);
  const discountedEnd = getDiscountedPrice(product, product.priceEnd);
  const hasDiscount = discountedStart < product.priceStart;

  const installmentOptions = product.installmentOptions ?? [];
  const hasInstallments = installmentOptions.length > 0;
  const lowestMonthly = (() => {
    if (!hasInstallments) return null;
    const longest = [...installmentOptions].sort((a, b) => b.months - a.months)[0];
    return calcInstallment(discountedStart, longest.months, longest.interestRate);
  })();

  const priceColor = getPriceColor(product.tier, productHasPromos(product));
  const tierLabel = getTierLabel(product.tier);
  const resolvedPromos = resolveProductPromos(product, tagCatalog).slice(0, 3);
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
        {/* Product Image */}
        <div className="relative bg-gray-50 aspect-square shrink-0 flex items-center justify-center p-4">
          <img
            src={product.image}
            alt={product.model}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          />

          {/* Top-right corner tags — equal width per card (widest label wins) */}
          {cornerTags.length > 0 && (
            <div className="absolute top-2 right-2 inline-flex max-w-[calc(100%-1rem)] flex-col items-stretch gap-1">
              {cornerTags.map((tag) => (
                <CornerTag
                  key={tag.id}
                  label={tag.name}
                  color={cornerTagTextColor(tag)}
                  bgColor={cornerTagBgColor(tag)}
                />
              ))}
            </div>
          )}

        </div>

        {/* Product Info — fixed blocks + flex spacer so CTA sits on one baseline */}
        <div className="flex min-h-0 flex-1 flex-col p-4">
          {/* Brand */}
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
                      ? 'h-auto w-[118px] max-h-7 object-contain object-left'
                      : 'h-6 w-auto max-w-[100px] object-contain object-left'
                  }
                />
              ) : (
                <span className="text-xs uppercase tracking-wide text-gray-500">{product.brand}</span>
              );
            })()}
          </div>

          {/* Model Name */}
          <h3 className="mb-3 line-clamp-2 min-h-[2.75rem] shrink-0 text-sm font-bold leading-snug text-gray-900">
            {product.model}
          </h3>

          {/* HP Options — Abenson-style soft selection chips */}
          <div className="mb-3 flex h-14 shrink-0 flex-wrap content-start gap-1.5">
            {product.hp.slice(0, 4).map((hp) => (
              <span
                key={hp}
                className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#0369A1]"
              >
                {hp}
              </span>
            ))}
          </div>

          {/* Price — fixed two-row slot so sale & regular prices share one baseline */}
          <div className="mb-1 flex h-[3.25rem] shrink-0 flex-col justify-end gap-0.5">
            <div className="h-4 text-xs leading-4 text-gray-400 line-through">
              {hasDiscount
                ? product.priceStart === product.priceEnd
                  ? `₱${product.priceStart.toLocaleString()}`
                  : `₱${product.priceStart.toLocaleString()} – ₱${product.priceEnd.toLocaleString()}`
                : '\u00A0'}
            </div>
            <div
              className="truncate text-lg font-bold leading-tight"
              style={{ color: priceColor }}
              title={
                hasDiscount
                  ? discountedStart === discountedEnd
                    ? `₱${discountedStart.toLocaleString()}`
                    : `₱${discountedStart.toLocaleString()} – ₱${discountedEnd.toLocaleString()}`
                  : product.priceStart === product.priceEnd
                    ? `₱${product.priceStart.toLocaleString()}`
                    : `₱${product.priceStart.toLocaleString()} – ₱${product.priceEnd.toLocaleString()}`
              }
            >
              {hasDiscount
                ? discountedStart === discountedEnd
                  ? `₱${discountedStart.toLocaleString()}`
                  : `₱${discountedStart.toLocaleString()} – ₱${discountedEnd.toLocaleString()}`
                : product.priceStart === product.priceEnd
                  ? `₱${product.priceStart.toLocaleString()}`
                  : `₱${product.priceStart.toLocaleString()} – ₱${product.priceEnd.toLocaleString()}`}
            </div>
          </div>

          {/* Tier / countdown — own row so it never fights installment for width */}
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

          {/* Installment — full-width compact line under price (no “As low as”) */}
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

          {/* Rating */}
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

          {/* Promo chips — compact wrap so 2–3 chips don’t cover the card */}
          <div className="mb-3 flex max-h-[68px] shrink-0 flex-wrap content-end gap-1.5 overflow-hidden">
            {resolvedPromos.map((promo, i) => (
              <PromoChip
                key={i}
                size="card"
                badgeType={promo.badgeType}
                label={promo.label}
                cashPerMonth={promo.cashPerMonth}
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

          {/* CTA */}
          <div
            className={`w-full shrink-0 py-2.5 text-center text-sm font-semibold transition-opacity ${
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
