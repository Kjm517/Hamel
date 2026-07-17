import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, X } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import {
  listPromoPopupsForPath,
  loadSitePromoPopups,
  markPromoPopupDismissed,
  type SitePromoPopupItem,
  type SitePromoPopupsConfig,
} from '../data/site-promo-popup';
import { promoAnimationClass } from '../lib/promo-animations';

export function SitePromoPopup() {
  const location = useLocation();
  const [config, setConfig] = useState<SitePromoPopupsConfig | null>(null);
  const [active, setActive] = useState<SitePromoPopupItem | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Remaining popups to show for this path (priority order). */
  const queueRef = useRef<SitePromoPopupItem[]>([]);
  /** Once-per-* popups should not re-open on every SPA route change in the same tab. */
  const openedOnceIdsRef = useRef<Set<string>>(new Set());
  const cancelledRef = useRef(false);

  useEffect(() => {
    void loadSitePromoPopups().then(setConfig);
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const showNextFromQueue = () => {
    clearTimer();
    const next = queueRef.current.shift();
    if (!next) {
      setOpen(false);
      setActive(null);
      return;
    }

    timerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      if (next.frequency !== 'every_visit') {
        openedOnceIdsRef.current.add(next.id);
      }
      setActive(next);
      setOpen(true);
      setCopied(false);
    }, next.delayMs || 0);
  };

  useEffect(() => {
    cancelledRef.current = false;
    clearTimer();
    setOpen(false);
    setActive(null);
    setCopied(false);
    queueRef.current = [];

    if (!config) return;

    const candidates = listPromoPopupsForPath(config, location.pathname).filter(
      (p) => p.frequency === 'every_visit' || !openedOnceIdsRef.current.has(p.id)
    );
    queueRef.current = candidates;
    showNextFromQueue();

    return () => {
      cancelledRef.current = true;
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showNextFromQueue uses refs
  }, [config, location.pathname]);

  if (!open || !active || typeof document === 'undefined') return null;

  const dismiss = () => {
    markPromoPopupDismissed(active);
    setOpen(false);
    setActive(null);
    setCopied(false);
    // Advance to next matching popup (P2, P3, …)
    showNextFromQueue();
  };

  const copyCode = async () => {
    if (!active.code) return;
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const anim = promoAnimationClass(active.animation);
  const showCode = active.purpose === 'voucher' && Boolean(active.code);
  const eyebrow =
    active.purpose === 'product'
      ? 'Featured product'
      : active.purpose === 'announcement'
        ? 'Hamel update'
        : '⚡ Flash deal ends soon';

  const body = (() => {
    if (active.layout === 'poster') {
      return (
        <div
          className={`relative overflow-hidden rounded-2xl bg-white shadow-2xl ${anim}`}
          style={{ width: 'min(90vw, calc(64vh * 0.7725), 480px)' }}
        >
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/55 p-1.5 text-white transition-colors hover:bg-black/75"
            aria-label="Close popup"
          >
            <X size={18} />
          </button>
          {active.imageUrl ? (
            <div className="relative aspect-[791/1024] w-full overflow-hidden bg-slate-900">
              {active.mediaType === 'video' ? (
                <video
                  src={active.imageUrl}
                  className="block h-full w-full object-contain"
                  autoPlay
                  controls
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={active.imageUrl}
                  alt={active.headline || 'Promotion'}
                  className="block h-full w-full object-contain"
                />
              )}
            </div>
          ) : (
            <div className="flex min-h-72 items-center justify-center bg-[#0EA5E9] p-8 text-center text-xl font-black text-white">
              Upload your campaign creative
            </div>
          )}
          {(active.headline || active.body) && (
            <div className="px-5 pt-4 text-center">
              {active.headline && <h2 className="text-xl font-black text-gray-900">{active.headline}</h2>}
              {active.body && <p className="mt-1 text-sm text-gray-600">{active.body}</p>}
            </div>
          )}
          <div className="p-4">
            <Link
              to={active.ctaHref || '/products'}
              onClick={dismiss}
              className="flex w-full items-center justify-center rounded-full bg-[#0EA5E9] py-2.5 text-sm font-bold text-white"
            >
              {active.ctaLabel || 'Learn more'}
            </Link>
            <button type="button" onClick={dismiss} className="mt-2 w-full py-1 text-sm text-gray-500 hover:text-gray-700">
              {active.dismissLabel || 'Close'}
            </button>
          </div>
        </div>
      );
    }

    if (active.layout === 'split') {
      return (
        <div className={`flex w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ${anim}`}>
          <div className="relative hidden w-2/5 bg-[#0EA5E9] sm:block">
            {active.imageUrl ? (
              <img src={active.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm font-bold text-white">
                FLASH DEAL
              </div>
            )}
          </div>
          <div className="relative flex-1 p-5">
            <button type="button" onClick={dismiss} className="absolute right-3 top-3 text-gray-400 hover:text-gray-700">
              <X size={18} />
            </button>
            <p className="text-xs font-extrabold uppercase tracking-wide text-orange-500">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-900">{active.headline}</h2>
            <p className="mt-2 text-sm text-gray-600">{active.body}</p>
            {showCode && (
              <div className="mt-4 rounded-lg border border-dashed border-[#0EA5E9] bg-[#F0F9FF] px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-[#0369A1]">Your code</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-lg font-bold text-gray-900">{active.code}</span>
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    className="inline-flex items-center gap-1 rounded-md bg-[#0EA5E9] px-2.5 py-1 text-xs font-bold text-white"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
            <Link
              to={active.ctaHref || '/cool-deals'}
              onClick={dismiss}
              className="mt-4 flex w-full items-center justify-center rounded-full bg-[#0EA5E9] py-2.5 text-sm font-bold text-white"
            >
              {active.ctaLabel || 'Claim & Shop'}
            </Link>
          </div>
        </div>
      );
    }

    if (active.layout === 'coupon' && active.purpose === 'voucher') {
      return (
        <div className={`w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ${anim}`}>
          <div className="relative bg-gradient-to-br from-[#0EA5E9] to-[#0369A1] px-5 py-6 text-white">
            <button type="button" onClick={dismiss} className="absolute right-3 top-3 text-white/80 hover:text-white">
              <X size={18} />
            </button>
            <p className="text-xs font-bold uppercase tracking-widest text-sky-100">Hamel welcome gift</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">{active.headline}</h2>
            <p className="mt-2 text-sm text-sky-50">{active.body}</p>
          </div>
          <div className="border-t border-dashed border-gray-200 px-5 py-4">
            <p className="text-[10px] font-bold uppercase text-gray-500">Use code</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-xl font-black text-gray-900">{active.code}</span>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="rounded-full border border-[#0EA5E9] px-3 py-1 text-xs font-bold text-[#0EA5E9]"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <Link
              to={active.ctaHref || '/cool-deals'}
              onClick={dismiss}
              className="mt-4 flex w-full items-center justify-center rounded-full bg-amber-400 py-2.5 text-sm font-bold text-gray-900"
            >
              {active.ctaLabel || 'Redeem Now'}
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ${anim}`}>
        <div className="relative bg-[#0EA5E9] px-5 pt-5 pb-8 text-center text-white">
          <button type="button" onClick={dismiss} className="absolute right-3 top-3 text-white/80 hover:text-white">
            <X size={18} />
          </button>
          {active.imageUrl ? (
            <img
              src={active.imageUrl}
              alt=""
              className="mx-auto mb-3 h-24 w-24 rounded-full object-cover ring-4 ring-white/30"
            />
          ) : (
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-black text-[#0EA5E9]">
              H
            </div>
          )}
          <h2 className="text-2xl font-black">{active.headline}</h2>
          <p className="mt-2 text-sm text-sky-50">{active.body}</p>
        </div>
        <div className="px-5 py-4">
          {showCode && (
            <button
              type="button"
              onClick={() => void copyCode()}
              className="flex w-full items-center justify-between rounded-xl border border-dashed border-[#0EA5E9] bg-[#F0F9FF] px-4 py-3"
            >
              <span className="font-mono text-lg font-bold text-gray-900">{active.code}</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0EA5E9]">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </span>
            </button>
          )}
          <Link
            to={active.ctaHref || '/cool-deals'}
            onClick={dismiss}
            className="mt-3 flex w-full items-center justify-center rounded-full bg-[#0EA5E9] py-2.5 text-sm font-bold text-white"
          >
            {active.ctaLabel || 'Shop the sale'}
          </Link>
          <button type="button" onClick={dismiss} className="mt-2 w-full py-2 text-sm text-gray-500 hover:text-gray-700">
            {active.dismissLabel || 'No thanks, maybe later'}
          </button>
        </div>
      </div>
    );
  })();

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      {body}
    </div>,
    document.body
  );
}
