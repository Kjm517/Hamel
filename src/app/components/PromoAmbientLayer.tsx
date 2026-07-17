import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Ban,
  CloudFog,
  CloudSnow,
  Droplets,
  PartyPopper,
  Snowflake,
  Sparkles,
  Wind,
  type LucideProps,
} from 'lucide-react';
import {
  ambientEffectDurationMs,
  ambientParticleCount,
  normalizePromoAmbientEffect,
  normalizePromoAmbientIntensity,
  type PromoAmbientEffect,
  type PromoAmbientIntensity,
} from '../lib/promo-ambient-effects';

type PromoAmbientLayerProps = {
  effect?: PromoAmbientEffect | string | null;
  intensity?: PromoAmbientIntensity | string | null;
  accentColor?: string;
};

function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const BALLOON_COLORS = ['#93C5FD', '#F9A8D4', '#FDE047', '#FDA4AF', '#A5B4FC', '#67E8F9', '#FCA5A5'];
const CONFETTI_COLORS = ['#0EA5E9', '#FFC107', '#F97316', '#EC4899', '#22C55E', '#FFFFFF'];

const MIST_ICONS: ComponentType<LucideProps>[] = [CloudFog, Wind, Droplets];
const BREEZE_ICONS: ComponentType<LucideProps>[] = [Wind, CloudFog];
const FROST_ICONS: ComponentType<LucideProps>[] = [Snowflake, CloudSnow];
const SPARKLE_ICONS: ComponentType<LucideProps>[] = [Sparkles];

export function PromoAmbientLayer({
  effect: rawEffect,
  intensity: rawIntensity,
  accentColor = '#FFC107',
}: PromoAmbientLayerProps) {
  const effect = normalizePromoAmbientEffect(rawEffect);
  const intensity = normalizePromoAmbientIntensity(rawIntensity);
  const count = ambientParticleCount(effect, intensity);
  const playMs = ambientEffectDurationMs(intensity);
  const [phase, setPhase] = useState<'play' | 'fade' | 'done'>('play');

  useEffect(() => {
    setPhase('play');
    const fadeAt = window.setTimeout(() => setPhase('fade'), playMs);
    const doneAt = window.setTimeout(() => setPhase('done'), playMs + 700);
    return () => {
      window.clearTimeout(fadeAt);
      window.clearTimeout(doneAt);
    };
  }, [effect, intensity, playMs]);

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const a = seeded(i, 1);
      const b = seeded(i, 2);
      const c = seeded(i, 3);
      const d = seeded(i, 4);
      return {
        id: i,
        left: `${4 + a * 92}%`,
        delay: `${b * 0.9}s`,
        duration: `${2.4 + c * 2.2}s`,
        size: 18 + d * 28,
        rotate: Math.round(a * 360),
        color:
          effect === 'balloons'
            ? BALLOON_COLORS[i % BALLOON_COLORS.length]
            : effect === 'confetti-rain'
              ? CONFETTI_COLORS[i % CONFETTI_COLORS.length]
              : accentColor,
        opacity: 0.55 + b * 0.4,
      };
    });
  }, [count, effect, accentColor]);

  if (effect === 'none' || count === 0 || phase === 'done') return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 overflow-hidden hamel-fx-${effect} hamel-fx-burst ${
        phase === 'fade' ? 'hamel-fx-fading' : ''
      }`}
      aria-hidden
    >
      {effect === 'cool-mist' || effect === 'frost' ? (
        <>
          <div className="hamel-fx-veil absolute inset-0" />
          {effect === 'cool-mist' ? (
            <div className="hamel-fx-veil hamel-fx-veil-strong absolute inset-0" />
          ) : null}
        </>
      ) : null}

      {particles.map((p) => {
        if (effect === 'balloons') {
          return (
            <span
              key={p.id}
              className="hamel-fx-balloon absolute"
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                ['--fx-size' as string]: `${p.size}px`,
                ['--fx-color' as string]: p.color,
                opacity: p.opacity,
              }}
            >
              <span className="hamel-fx-balloon-body" />
              <span className="hamel-fx-balloon-string" />
            </span>
          );
        }

        if (effect === 'breeze') {
          const Icon = BREEZE_ICONS[p.id % BREEZE_ICONS.length];
          const iconSize = 18 + seeded(p.id, 6) * 16;
          return (
            <span
              key={p.id}
              className="hamel-fx-leaf absolute text-white drop-shadow"
              style={{
                top: `${8 + seeded(p.id, 5) * 75}%`,
                left: '-10%',
                animationDelay: p.delay,
                animationDuration: p.duration,
                opacity: 0.55 + seeded(p.id, 6) * 0.35,
                color: '#E0F2FE',
              }}
            >
              <Icon size={iconSize} strokeWidth={2.25} />
            </span>
          );
        }

        if (effect === 'cool-mist') {
          const Icon = MIST_ICONS[p.id % MIST_ICONS.length];
          const iconSize = 22 + seeded(p.id, 8) * 18;
          return (
            <span
              key={p.id}
              className="hamel-fx-mist-icon absolute drop-shadow-md"
              style={{
                left: p.left,
                top: `${seeded(p.id, 7) * 78}%`,
                animationDelay: p.delay,
                animationDuration: p.duration,
                opacity: 0.45 + seeded(p.id, 10) * 0.4,
                color: '#FFFFFF',
              }}
            >
              <Icon size={iconSize} strokeWidth={2.25} />
            </span>
          );
        }

        if (effect === 'frost') {
          const Icon = FROST_ICONS[p.id % FROST_ICONS.length];
          const iconSize = 16 + seeded(p.id, 13) * 16;
          return (
            <span
              key={p.id}
              className="hamel-fx-frost absolute drop-shadow"
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                opacity: p.opacity,
                color: '#E0F2FE',
              }}
            >
              <Icon size={iconSize} strokeWidth={2.25} />
            </span>
          );
        }

        if (effect === 'snow') {
          return (
            <span
              key={p.id}
              className="hamel-fx-snow absolute text-white drop-shadow"
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                opacity: 0.75 + seeded(p.id, 15) * 0.25,
                color: '#FFFFFF',
              }}
            >
              <Snowflake size={10 + seeded(p.id, 14) * 12} strokeWidth={2.5} />
            </span>
          );
        }

        if (effect === 'sparkles') {
          const Icon = SPARKLE_ICONS[0];
          return (
            <span
              key={p.id}
              className="hamel-fx-sparkle absolute drop-shadow"
              style={{
                left: p.left,
                top: `${seeded(p.id, 16) * 88}%`,
                animationDelay: p.delay,
                animationDuration: `${1.1 + seeded(p.id, 17) * 1.2}s`,
                color: p.color,
              }}
            >
              <Icon size={12 + seeded(p.id, 18) * 12} strokeWidth={2.25} />
            </span>
          );
        }

        if (effect === 'confetti-rain') {
          return (
            <span
              key={p.id}
              className="hamel-fx-confetti absolute rounded-[2px]"
              style={{
                left: p.left,
                width: `${6 + seeded(p.id, 19) * 7}px`,
                height: `${10 + seeded(p.id, 20) * 10}px`,
                backgroundColor: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
                opacity: p.opacity,
              }}
            />
          );
        }

        return (
          <span
            key={p.id}
            className="hamel-fx-bubble absolute text-sky-50 drop-shadow"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              opacity: 0.45 + seeded(p.id, 22) * 0.4,
              color: '#E0F2FE',
            }}
          >
            <Droplets size={14 + seeded(p.id, 21) * 18} strokeWidth={2.25} />
          </span>
        );
      })}
    </div>
  );
}

/** Lucide icons used in the ambient-effect admin picker. */
export const PROMO_AMBIENT_ICONS: Record<
  PromoAmbientEffect,
  ComponentType<LucideProps>
> = {
  none: Ban,
  balloons: PartyPopper,
  breeze: Wind,
  'cool-mist': CloudFog,
  frost: Snowflake,
  snow: CloudSnow,
  sparkles: Sparkles,
  'confetti-rain': PartyPopper,
  bubbles: Droplets,
};
