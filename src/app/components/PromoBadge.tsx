/**
 * Sticker-style promotional badge components, visually similar to the
 * graphic promo overlays seen on product cards in Philippine e-commerce sites.
 */

import type { KeyboardEvent, MouseEvent } from 'react';

export type BadgeType = 'cash-deal' | 'free-install' | 'discount' | 'flash-sale' | 'bundle';

interface PromoBadgeProps {
  badgeType: BadgeType;
  label: string;
  cashPerMonth?: number;
  size?: 'sm' | 'md';
  iconUrl?: string;
  iconEmoji?: string;
  iconBgColor?: string;
  textBgColor?: string;
  subtitle?: string;
}

const ICON_WHITE = '#FFFFFF';

function WhiteStyleIcon({
  badgeType,
  size = 'md',
}: {
  badgeType: BadgeType;
  size?: 'xs' | 'sm' | 'md';
}) {
  const w = size === 'xs' ? 10 : size === 'sm' ? 14 : 18;
  const h = w;
  switch (badgeType) {
    case 'flash-sale':
      return (
        <svg width={w} height={h} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M13 2L4.09 12.37A1 1 0 004.82 14h6.18l-1 8 8.91-10.37A1 1 0 0018.18 10H12l1-8z"
            fill={ICON_WHITE}
          />
        </svg>
      );
    case 'free-install':
      return (
        <svg width={w} height={h} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 12.5l3.5 3.5 6-7"
            stroke={ICON_WHITE}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'discount':
      return (
        <svg width={w} height={h} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2L14.4 9.3H22L15.8 13.7L18.2 21L12 16.6L5.8 21L8.2 13.7L2 9.3H9.6L12 2Z"
            fill={ICON_WHITE}
          />
        </svg>
      );
    case 'cash-deal':
      return (
        <svg width={w} height={h} viewBox="0 0 24 24" fill="none" aria-hidden>
          <text
            x="12"
            y="17"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill={ICON_WHITE}
          >
            ₱
          </text>
        </svg>
      );
    case 'bundle':
      return (
        <svg width={w} height={h} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
            fill={ICON_WHITE}
          />
          <path
            d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
            stroke={ICON_WHITE}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    default:
      return null;
  }
}

function PromoIconSlot({
  iconUrl,
  iconEmoji,
  badgeType,
  isSmall,
}: {
  iconUrl?: string;
  iconEmoji?: string;
  badgeType?: BadgeType;
  isSmall: boolean;
}) {
  const size = isSmall ? 18 : 22;
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className="object-cover"
        style={{
          width: size,
          height: size,
          borderRadius: 2,
        }}
      />
    );
  }
  if (badgeType) {
    return <WhiteStyleIcon badgeType={badgeType} size={isSmall ? 'sm' : 'md'} />;
  }
  if (iconEmoji) {
    return (
      <span
        style={{
          fontSize: isSmall ? 14 : 16,
          lineHeight: 1,
          color: ICON_WHITE,
          filter: 'brightness(0) invert(1)',
        }}
        aria-hidden
      >
        {iconEmoji}
      </span>
    );
  }
  return null;
}

function CustomPromoSticker({
  badgeType,
  label,
  subtitle,
  iconUrl,
  iconEmoji,
  iconBgColor,
  textBgColor,
  size = 'sm',
}: PromoBadgeProps & { iconBgColor: string; textBgColor: string }) {
  const isSmall = size === 'sm';
  const hasCustomIcon = Boolean(iconUrl || iconEmoji || badgeType);

  return (
    <div
      className="flex items-stretch overflow-hidden shadow-md"
      style={{
        borderRadius: '4px',
        minWidth: isSmall ? 80 : 100,
        height: isSmall ? 28 : 34,
      }}
    >
      {hasCustomIcon && (
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden"
          style={{
            backgroundColor: iconUrl ? '#ffffff' : iconBgColor,
            width: iconUrl ? (isSmall ? 32 : 42) : isSmall ? 28 : 34,
          }}
        >
          <PromoIconSlot
            iconUrl={iconUrl}
            iconEmoji={iconEmoji}
            badgeType={iconUrl ? undefined : badgeType}
            isSmall={isSmall}
          />
        </div>
      )}
      <div
        className="flex flex-col justify-center px-2 flex-1"
        style={{ backgroundColor: textBgColor }}
      >
        {subtitle ? (
          <>
            <div
              style={{
                fontSize: isSmall ? 6.5 : 7.5,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1,
                fontWeight: 600,
              }}
            >
              {label.length > 22 ? `${label.slice(0, 20)}…` : label}
            </div>
            <div
              style={{
                fontSize: isSmall ? 9 : 11,
                color: '#FFF',
                lineHeight: 1.1,
                fontWeight: 800,
              }}
            >
              {subtitle}
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: isSmall ? 9 : 11,
              color: '#FFF',
              lineHeight: 1.1,
              fontWeight: 800,
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

const CHIP_STYLE_COLORS: Record<
  BadgeType,
  { iconBg: string; textBg: string; textColor: string; mutedColor: string; border?: string }
> = {
  'flash-sale': {
    iconBg: '#FFFFFF',
    textBg: '#F97316',
    textColor: '#FFFFFF',
    mutedColor: 'rgba(255,255,255,0.9)',
  },
  'free-install': {
    iconBg: '#FFFFFF',
    textBg: '#FACC15',
    textColor: '#1E3A8A',
    mutedColor: '#1D4ED8',
  },
  discount: {
    iconBg: '#FFFFFF',
    textBg: '#FB923C',
    textColor: '#FFFFFF',
    mutedColor: 'rgba(255,255,255,0.92)',
  },
  'cash-deal': {
    iconBg: '#FFFFFF',
    textBg: '#F97316',
    textColor: '#FFFFFF',
    mutedColor: 'rgba(255,255,255,0.9)',
  },
  bundle: {
    iconBg: '#FFFFFF',
    textBg: '#FEF08A',
    textColor: '#1E40AF',
    mutedColor: '#2563EB',
  },
};

function chipLines({
  badgeType,
  label,
  cashPerMonth,
  subtitle,
}: PromoBadgeProps): { eyebrow: string; headline: string } {
  if (badgeType === 'cash-deal') {
    return {
      eyebrow: label || 'Cool Cash',
      headline: cashPerMonth ? `₱${cashPerMonth.toLocaleString()}/mo` : '0% INTEREST',
    };
  }
  if (badgeType === 'free-install') {
    return {
      eyebrow: 'Hamel Service',
      headline: subtitle || 'FREE INSTALLATION',
    };
  }
  if (badgeType === 'bundle') {
    return {
      eyebrow: label || 'Promo',
      headline: subtitle || 'BUNDLE DEAL',
    };
  }
  if (badgeType === 'flash-sale') {
    return {
      eyebrow: 'Limited Offer',
      headline: subtitle || label || 'FLASH DEAL',
    };
  }
  return {
    eyebrow: subtitle ? label : 'Special Offer',
    headline: subtitle || label,
  };
}

function ColoredGlyph({
  badgeType,
  color,
  size,
}: {
  badgeType: BadgeType;
  color: string;
  size: number;
}) {
  switch (badgeType) {
    case 'flash-sale':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M13 2L4.09 12.37A1 1 0 004.82 14h6.18l-1 8 8.91-10.37A1 1 0 0018.18 10H12l1-8z"
            fill={color}
          />
        </svg>
      );
    case 'free-install':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" fill={color} opacity="0.15" />
          <path
            d="M7 12.5l3.5 3.5 6-7"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'discount':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2L14.4 9.3H22L15.8 13.7L18.2 21L12 16.6L5.8 21L8.2 13.7L2 9.3H9.6L12 2Z"
            fill={color}
          />
        </svg>
      );
    case 'cash-deal':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>
            ₱
          </text>
        </svg>
      );
    case 'bundle':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
            fill={color}
          />
          <path
            d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    default:
      return null;
  }
}

/** Marketplace-style chip: Abenson special-offer badge (logo panel + offer text). */
export function PromoChip({
  badgeType,
  label,
  cashPerMonth,
  iconUrl,
  iconEmoji,
  iconBgColor,
  textBgColor,
  subtitle,
  size = 'card',
  onClick,
}: PromoBadgeProps & {
  size?: 'card' | 'compact';
  onClick?: (e: MouseEvent) => void;
}) {
  const isCard = size === 'card';
  const colors = CHIP_STYLE_COLORS[badgeType];
  const textBg = textBgColor ?? colors.textBg;
  const iconBg = iconBgColor ?? colors.iconBg;
  // Custom tag colors are often dark — always use white text for readability
  const textColor = textBgColor ? '#FFFFFF' : colors.textColor;
  const mutedColor = textBgColor ? 'rgba(255,255,255,0.9)' : colors.mutedColor;
  const lines = chipLines({ badgeType, label, cashPerMonth, subtitle });
  const fullTitle = subtitle ? `${label} — ${subtitle}` : label;
  const height = isCard ? 30 : 26;
  const logoWidth = isCard ? 28 : 24;
  const glyphSize = isCard ? 14 : 12;
  const primarySize = isCard ? 9 : 8;
  const secondarySize = isCard ? 7 : 6;

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as MouseEvent);
              }
            }
          : undefined
      }
      className={`inline-flex max-w-full items-stretch overflow-hidden shadow-sm ${
        onClick ? 'cursor-pointer transition hover:brightness-[0.98] hover:shadow-md' : ''
      }`}
      style={{
        height,
        minWidth: isCard ? 96 : 84,
        maxWidth: isCard ? 140 : 120,
        borderRadius: 6,
        border: '1px solid rgba(0,0,0,0.06)',
      }}
      title={fullTitle}
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{
          width: logoWidth,
          backgroundColor: iconBg,
          borderRight: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {iconUrl ? (
          <img
            src={iconUrl}
            alt=""
            className="object-contain"
            style={{ width: isCard ? 18 : 16, height: isCard ? 18 : 16 }}
          />
        ) : iconEmoji ? (
          <span style={{ fontSize: isCard ? 12 : 11, lineHeight: 1 }} aria-hidden>
            {iconEmoji}
          </span>
        ) : (
          <ColoredGlyph badgeType={badgeType} color={textBg} size={glyphSize} />
        )}
      </span>
      <span
        className="flex min-w-0 flex-1 flex-col justify-center px-1.5 py-0.5"
        style={{ backgroundColor: textBg }}
      >
        <span
          className="truncate font-semibold uppercase leading-none"
          style={{
            color: mutedColor,
            fontSize: secondarySize,
            letterSpacing: '0.04em',
          }}
        >
          {lines.eyebrow.length > 16 ? `${lines.eyebrow.slice(0, 14)}…` : lines.eyebrow}
        </span>
        <span
          className="mt-0.5 truncate font-extrabold uppercase leading-tight"
          style={{
            color: textColor,
            fontSize: primarySize,
            letterSpacing: '0.01em',
          }}
        >
          {lines.headline}
        </span>
      </span>
    </span>
  );
}

export function PromoBadge({
  badgeType,
  label,
  cashPerMonth,
  size = 'sm',
  iconUrl,
  iconEmoji,
  iconBgColor,
  textBgColor,
  subtitle,
}: PromoBadgeProps) {
  const isSmall = size === 'sm';

  if (iconBgColor && textBgColor) {
    return (
      <CustomPromoSticker
        badgeType={badgeType}
        label={label}
        cashPerMonth={cashPerMonth}
        size={size}
        iconUrl={iconUrl}
        iconEmoji={iconEmoji}
        iconBgColor={iconBgColor}
        textBgColor={textBgColor}
        subtitle={subtitle}
      />
    );
  }

  if (badgeType === 'cash-deal') {
    return (
      <div
        className="flex items-stretch overflow-hidden shadow-md"
        style={{
          borderRadius: '4px',
          minWidth: isSmall ? 90 : 110,
          height: isSmall ? 28 : 34,
        }}
      >
        {/* Left icon section */}
        <div
          className="flex items-center justify-center px-1.5"
          style={{ backgroundColor: '#1E3A8A', width: isSmall ? 28 : 34 }}
        >
          <svg width={isSmall ? 14 : 18} height={isSmall ? 14 : 18} viewBox="0 0 24 24" fill="none">
            <text x="12" y="17" textAnchor="middle" fontSize="13" fontWeight="bold" fill={ICON_WHITE}>
              ₱
            </text>
          </svg>
        </div>
        {/* Right text section */}
        <div
          className="flex flex-col justify-center px-1.5 flex-1"
          style={{ backgroundColor: '#2563EB' }}
        >
          <div style={{ fontSize: isSmall ? 7 : 8, color: '#BFDBFE', lineHeight: 1, fontWeight: 600, letterSpacing: '0.03em' }}>
            COOL CASH
          </div>
          <div style={{ fontSize: isSmall ? 10 : 12, color: '#FFF', lineHeight: 1.1, fontWeight: 800 }}>
            {cashPerMonth ? `₱${cashPerMonth.toLocaleString()}/mo` : label}
          </div>
        </div>
      </div>
    );
  }

  if (badgeType === 'free-install') {
    return (
      <div
        className="flex items-stretch overflow-hidden shadow-md"
        style={{
          borderRadius: '4px',
          minWidth: isSmall ? 100 : 130,
          height: isSmall ? 28 : 34,
        }}
      >
        {/* Green check icon */}
        <div
          className="flex items-center justify-center px-1.5"
          style={{ backgroundColor: '#065F46', width: isSmall ? 26 : 32 }}
        >
          <svg width={isSmall ? 13 : 16} height={isSmall ? 13 : 16} viewBox="0 0 24 24" fill="none">
            <path
              d="M7 12.5l3.5 3.5 6-7"
              stroke={ICON_WHITE}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {/* Text */}
        <div
          className="flex flex-col justify-center px-1.5 flex-1"
          style={{ backgroundColor: '#059669' }}
        >
          <div style={{ fontSize: isSmall ? 6.5 : 7.5, color: '#A7F3D0', lineHeight: 1, fontWeight: 600, letterSpacing: '0.04em' }}>
            FREE AUTHORIZED
          </div>
          <div style={{ fontSize: isSmall ? 9 : 11, color: '#FFF', lineHeight: 1.1, fontWeight: 800 }}>
            INSTALLATION
          </div>
        </div>
      </div>
    );
  }

  if (badgeType === 'discount') {
    // Red/orange sticker — "₱5,000 OFF" or "15% OFF"
    return (
      <div
        className="flex items-center justify-center shadow-md"
        style={{
          borderRadius: '4px',
          background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
          minWidth: isSmall ? 70 : 88,
          height: isSmall ? 28 : 34,
          padding: '0 8px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ribbon diagonal stripe accent */}
        <div style={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 22,
          height: 22,
          background: 'rgba(255,255,255,0.15)',
          transform: 'rotate(45deg)',
        }} />
        <div className="flex items-center gap-1">
          <svg width={isSmall ? 11 : 14} height={isSmall ? 11 : 14} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L14.4 9.3H22L15.8 13.7L18.2 21L12 16.6L5.8 21L8.2 13.7L2 9.3H9.6L12 2Z"
              fill={ICON_WHITE}
            />
          </svg>
          <span style={{ fontSize: isSmall ? 10 : 13, color: '#FFF', fontWeight: 800, lineHeight: 1 }}>
            {label}
          </span>
        </div>
      </div>
    );
  }

  if (badgeType === 'flash-sale') {
    // Orange urgent flash deal badge
    return (
      <div
        className="flex items-center gap-1 shadow-md"
        style={{
          borderRadius: '4px',
          background: 'linear-gradient(135deg, #EA580C, #C2410C)',
          minWidth: isSmall ? 70 : 88,
          height: isSmall ? 28 : 34,
          padding: '0 8px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: '#FFC107',
        }} />
        <svg width={isSmall ? 11 : 13} height={isSmall ? 11 : 13} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4 }}>
          <path
            d="M13 2L4.09 12.37A1 1 0 004.82 14h6.18l-1 8 8.91-10.37A1 1 0 0018.18 10H12l1-8z"
            fill={ICON_WHITE}
          />
        </svg>
        <span style={{ fontSize: isSmall ? 10 : 12, color: '#FFF', fontWeight: 800, letterSpacing: '0.02em' }}>
          {label}
        </span>
      </div>
    );
  }

  if (badgeType === 'bundle') {
    return (
      <div
        className="flex items-center gap-1 shadow-md"
        style={{
          borderRadius: '4px',
          background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
          minWidth: isSmall ? 80 : 100,
          height: isSmall ? 28 : 34,
          padding: '0 8px',
        }}
      >
        <svg width={isSmall ? 11 : 13} height={isSmall ? 11 : 13} viewBox="0 0 24 24" fill="none">
          <path
            d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
            fill={ICON_WHITE}
          />
          <path
            d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
            stroke={ICON_WHITE}
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <div className="flex flex-col" style={{ lineHeight: 1 }}>
          <span style={{ fontSize: isSmall ? 6 : 7, color: '#DDD6FE', fontWeight: 600, letterSpacing: '0.04em' }}>PROMO</span>
          <span style={{ fontSize: isSmall ? 9 : 11, color: '#FFF', fontWeight: 800 }}>BUNDLE DEAL</span>
        </div>
      </div>
    );
  }

  return null;
}

/** Small corner tag for SALE / NEW / INVERTER */
interface CornerTagProps {
  label: string;
  color?: string;
  bgColor?: string;
}
export function CornerTag({ label, color = '#FFF', bgColor = '#EF4444' }: CornerTagProps) {
  return (
    <span
      className="inline-flex h-[22px] w-full min-w-[40px] shrink-0 items-center justify-center whitespace-nowrap px-2 font-semibold shadow-sm"
      style={{
        backgroundColor: bgColor,
        color,
        borderRadius: '4px',
        fontSize: 10,
        lineHeight: 1,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  );
}
