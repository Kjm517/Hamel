import type { CSSProperties } from 'react';
import { hamelAssets } from '../data/hamelAssets';
import { useStoreSettings } from '../context/StoreSettingsContext';

/** Full-page "under maintenance" state — no site chrome (nav / footer / chat). */
export function MaintenancePage() {
  const { settings, whatsappUrl } = useStoreSettings();
  const label = settings.storeName || 'Hamel Trading';

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <div
        className="hamel-construction-sprite"
        style={
          {
            '--hamel-construction-sheet': `url(${hamelAssets.mascot.constructionSheet})`,
          } as CSSProperties
        }
        role="img"
        aria-label={`${label} mascot working on site maintenance`}
      />

      <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
        We're Under Maintenance
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-gray-700">
        We're currently making a few improvements to serve you better. Please try again later or come
        back soon — we won't be long!
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0EA5E9' }}
        >
          Try Again
        </button>
        <a
          href={whatsappUrl("Hi! I'd like to check if the site is back up.")}
          className="rounded-full px-6 py-3 font-bold text-gray-900 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#FFC107' }}
        >
          Message Us Instead
        </a>
      </div>
    </div>
  );
}
