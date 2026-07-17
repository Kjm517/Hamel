import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { hamelAssets } from '../data/hamelAssets';
import { useCatalog } from '../context/CatalogContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useProductTags } from '../context/ProductTagsContext';
import { useSiteLoading } from '../context/SiteLoadingContext';

const MIN_FIRST_MS = 1100;
const MIN_PAGE_MS = 480;
const EXIT_MS = 420;
const MESSAGE_ROTATE_MS = 1600;

const LOADING_MESSAGES = [
  'Cooling things down…',
  'Chilling the catalog…',
  'Prepping cool deals…',
  'Almost frost-ready…',
  'Tuning the thermostat…',
  'Loading icy savings…',
  'Waking the penguin…',
  'Fetching fresh breeze…',
  'Stacking cool comfort…',
  'Just a cool second…',
];

/**
 * Full-screen dance loader — shows on boot and again whenever
 * catalog/settings/tags or a page reports loading.
 */
export function SiteLoadingScreen() {
  const { loading: catalogLoading } = useCatalog();
  const { loading: settingsLoading, settings } = useStoreSettings();
  const { loading: tagsLoading } = useProductTags();
  const { pageBusy } = useSiteLoading();

  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [pct, setPct] = useState(6);
  const [msgIndex, setMsgIndex] = useState(0);
  const startedAt = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const sessionRef = useRef(0);
  const firstDoneRef = useRef(false);
  const busyRef = useRef(true);

  const bootstrapBusy = catalogLoading || settingsLoading || tagsLoading;
  const busy = bootstrapBusy || pageBusy;

  // Start / restart loader whenever work becomes pending.
  useEffect(() => {
    const wasBusy = busyRef.current;
    busyRef.current = busy;
    if (!busy || wasBusy) return;

    sessionRef.current += 1;
    startedAt.current =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    setPct(8);
    setMsgIndex(Math.floor(Math.random() * LOADING_MESSAGES.length));
    setExiting(false);
    setVisible(true);
  }, [busy]);

  useEffect(() => {
    if (!visible || exiting) return;

    const id = window.setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_ROTATE_MS);

    return () => window.clearInterval(id);
  }, [visible, exiting]);

  useEffect(() => {
    if (!visible || exiting) return;

    const id = window.setInterval(() => {
      setPct((prev) => {
        if (!busy) return Math.min(100, prev + 10);
        const ceiling = 88;
        if (prev >= ceiling) return prev;
        const step = prev < 40 ? 2.6 : prev < 70 ? 1.5 : 0.7;
        return Math.min(ceiling, prev + step);
      });
    }, 80);

    return () => window.clearInterval(id);
  }, [visible, exiting, busy]);

  useEffect(() => {
    if (!visible || exiting) return;
    if (busy || pct < 100) return;

    const minMs = firstDoneRef.current ? MIN_PAGE_MS : MIN_FIRST_MS;
    const elapsed =
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
      startedAt.current;
    const wait = Math.max(0, minMs - elapsed);
    const session = sessionRef.current;

    const t1 = window.setTimeout(() => {
      if (session !== sessionRef.current) return;
      firstDoneRef.current = true;
      setExiting(true);
      window.setTimeout(() => {
        if (session !== sessionRef.current) return;
        setVisible(false);
        setExiting(false);
      }, EXIT_MS);
    }, wait);

    return () => window.clearTimeout(t1);
  }, [visible, exiting, busy, pct]);

  if (!visible || typeof document === 'undefined') return null;

  const label = settings.storeName || 'Hamel Trading';
  const rounded = Math.round(pct);
  const message = LOADING_MESSAGES[msgIndex] ?? LOADING_MESSAGES[0];

  return createPortal(
    <div
      className="hamel-load-screen fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
      style={{
        animation: exiting ? `hamel-load-fade-out ${EXIT_MS}ms ease-out forwards` : undefined,
        pointerEvents: exiting ? 'none' : 'auto',
      }}
      role="status"
      aria-live="polite"
      aria-busy={busy}
      aria-label={`${label} is loading`}
    >
      <div className="hamel-load-glow" aria-hidden />

      <div className="relative z-[1] flex flex-col items-center">
        <img
          src={hamelAssets.branding.soloLogo}
          alt={label}
          className="mb-8 h-9 w-auto object-contain"
          draggable={false}
        />

        <div className="relative flex h-[200px] w-[200px] items-end justify-center">
          <div
            className="hamel-load-dance-sprite relative z-[1]"
            style={
              {
                '--hamel-dance-sheet': `url(${hamelAssets.mascot.danceSheet})`,
              } as CSSProperties
            }
            aria-hidden
          />
          <div className="hamel-load-b-shadow absolute bottom-2 z-0 h-3.5 w-24 rounded-full bg-[#0EA5E9]/30" />
        </div>

        <div className="mt-8 w-[260px] text-center">
          <p
            key={`${sessionRef.current}-${msgIndex}`}
            className="hamel-load-msg text-[15px] font-bold text-[#0C4A6E]"
          >
            {message}
          </p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#BAE6FD]/70">
            <div
              className="h-full rounded-full bg-[#0EA5E9] transition-[width] duration-100 ease-linear"
              style={{ width: `${rounded}%` }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
