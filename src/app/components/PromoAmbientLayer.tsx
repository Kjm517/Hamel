import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Ban, type LucideProps } from 'lucide-react';
import {
  ambientEffectDurationMs,
  ambientParticleCount,
  normalizePromoAmbientDirection,
  normalizePromoAmbientDurationSec,
  normalizePromoAmbientEffect,
  normalizePromoAmbientIntensity,
  type PromoAmbientDirection,
  type PromoAmbientEffect,
  type PromoAmbientIntensity,
} from '../lib/promo-ambient-effects';
import {
  AmbientBalloonGlyph,
  AmbientBalloonHeart,
  AmbientBalloonRound,
  AmbientBubble,
  AmbientCloudMist,
  AmbientConfettiPiece,
  AmbientCrystal,
  AmbientDroplet,
  AmbientFirefly,
  AmbientFrostFlake,
  AmbientHeart,
  AmbientIceShard,
  AmbientLeaf,
  AmbientPetal,
  AmbientRibbon,
  AmbientSnowflake,
  AmbientSnowflakeSoft,
  AmbientSparkle,
  AmbientStar,
  AmbientStreamer,
  AmbientSun,
  AmbientWindSwirl,
} from './promo-ambient-glyphs';

type PromoAmbientLayerProps = {
  effect?: PromoAmbientEffect | string | null;
  intensity?: PromoAmbientIntensity | string | null;
  durationSec?: number | string | null;
  direction?: PromoAmbientDirection | string | null;
  accentColor?: string;
  loop?: boolean;
};

type GlyphComponent = ComponentType<{ size?: number; className?: string }>;

function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const BALLOON_COLORS = ['#60A5FA', '#F472B6', '#FACC15', '#FB7185', '#A78BFA', '#22D3EE', '#F87171', '#34D399'];
const HEART_COLORS = ['#FB7185', '#F43F5E', '#FDA4AF', '#E11D48', '#F9A8D4'];
const PETAL_COLORS = ['#FBCFE8', '#F9A8D4', '#FDA4AF', '#FECDD3', '#F472B6', '#FFFFFF'];
const CONFETTI_COLORS = ['#0EA5E9', '#FFC107', '#F97316', '#EC4899', '#22C55E', '#FFFFFF', '#A855F7', '#EF4444'];
const STAR_COLORS = ['#FDE047', '#FFFFFF', '#FDBA74', '#FACC15', '#FEF08A'];
const STREAMER_COLORS = ['#0EA5E9', '#F43F5E', '#FACC15', '#A855F7', '#22C55E', '#F97316'];
const SUN_COLORS = ['#FDE047', '#FBBF24', '#F59E0B', '#FEF08A'];
const FIREFLY_COLORS = ['#FDE68A', '#FACC15', '#A7F3D0', '#67E8F9', '#FFFFFF'];

const BALLOON_GLYPHS: GlyphComponent[] = [AmbientBalloonGlyph, AmbientBalloonRound, AmbientBalloonHeart];
const MIST_GLYPHS: GlyphComponent[] = [AmbientCloudMist, AmbientWindSwirl, AmbientDroplet];
const BREEZE_GLYPHS: GlyphComponent[] = [AmbientWindSwirl, AmbientLeaf, AmbientCloudMist];
const FROST_GLYPHS: GlyphComponent[] = [AmbientFrostFlake, AmbientCrystal, AmbientIceShard];
const SNOW_GLYPHS: GlyphComponent[] = [AmbientSnowflake, AmbientSnowflakeSoft, AmbientFrostFlake];
const SPARKLE_GLYPHS: GlyphComponent[] = [AmbientSparkle, AmbientStar];
const BUBBLE_GLYPHS: GlyphComponent[] = [AmbientBubble, AmbientDroplet];
const HEART_GLYPHS: GlyphComponent[] = [AmbientHeart, AmbientBalloonHeart];
const PETAL_GLYPHS: GlyphComponent[] = [AmbientPetal, AmbientLeaf];
const STAR_GLYPHS: GlyphComponent[] = [AmbientStar, AmbientSparkle];
const STREAMER_GLYPHS: GlyphComponent[] = [AmbientStreamer, AmbientRibbon, AmbientConfettiPiece];

function particleClass(effect: PromoAmbientEffect): string {
  switch (effect) {
    case 'balloons':
      return 'hamel-fx-balloon';
    case 'breeze':
      return 'hamel-fx-leaf';
    case 'cool-mist':
      return 'hamel-fx-mist-icon';
    case 'frost':
      return 'hamel-fx-crystal';
    case 'snow':
      return 'hamel-fx-flake';
    case 'sparkles':
      return 'hamel-fx-sparkle';
    case 'confetti-rain':
      return 'hamel-fx-confetti';
    case 'bubbles':
      return 'hamel-fx-bubble';
    case 'hearts':
      return 'hamel-fx-heart';
    case 'petals':
      return 'hamel-fx-petal';
    case 'stars':
      return 'hamel-fx-starfall';
    case 'streamers':
      return 'hamel-fx-streamer';
    case 'sunshine':
      return 'hamel-fx-sun';
    case 'fireflies':
      return 'hamel-fx-firefly';
    default:
      return 'hamel-fx-sparkle';
  }
}

function colorFor(effect: PromoAmbientEffect, i: number, accent: string): string {
  switch (effect) {
    case 'balloons':
      return BALLOON_COLORS[i % BALLOON_COLORS.length];
    case 'hearts':
      return HEART_COLORS[i % HEART_COLORS.length];
    case 'petals':
      return PETAL_COLORS[i % PETAL_COLORS.length];
    case 'confetti-rain':
    case 'streamers':
      return (effect === 'streamers' ? STREAMER_COLORS : CONFETTI_COLORS)[i % 8];
    case 'stars':
      return STAR_COLORS[i % STAR_COLORS.length];
    case 'sunshine':
      return SUN_COLORS[i % SUN_COLORS.length];
    case 'fireflies':
      return FIREFLY_COLORS[i % FIREFLY_COLORS.length];
    case 'sparkles':
      return accent;
    default:
      return accent;
  }
}

export function PromoAmbientLayer({
  effect: rawEffect,
  intensity: rawIntensity,
  durationSec: rawDurationSec,
  direction: rawDirection,
  accentColor = '#FFC107',
  loop = false,
}: PromoAmbientLayerProps) {
  const effect = normalizePromoAmbientEffect(rawEffect);
  const intensity = normalizePromoAmbientIntensity(rawIntensity);
  const durationSec = normalizePromoAmbientDurationSec(rawDurationSec);
  const direction = normalizePromoAmbientDirection(rawDirection, effect);
  const count = ambientParticleCount(effect, intensity);
  const playMs = ambientEffectDurationMs(durationSec, intensity);
  const continuous = loop || playMs === null;
  const [phase, setPhase] = useState<'play' | 'fade' | 'done'>('play');

  useEffect(() => {
    setPhase('play');
    if (continuous || effect === 'none' || playMs === null) return;
    const fadeAt = window.setTimeout(() => setPhase('fade'), playMs);
    const doneAt = window.setTimeout(() => setPhase('done'), playMs + 800);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(doneAt);
    };
  }, [effect, intensity, durationSec, direction, playMs, continuous]);

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const a = seeded(i, 1);
      const b = seeded(i, 2);
      const c = seeded(i, 3);
      const d = seeded(i, 4);
      return {
        id: i,
        left: `${2 + a * 96}%`,
        delay: `${b * 4.2}s`,
        duration: `${4.6 + c * 3.8}s`,
        size: 16 + d * 26,
        color: colorFor(effect, i, accentColor),
        opacity: 0.72 + b * 0.28,
      };
    });
  }, [count, effect, accentColor]);

  if (effect === 'none' || count === 0 || phase === 'done') return null;

  const showColdVeil = effect === 'cool-mist' || effect === 'frost' || effect === 'snow';
  const showWarmVeil = effect === 'sunshine';

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 overflow-hidden hamel-fx-${effect} hamel-fx-dir-${direction} hamel-fx-burst ${
        phase === 'fade' ? 'hamel-fx-fading' : ''
      }`}
      aria-hidden
    >
      {showColdVeil ? (
        <>
          <div className="hamel-fx-veil absolute inset-0" />
          {effect === 'cool-mist' || effect === 'snow' ? (
            <div className="hamel-fx-veil hamel-fx-veil-strong absolute inset-0" />
          ) : null}
        </>
      ) : null}
      {showWarmVeil ? <div className="hamel-fx-veil hamel-fx-veil-warm absolute inset-0" /> : null}

      {particles.map((p) => {
        const cls = `absolute ${particleClass(effect)}`;
        const motionStyle = {
          left: p.left,
          animationDelay: p.delay,
          animationDuration: p.duration,
          opacity: p.opacity,
          color: p.color,
        };

        if (effect === 'balloons') {
          const Glyph = BALLOON_GLYPHS[p.id % BALLOON_GLYPHS.length];
          return (
            <span key={p.id} className={cls} style={motionStyle}>
              <Glyph size={22 + seeded(p.id, 5) * 20} />
            </span>
          );
        }

        if (effect === 'breeze') {
          const Glyph = BREEZE_GLYPHS[p.id % BREEZE_GLYPHS.length];
          return (
            <span
              key={p.id}
              className={cls}
              style={{ ...motionStyle, color: '#E0F2FE', opacity: 0.65 + seeded(p.id, 6) * 0.3 }}
            >
              <Glyph size={20 + seeded(p.id, 6) * 18} />
            </span>
          );
        }

        if (effect === 'cool-mist') {
          const Glyph = MIST_GLYPHS[p.id % MIST_GLYPHS.length];
          return (
            <span
              key={p.id}
              className={cls}
              style={{ ...motionStyle, color: '#FFFFFF', opacity: 0.5 + seeded(p.id, 10) * 0.4 }}
            >
              <Glyph size={24 + seeded(p.id, 8) * 20} />
            </span>
          );
        }

        if (effect === 'frost') {
          const Glyph = FROST_GLYPHS[p.id % FROST_GLYPHS.length];
          return (
            <span
              key={p.id}
              className={cls}
              style={{ ...motionStyle, color: '#F0F9FF', opacity: Math.min(1, p.opacity + 0.2) }}
            >
              <Glyph size={18 + seeded(p.id, 13) * 22} />
            </span>
          );
        }

        if (effect === 'snow') {
          const Glyph = SNOW_GLYPHS[p.id % SNOW_GLYPHS.length];
          return (
            <span
              key={p.id}
              className={cls}
              style={{ ...motionStyle, color: '#FFFFFF', opacity: 0.88 + seeded(p.id, 15) * 0.12 }}
            >
              <Glyph size={14 + seeded(p.id, 14) * 18} />
            </span>
          );
        }

        if (effect === 'sparkles') {
          const Glyph = SPARKLE_GLYPHS[p.id % SPARKLE_GLYPHS.length];
          return (
            <span
              key={p.id}
              className={cls}
              style={{ ...motionStyle, animationDuration: `${3 + seeded(p.id, 17) * 2.6}s` }}
            >
              <Glyph size={14 + seeded(p.id, 18) * 14} />
            </span>
          );
        }

        if (effect === 'confetti-rain') {
          if (p.id % 3 === 0) {
            return (
              <span key={p.id} className={cls} style={motionStyle}>
                <AmbientConfettiPiece size={14 + seeded(p.id, 19) * 12} />
              </span>
            );
          }
          const w = 7 + seeded(p.id, 19) * 9;
          const h = 12 + seeded(p.id, 20) * 14;
          return (
            <span
              key={p.id}
              className={`${cls} rounded-[2px]`}
              style={{
                ...motionStyle,
                width: `${w}px`,
                height: `${h}px`,
                backgroundColor: p.color,
                color: undefined,
              }}
            />
          );
        }

        if (effect === 'hearts') {
          const Glyph = HEART_GLYPHS[p.id % HEART_GLYPHS.length];
          return (
            <span key={p.id} className={cls} style={motionStyle}>
              <Glyph size={16 + seeded(p.id, 21) * 18} />
            </span>
          );
        }

        if (effect === 'petals') {
          const Glyph = PETAL_GLYPHS[p.id % PETAL_GLYPHS.length];
          return (
            <span key={p.id} className={cls} style={motionStyle}>
              <Glyph size={16 + seeded(p.id, 22) * 16} />
            </span>
          );
        }

        if (effect === 'stars') {
          const Glyph = STAR_GLYPHS[p.id % STAR_GLYPHS.length];
          return (
            <span key={p.id} className={cls} style={motionStyle}>
              <Glyph size={14 + seeded(p.id, 23) * 16} />
            </span>
          );
        }

        if (effect === 'streamers') {
          const Glyph = STREAMER_GLYPHS[p.id % STREAMER_GLYPHS.length];
          return (
            <span key={p.id} className={cls} style={motionStyle}>
              <Glyph size={20 + seeded(p.id, 24) * 18} />
            </span>
          );
        }

        if (effect === 'sunshine') {
          return (
            <span
              key={p.id}
              className={cls}
              style={{ ...motionStyle, opacity: 0.55 + seeded(p.id, 25) * 0.4 }}
            >
              <AmbientSun size={16 + seeded(p.id, 25) * 18} />
            </span>
          );
        }

        if (effect === 'fireflies') {
          return (
            <span
              key={p.id}
              className={cls}
              style={{ ...motionStyle, opacity: 0.5 + seeded(p.id, 26) * 0.45 }}
            >
              <AmbientFirefly size={10 + seeded(p.id, 26) * 14} />
            </span>
          );
        }

        const Glyph = BUBBLE_GLYPHS[p.id % BUBBLE_GLYPHS.length];
        return (
          <span
            key={p.id}
            className={cls}
            style={{ ...motionStyle, color: '#E0F2FE', opacity: 0.5 + seeded(p.id, 27) * 0.4 }}
          >
            <Glyph size={16 + seeded(p.id, 27) * 18} />
          </span>
        );
      })}
    </div>
  );
}

/** Icons used in the ambient-effect admin picker. */
export const PROMO_AMBIENT_ICONS: Record<
  PromoAmbientEffect,
  ComponentType<LucideProps> | GlyphComponent
> = {
  none: Ban,
  balloons: AmbientBalloonGlyph,
  breeze: AmbientWindSwirl,
  'cool-mist': AmbientCloudMist,
  frost: AmbientFrostFlake,
  snow: AmbientSnowflake,
  sparkles: AmbientSparkle,
  'confetti-rain': AmbientConfettiPiece,
  bubbles: AmbientBubble,
  hearts: AmbientHeart,
  petals: AmbientPetal,
  stars: AmbientStar,
  streamers: AmbientStreamer,
  sunshine: AmbientSun,
  fireflies: AmbientFirefly,
};
