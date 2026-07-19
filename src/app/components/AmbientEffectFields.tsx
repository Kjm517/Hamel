import {
  PROMO_AMBIENT_DIRECTION_OPTIONS,
  PROMO_AMBIENT_DURATION_PRESETS,
  PROMO_AMBIENT_INTENSITY_OPTIONS,
  PROMO_AMBIENT_OPTIONS,
  MAX_AMBIENT_DURATION_SEC,
  MIN_AMBIENT_DURATION_SEC,
  defaultAmbientDirection,
  normalizePromoAmbientDirection,
  normalizePromoAmbientDurationSec,
  normalizePromoAmbientEffect,
  normalizePromoAmbientIntensity,
  type PromoAmbientDirection,
  type PromoAmbientEffect,
  type PromoAmbientIntensity,
} from '../lib/promo-ambient-effects';
import { PromoAmbientLayer, PROMO_AMBIENT_ICONS } from './PromoAmbientLayer';

export type AmbientEffectFieldsValue = {
  ambientEffect?: PromoAmbientEffect | string | null;
  ambientIntensity?: PromoAmbientIntensity | string | null;
  ambientDurationSec?: number | null;
  ambientDirection?: PromoAmbientDirection | string | null;
};

type AmbientEffectFieldsProps = {
  value: AmbientEffectFieldsValue;
  accentColor?: string;
  /** Short note under the title (where the effect plays). */
  hint?: string;
  onChange: (patch: {
    ambientEffect?: PromoAmbientEffect;
    ambientIntensity?: PromoAmbientIntensity;
    ambientDurationSec?: number;
    ambientDirection?: PromoAmbientDirection;
  }) => void;
};

/** Shared admin picker: effect type, intensity, direction, duration, live preview. */
export function AmbientEffectFields({
  value,
  accentColor = '#FFC107',
  hint = 'Plays when visitors land on this section, then fades out (or stays if Continuous).',
  onChange,
}: AmbientEffectFieldsProps) {
  const effect = normalizePromoAmbientEffect(value.ambientEffect);
  const intensity = normalizePromoAmbientIntensity(value.ambientIntensity);
  const durationSec = normalizePromoAmbientDurationSec(value.ambientDurationSec);
  const direction = normalizePromoAmbientDirection(value.ambientDirection, effect);

  return (
    <div className="rounded-xl border border-[#bae6fd] bg-[#f0f9ff] p-[13px]">
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#0369a1]">
        Ambient effect
      </div>
      <p className="mb-2 text-[11px] text-[#7a8899]">{hint}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {PROMO_AMBIENT_OPTIONS.map((option) => {
          const active = effect === option.id;
          const Icon = PROMO_AMBIENT_ICONS[option.id];
          return (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onChange({
                  ambientEffect: option.id,
                  ambientDirection: defaultAmbientDirection(option.id),
                })
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition ${
                active
                  ? 'bg-[#0ea5e9] font-semibold text-white'
                  : 'bg-white/80 font-medium text-[#516171] ring-1 ring-[#bae6fd] hover:bg-white'
              }`}
              title={option.desc}
            >
              <Icon size={13} strokeWidth={2.25} />
              {option.name}
            </button>
          );
        })}
      </div>

      {effect !== 'none' ? (
        <>
          <label className="mb-1 block text-xs font-medium text-[#516171]">Intensity</label>
          <div className="mb-3 flex flex-wrap gap-2">
            {PROMO_AMBIENT_INTENSITY_OPTIONS.map((option) => {
              const active = intensity === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ ambientIntensity: option.id })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    active
                      ? 'bg-[#0EA5E9] text-white'
                      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {option.name}
                </button>
              );
            })}
          </div>

          <label className="mb-1 block text-xs font-medium text-[#516171]">Direction</label>
          <div className="mb-3 flex flex-wrap gap-2">
            {PROMO_AMBIENT_DIRECTION_OPTIONS.map((option) => {
              const active = direction === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ ambientDirection: option.id })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    active
                      ? 'bg-[#0EA5E9] text-white'
                      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                  }`}
                  title={option.desc}
                >
                  {option.name}
                </button>
              );
            })}
          </div>

          <label className="mb-1 block text-xs font-medium text-[#516171]">
            Duration (seconds)
          </label>
          <p className="mb-1.5 text-[10px] text-[#7a8899]">
            How long the effect stays before fading. Continuous keeps it playing while the section
            is on screen.
          </p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {PROMO_AMBIENT_DURATION_PRESETS.map((preset) => {
              const active = durationSec === preset.sec;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange({ ambientDurationSec: preset.sec })}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    active
                      ? 'bg-[#0EA5E9] text-white'
                      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            <label className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#516171] ring-1 ring-gray-200">
              Custom
              <input
                type="number"
                min={MIN_AMBIENT_DURATION_SEC}
                max={MAX_AMBIENT_DURATION_SEC}
                value={durationSec}
                onChange={(e) =>
                  onChange({
                    ambientDurationSec: normalizePromoAmbientDurationSec(e.target.value),
                  })
                }
                className="w-12 rounded border border-[#e4ebf2] bg-[#f7fafd] px-1 py-0.5 text-center font-mono text-[11px] text-[#0C4A6E]"
              />
              s
            </label>
          </div>

          <div className="relative h-36 overflow-hidden rounded-lg border border-[#BAE6FD] bg-[#0EA5E9]">
            <PromoAmbientLayer
              key={`${effect}-${intensity}-${direction}-${durationSec}`}
              effect={effect}
              intensity={intensity}
              direction={direction}
              durationSec={durationSec}
              accentColor={accentColor}
              loop
            />
            <p className="relative z-10 px-3 py-2 text-[10px] font-semibold text-white/90">
              Effect preview
              {direction === 'up' ? ' · bottom → top' : ' · top → bottom'}
              {durationSec === 0 ? ' · continuous' : ` · ${durationSec}s on storefront`}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
