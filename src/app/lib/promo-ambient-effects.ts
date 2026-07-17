export type PromoAmbientEffect =
  | 'none'
  | 'balloons'
  | 'breeze'
  | 'cool-mist'
  | 'frost'
  | 'snow'
  | 'sparkles'
  | 'confetti-rain'
  | 'bubbles';

export type PromoAmbientIntensity = 'low' | 'medium' | 'high';

export const PROMO_AMBIENT_OPTIONS: {
  id: PromoAmbientEffect;
  name: string;
  desc: string;
}[] = [
  { id: 'none', name: 'None', desc: 'No overlay effects' },
  { id: 'balloons', name: 'Balloons', desc: 'Floating birthday balloons' },
  { id: 'breeze', name: 'Breeze', desc: 'Soft wind and drifting air' },
  { id: 'cool-mist', name: 'Cool mist', desc: 'Fog + wind + droplet icons' },
  { id: 'frost', name: 'Frost / freeze', desc: 'Icy crystals and chill' },
  { id: 'snow', name: 'Snowfall', desc: 'Gentle falling snow' },
  { id: 'sparkles', name: 'Sparkles', desc: 'Twinkling celebration glitter' },
  { id: 'confetti-rain', name: 'Confetti rain', desc: 'Falling party confetti' },
  { id: 'bubbles', name: 'Cool bubbles', desc: 'Rising cool droplet icons' },
];

export const PROMO_AMBIENT_INTENSITY_OPTIONS: {
  id: PromoAmbientIntensity;
  name: string;
}[] = [
  { id: 'low', name: 'Subtle' },
  { id: 'medium', name: 'Medium' },
  { id: 'high', name: 'Strong' },
];

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

/** How long ambient overlays stay visible before fading out. */
export function ambientEffectDurationMs(intensity: PromoAmbientIntensity): number {
  if (intensity === 'low') return 3200;
  if (intensity === 'high') return 5500;
  return 4200;
}

/** Particle counts by intensity. */
export function ambientParticleCount(
  effect: PromoAmbientEffect,
  intensity: PromoAmbientIntensity
): number {
  if (effect === 'none') return 0;
  const base: Record<PromoAmbientEffect, number> = {
    none: 0,
    balloons: 10,
    breeze: 10,
    'cool-mist': 12,
    frost: 12,
    snow: 18,
    sparkles: 14,
    'confetti-rain': 18,
    bubbles: 12,
  };
  const mult = intensity === 'low' ? 0.7 : intensity === 'high' ? 1.25 : 1;
  return Math.max(4, Math.round((base[effect] || 8) * mult));
}
