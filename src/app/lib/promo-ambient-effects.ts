export type PromoAmbientEffect =
  | 'none'
  | 'balloons'
  | 'breeze'
  | 'cool-mist'
  | 'frost'
  | 'snow'
  | 'sparkles'
  | 'confetti-rain'
  | 'bubbles'
  | 'hearts'
  | 'petals'
  | 'stars'
  | 'streamers'
  | 'sunshine'
  | 'fireflies';

export type PromoAmbientIntensity = 'low' | 'medium' | 'high';

/** Vertical travel: bottom→top (`up`) or top→bottom (`down`). */
export type PromoAmbientDirection = 'up' | 'down';

export const PROMO_AMBIENT_OPTIONS: {
  id: PromoAmbientEffect;
  name: string;
  desc: string;
}[] = [
  { id: 'none', name: 'None', desc: 'No overlay effects' },
  { id: 'balloons', name: 'Balloons', desc: 'Party balloons floating up' },
  { id: 'hearts', name: 'Hearts', desc: 'Soft floating hearts' },
  { id: 'breeze', name: 'Breeze', desc: 'Wind swirls and leaves' },
  { id: 'cool-mist', name: 'Cool mist', desc: 'Fog clouds and cool droplets' },
  { id: 'frost', name: 'Frost / freeze', desc: 'Ice crystals and frost flakes' },
  { id: 'snow', name: 'Snowfall', desc: 'Falling snowflakes' },
  { id: 'petals', name: 'Petals', desc: 'Soft flower petals drifting' },
  { id: 'sparkles', name: 'Sparkles', desc: 'Twinkling glitter bursts' },
  { id: 'stars', name: 'Star rain', desc: 'Bright stars falling across' },
  { id: 'confetti-rain', name: 'Confetti rain', desc: 'Heavy party confetti' },
  { id: 'streamers', name: 'Streamers', desc: 'Curly celebration ribbons' },
  { id: 'sunshine', name: 'Sunshine', desc: 'Warm sunburst accents' },
  { id: 'fireflies', name: 'Fireflies', desc: 'Soft glowing orbs' },
  { id: 'bubbles', name: 'Cool bubbles', desc: 'Shiny rising bubbles' },
];

export const PROMO_AMBIENT_INTENSITY_OPTIONS: {
  id: PromoAmbientIntensity;
  name: string;
}[] = [
  { id: 'low', name: 'Subtle' },
  { id: 'medium', name: 'Medium' },
  { id: 'high', name: 'Strong' },
];

export const PROMO_AMBIENT_DIRECTION_OPTIONS: {
  id: PromoAmbientDirection;
  name: string;
  desc: string;
}[] = [
  { id: 'up', name: 'Bottom → Top', desc: 'Particles rise from the bottom' },
  { id: 'down', name: 'Top → Bottom', desc: 'Particles fall from the top' },
];

/** Quick picks for the duration control (0 = keep playing). */
export const PROMO_AMBIENT_DURATION_PRESETS = [
  { sec: 5, label: '5s' },
  { sec: 10, label: '10s' },
  { sec: 15, label: '15s' },
  { sec: 30, label: '30s' },
  { sec: 60, label: '60s' },
  { sec: 0, label: 'Continuous' },
] as const;

export const DEFAULT_AMBIENT_DURATION_SEC = 10;
export const MIN_AMBIENT_DURATION_SEC = 0;
export const MAX_AMBIENT_DURATION_SEC = 120;

const EFFECT_IDS = new Set(PROMO_AMBIENT_OPTIONS.map((o) => o.id));

export function normalizePromoAmbientEffect(
  value?: string | null
): PromoAmbientEffect {
  if (value && EFFECT_IDS.has(value as PromoAmbientEffect)) {
    return value as PromoAmbientEffect;
  }
  return 'none';
}

export function normalizePromoAmbientIntensity(
  value?: string | null
): PromoAmbientIntensity {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return 'medium';
}

/** Natural direction for each effect when none is saved yet. */
export function defaultAmbientDirection(
  effect: PromoAmbientEffect
): PromoAmbientDirection {
  if (
    effect === 'balloons' ||
    effect === 'bubbles' ||
    effect === 'hearts' ||
    effect === 'fireflies' ||
    effect === 'sunshine'
  ) {
    return 'up';
  }
  return 'down';
}

export function normalizePromoAmbientDirection(
  value?: string | null,
  effect?: PromoAmbientEffect | string | null
): PromoAmbientDirection {
  if (value === 'up' || value === 'down') return value;
  return defaultAmbientDirection(normalizePromoAmbientEffect(effect));
}

/** Seconds the effect stays on screen. 0 = continuous (no auto-fade). */
export function normalizePromoAmbientDurationSec(
  value?: number | string | null
): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return DEFAULT_AMBIENT_DURATION_SEC;
  return Math.min(
    MAX_AMBIENT_DURATION_SEC,
    Math.max(MIN_AMBIENT_DURATION_SEC, Math.round(n))
  );
}

/**
 * How long ambient overlays stay visible before fading out.
 * Returns `null` when duration is continuous (0).
 */
export function ambientEffectDurationMs(
  durationSec?: number | string | null,
  intensity: PromoAmbientIntensity = 'medium'
): number | null {
  const sec = normalizePromoAmbientDurationSec(
    durationSec === undefined || durationSec === null || durationSec === ''
      ? intensity === 'low'
        ? 7
        : intensity === 'high'
          ? 12
          : 10
      : durationSec
  );
  if (sec === 0) return null;
  return sec * 1000;
}

/** Particle counts by intensity. */
export function ambientParticleCount(
  effect: PromoAmbientEffect,
  intensity: PromoAmbientIntensity
): number {
  if (effect === 'none') return 0;
  const base: Record<PromoAmbientEffect, number> = {
    none: 0,
    balloons: 14,
    breeze: 14,
    'cool-mist': 16,
    frost: 24,
    snow: 38,
    sparkles: 18,
    'confetti-rain': 44,
    bubbles: 16,
    hearts: 18,
    petals: 22,
    stars: 20,
    streamers: 16,
    sunshine: 14,
    fireflies: 20,
  };
  const mult = intensity === 'low' ? 0.75 : intensity === 'high' ? 1.55 : 1.1;
  return Math.max(6, Math.round((base[effect] || 8) * mult));
}
