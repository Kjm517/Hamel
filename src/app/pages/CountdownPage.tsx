import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { hamelAssets } from '../data/hamelAssets';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { getCountdownParts } from '../components/PromoCountdownBanner';

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[4.5rem] flex-col items-center justify-center rounded-2xl bg-white/90 px-3 py-4 shadow-sm sm:min-w-[5.5rem] sm:px-4 sm:py-5">
      <span className="text-3xl font-black leading-none text-[#0C4A6E] tabular-nums sm:text-4xl">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0369A1] sm:text-xs">
        {label}
      </span>
    </div>
  );
}

/** Full-page "coming soon" countdown state — no site chrome (nav / footer / chat). */
export function CountdownPage() {
  const { settings } = useStoreSettings();
  const endsAt = settings.countdownEndsAt || '';
  const [parts, setParts] = useState(() => getCountdownParts(endsAt));

  useEffect(() => {
    setParts(getCountdownParts(endsAt));
    const id = window.setInterval(() => setParts(getCountdownParts(endsAt)), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const isLive = !endsAt || parts.totalMs <= 0;
  const title = settings.countdownTitle || 'Something Exciting Is Coming!';
  const message =
    settings.countdownMessage ||
    "We're putting the finishing touches on something cool. Check back soon!";

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#E0F2FE] via-white to-white px-6 py-16 text-center">
      <div className="hamel-anim-confetti-burst">
        <img
          src={hamelAssets.mascot.celebrate}
          alt="Hamel mascot celebrating"
          className="hamel-anim-mascot-wiggle h-40 w-40 object-contain sm:h-52 sm:w-52"
          draggable={false}
        />
      </div>

      <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
        {isLive ? "We're Live!" : title}
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-gray-700">
        {isLive ? 'Thanks for waiting — everything is ready. Come take a look!' : message}
      </p>

      {!isLive ? (
        <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4" aria-live="polite">
          <CountdownUnit value={parts.days} label="Days" />
          <CountdownUnit value={parts.hours} label="Hours" />
          <CountdownUnit value={parts.minutes} label="Mins" />
          <CountdownUnit value={parts.seconds} label="Secs" />
        </div>
      ) : (
        <Link
          to="/"
          className="mt-8 rounded-full px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0EA5E9' }}
        >
          Explore Now
        </Link>
      )}
    </div>
  );
}
