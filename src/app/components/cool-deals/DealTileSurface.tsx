import { ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { isLightBackground, readableOnBackground } from '../../lib/color-utils';
import { resolveDealCardColors, type CoolDealsDealCardItem } from '../../data/cool-deals-page';

function accentBadgeBg(tileBg: string, hasImage: boolean): string {
  if (hasImage) return 'rgba(15, 23, 42, 0.5)';
  return isLightBackground(tileBg) ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.14)';
}

/** Scale accent label by length so short tags stay punchy without dominating the tile. */
function accentTextClass(accent: string, compact?: boolean): string {
  const len = accent.trim().length;
  if (compact) {
    if (len <= 4) return 'text-base';
    if (len <= 10) return 'text-xs';
    return 'text-[10px]';
  }
  if (len <= 4) return 'text-xl';
  if (len <= 10) return 'text-sm';
  return 'text-xs';
}

function DealTileAccent({
  accent,
  accentColor,
  tileBg,
  hasImage,
  compact,
}: {
  accent: string;
  accentColor: string;
  tileBg: string;
  hasImage: boolean;
  compact?: boolean;
}) {
  const label = accent.trim();
  if (!label) return null;

  const onBadge = readableOnBackground(
    accentColor,
    hasImage ? '#1E293B' : tileBg,
    hasImage || !isLightBackground(tileBg) ? '#FFFFFF' : '#0C4A6E'
  );
  const textClass = accentTextClass(label, compact);

  if (hasImage) {
    return (
      <div
        className={`absolute z-[5] ${compact ? 'top-2 right-2' : 'top-3 right-3'}`}
        aria-hidden
      >
        <div
          className={`inline-flex max-w-[7rem] items-center justify-center rounded-full border backdrop-blur-sm shadow-sm ${
            compact ? 'px-2 py-0.5' : 'px-2.5 py-1'
          }`}
          style={{
            backgroundColor: accentBadgeBg(tileBg, true),
            borderColor: 'rgba(255,255,255,0.22)',
          }}
        >
          <span
            className={`font-extrabold leading-none tracking-tight truncate ${textClass}`}
            style={{ color: onBadge }}
          >
            {label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute z-[5] pointer-events-none select-none max-w-[40%] truncate font-extrabold leading-none ${
        compact ? 'top-1.5 right-2' : 'top-2.5 right-3'
      } ${textClass}`}
      style={{
        color: onBadge,
        opacity: isLightBackground(tileBg) ? 0.2 : 0.32,
      }}
      aria-hidden
    >
      {label}
    </div>
  );
}

interface DealTileSurfaceProps {
  card: CoolDealsDealCardItem;
  /** Shorter preview for admin color panel */
  compact?: boolean;
}

/** Shared deal-tile visuals (storefront + admin preview). */
export function DealTileSurface({ card, compact }: DealTileSurfaceProps) {
  const { title, body, cta, imageUrl, accent } = card;
  const colors = resolveDealCardColors(card);
  const hasImage = Boolean(imageUrl?.trim());

  return (
    <div
      className={`relative rounded-xl overflow-hidden flex flex-col justify-end ${
        compact ? 'min-h-[130px] p-3' : 'min-h-[220px] p-5'
      } group`}
      style={{ backgroundColor: colors.bg }}
    >
      {imageUrl && (
        <>
          <ImageWithFallback
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {}
          <div
            className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-95"
            style={{
              background: `linear-gradient(
                to top,
                ${colors.bg} 0%,
                ${colors.bg}e8 28%,
                ${colors.bg}99 48%,
                ${colors.bg}33 68%,
                transparent 88%
              )`,
            }}
          />
        </>
      )}
      {accent && (
        <DealTileAccent
          accent={accent}
          accentColor={colors.accent}
          tileBg={colors.bg}
          hasImage={hasImage}
          compact={compact}
        />
      )}
      <div className="relative z-10">
        <h3
          className={`font-bold leading-snug mb-0.5 ${compact ? 'text-sm' : 'text-lg mb-1'}`}
          style={{ color: colors.title }}
        >
          {title || 'Tile title'}
        </h3>
        <p
          className={`leading-snug ${compact ? 'text-[11px] mb-2 line-clamp-2' : 'text-sm mb-4'}`}
          style={{ color: colors.body }}
        >
          {body || 'Description text'}
        </p>
        <span
          className={`inline-flex items-center gap-1 font-bold ${compact ? 'text-[10px]' : 'text-xs'}`}
          style={{ color: colors.cta }}
        >
          {cta || 'Button'} <ArrowRight size={compact ? 12 : 14} />
        </span>
      </div>
    </div>
  );
}
