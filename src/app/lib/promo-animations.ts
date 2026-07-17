export type PromoAnimationStyle =
  | 'fade'
  | 'slide-up'
  | 'bounce-in'
  | 'confetti-burst'
  | 'countdown-pulse'
  | 'mascot-wiggle'
  | 'zoom-in'
  | 'card-flip'
  | 'slide-side'
  | 'attention-shake'
  | 'glow-pulse'
  | 'shine-sweep'
  /** @deprecated aliases kept for saved CMS values */
  | 'pulse'
  | 'shimmer'
  | 'confetti-lite';

export const PROMO_ANIMATION_OPTIONS: {
  id: PromoAnimationStyle;
  name: string;
  desc: string;
  icon: string;
}[] = [
  { id: 'fade', name: 'Fade in', desc: 'Soft opacity fade', icon: '✧' },
  { id: 'slide-up', name: 'Slide up', desc: 'Eases in from below', icon: '↑' },
  { id: 'bounce-in', name: 'Bounce in', desc: 'Playful scale pop', icon: '▢' },
  { id: 'confetti-burst', name: 'Confetti burst', desc: 'Celebration on reveal', icon: '🎉' },
  { id: 'countdown-pulse', name: 'Countdown pulse', desc: 'Urgency timer pulse', icon: '⏱' },
  { id: 'mascot-wiggle', name: 'Mascot wiggle', desc: 'Penguin waves in', icon: '🐧' },
  { id: 'zoom-in', name: 'Zoom in', desc: 'Scales up on reveal', icon: '🔍' },
  { id: 'card-flip', name: 'Card flip', desc: '3D flip entrance', icon: '🃏' },
  { id: 'slide-side', name: 'Slide from side', desc: 'Enters from the left', icon: '⇔' },
  { id: 'attention-shake', name: 'Attention shake', desc: 'Quick wiggle to grab eyes', icon: '📳' },
  { id: 'glow-pulse', name: 'Glow pulse', desc: 'Soft pulsing halo', icon: '✦' },
  { id: 'shine-sweep', name: 'Shine sweep', desc: 'Light sweeps across', icon: '✨' },
];

const LEGACY_MAP: Record<string, PromoAnimationStyle> = {
  pulse: 'countdown-pulse',
  shimmer: 'shine-sweep',
  'confetti-lite': 'confetti-burst',
};

export function normalizePromoAnimation(
  style?: PromoAnimationStyle | string | null
): PromoAnimationStyle {
  if (!style) return 'slide-up';
  if (LEGACY_MAP[style]) return LEGACY_MAP[style];
  if (PROMO_ANIMATION_OPTIONS.some((o) => o.id === style)) return style as PromoAnimationStyle;
  return 'slide-up';
}

export function promoAnimationClass(style?: PromoAnimationStyle | string): string {
  const id = normalizePromoAnimation(style);
  switch (id) {
    case 'slide-up':
      return 'hamel-anim-slide-up';
    case 'bounce-in':
      return 'hamel-anim-bounce-in';
    case 'confetti-burst':
      return 'hamel-anim-confetti-burst';
    case 'countdown-pulse':
      return 'hamel-anim-countdown-pulse';
    case 'mascot-wiggle':
      return 'hamel-anim-mascot-wiggle';
    case 'zoom-in':
      return 'hamel-anim-zoom-in';
    case 'card-flip':
      return 'hamel-anim-card-flip';
    case 'slide-side':
      return 'hamel-anim-slide-side';
    case 'attention-shake':
      return 'hamel-anim-attention-shake';
    case 'glow-pulse':
      return 'hamel-anim-glow-pulse';
    case 'shine-sweep':
      return 'hamel-anim-shine-sweep';
    case 'fade':
    default:
      return 'hamel-anim-fade';
  }
}
