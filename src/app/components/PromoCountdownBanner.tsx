import { useEffect, useState } from 'react';

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

export function getCountdownParts(endsAt: string, now = Date.now()): CountdownParts {
  const end = Date.parse(endsAt);
  const totalMs = Number.isFinite(end) ? Math.max(0, end - now) : 0;
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalMs };
}

function UnitBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg bg-white/90 px-1.5 py-2 shadow-sm sm:rounded-xl sm:px-2 sm:py-2.5">
      <span className="text-xl font-extrabold leading-none text-[#0C4A6E] tabular-nums sm:text-2xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#0369A1] sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}

type PromoCountdownBannerProps = {
  endsAt: string;
  /** Promo copy shown above the timer */
  message?: string;
  className?: string;
  onExpired?: () => void;
};

/** Abenson-style promo countdown strip for product detail. */
export function PromoCountdownBanner({
  endsAt,
  message,
  className = '',
  onExpired,
}: PromoCountdownBannerProps) {
  const [parts, setParts] = useState(() => getCountdownParts(endsAt));

  useEffect(() => {
    setParts(getCountdownParts(endsAt));
    const id = window.setInterval(() => {
      const next = getCountdownParts(endsAt);
      setParts(next);
      if (next.totalMs <= 0) {
        window.clearInterval(id);
        onExpired?.();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [endsAt, onExpired]);

  if (parts.totalMs <= 0) {
    return (
      <div
        className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 ${className}`}
      >
        This limited-time offer has ended.
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#BAE6FD] bg-gradient-to-r from-[#E0F2FE] via-[#F0F9FF] to-[#E0F2FE] px-4 py-3.5 sm:px-5 sm:py-4 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 40%, rgba(244,114,182,0.3) 0 5px, transparent 6px), radial-gradient(circle at 92% 60%, rgba(56,189,248,0.35) 0 5px, transparent 6px)',
        }}
        aria-hidden
      />
      <div className="relative flex w-full flex-col gap-3">
        {message ? (
          <p className="w-full text-sm font-medium leading-relaxed text-[#0C4A6E] sm:text-[15px]">
            {message}
          </p>
        ) : null}
        <div
          className="grid w-full grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-1 sm:gap-1.5"
          aria-live="polite"
        >
          <UnitBox value={parts.days} label="Days" />
          <span className="text-lg font-bold text-[#0C4A6E] sm:text-xl">:</span>
          <UnitBox value={parts.hours} label="Hours" />
          <span className="text-lg font-bold text-[#0C4A6E] sm:text-xl">:</span>
          <UnitBox value={parts.minutes} label="Mins" />
          <span className="text-lg font-bold text-[#0C4A6E] sm:text-xl">:</span>
          <UnitBox value={parts.seconds} label="Secs" />
        </div>
      </div>
    </div>
  );
}

/** Compact timer for product cards (flash deals). */
export function PromoCountdownInline({ endsAt }: { endsAt: string }) {
  const [parts, setParts] = useState(() => getCountdownParts(endsAt));

  useEffect(() => {
    const id = window.setInterval(() => setParts(getCountdownParts(endsAt)), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (parts.totalMs <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded bg-[#FFEDD5] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#C2410C]">
      {parts.days > 0 ? `${parts.days}d ` : ''}
      {String(parts.hours).padStart(2, '0')}:{String(parts.minutes).padStart(2, '0')}:
      {String(parts.seconds).padStart(2, '0')}
    </span>
  );
}

function CircleUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-extrabold tabular-nums text-[#0C4A6E] shadow-sm sm:h-11 sm:w-11 sm:text-base">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-white/85">{label}</span>
    </div>
  );
}

/** Abenson-style section countdown next to promo event title. */
export function FeaturedEventCountdown({
  endsAt,
  label = 'ENDS IN',
  labelColor = '#FFFFFF',
}: {
  endsAt: string;
  label?: string;
  labelColor?: string;
}) {
  const [parts, setParts] = useState(() => getCountdownParts(endsAt));

  useEffect(() => {
    const id = window.setInterval(() => setParts(getCountdownParts(endsAt)), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (parts.totalMs <= 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>
        {label}
      </span>
      <div className="flex items-end gap-1.5 sm:gap-2">
        <CircleUnit value={parts.days} label="days" />
        <CircleUnit value={parts.hours} label="hours" />
        <CircleUnit value={parts.minutes} label="mins" />
        <CircleUnit value={parts.seconds} label="secs" />
      </div>
    </div>
  );
}
