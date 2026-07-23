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

function RectUnit({
  value,
  label,
  urgent = false,
}: {
  value: number;
  label: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={`flex min-w-[2.75rem] flex-col items-center justify-center rounded-lg px-1.5 py-1 shadow-sm sm:min-w-[3.25rem] sm:px-2 sm:py-1.5 ${
        urgent ? 'bg-[#ff1a1a]' : 'bg-[#7DD3FC]'
      }`}
    >
      <span className="text-sm font-black leading-none text-white tabular-nums sm:text-base">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-0.5 text-[8px] font-bold lowercase leading-none tracking-wide text-white sm:text-[9px]">
        {label}
      </span>
    </div>
  );
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/** Compact countdown beside the promo-event title. */
export function FeaturedEventCountdown({
  endsAt,
  label = 'ENDS IN',
  labelColor = '#0C4A6E',
  /** Urgent red when remaining time is under this many ms (default = 3 days). */
  urgentUnderMs = THREE_DAYS_MS,
  /** Always use urgent red while the timer is visible. */
  forceUrgent = false,
  /** Auto-apply urgent red under the threshold (ignored when forceUrgent). */
  autoUrgent = true,
}: {
  endsAt: string;
  label?: string;
  labelColor?: string;
  urgentUnderMs?: number;
  forceUrgent?: boolean;
  autoUrgent?: boolean;
}) {
  const [parts, setParts] = useState(() => getCountdownParts(endsAt));

  useEffect(() => {
    const id = window.setInterval(() => setParts(getCountdownParts(endsAt)), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (parts.totalMs <= 0) return null;

  const thresholdMs =
    Number.isFinite(urgentUnderMs) && urgentUnderMs > 0 ? urgentUnderMs : THREE_DAYS_MS;
  // Always-red toggle wins; otherwise follow the hours threshold from admin.
  const urgent =
    forceUrgent === true ||
    (autoUrgent !== false && parts.totalMs > 0 && parts.totalMs < thresholdMs);

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {label ? (
        <span
          className="text-[9px] font-extrabold uppercase tracking-widest sm:text-[10px]"
          style={{ color: labelColor }}
        >
          {label}
        </span>
      ) : null}
      <div className="flex items-center gap-1" aria-live="polite">
        <RectUnit value={parts.days} label="days" urgent={urgent} />
        <RectUnit value={parts.hours} label="hours" urgent={urgent} />
        <RectUnit value={parts.minutes} label="mins" urgent={urgent} />
        <RectUnit value={parts.seconds} label="secs" urgent={urgent} />
      </div>
    </div>
  );
}
