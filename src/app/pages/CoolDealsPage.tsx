import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Award,
  ArrowRight,
  BedDouble,
  Building2,
  Check,
  Clock,
  CreditCard,
  DoorOpen,
  Flame,
  Gauge,
  Gift,
  Headset,
  MessageCircle,
  Phone,
  Shield,
  Snowflake,
  Sofa,
  VolumeX,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ProductCard } from '../components/ProductCard';
import { DealTileSurface } from '../components/cool-deals/DealTileSurface';
import { ContactOptionsModal } from '../components/ContactOptionsModal';
import { BookMaintenanceModal } from '../components/BookMaintenanceModal';
import { CoolDealsHeroBanner } from '../components/CoolDealsHeroBanner';
import { resolveBannerLinkHref } from '../lib/banner-link';
import { brandLogoFor, hamelAssets, hamelBrandLogos } from '../data/hamelAssets';
import { useCatalog } from '../context/CatalogContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { usePageLoading } from '../context/SiteLoadingContext';
import { useCoolDealsBanner } from '../hooks/useBanner';
import { useCoolDealsPage } from '../hooks/useCoolDealsPage';
import { getProductDisplayPrices, getDiscountedPrice, productHasPromos } from '../lib/product-promos';
import { productMatchesHp } from '../lib/catalog-product';
import { findDealCatalogProduct } from '../lib/deal-catalog-product';
import { getPriceColor } from '../lib/product-price-color';
import {
  cornerTagBgColor,
  cornerTagTextColor,
  cornerTagVariant,
  formatCornerTagLabel,
  resolveProductCornerTags,
} from '../lib/product-corner-tags';
import { useProductTags } from '../context/ProductTagsContext';
import { CornerTag } from '../components/PromoBadge';
import { getHpUnitPrice, resolveProductStock } from '../data/products';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useClaimedVouchers } from '../context/ClaimedVouchersContext';
import type { Product } from '../data/products';
import type {
  CoolDealsBestSellersSection,
  CoolDealsBrandsSection,
  CoolDealsBundleItem,
  CoolDealsBundlesSection,
  CoolDealsCardGridSection,
  CoolDealsCtaSection,
  CoolDealsDealOfDaySection,
  CoolDealsFinancingSection,
  CoolDealsFinderSection,
  CoolDealsFlashDealsSection,
  CoolDealsProductMatrixSection,
  CoolDealsPromoStripSection,
  CoolDealsRecommendedSection,
  CoolDealsSection,
  CoolDealsServiceStickySection,
  CoolDealsStatsBrandsSection,
  CoolDealsTrustBarSection,
} from '../data/cool-deals-page';

const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`;

function BrandMark({ brand, className = 'h-6 w-auto max-w-[100px] object-contain object-left' }: { brand: string; className?: string }) {
  const logo = brandLogoFor(brand);
  if (logo) {
    return <ImageWithFallback src={logo} alt={brand} className={className} />;
  }
  return <span className="font-black text-[#0EA5E9] text-[15px] uppercase tracking-wide">{brand}</span>;
}

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';

function useCoolDealsFonts() {
  useEffect(() => {
    const id = 'cool-deals-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

const HOUR_MS = 60 * 60 * 1000;

function resolveUrgencyThresholdHours(raw: unknown, fallback = 72): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function isCountdownUrgent(
  totalMs: number,
  opts: {
    thresholdHours?: unknown;
    autoUrgent?: boolean;
    forceUrgent?: boolean;
  }
): boolean {
  if (totalMs <= 0) return false;
  // "Always use urgent red" wins — ignore the hours field.
  if (opts.forceUrgent === true) return true;
  // Otherwise only the hours input drives red (when auto urgent is on).
  if (opts.autoUrgent === false) return false;
  const hours = resolveUrgencyThresholdHours(opts.thresholdHours);
  return totalMs < hours * HOUR_MS;
}

function useEndOfDayCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = Math.max(0, end.getTime() - now);
  const h = Math.floor(diff / 3.6e6);
  const m = Math.floor((diff % 3.6e6) / 6e4);
  const s = Math.floor((diff % 6e4) / 1e3);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    h: pad(h),
    m: pad(m),
    s: pad(s),
    label: `${pad(h)}:${pad(m)}:${pad(s)}`,
    totalMs: diff,
  };
}

/**
 * Counts down to `endsAt` when provided (real multi-day deadline); otherwise
 * falls back to the end of the current day. Returns days plus padded parts.
 */
function useDeadlineCountdown(endsAt?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const parsed = endsAt ? new Date(endsAt).getTime() : NaN;
  const hasDeadline = Number.isFinite(parsed);
  let target: number;
  if (hasDeadline) {
    target = parsed;
  } else {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    target = end.getTime();
  }

  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 8.64e7);
  const h = Math.floor((diff % 8.64e7) / 3.6e6);
  const m = Math.floor((diff % 3.6e6) / 6e4);
  const s = Math.floor((diff % 6e4) / 1e3);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { d, h: pad(h), m: pad(m), s: pad(s), totalMs: diff, hasDeadline, pad };
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  eyebrowClass = 'text-[#0EA5E9]',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  eyebrowClass?: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-8">
      {eyebrow && (
        <div className={`text-xs font-extrabold uppercase tracking-[0.16em] ${eyebrowClass}`}>
          {eyebrow}
        </div>
      )}
      <h2 className="mt-2 text-xl md:text-2xl font-black tracking-wide uppercase text-[#0EA5E9]">
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-sm md:text-base text-gray-500">{subtitle}</p>}
    </div>
  );
}

function activeProducts(products: Product[]) {
  return products.filter((p) => p.isActive !== false);
}

function productDetailHref(productId: string, hp?: string) {
  if (!hp?.trim()) return `/product/${productId}`;
  return `/product/${productId}?hp=${encodeURIComponent(hp.trim())}`;
}

function resolveProductHp(product: Product, preferred?: string): string | undefined {
  if (!preferred?.trim()) return undefined;
  const want = preferred.trim();
  const exact = product.hp.find((h) => h.toLowerCase() === want.toLowerCase());
  if (exact) return exact;
  const num = want.match(/([\d.]+)/)?.[1];
  if (!num) return undefined;
  return product.hp.find((h) => {
    const n = h.match(/([\d.]+)/)?.[1];
    return n && Number(n) === Number(num);
  });
}

function displayPricesForHp(product: Product, hp?: string) {
  const resolved = resolveProductHp(product, hp);
  if (!resolved) return getProductDisplayPrices(product);
  const list = getHpUnitPrice(product, resolved);
  const sale = getDiscountedPrice(product, list, resolved);
  return {
    listStart: list,
    listEnd: list,
    saleStart: sale,
    saleEnd: sale,
    hasDiscount: sale < list,
  };
}

function productTitleWithHp(product: Product, hp?: string) {
  const resolved = resolveProductHp(product, hp);
  if (!resolved) return product.model;
  if (new RegExp(resolved.replace(/\./g, '\\.'), 'i').test(product.model)) return product.model;
  return `${product.model} · ${resolved}`;
}

function pickProducts(
  products: Product[],
  opts: { source: 'catalog' | 'manual'; productIds: string[]; limit: number; preferDeal?: boolean }
) {
  const active = activeProducts(products);
  if (opts.source === 'manual' && opts.productIds.length) {
    const map = new Map(active.map((p) => [p.id, p]));
    return opts.productIds.map((id) => map.get(id)).filter(Boolean).slice(0, opts.limit) as Product[];
  }
  if (opts.preferDeal) {
    const withDeal = active.filter(
      (p) => p.tier === 'flash-sale' || getProductDisplayPrices(p).hasDiscount
    );
    return (withDeal.length ? withDeal : active).slice(0, opts.limit);
  }
  return [...active]
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0) || (b.rating || 0) - (a.rating || 0))
    .slice(0, opts.limit);
}

function resolveDealStock(
  section: CoolDealsDealOfDaySection,
  product?: Product
): {
  show: boolean;
  headline: string;
  label: string;
  pct: number;
  left: number | null;
  source: 'product' | 'manual';
} | null {
  // Prefer live inventory from the linked (or name-matched) catalog product.
  // Manual Cool Deals stockLeft is only a fallback when the product has no stockQty.
  const live = product ? resolveProductStock(product) : null;
  if (live) {
    const { qty: left, capacity } = live;
    const remainingRatio = capacity > 0 ? left / capacity : 0;
    const soldPct = Math.round(((capacity - Math.min(left, capacity)) / capacity) * 100);
    const headline =
      left === 0
        ? 'Sold out'
        : remainingRatio <= 0.25
          ? 'Selling fast'
          : remainingRatio <= 0.5
            ? 'Going quickly'
            : 'Limited stock';
    const label =
      left === 0 ? 'Sold out' : left === 1 ? 'Only 1 left' : `Only ${left} left`;
    return {
      show: true,
      headline,
      label,
      pct: Math.min(100, Math.max(left === 0 ? 100 : 8, soldPct)),
      left,
      source: 'product',
    };
  }

  let left = Number(section.stockLeft);
  if (!Number.isFinite(left) || left < 0) {
    const parsed = section.stockLabel?.match(/(\d+)/)?.[1];
    left = parsed ? Number(parsed) : NaN;
  }
  if (!Number.isFinite(left)) {
    if (!section.stockLabel && section.stockPct == null) return null;
    return {
      show: true,
      headline: 'Selling fast',
      label: section.stockLabel || 'Limited stock',
      pct: Math.min(100, Math.max(5, section.stockPct ?? 30)),
      left: null,
      source: 'manual',
    };
  }

  let capacity = Number(section.stockCapacity);
  if (!Number.isFinite(capacity) || capacity <= 0) capacity = Math.max(20, left);
  if (capacity < left) capacity = left;

  const remainingRatio = capacity > 0 ? left / capacity : 0;
  const soldPct = Math.round(((capacity - Math.min(left, capacity)) / capacity) * 100);
  const headline =
    left === 0
      ? 'Sold out'
      : remainingRatio <= 0.25
        ? 'Selling fast'
        : remainingRatio <= 0.5
          ? 'Going quickly'
          : 'Limited stock';
  const label =
    left === 0 ? 'Sold out' : left === 1 ? 'Only 1 left' : `Only ${left} left`;

  return {
    show: true,
    headline,
    label,
    pct: Math.min(100, Math.max(left === 0 ? 100 : 8, soldPct)),
    left,
    source: 'manual',
  };
}

function resolveDealProduct(
  section: CoolDealsDealOfDaySection,
  products: Product[]
): {
  brand: string;
  name: string;
  imageUrl: string;
  priceNow: number;
  priceWas: number;
  href: string;
  product?: Product;
} {
  const product = findDealCatalogProduct(section, products);
  if (product) {
    const prices = getProductDisplayPrices(product);
    return {
      brand: (section.brand || product.brand).toUpperCase(),
      name: section.productName || `${product.model}${product.hp[0] ? ` ${product.hp[0]}` : ''}`,
      imageUrl: section.imageUrl || product.image,
      priceNow: section.priceNow ?? prices.saleStart,
      priceWas: section.priceWas ?? prices.listStart,
      href: `/product/${product.id}`,
      product,
    };
  }
  return {
    brand: (section.brand || 'HAMEL').toUpperCase(),
    name: section.productName || 'Featured deal',
    imageUrl: section.imageUrl || hamelAssets.aircon.wallSplitDaikinAmihan,
    priceNow: section.priceNow ?? 0,
    priceWas: section.priceWas ?? section.priceNow ?? 0,
    href: '/products',
  };
}

/* ------------------------------------------------------------------ */
/* Promo strip                                                          */
/* ------------------------------------------------------------------ */
function PromoStrip({ section }: { section: CoolDealsPromoStripSection }) {
  const { label } = useEndOfDayCountdown();
  return (
    <div className="w-full bg-[#0EA5E9] text-white flex items-center justify-center gap-3.5 px-4 sm:px-5 py-2.5 text-[13px] font-semibold flex-wrap">
      <span className="bg-[#FFC107] text-[#22303c] px-3 py-0.5 rounded-full font-extrabold tracking-wide text-[12px] uppercase">
        {section.badge}
      </span>
      <span className="text-center sm:text-left">{section.text}</span>
      {section.showCountdown && (
        <span className="opacity-90">
          Ends in <b className="tabular-nums font-bold">{label}</b>
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Deal of the Day hero                                                 */
/* ------------------------------------------------------------------ */
function DealOfDayHero({
  section,
  products,
}: {
  section: CoolDealsDealOfDaySection;
  products: Product[];
}) {
  const { label, totalMs } = useEndOfDayCountdown();
  const urgent = isCountdownUrgent(totalMs, {
    thresholdHours: section.urgencyThresholdHours,
    autoUrgent: section.blinkWhenUrgent !== false,
    forceUrgent: section.forceBlink === true,
  });
  const deal = resolveDealProduct(section, products);
  const stock = resolveDealStock(section, deal.product);
  const months = section.months || 36;
  const monthly = deal.priceNow > 0 ? Math.round(deal.priceNow / months) : 0;
  const save = Math.max(0, deal.priceWas - deal.priceNow);
  const titleLines = section.title.split('\n');

  const scrollFinder = () => {
    const el = document.getElementById('finder');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="bg-[radial-gradient(120%_120%_at_80%_0%,#38BDF8_0%,#0EA5E9_42%,#0284C7_100%)] px-4 md:px-11 py-12 md:py-14">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-11 items-center">
        <div className="text-white">
          <div className="inline-flex items-center gap-2 bg-[#FFC107] text-[#22303c] font-extrabold text-xs tracking-[0.14em] px-3.5 py-1.5 rounded-full uppercase">
            <Zap size={14} fill="currentColor" /> {section.eyebrow || 'Deal of the Day'}
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl lg:text-[56px] font-black leading-[1.02] tracking-tight">
            {titleLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < titleLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="mt-4 text-base md:text-[17px] leading-relaxed text-white/90 max-w-md">
            {section.subtitle.split(/free installation/i).map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <b className="text-white">free installation</b>
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
          <div className="flex flex-wrap gap-3.5 mt-6 mb-6">
            <Link
              to={deal.href}
              className="bg-[#FFC107] text-[#22303c] font-extrabold text-base px-7 py-3.5 rounded-xl shadow-[0_10px_24px_-8px_rgba(255,193,7,0.55)] hover:opacity-95"
            >
              {section.primaryCta}
            </Link>
            <button
              type="button"
              onClick={() => {
                if (section.secondaryHref?.startsWith('#')) scrollFinder();
                else if (section.secondaryHref) window.location.assign(section.secondaryHref);
              }}
              className="border-[1.5px] border-white/70 text-white font-bold text-base px-6 py-3.5 rounded-xl hover:bg-white/10"
            >
              {section.secondaryCta}
            </button>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/95 font-semibold">
            {section.trustLine.split(/\s*·\s*/).map((t) => (
              <span key={t}>✓ {t.trim().replace(/^✓\s*/, '')}</span>
            ))}
          </div>
        </div>

        <Link
          to={deal.href}
          className="block bg-white rounded-[22px] p-5 md:p-[22px] shadow-[0_30px_60px_-20px_rgba(2,132,199,0.45)] transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC107] focus-visible:ring-offset-2"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="bg-[#EF4444] text-white font-extrabold text-[13px] px-3 py-1 rounded-lg">
              {section.badge || (save > 0 ? `SAVE ${peso(save)}` : 'TODAY ONLY')}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 font-extrabold text-[13px] tabular-nums ${
                urgent ? 'text-[#ff1a1a]' : 'text-[#516171]'
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-current ${
                  urgent ? 'animate-pulse' : ''
                }`}
                aria-hidden
              />
              <span>
                {label} left
              </span>
            </span>
          </div>
          <div className="relative h-[190px] rounded-[14px] bg-[#F4F8FC] overflow-hidden">
            <ImageWithFallback src={deal.imageUrl} alt={deal.name} className="h-full w-full object-contain p-4" />
          </div>
          <div className="flex items-center gap-2.5 mt-4 flex-wrap">
            <BrandMark brand={deal.brand} className="h-7 w-auto max-w-[120px] object-contain object-left" />
            {section.tag && (
              <span className="text-xs text-[#0EA5E9] border border-[#BAE6FD] px-2 py-0.5 rounded-full font-bold">
                {section.tag}
              </span>
            )}
          </div>
          <div className="font-extrabold text-xl mt-1 mb-2.5 text-[#1E2A38]">{deal.name}</div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-black text-[34px] text-[#EF4444]">{peso(deal.priceNow)}</span>
            {deal.priceWas > deal.priceNow && (
              <span className="text-gray-400 line-through font-semibold">{peso(deal.priceWas)}</span>
            )}
          </div>
          {monthly > 0 && (
            <div className="text-[#16A34A] font-bold text-[13px] mt-0.5">
              or {peso(monthly)}/mo · {months} mos · 0% interest
            </div>
          )}
          {stock?.show && (
            <div className="mt-3.5">
              <div className="flex justify-between text-xs font-bold text-[#535763] mb-1">
                <span>{stock.headline}</span>
                <span
                  className={
                    stock.left != null && stock.left <= 5 ? 'text-[#EF4444]' : 'text-[#E3790B]'
                  }
                >
                  {stock.label}
                </span>
              </div>
              <div className="h-1.5 rounded-md bg-[#DDE6F0] overflow-hidden">
                <div
                  className={`h-full rounded-md transition-[width] duration-500 ${
                    stock.left != null && stock.left <= 5
                      ? 'bg-gradient-to-r from-[#DC2626] to-[#EF4444]'
                      : 'bg-gradient-to-r from-[#E3790B] to-[#F5B301]'
                  }`}
                  style={{ width: `${stock.pct}%` }}
                />
              </div>
            </div>
          )}
          <span className="block w-full mt-4 bg-[#FFC107] text-[#22303c] text-center font-extrabold text-base py-3.5 rounded-xl hover:opacity-95">
            {section.inquireCta || 'Inquire now'}
          </span>
        </Link>
      </div>
    </section>
  );
}

function StickyServiceBar({
  section,
  onBook,
}: {
  section: CoolDealsServiceStickySection;
  onBook: () => void;
}) {
  const [visible, setVisible] = useState(false);
  // Dismiss hides it only for the current view — it shows again on every visit/reload.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      const y = window.scrollY;
      const doc = document.documentElement;
      const nearBottom = y + window.innerHeight >= doc.scrollHeight - 280;
      // Appear once the customer is clearly browsing; retreat near the footer/CTA.
      setVisible(y > 520 && !nearBottom);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [dismissed]);

  const dismiss = () => setDismissed(true);

  if (dismissed) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pl-3 pr-[4.75rem] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto relative w-full max-w-xl overflow-hidden rounded-2xl border pl-4 pr-9 py-3 flex items-center gap-3 transition-all duration-500 ease-out ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[150%] opacity-0'
        }`}
        style={{
          backgroundColor: section.bgFrom,
          borderColor: 'rgba(255,255,255,0.14)',
          boxShadow: '0 14px 34px -16px rgba(15,31,46,0.55)',
        }}
      >
        {/* Accent stripe */}
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-1"
          style={{ background: section.accentColor }}
          aria-hidden
        />

        {/* Dismiss */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X size={15} />
        </button>

        {/* Icon */}
        <div
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.14)',
            color: section.accentColor,
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.22)`,
          }}
        >
          <Wrench size={20} />
        </div>

        {/* Text */}
        <div className="relative min-w-0 flex-1">
          {section.eyebrow?.trim() && (
            <div
              className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em]"
              style={{ color: section.accentColor }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ background: section.accentColor }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: section.accentColor }}
                />
              </span>
              <span className="truncate">{section.eyebrow}</span>
            </div>
          )}
          <div
            className="truncate font-extrabold text-[14px] leading-tight"
            style={{ color: section.titleColor }}
          >
            {section.title}
          </div>
          {section.subtitle?.trim() && (
            <div
              className="hidden truncate text-[11px] font-medium sm:block"
              style={{ color: section.subtitleColor }}
            >
              {section.subtitle}
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onBook}
          className="relative inline-flex shrink-0 items-center gap-1.5 rounded-[11px] px-4 py-2.5 text-[13px] font-extrabold transition hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0"
          style={{
            backgroundColor: section.ctaBg,
            color: section.ctaText,
          }}
        >
          <Wrench size={15} />
          <span className="hidden sm:inline">{section.ctaLabel}</span>
          <span className="sm:hidden">Book</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vouchers / deal tiles                                                */
/* ------------------------------------------------------------------ */
function ClaimableVouchers({ section }: { section: CoolDealsCardGridSection }) {
  const { isAuthenticated, requireAuth } = useCustomerAuth();
  const { isCardClaimed, claimVoucher } = useClaimedVouchers();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  if (section.variant !== 'voucher' || !section.cards.length) return null;

  return (
    <section className="py-11 md:py-14 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow={section.headingEyebrow}
          title={section.headingTitle}
          subtitle={section.headingSubtitle}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {section.cards.map((card) => {
            // Guests always see Claim; Claimed only after this account claims in the DB.
            const isDone = isAuthenticated && isCardClaimed(card.id);
            const isClaiming = claimingId === card.id;
            return (
              <div
                key={card.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-lg ${
                  isDone ? 'border-green-300' : 'border-gray-100'
                }`}
              >
                <div className="h-2" style={{ backgroundColor: card.color }} />
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-base mb-3" style={{ color: card.color }}>
                    {card.title}
                  </h3>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 h-36 overflow-hidden mb-4">
                    <ImageWithFallback src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">{card.body}</p>
                  {card.voucherCode?.trim() && (
                    <p className="mt-2 text-[11px] font-semibold text-[#0369A1]">
                      Code {card.voucherCode.trim().toUpperCase()}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={isDone || isClaiming}
                    onClick={() => {
                      requireAuth(
                        () => {
                          setClaimingId(card.id);
                          void claimVoucher({
                            cardId: card.id,
                            title: card.title,
                            voucherCode: card.voucherCode,
                            source: 'cool-deals',
                          })
                            .catch((err) => {
                              window.alert(
                                err instanceof Error
                                  ? err.message
                                  : 'Could not claim this voucher. Please try again.'
                              );
                            })
                            .finally(() => setClaimingId(null));
                        },
                        {
                          view: 'login',
                          reason:
                            'Sign in or create an account to claim this exclusive voucher.',
                        }
                      );
                    }}
                    className={`mt-4 w-full text-center font-bold text-[13px] py-2.5 rounded-xl ${
                      isDone
                        ? 'bg-green-50 text-green-600'
                        : 'bg-[#0EA5E9] text-white hover:bg-[#0284C7] disabled:opacity-70'
                    }`}
                  >
                    {isDone ? (
                      <span className="inline-flex items-center gap-1.5 justify-center">
                        <Check size={14} /> Claimed
                      </span>
                    ) : isClaiming ? (
                      'Claiming…'
                    ) : (
                      'Claim'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DealTiles({ section }: { section: CoolDealsCardGridSection }) {
  if (section.variant !== 'deal' || !section.dealCards?.length) return null;
  return (
    <section className="py-11 md:py-14 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeading title={section.headingTitle} subtitle={section.headingSubtitle} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {section.dealCards.map((card) => {
            const href = resolveBannerLinkHref(card) || card.href || '/contact';
            return (
              <Link key={card.id} to={href} className="block rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform">
                <DealTileSurface card={card} />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Best sellers                                                         */
/* ------------------------------------------------------------------ */
function rankMeta(rank: number) {
  if (rank === 1) return { label: 'No. 1 · Top pick', bar: 'bg-[#FFC107] text-[#22303c]', ring: 'ring-2 ring-[#FFC107]/70' };
  if (rank === 2) return { label: 'No. 2', bar: 'bg-slate-200 text-slate-700', ring: 'ring-1 ring-slate-200' };
  if (rank === 3) return { label: 'No. 3', bar: 'bg-orange-100 text-orange-800', ring: 'ring-1 ring-orange-200' };
  return { label: `No. ${rank}`, bar: 'bg-[#E0F2FE] text-[#0284C7]', ring: 'ring-1 ring-[#E0F2FE]' };
}

function BestSellers({ section, products }: { section: CoolDealsBestSellersSection; products: Product[] }) {
  const { tags: tagCatalog } = useProductTags();
  const list = useMemo(
    () =>
      pickProducts(products, {
        source: section.source,
        productIds: section.productIds,
        limit: section.limit || 5,
      }),
    [products, section]
  );
  if (!list.length) return null;

  const hps = section.productHps ?? {};
  const [top, ...rest] = list;
  const topHp = resolveProductHp(top, hps[top.id]);
  const topPrices = displayPricesForHp(top, topHp);
  const topCornerTags = resolveProductCornerTags(top, tagCatalog);

  const renderCornerTags = (product: Product, hp?: string, compact?: boolean) => {
    const tags = resolveProductCornerTags(product, tagCatalog);
    if (!tags.length) return null;
    return (
      <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-1' : 'mb-2 justify-center sm:justify-start'}`}>
        {tags.map((tag) => {
          const label = formatCornerTagLabel(product, tag, hp);
          if (!label) return null;
          const variant = cornerTagVariant(tag);
          const bg = cornerTagBgColor(tag);
          return (
            <CornerTag
              key={tag.id}
              size={compact ? 'card' : 'detail'}
              variant={variant}
              label={label}
              color={variant === 'outline' ? bg : cornerTagTextColor(tag)}
              bgColor={
                variant === 'outline'
                  ? bg === '#EA580C' || bg === '#EF4444'
                    ? '#0EA5E9'
                    : bg
                  : bg
              }
            />
          );
        })}
      </div>
    );
  };

  const formatPriceBlock = (
    product: Product,
    prices: ReturnType<typeof getProductDisplayPrices>,
    opts: { saleSize?: string; align?: 'left' | 'right' }
  ) => {
    const hasDeal =
      prices.hasDiscount || (prices.saleEnd > 0 && prices.saleEnd < prices.listEnd);
    const saleLabel =
      prices.saleStart > 0
        ? prices.saleStart === prices.saleEnd
          ? peso(prices.saleStart)
          : `${peso(prices.saleStart)} – ${peso(prices.saleEnd)}`
        : prices.listStart > 0
          ? prices.listStart === prices.listEnd
            ? peso(prices.listStart)
            : `${peso(prices.listStart)} – ${peso(prices.listEnd)}`
          : null;
    const listLabel =
      prices.listStart === prices.listEnd
        ? peso(prices.listStart)
        : `${peso(prices.listStart)} – ${peso(prices.listEnd)}`;
    const align = opts.align === 'right' ? 'text-right' : '';
    const saleColor = getPriceColor(product.tier, productHasPromos(product));

    return (
      <div className={align}>
        {hasDeal && prices.listStart > 0 && (
          <div className="text-[11px] sm:text-xs text-gray-400 line-through leading-tight">
            {listLabel}
          </div>
        )}
        <div
          className={`font-black tabular-nums leading-tight ${opts.saleSize ?? ''}`}
          style={{ color: saleColor }}
        >
          {saleLabel ?? 'Ask for price'}
        </div>
      </div>
    );
  };

  return (
    <section className="py-11 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#EF4444] font-extrabold text-xs tracking-[0.16em]">
              <Flame size={14} className="fill-[#EF4444]" /> {section.eyebrow}
            </div>
            <h2 className="font-black text-2xl md:text-[30px] mt-1.5 text-[#0EA5E9]">
              {section.headingTitle}
            </h2>
          </div>
          <Link to={section.seeAllHref || '/products'} className="text-[#0EA5E9] font-bold text-sm hover:underline">
            See full ranking →
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-4 md:gap-5 items-stretch">
          {/* #1 featured */}
          <Link
            to={productDetailHref(top.id, topHp)}
            className={`group bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:shadow-md transition-all ${rankMeta(1).ring}`}
          >
            <div className={`px-4 py-2.5 text-xs font-extrabold tracking-wide uppercase ${rankMeta(1).bar}`}>
              {rankMeta(1).label}
            </div>
            <div className="p-5 flex flex-col sm:flex-row gap-5 items-center">
              <div className="w-full sm:w-[46%] h-44 rounded-xl bg-[#F4F8FC] overflow-hidden shrink-0">
                <ImageWithFallback
                  src={top.image}
                  alt={top.model}
                  className="h-full w-full object-contain p-3 group-hover:scale-[1.03] transition-transform"
                />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                {topCornerTags.length > 0 && renderCornerTags(top, topHp)}
                <div className="h-6 mb-1.5 flex items-center justify-center sm:justify-start">
                  <BrandMark brand={top.brand} className="h-5 w-auto max-w-[100px] object-contain" />
                </div>
                <div className="font-bold text-lg md:text-xl text-[#1E2A38] mt-1 leading-snug">
                  {productTitleWithHp(top, topHp)}
                </div>
                {topHp && (
                  <div className="mt-1 inline-flex rounded-full border border-[#BAE6FD] bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-bold text-[#0369A1]">
                    {topHp}
                  </div>
                )}
                <div className="mt-3 inline-flex flex-col items-center sm:items-start">
                  {formatPriceBlock(top, topPrices, {
                    saleSize: 'text-2xl md:text-3xl',
                  })}
                </div>
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3 text-xs font-semibold text-[#516171]">
                  <span>★ {top.rating > 0 ? top.rating.toFixed(1) : 'New'}</span>
                  <span>·</span>
                  <span>{top.reviews > 0 ? `${top.reviews}+ sold` : 'Trending this week'}</span>
                </div>
              </div>
            </div>
          </Link>

          {/* #2–N ranked list */}
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 text-xs font-extrabold tracking-wide uppercase bg-[#E0F2FE] text-[#0284C7]">
              Rest of the ranking
            </div>
            <ul className="divide-y divide-gray-100 flex-1">
              {(rest.length ? rest : []).map((p, idx) => {
                const rank = idx + 2;
                const meta = rankMeta(rank);
                const hp = resolveProductHp(p, hps[p.id]);
                const prices = displayPricesForHp(p, hp);
                return (
                  <li key={p.id}>
                    <Link
                      to={productDetailHref(p.id, hp)}
                      className="flex items-center gap-3 px-3.5 py-3 hover:bg-[#F8FBFE] transition-colors"
                    >
                      <span
                        className={`w-9 h-9 rounded-full grid place-items-center text-sm font-black shrink-0 ${meta.bar}`}
                      >
                        {rank}
                      </span>
                      <div className="w-14 h-14 rounded-lg bg-[#F4F8FC] overflow-hidden shrink-0">
                        <ImageWithFallback src={p.image} alt={p.model} className="h-full w-full object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-4 mb-0.5 flex items-center">
                          <BrandMark brand={p.brand} className="h-3.5 w-auto max-w-[72px] object-contain object-left" />
                        </div>
                        <div className="text-sm font-semibold text-[#1E2A38] truncate">
                          {productTitleWithHp(p, hp)}
                        </div>
                        {renderCornerTags(p, hp, true)}
                        <div className="text-[11px] text-[#516171] mt-0.5">
                          {hp ? `${hp} · ` : ''}
                          ★ {p.rating > 0 ? p.rating.toFixed(1) : 'New'}
                          {p.reviews > 0 ? ` · ${p.reviews}+ sold` : ''}
                        </div>
                      </div>
                      {formatPriceBlock(p, prices, {
                        saleSize: 'text-sm sm:text-base',
                        align: 'right',
                      })}
                    </Link>
                  </li>
                );
              })}
              {!rest.length && (
                <li className="px-4 py-8 text-sm text-center text-gray-400">More bestsellers coming soon</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Flash deals                                                          */
/* ------------------------------------------------------------------ */
function FlashDeals({ section, products }: { section: CoolDealsFlashDealsSection; products: Product[] }) {
  const { d, h, m, s, totalMs, hasDeadline, pad } = useDeadlineCountdown(section.endsAt);
  const deals = useMemo(
    () =>
      pickProducts(products, {
        source: section.source,
        productIds: section.productIds,
        limit: section.limit || 8,
        preferDeal: true,
      }),
    [products, section]
  );
  if (!deals.length) return null;

  const expired = hasDeadline && totalMs <= 0;
  const urgent =
    !expired &&
    isCountdownUrgent(totalMs, {
      thresholdHours: section.urgencyThresholdHours,
      autoUrgent: section.blinkWhenUrgent !== false,
      forceUrgent: section.forceBlink === true,
    });
  const showTimer = section.showCountdown && !expired;

  const Seg = ({ v }: { v: string }) => (
    <span
      className={`text-white rounded-lg px-2.5 py-1.5 text-sm font-extrabold tabular-nums ${
        urgent ? 'bg-[#ff1a1a]' : 'bg-[#0EA5E9]'
      }`}
      style={{ fontFamily: 'Archivo, sans-serif' }}
    >
      {v}
    </span>
  );
  const colon = <span className={`font-extrabold ${urgent ? 'text-[#ff1a1a]' : ''}`}>:</span>;

  return (
    <section id="flash-deals" className="px-4 pb-11">
      <div className="max-w-7xl mx-auto">
        <div
          className={`rounded-[20px] px-6 py-5 flex items-center justify-between gap-4 flex-wrap mb-5 border ${
            urgent
              ? 'bg-gradient-to-r from-[#FEF2F2] to-white border-[#FECACA]'
              : 'bg-gradient-to-r from-[#F0F9FF] to-white border-[#BAE6FD]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <span
              className={`w-[46px] h-[46px] rounded-[13px] grid place-items-center text-white shrink-0 ${
                urgent ? 'bg-[#ff1a1a]' : 'bg-[#0EA5E9]'
              }`}
            >
              <Zap size={24} fill="currentColor" />
            </span>
            <div>
              <div className="font-black text-[26px] text-[#1E2A38]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                {section.headingTitle}
              </div>
              <div className="text-[#516171] text-[13px]">{section.headingSubtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {showTimer && (
              <>
                {urgent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ff1a1a] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
                    <Zap size={12} fill="currentColor" /> Ending soon
                  </span>
                )}
                <span className="text-xs font-bold inline-flex items-center gap-1 text-[#516171]">
                  <Clock size={14} /> Ends in
                </span>
                <div className="flex items-center gap-2.5">
                  {d > 0 && (
                    <>
                      <Seg v={pad(d)} />
                      {colon}
                    </>
                  )}
                  <Seg v={h} />
                  {colon}
                  <Seg v={m} />
                  {colon}
                  <Seg v={s} />
                </div>
              </>
            )}
            <Link to={section.seeAllHref || '/products'} className="text-[#0EA5E9] font-bold text-[13px] ml-2 hover:underline">
              See all →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {deals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Finder                                                               */
/* ------------------------------------------------------------------ */
type RoomKey = 'small' | 'medium' | 'large' | 'xl';

const ROOM_RECS: Record<
  RoomKey,
  {
    name: string;
    hp: string;
    blurb: string;
    /** Catalog list with HP (or category) pre-filtered */
    matchesTo: string;
    imageUrl: string;
  }
> = {
  small: {
    name: 'Window / 1.0HP Split',
    hp: '1.0HP',
    blurb: 'Perfect for bedrooms & small rooms up to 12 sqm.',
    matchesTo: '/products?hp=1HP',
    imageUrl: hamelAssets.aircon.wallSplitPanasonic,
  },
  medium: {
    name: '1.5HP Inverter Split',
    hp: '1.5HP',
    blurb: 'Ideal for standard bedrooms & offices, 13–20 sqm.',
    matchesTo: '/products?hp=1.5HP',
    imageUrl: hamelAssets.aircon.wallSplitDaikinAmihan,
  },
  large: {
    name: '2.0HP Inverter Split',
    hp: '2.0HP',
    blurb: 'Cools living rooms & large spaces, 21–30 sqm.',
    matchesTo: '/products?hp=2HP',
    imageUrl: hamelAssets.aircon.wallSplitDaikinDsmart,
  },
  xl: {
    name: 'Package / Commercial Type',
    hp: '3.0HP+',
    blurb: 'For shops, halls & commercial spaces. We’ll size it for you.',
    matchesTo: '/products?category=Package%20Type',
    imageUrl: hamelAssets.aircon.floorStanding,
  },
};

const FINDER_STEPS: {
  key: string;
  label: string;
  title: string;
  opts: { v: string; t: string; s: string; icon: ReactNode }[];
}[] = [
  {
    key: 'room',
    label: 'Step 1 of 3',
    title: 'How big is the room?',
    opts: [
      { v: 'small', t: 'Small bedroom', s: 'Up to 12 sqm', icon: <BedDouble size={18} /> },
      { v: 'medium', t: 'Standard room / office', s: '13–20 sqm', icon: <DoorOpen size={18} /> },
      { v: 'large', t: 'Living room', s: '21–30 sqm', icon: <Sofa size={18} /> },
      { v: 'xl', t: 'Commercial space', s: 'Shop, hall, 30+ sqm', icon: <Building2 size={18} /> },
    ],
  },
  {
    key: 'budget',
    label: 'Step 2 of 3',
    title: 'What’s your budget?',
    opts: [
      { v: 'value', t: 'Best value', s: 'Under ₱20,000', icon: <Gauge size={18} /> },
      { v: 'mid', t: 'Balanced', s: '₱20,000 – ₱30,000', icon: <Gauge size={18} /> },
      { v: 'premium', t: 'Premium / most efficient', s: '₱30,000+', icon: <Award size={18} /> },
    ],
  },
  {
    key: 'use',
    label: 'Step 3 of 3',
    title: 'What matters most?',
    opts: [
      { v: 'bill', t: 'Lowest electric bill', s: 'Max efficiency inverter', icon: <Gauge size={18} /> },
      { v: 'fast', t: 'Fast, strong cooling', s: 'Powerful airflow', icon: <Snowflake size={18} /> },
      { v: 'quiet', t: 'Quiet operation', s: 'Bedroom-friendly', icon: <VolumeX size={18} /> },
    ],
  },
];

function AirconFinder({ section }: { section: CoolDealsFinderSection }) {
  const navigate = useNavigate();
  const { products } = useCatalog();
  const [stepIdx, setStepIdx] = useState(0);
  const [room, setRoom] = useState<RoomKey | null>(null);
  const done = stepIdx >= FINDER_STEPS.length;
  const rec = ROOM_RECS[room ?? 'medium'];

  const matchedProduct = useMemo(() => {
    if (room === 'xl') {
      return (
        products.find((p) => /package|commercial|floor/i.test(`${p.category} ${p.model}`)) ??
        products.find((p) => productMatchesHp(p, '3HP') || productMatchesHp(p, '3.0HP')) ??
        null
      );
    }
    return products.find((p) => productMatchesHp(p, rec.hp)) ?? null;
  }, [products, room, rec.hp]);

  const viewHref = matchedProduct ? `/product/${matchedProduct.id}` : rec.matchesTo;
  const cardName = matchedProduct
    ? `${matchedProduct.brand} ${matchedProduct.model}`
    : rec.name;
  const cardImage = matchedProduct?.images?.[0] || matchedProduct?.image || rec.imageUrl;

  return (
    <section id="finder" className="px-4 pb-11">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#0284C7] to-[#0EA5E9] rounded-3xl p-7 md:p-11 grid md:grid-cols-2 gap-8 md:gap-10 items-center shadow-lg">
          <div className="text-white">
            <div className="text-[#FFC107] font-extrabold text-xs tracking-[0.16em]">
              {section.eyebrow}
            </div>
            <h2 className="font-black text-3xl md:text-[38px] leading-[1.05] mt-3 mb-3.5">
              {section.title}
            </h2>
            <p className="text-blue-100 text-base leading-relaxed m-0">{section.subtitle}</p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-[18px] p-5 md:p-6 backdrop-blur-sm">
            {!done ? (
              <>
                <div className="flex gap-2 mb-4">
                  {FINDER_STEPS.map((_, i) => (
                    <span key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/20">
                      <span className={`block h-full ${i <= stepIdx ? 'bg-[#FFC107]' : 'bg-transparent'}`} />
                    </span>
                  ))}
                </div>
                <div className="text-[#FFC107] font-extrabold text-xs tracking-[0.1em]">
                  {FINDER_STEPS[stepIdx].label}
                </div>
                <div className="text-white font-extrabold text-xl mt-1 mb-4">
                  {FINDER_STEPS[stepIdx].title}
                </div>
                <div className="flex flex-col gap-2.5">
                  {FINDER_STEPS[stepIdx].opts.map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => {
                        if (FINDER_STEPS[stepIdx].key === 'room') setRoom(o.v as RoomKey);
                        setStepIdx((i) => i + 1);
                      }}
                      className="flex items-center gap-3.5 px-4 py-3.5 rounded-[13px] bg-white/10 border border-white/15 text-left hover:bg-white/20"
                    >
                      <span className="w-[38px] h-[38px] rounded-[10px] bg-[#FFC107]/20 text-[#FFC107] grid place-items-center shrink-0">
                        {o.icon}
                      </span>
                      <span className="flex-1">
                        <span className="block text-white font-bold text-[15px]">{o.t}</span>
                        <span className="block text-blue-100 text-xs">{o.s}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {stepIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => setStepIdx((i) => i - 1)}
                    className="mt-3.5 text-blue-100 text-[13px] font-bold hover:text-white"
                  >
                    ← Back
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="bg-white rounded-[13px] p-4 flex items-center gap-3.5">
                  <div className="w-[54px] h-[54px] rounded-[11px] bg-[#F4F8FC] shrink-0 overflow-hidden">
                    <ImageWithFallback
                      src={cardImage}
                      alt={cardName}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#16A34A] font-extrabold">✓ RECOMMENDED FOR YOU</div>
                    <div className="font-extrabold text-base text-[#0EA5E9]">
                      {cardName} · {rec.hp}
                    </div>
                    <div className="text-gray-500 text-xs">{rec.blurb}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(viewHref)}
                    className="bg-[#FFC107] text-[#22303c] font-extrabold text-[13px] px-4 py-2.5 rounded-[10px] shrink-0"
                  >
                    View
                  </button>
                </div>
                <div className="flex gap-2.5 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStepIdx(0);
                      setRoom(null);
                    }}
                    className="flex-1 text-center border border-white/40 text-white font-bold text-[13px] py-2.5 rounded-[10px]"
                  >
                    Start over
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(rec.matchesTo)}
                    className="flex-1 text-center bg-[#FFC107] text-[#22303c] font-extrabold text-[13px] py-2.5 rounded-[10px]"
                  >
                    See all matches
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Financing                                                            */
/* ------------------------------------------------------------------ */
type FinanceOption = {
  id: string;
  kind: 'unit' | 'bundle';
  name: string;
  brand?: string;
  price: number;
  image?: string;
};

function Financing({
  section,
  products,
  bundles,
  onContact,
}: {
  section: CoolDealsFinancingSection;
  products: Product[];
  bundles: CoolDealsBundleItem[];
  onContact: () => void;
}) {
  const [months, setMonths] = useState(section.defaultMonths || 24);
  const [selectedId, setSelectedId] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const options = useMemo<FinanceOption[]>(() => {
    const units: FinanceOption[] = activeProducts(products).map((p) => {
      const prices = getProductDisplayPrices(p);
      const price = prices.saleStart > 0 ? prices.saleStart : prices.listStart || p.priceStart;
      return {
        id: `unit:${p.id}`,
        kind: 'unit',
        name: `${p.brand} ${p.model}`,
        brand: p.brand,
        price,
        image: p.image,
      };
    });
    const bundleOpts: FinanceOption[] = bundles.map((b) => ({
      id: `bundle:${b.id}`,
      kind: 'bundle',
      name: b.name,
      price: b.priceNow,
      image: b.imageUrl,
    }));
    return [...units, ...bundleOpts];
  }, [products, bundles]);

  useEffect(() => {
    if (!selectedId && options.length) setSelectedId(options[0].id);
  }, [options, selectedId]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.brand && o.brand.toLowerCase().includes(q)) ||
        o.kind.includes(q)
    );
  }, [options, query]);

  const model = options.find((o) => o.id === selectedId) ?? options[0];
  const monthly = model ? Math.round(model.price / Math.max(1, months)) : 0;

  return (
    <section className="px-4 pb-11">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-8 md:p-10 shadow-[0_12px_30px_-20px_rgba(14,165,233,0.25)] border border-[#E8EEF4]">
          <div>
            <div className="inline-flex items-center gap-2 text-[#16A34A] font-extrabold text-xs tracking-[0.14em]">
              <span className="w-8 h-8 rounded-lg bg-[#FFC107] text-[#22303c] grid place-items-center shadow-sm">
                <CreditCard size={16} strokeWidth={2.5} />
              </span>
              {section.eyebrow}
            </div>
            <h2 className="font-black text-3xl md:text-[34px] leading-[1.05] mt-3 mb-3.5 text-[#0EA5E9]">
              {section.title}
            </h2>
            <p className="text-[#516171] text-base leading-relaxed mb-4">{section.body}</p>
            <div className="flex flex-wrap gap-4 text-[13px] font-bold text-[#334]">
              {section.bullets.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5">
                  <Check size={14} className="text-[#16A34A]" /> {b}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] rounded-[18px] p-6 border border-[#BAE6FD]">
            <label className="text-xs font-extrabold text-[#516171] tracking-wide">CHOOSE A UNIT OR BUNDLE</label>
            <div className="relative mt-2 mb-4" ref={rootRef}>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full px-3.5 py-3 rounded-[11px] border border-[#BAE6FD] bg-white text-sm font-semibold text-[#1E2A38] text-left flex items-center gap-3"
              >
                {model?.image ? (
                  <ImageWithFallback src={model.image} alt="" className="w-9 h-9 rounded-md object-contain bg-[#F4F8FC] shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-md bg-[#F4F8FC] shrink-0" />
                )}
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{model?.name || 'Select…'}</span>
                  {model && (
                    <span className="block text-[11px] font-medium text-[#0EA5E9]">
                      {model.kind === 'bundle' ? 'Bundle' : 'Unit'} · {peso(model.price)}
                    </span>
                  )}
                </span>
                <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
              </button>
              {open && (
                <div className="absolute z-30 mt-1 w-full rounded-xl border border-[#BAE6FD] bg-white shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      autoFocus
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search units or bundles…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {filtered.length === 0 && (
                      <div className="px-3 py-6 text-sm text-center text-gray-400">No matches</div>
                    )}
                    {filtered.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(o.id);
                          setOpen(false);
                          setQuery('');
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 hover:bg-[#E0F2FE] ${
                          o.id === selectedId ? 'bg-[#F0F9FF]' : ''
                        }`}
                      >
                        {o.image ? (
                          <ImageWithFallback src={o.image} alt="" className="w-9 h-9 rounded-md object-contain bg-[#F4F8FC] shrink-0" />
                        ) : (
                          <span className="w-9 h-9 rounded-md bg-[#F4F8FC] shrink-0" />
                        )}
                        <span className="flex-1 min-w-0">
                          <span className="block truncate font-semibold text-[#1E2A38]">{o.name}</span>
                          <span className="flex items-center gap-2 text-[11px] text-[#516171]">
                            {o.brand && <BrandMark brand={o.brand} className="h-3.5 w-auto max-w-[64px] object-contain" />}
                            <span className="uppercase tracking-wide font-bold text-[#0EA5E9]">
                              {o.kind === 'bundle' ? 'Bundle' : 'Unit'}
                            </span>
                          </span>
                        </span>
                        <span className="font-bold text-[#0EA5E9] tabular-nums shrink-0">{peso(o.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline">
              <label className="text-xs font-extrabold text-[#516171] tracking-wide">TERM</label>
              <span className="font-extrabold text-[#0EA5E9]">{months} months</span>
            </div>
            <input
              type="range"
              min={section.minMonths || 3}
              max={section.maxMonths || 36}
              step={section.stepMonths || 3}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full my-2.5 accent-[#0EA5E9]"
            />
            <div className="bg-white rounded-[14px] p-5 text-center border border-[#BAE6FD]">
              <div className="text-xs text-[#516171] font-bold">Your estimated payment</div>
              <div className="font-black text-[44px] text-[#0EA5E9] leading-tight">
                {peso(monthly)}
                <span className="text-lg text-[#516171]">/mo</span>
              </div>
              <div className="text-xs text-[#516171]">
                {model?.name} · {model ? peso(model.price) : '—'} total · {months} mos · 0% interest
              </div>
            </div>
            <button
              type="button"
              onClick={onContact}
              className="w-full mt-3.5 bg-[#FFC107] text-[#22303c] font-extrabold text-[15px] py-3 rounded-xl hover:opacity-95 inline-flex items-center justify-center gap-2"
            >
              <CreditCard size={16} /> {section.ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Bundles                                                              */
/* ------------------------------------------------------------------ */
function Bundles({ section, onContact }: { section: CoolDealsBundlesSection; onContact: () => void }) {
  if (!section.items?.length) return null;
  return (
    <section className="px-4 pb-11 text-center">
      <div className="max-w-7xl mx-auto">
        <SectionHeading eyebrow={section.eyebrow} title={section.headingTitle} subtitle={section.headingSubtitle} />
        <div className="grid md:grid-cols-3 gap-5 text-left items-start">
          {section.items.map((b) => {
            const save = Math.max(0, b.priceWas - b.priceNow);
            return (
              <div
                key={b.id}
                className={`relative bg-white rounded-[20px] p-6 shadow-[0_12px_30px_-18px_rgba(14,58,82,0.5)] ${
                  b.featured ? 'border-2 border-[#FFC107]' : 'border border-[#E8EEF4]'
                }`}
              >
                {(b.featured || b.badge) && (
                  <div
                    className="absolute -top-3 right-5 bg-[#FFC107] text-[#22303c] font-extrabold text-xs px-3.5 py-1.5 rounded-full"
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                  >
                    ★ {b.badge || 'MOST POPULAR'}
                  </div>
                )}
                <div className="font-black text-[22px] text-[#1E2A38]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  {b.name}
                </div>
                <div className="text-[#516171] text-[13px] mb-4">{b.sub}</div>
                <div className="h-[150px] rounded-[13px] bg-[#F7FAFD] overflow-hidden mb-4">
                  <ImageWithFallback src={b.imageUrl} alt={b.name} className="h-full w-full object-cover" />
                </div>
                <ul className="flex flex-col gap-2.5 mb-4">
                  {b.includes.map((inc) => (
                    <li key={inc} className="flex items-center gap-2.5 text-[13px] text-[#334] font-semibold">
                      <span className="w-5 h-5 rounded-full bg-[#DCFCE7] text-[#16A34A] grid place-items-center shrink-0 text-xs font-black">
                        ✓
                      </span>
                      {inc}
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline gap-2">
                  <span className="font-black text-[30px] text-[#EF4444]" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    {peso(b.priceNow)}
                  </span>
                  {b.priceWas > b.priceNow && (
                    <span className="text-[#94a3b8] line-through font-semibold">{peso(b.priceWas)}</span>
                  )}
                </div>
                {save > 0 && <div className="text-[#16A34A] font-extrabold text-[13px] mb-4">You save {peso(save)}</div>}
                <button
                  type="button"
                  onClick={onContact}
                  className={`w-full text-center font-extrabold text-[15px] py-3.5 rounded-xl ${
                    b.featured ? 'bg-[#FFC107] text-[#22303c]' : 'bg-[#0EA5E9] text-white'
                  }`}
                  style={{ fontFamily: 'Archivo, sans-serif' }}
                >
                  🎁 {b.ctaLabel || 'Get this bundle'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Brands / recommended / trust / cta / matrix / stats                  */
/* ------------------------------------------------------------------ */
const DEFAULT_BRANDS = [
  { name: 'Panasonic', src: hamelBrandLogos.Panasonic },
  { name: 'Daikin', src: hamelBrandLogos.Daikin },
  { name: 'Midea', src: hamelBrandLogos.Midea },
  { name: 'LG', src: hamelBrandLogos.LG },
  { name: 'Samsung', src: hamelBrandLogos.Samsung },
  { name: 'Carrier', src: hamelBrandLogos.Carrier },
  { name: 'Kolin', src: '' },
  { name: 'Condura', src: '' },
];

function Brands({ section }: { section: CoolDealsBrandsSection }) {
  const names = section.brandNames?.filter(Boolean);
  const brands = names?.length
    ? names.map((n) => ({ name: n, src: DEFAULT_BRANDS.find((b) => b.name.toLowerCase() === n.toLowerCase())?.src || '' }))
    : DEFAULT_BRANDS;

  return (
    <section className="px-4 pb-11 text-center">
      <div className="max-w-7xl mx-auto">
        <div
          className="text-[#0EA5E9] font-extrabold text-xs tracking-[0.16em]"
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          {section.eyebrow}
        </div>
        <h2 className="font-black text-[28px] mt-2 mb-5 text-[#0EA5E9]">
          {section.headingTitle}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {brands.map((br) => (
            <Link
              key={br.name}
              to={`/products?brand=${encodeURIComponent(br.name)}`}
              className="bg-white rounded-[13px] px-2.5 py-5 font-extrabold text-sm text-[#0EA5E9] shadow-[0_6px_16px_-12px_rgba(14,165,233,0.25)] border border-[#E8EEF4] hover:-translate-y-1 transition-transform grid place-items-center min-h-[72px]"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              {br.src ? (
                <ImageWithFallback src={br.src} alt={br.name} className="h-8 w-auto object-contain" />
              ) : (
                br.name
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Recommended({ section, products }: { section: CoolDealsRecommendedSection; products: Product[] }) {
  const list = useMemo(
    () =>
      pickProducts(products, {
        source: section.source,
        productIds: section.productIds,
        limit: section.limit || 4,
      }),
    [products, section]
  );
  if (!list.length) return null;

  return (
    <section className="px-4 pb-11">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0EA5E9]">Picked for you</div>
            <h2 className="font-black text-2xl md:text-[26px] mt-1 text-[#0EA5E9]">{section.headingTitle}</h2>
          </div>
          <Link to="/products" className="text-sm font-bold text-[#0EA5E9] hover:underline inline-flex items-center gap-1">
            Browse all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {list.map((p) => {
            const prices = getProductDisplayPrices(p);
            const price = prices.saleStart > 0 ? prices.saleStart : prices.listStart;
            return (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className="relative h-36 bg-gradient-to-b from-[#F0F9FF] to-[#F8FBFE] overflow-hidden">
                  <ImageWithFallback
                    src={p.image}
                    alt={p.model}
                    className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform"
                  />
                  {prices.hasDiscount && (
                    <span className="absolute top-2.5 left-2.5 bg-[#EF4444] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                      SALE
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="h-6 mb-2 flex items-center">
                    <BrandMark brand={p.brand} className="h-5 w-auto max-w-[90px] object-contain object-left" />
                  </div>
                  <div className="font-bold text-sm text-[#1E2A38] leading-snug line-clamp-2 min-h-[2.5rem]">
                    {p.model}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-black text-lg text-[#EF4444]">
                      {price > 0 ? peso(price) : 'Ask for price'}
                    </span>
                    {prices.hasDiscount && prices.listStart > price && (
                      <span className="text-xs text-gray-400 line-through">{peso(prices.listStart)}</span>
                    )}
                  </div>
                  <div className="mt-3 text-xs font-semibold text-[#0EA5E9] inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                    View details <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const TRUST_ICON_MAP: Record<string, ReactNode> = {
  award: <Award size={18} />,
  wrench: <Wrench size={18} />,
  shield: <Shield size={18} />,
  package: <CreditCard size={18} />,
  headset: <Headset size={18} />,
};

function TrustBar({ section }: { section: CoolDealsTrustBarSection }) {
  const items = section.items?.length
    ? section.items
    : [
        { id: '1', title: '100% Authentic', sub: 'Genuine, brand-new units', icon: 'award' },
        { id: '2', title: 'Pro Installation', sub: 'Certified technicians', icon: 'wrench' },
        { id: '3', title: 'Warranty Coverage', sub: 'Official manufacturer', icon: 'shield' },
        { id: '4', title: 'Flexible Payment', sub: '0% up to 36 months', icon: 'package' },
        { id: '5', title: 'After-Sales Support', sub: 'We stay with you', icon: 'headset' },
      ];

  return (
    <section className="bg-white border-t border-[#E5E7EB] py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-4">
        {items.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 min-w-[140px]">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-[#E0F2FE] text-[#0EA5E9] grid place-items-center shrink-0">
              {TRUST_ICON_MAP[t.icon] || <Award size={18} />}
            </div>
            <div>
              <div className="font-extrabold text-[13px] text-[#1E2A38]">{t.title}</div>
              <div className="text-[#516171] text-[11px]">{t.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaSection({ section, onContact }: { section: CoolDealsCtaSection; onContact: () => void }) {
  const { telHref } = useStoreSettings();
  return (
    <section className="bg-[#0EA5E9] py-10 md:py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <ImageWithFallback
          src={hamelAssets.mascot.cta}
          alt="Hamel mascot"
          className="w-24 md:w-28 h-auto shrink-0 object-contain"
        />
        <div className="text-white flex-1 text-center md:text-left">
          <div className="font-black text-2xl md:text-[26px]">{section.title}</div>
          <div className="text-blue-100 text-sm md:text-base mt-1.5 max-w-lg">{section.subtitle}</div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={telHref}
            className="inline-flex items-center gap-2 bg-white text-[#0EA5E9] font-semibold text-sm px-5 py-3 rounded-lg hover:opacity-90"
          >
            <Phone size={16} /> Call Us Now
          </a>
          <button
            type="button"
            onClick={onContact}
            className="inline-flex items-center gap-2 border-2 border-white text-white font-semibold text-sm px-5 py-3 rounded-lg hover:bg-white/10"
          >
            <MessageCircle size={16} /> Message Us
          </button>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-[#FFC107] text-[#22303c] font-bold text-sm px-5 py-3 rounded-lg hover:opacity-90"
          >
            Book a Free Site Survey
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Product matrix                                                       */
/* ------------------------------------------------------------------ */
function ProductMatrix({ section }: { section: CoolDealsProductMatrixSection }) {
  return (
    <section className="py-11 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeading title={section.headingTitle} subtitle={section.headingSubtitle} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {section.columns.map((col) => (
            <div key={col.id} className="rounded-2xl border border-[#E8EEF4] overflow-hidden bg-[#f8fafc]">
              <div className="h-36 bg-white">
                <ImageWithFallback src={col.imageUrl} alt={col.name} className="h-full w-full object-contain p-3" />
              </div>
              <div className="p-4">
                <div className="font-extrabold text-[#1E2A38]">{col.name}</div>
                <div className="text-[13px] text-[#516171] mb-3">{col.sub}</div>
                <ul className="space-y-1.5">
                  {col.perks.map((p) => (
                    <li key={p} className="text-[12px] text-[#334] flex gap-2">
                      <Check size={14} className="text-[#16A34A] shrink-0 mt-0.5" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        {section.footnote && <p className="text-center text-xs text-[#516171] mt-6">{section.footnote}</p>}
      </div>
    </section>
  );
}

function StatsBrands({ section }: { section: CoolDealsStatsBrandsSection }) {
  return (
    <section className="py-11 px-4 bg-[#F4F8FC]">
      <div className="max-w-7xl mx-auto text-center">
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
          {(section.stats || []).map((s) => (
            <div key={s.id}>
              <div className="text-2xl md:text-4xl font-black text-[#0EA5E9] tabular-nums">{s.value}</div>
              <div className="text-xs text-[#516171] mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">{section.brandsLabel}</p>
        <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
          {DEFAULT_BRANDS.filter((b) => b.src).map((brand) => (
            <ImageWithFallback
              key={brand.name}
              src={brand.src}
              alt={brand.name}
              className="h-9 md:h-11 w-auto object-contain opacity-80"
            />
          ))}
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm bg-[#0EA5E9] text-white"
        >
          Shop All Aircon Units <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function renderSection(
  section: CoolDealsSection,
  products: Product[],
  onContact: () => void,
  bundles: CoolDealsBundleItem[]
): ReactNode {
  if (!section.enabled) return null;
  switch (section.type) {
    case 'promo-strip':
      // Rendered at page top (above banner) — skip here to avoid duplicate
      return null;
    case 'service-sticky':
      // Fixed bottom bar — rendered separately
      return null;
    case 'deal-of-day':
      return <DealOfDayHero key={section.id} section={section} products={products} />;
    case 'card-grid':
      return section.variant === 'voucher' ? (
        <ClaimableVouchers key={section.id} section={section} />
      ) : (
        <DealTiles key={section.id} section={section} />
      );
    case 'best-sellers':
      return <BestSellers key={section.id} section={section} products={products} />;
    case 'flash-deals':
      return <FlashDeals key={section.id} section={section} products={products} />;
    case 'finder':
      return <AirconFinder key={section.id} section={section} />;
    case 'financing':
      return (
        <Financing
          key={section.id}
          section={section}
          products={products}
          bundles={bundles}
          onContact={onContact}
        />
      );
    case 'bundles':
      return <Bundles key={section.id} section={section} onContact={onContact} />;
    case 'brands':
      return <Brands key={section.id} section={section} />;
    case 'recommended':
      return <Recommended key={section.id} section={section} products={products} />;
    case 'product-matrix':
      return <ProductMatrix key={section.id} section={section} />;
    case 'trust-bar':
      return <TrustBar key={section.id} section={section} />;
    case 'cta':
      return <CtaSection key={section.id} section={section} onContact={onContact} />;
    case 'stats-brands':
      return <StatsBrands key={section.id} section={section} />;
    default:
      return null;
  }
}

export function CoolDealsPage() {
  useCoolDealsFonts();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const banner = useCoolDealsBanner();
  const page = useCoolDealsPage();
  const { products, loading } = useCatalog();
  usePageLoading(loading, 'cool-deals');

  const onContact = () => setIsContactOpen(true);
  const onBook = () => setIsBookOpen(true);
  const showPhotoBanner = Boolean(banner.bannerImageUrl?.trim());

  const promoStrip = useMemo(() => {
    return page.sections.find(
      (s): s is CoolDealsPromoStripSection => s.type === 'promo-strip' && s.enabled
    );
  }, [page.sections]);

  const serviceSticky = useMemo(() => {
    return page.sections.find(
      (s): s is CoolDealsServiceStickySection => s.type === 'service-sticky' && s.enabled
    );
  }, [page.sections]);

  const bundles = useMemo(() => {
    const sec = page.sections.find((s): s is CoolDealsBundlesSection => s.type === 'bundles');
    return sec?.items ?? [];
  }, [page.sections]);

  return (
    <div className="bg-[#F4F8FC] text-[#1E2A38]">
      {promoStrip && <PromoStrip section={promoStrip} />}
      {showPhotoBanner && <CoolDealsHeroBanner config={banner} />}
      {page.sections.map((section) => renderSection(section, products, onContact, bundles))}
      {serviceSticky && <StickyServiceBar section={serviceSticky} onBook={onBook} />}
      <ContactOptionsModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <BookMaintenanceModal isOpen={isBookOpen} onClose={() => setIsBookOpen(false)} />
    </div>
  );
}
