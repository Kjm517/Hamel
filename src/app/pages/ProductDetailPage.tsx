import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router';
import {
  Star,
  ChevronLeft,
  Truck,
  Wrench,
  ShieldCheck,
  Check,
  Heart,
  Share2,
  GitCompare,
  Copy,
  CheckCheck,
  User,
  BadgeCheck,
} from 'lucide-react';
import { getHpUnitPrice } from '../data/products';
import { brandLogoFor } from '../data/hamelAssets';
import { useCatalog } from '../context/CatalogContext';
import { ConversationalInquiryModal, type InquiryFormData } from '../components/ConversationalInquiryModal';
import { PageBanner } from '../components/PageBanner';
import { PromoChip, CornerTag } from '../components/PromoBadge';
import { SpecialOffersModal } from '../components/SpecialOffersModal';
import { InstallmentChip, InstallmentOptionsModal } from '../components/InstallmentOptionsModal';
import {
  loadInstallmentPlans,
  resolveInstallmentOptionsForPrice,
} from '../data/installment-plans';
import { SelectOrEnterVoucher } from '../components/SelectOrEnterVoucher';
import { computeVouchersDiscount, type StoreVoucher } from '../data/vouchers';
import { WriteReviewModal } from '../components/WriteReviewModal';
import { LoyaltyBadge } from '../components/LoyaltyBadge';
import { PromoCountdownBanner } from '../components/PromoCountdownBanner';
import { ShareProductModal } from '../components/ShareProductModal';
import { CompareLimitModal } from '../components/CompareLimitModal';
import type { InstallmentOption, Product } from '../data/products';
import { useProductTags } from '../context/ProductTagsContext';
import { isStorefrontProduct } from '../lib/catalog-product';
import {
  fetchProductDetail,
  markReviewHelpful,
  type CustomerReview,
} from '../lib/catalog-api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import {
  getDiscountedPrice,
  getPrimaryPromoEntry,
  getProductPromoList,
  getPromoCountdownEndsAt,
  isPromoCountdownActive,
  productHasPromos,
  resolveProductPromos,
} from '../lib/product-promos';
import {
  cornerTagBgColor,
  cornerTagTextColor,
  cornerTagVariant,
  formatCornerTagLabel,
  resolveProductCornerTags,
} from '../lib/product-corner-tags';
import { getPriceColor } from '../lib/product-price-color';
import {
  getCompareIds,
  isInCompare,
  isInWishlist,
  toggleCompare,
  toggleWishlist,
} from '../lib/product-actions';
import { usePageLoading } from '../context/SiteLoadingContext';

function averageRating(reviews: CustomerReview[]): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function ratingDistribution(reviews: CustomerReview[]): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const key = Math.min(5, Math.max(1, Math.round(r.rating)));
    counts[key] += 1;
  }
  return counts;
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading: catalogLoading } = useCatalog();
  const { tags: tagCatalog } = useProductTags();
  const { isAuthenticated } = useCustomerAuth();
  const product = products.find((p) => p.id === id && isStorefrontProduct(p));
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const hpFromUrl = searchParams.get('hp');

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedHP, setSelectedHP] = useState(() => {
    if (!product) return '';
    if (hpFromUrl) {
      const match = product.hp.find((h) => h.toLowerCase() === hpFromUrl.toLowerCase());
      if (match) return match;
      // fuzzy 2HP ↔ 2.0HP
      const want = hpFromUrl.match(/([\d.]+)/)?.[1];
      if (want) {
        const fuzzy = product.hp.find((h) => {
          const n = h.match(/([\d.]+)/)?.[1];
          return n && Number(n) === Number(want);
        });
        if (fuzzy) return fuzzy;
      }
    }
    return product.hp[0] || '';
  });
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryData, setInquiryData] = useState<InquiryFormData | null>(null);
  const [offersOpen, setOffersOpen] = useState(false);
  const [offerFocus, setOfferFocus] = useState(0);
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [appliedVouchers, setAppliedVouchers] = useState<StoreVoucher[]>([]);
  const [wishlisted, setWishlisted] = useState(() => (id ? isInWishlist(id) : false));
  const [comparing, setComparing] = useState(() => (id ? isInCompare(id) : false));
  const [compareLimitOpen, setCompareLimitOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  usePageLoading(catalogLoading || reviewsLoading, `product:${id ?? 'unknown'}`);

  const loadReviews = async (productId: string) => {
    setReviewsLoading(true);
    try {
      const { reviews: remote } = await fetchProductDetail(productId);
      setReviews(Array.isArray(remote) ? remote : []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setReviewsLoading(true);
    void fetchProductDetail(id)
      .then(({ reviews: remote }) => {
        if (cancelled) return;
        setReviews(Array.isArray(remote) ? remote : []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!product) return;
    if (hpFromUrl) {
      const exact = product.hp.find((h) => h.toLowerCase() === hpFromUrl.toLowerCase());
      if (exact) {
        setSelectedHP(exact);
      } else {
        const want = hpFromUrl.match(/([\d.]+)/)?.[1];
        const fuzzy = want
          ? product.hp.find((h) => {
              const n = h.match(/([\d.]+)/)?.[1];
              return n && Number(n) === Number(want);
            })
          : undefined;
        setSelectedHP(fuzzy || product.hp[0] || '');
      }
    } else if (product.hp[0]) {
      setSelectedHP(product.hp[0]);
    }
    if (product.id) {
      setWishlisted(isInWishlist(product.id));
      setComparing(isInCompare(product.id));
    }
  }, [product, hpFromUrl]);

  useEffect(() => {
    if (!product) {
      setInstallmentOptions([]);
      return;
    }
    let cancelled = false;
    const unit = getHpUnitPrice(product, selectedHP || product.hp[0]);
    const discounted = getDiscountedPrice(product, unit, selectedHP || product.hp[0]);
    const refresh = () => {
      void loadInstallmentPlans().then((cfg) => {
        if (!cancelled) {
          setInstallmentOptions(
            resolveInstallmentOptionsForPrice(discounted, product.installmentOptions, cfg)
          );
        }
      });
    };
    refresh();
    window.addEventListener('hamel-installment-plans-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-installment-plans-updated', refresh);
    };
  }, [product, selectedHP]);

  const handleInquiryComplete = (data: InquiryFormData) => {
    setInquiryData(data);
  };

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (reviewSort === 'highest') list.sort((a, b) => b.rating - a.rating);
    else if (reviewSort === 'lowest') list.sort((a, b) => a.rating - b.rating);

    return list;
  }, [reviews, reviewSort]);

  const liveRating = averageRating(reviews);
  const liveCount = reviews.length;
  const dist = ratingDistribution(reviews);

  const handleHelpful = (reviewId: string) => {
    void (async () => {
      try {
        const updated = await markReviewHelpful(reviewId);
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, ...updated } : r))
        );
      } catch {
        // network / conflict — leave UI unchanged
      }
    })();
  };

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Link to="/" className="text-blue-600 hover:underline">
          Return to homepage
        </Link>
      </div>
    );
  }

  const resolvedPromos = resolveProductPromos(product, tagCatalog);
  const cornerTags = resolveProductCornerTags(product, tagCatalog);
  const primaryPromo = getPrimaryPromoEntry(product);
  const promoList = getProductPromoList(product);
  const hasPromos = productHasPromos(product);
  const unitPrice = getHpUnitPrice(product, selectedHP);
  const discountedUnit = getDiscountedPrice(product, unitPrice, selectedHP);
  // Display pricing must reflect the selected HP, not whether another size
  // has a promo configured.
  const hasSelectedHpDiscount = discountedUnit < unitPrice;
  const vouchers = product.vouchers ?? [];
  const brandLogo = brandLogoFor(product.brand);
  const countdownEndsAt = getPromoCountdownEndsAt(product);
  const countdownMessage = (() => {
    const flash = promoList.find((p) => p.badgeType === 'flash-sale' || p.promoEndsAt);
    const until = flash?.validUntil || primaryPromo?.validUntil;
    const label = flash?.label || primaryPromo?.label || 'this promo';
    if (until) return `${label} — ends ${until}`;
    return `Limited-time ${label}. Ends soon!`;
  })();

  const detailBannerConfig = {
    premium: {
      imageUrl: 'https://images.unsplash.com/photo-1628745750110-c8ddcdad2c15?w=1200&h=280&fit=crop',
      overlayColor: 'linear-gradient(to right, rgba(14,165,233,0.93) 0%, rgba(14,165,233,0.6) 60%, transparent 100%)',
      tag: 'Premium Quality',
      title: `${product.brand} — Engineered for Philippine Homes`,
      subtitle: 'Built for tropical climates with 5-star energy efficiency and inverter technology.',
    },
    budget: {
      imageUrl: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=1200&h=280&fit=crop',
      overlayColor: 'linear-gradient(to right, rgba(217,119,6,0.93) 0%, rgba(251,191,36,0.65) 60%, transparent 100%)',
      tag: 'Best Value',
      title: `${product.brand} — Reliable Cooling at a Great Price`,
      subtitle: 'Quality performance at an affordable price. Perfect for every Filipino home.',
    },
    'flash-sale': {
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=280&fit=crop',
      overlayColor: 'linear-gradient(to right, rgba(234,88,12,0.93) 0%, rgba(249,115,22,0.65) 60%, transparent 100%)',
      tag: '⚡ Flash Deal',
      title: `${primaryPromo?.label || 'Limited Offer'} — ${product.brand} ${product.model}`,
      subtitle: primaryPromo?.validUntil
        ? `Offer valid until ${primaryPromo.validUntil}. While stocks last!`
        : 'Limited-time offer. Grab it now!',
    },
  }[product.tier];

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
      {}
      <PageBanner
        config={{
          ...detailBannerConfig,
          height: 'sm',
          textAlign: 'left',
        }}
      />

      {}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm text-gray-600">
            <Link to="/" className="shrink-0 hover:text-[#0EA5E9]">Home</Link>
            <span className="shrink-0">/</span>
            <Link to="/products" className="shrink-0 hover:text-[#0EA5E9]">Products</Link>
            <span className="shrink-0">/</span>
            <span className="shrink-0 hover:text-[#0EA5E9]">{product.brand}</span>
            <span className="shrink-0">/</span>
            <span className="truncate font-medium text-gray-900">{product.model}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {}
        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-2 hover:opacity-80"
          style={{ color: '#0EA5E9' }}
        >
          <ChevronLeft size={20} />
          Back to Products
        </Link>

        <div className="grid gap-6 lg:grid-cols-[60%_40%] lg:gap-8">
          {}
          <div>
            <div className="relative mb-4 rounded-lg bg-white p-4 sm:p-8">
              <img
                src={product.images[selectedImage]}
                alt={product.model}
                className="h-64 w-full object-contain sm:h-80 md:h-96"
              />
            </div>
            <div className="flex gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-1 bg-white rounded-lg p-3 border-2 transition-all ${
                    selectedImage === index
                      ? 'border-2'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={selectedImage === index ? { borderColor: '#0EA5E9' } : {}}
                >
                  <img
                    src={image}
                    alt={`${product.model} view ${index + 1}`}
                    className="w-full h-20 object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          {}
          <div>
            <div className="bg-white rounded-lg p-6">
              {}
              <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
                <div className="mb-1 flex h-8 items-center">
                  {brandLogo ? (
                    <img
                      src={brandLogo}
                      alt={product.brand}
                      className={
                        product.brand.trim().toLowerCase() === 'samsung'
                          ? 'h-auto w-[140px] max-h-8 object-contain object-left'
                          : 'h-6 w-auto max-w-[120px] object-contain object-left'
                      }
                    />
                  ) : (
                    <div className="text-sm text-gray-500">{product.brand}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const result = toggleCompare(product.id);
                      if (result.full && !result.added) {
                        setCompareLimitOpen(true);
                        return;
                      }
                      setComparing(result.ids.includes(product.id));
                      if (result.added) navigate(`/compare?ids=${result.ids.join(',')}`);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2.5 text-xs font-semibold ${
                      comparing
                        ? 'border-[#0EA5E9] bg-[#E0F2FE] text-[#0369A1]'
                        : 'border-[#BAE6FD] bg-white text-[#0369A1] hover:bg-[#F0F9FF]'
                    }`}
                  >
                    <GitCompare size={14} />
                    {comparing ? 'In compare' : 'Compare'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWishlisted(toggleWishlist(product.id))}
                    className={`rounded-full border p-2.5 ${
                      wishlisted
                        ? 'border-rose-300 bg-rose-50 text-rose-600'
                        : 'border-gray-200 text-gray-500 hover:border-rose-200 hover:text-rose-500'
                    }`}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    title="Wishlist"
                  >
                    <Heart size={16} className={wishlisted ? 'fill-current' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    className="rounded-full border border-gray-200 p-2.5 text-gray-500 hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
                    aria-label="Share product"
                    title="Share"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
              {cornerTags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {cornerTags.map((tag) => {
                    const label = formatCornerTagLabel(product, tag, selectedHP);
                    if (!label) return null;
                    const variant = cornerTagVariant(tag);
                    const bg = cornerTagBgColor(tag);
                    return (
                      <CornerTag
                        key={tag.id}
                        size="detail"
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
              )}
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#0EA5E9' }}>
                {product.model}
              </h1>

              {}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={
                        i < Math.floor(liveRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
                <span className="text-gray-600 font-medium">
                  ({liveRating}) — {liveCount} reviews
                </span>
              </div>

              {}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3" style={{ color: '#0EA5E9' }}>
                  HP Selector:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.hp.map((hp) => (
                    <button
                      key={hp}
                      type="button"
                      onClick={() => setSelectedHP(hp)}
                      className={`px-4 py-2 rounded-full font-medium transition-all ${
                        selectedHP === hp
                          ? 'text-white'
                          : 'border-2 hover:border-[#0EA5E9]'
                      }`}
                      style={
                        selectedHP === hp
                          ? { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' }
                          : { borderColor: '#E5E7EB' }
                      }
                    >
                      {hp}
                    </button>
                  ))}
                </div>
              </div>

              {}
              <div className="mb-6 pb-6 border-b">
                {hasSelectedHpDiscount ? (
                  <div className="text-lg text-gray-400 line-through mb-2">
                    ₱{unitPrice.toLocaleString()}
                  </div>
                ) : null}
                <div
                  className="text-3xl font-bold mb-3"
                  style={{ color: getPriceColor(product.tier, hasSelectedHpDiscount) }}
                >
                  ₱{discountedUnit.toLocaleString()}
                  <span className="ml-2 text-sm font-medium text-gray-500">
                    ({selectedHP || product.hp[0]})
                  </span>
                </div>

                {countdownEndsAt && isPromoCountdownActive(countdownEndsAt) ? (
                  <PromoCountdownBanner
                    className="mb-4"
                    endsAt={countdownEndsAt}
                    message={countdownMessage}
                  />
                ) : null}

                {hasPromos ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {resolvedPromos.map((promo, i) => (
                        <button
                          key={i}
                          type="button"
                          className="border-0 bg-transparent p-0 text-left leading-none"
                          onClick={() => {
                            setOfferFocus(i);
                            setOffersOpen(true);
                          }}
                          title="View offer details"
                        >
                          <PromoChip
                            size="card"
                            badgeType={promo.badgeType}
                            label={promo.label}
                            cashPerMonth={promo.cashPerMonth}
                            chipImageUrl={promo.chipImageUrl}
                            renderMode={promo.renderMode}
                            iconUrl={promo.iconUrl}
                            iconEmoji={promo.iconEmoji}
                            iconBgColor={promo.iconBgColor}
                            textBgColor={promo.textBgColor}
                            subtitle={promo.subtitle}
                          />
                        </button>
                      ))}
                    </div>
                    {promoList.map(
                      (p, i) =>
                        p.appliesTo && (
                          <div key={`apply-${i}`} className="text-xs text-gray-500">
                            Applies to: {p.appliesTo}
                          </div>
                        )
                    )}
                    {primaryPromo?.validUntil && (
                      <div className="text-xs text-gray-500">
                        Valid until {primaryPromo.validUntil}
                      </div>
                    )}
                  </>
                ) : null}

                {}
                {installmentOptions.length > 0 && (
                  <div className="mt-3">
                    <InstallmentChip
                      size="detail"
                      price={discountedUnit}
                      options={installmentOptions}
                      onClick={() => setInstallmentsOpen(true)}
                    />
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      ₱{discountedUnit.toLocaleString()}
                    </span>
                  </div>
                  <SelectOrEnterVoucher
                    subtotal={discountedUnit}
                    applied={appliedVouchers}
                    onApply={setAppliedVouchers}
                    productId={product.id}
                    category={product.category}
                  />
                  {appliedVouchers.length > 0 ? (
                    <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-sm">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-lg font-black text-[#2563EB]">
                        ₱
                        {Math.max(
                          0,
                          discountedUnit -
                            computeVouchersDiscount(appliedVouchers, discountedUnit).amount
                        ).toLocaleString()}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {}
              {vouchers.length > 0 ? (
                <div className="mb-6 pb-6 border-b">
                  <p className="mb-3 text-sm font-semibold text-gray-900">Vouchers</p>
                  <div className="space-y-2">
                    {vouchers.map((voucher) => (
                      <div
                        key={voucher.code}
                        className="flex items-center gap-3 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-3 py-2.5"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0EA5E9] text-xs font-bold text-white">
                          ₱
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#0369A1]">{voucher.code}</p>
                          <p className="truncate text-xs text-gray-600">{voucher.label}</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(voucher.code);
                              setCopiedCode(voucher.code);
                              window.setTimeout(() => setCopiedCode(null), 2000);
                            } catch {
                              window.alert(`Copy this code: ${voucher.code}`);
                            }
                          }}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#0EA5E9] bg-white px-3 py-1.5 text-xs font-semibold text-[#0EA5E9] hover:bg-[#E0F2FE]"
                        >
                          {copiedCode === voucher.code ? (
                            <>
                              <CheckCheck size={14} /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3" style={{ color: '#0EA5E9' }}>
                  Feature Highlights:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {product.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#FFC107' }} />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {}
              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-4 font-bold text-lg mb-4 hover:opacity-90 transition-opacity text-gray-900"
                style={{ backgroundColor: '#FFC107', borderRadius: '24px' }}
              >
                Inquire / Order Now
              </button>

              {}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center py-2 rounded" style={{ backgroundColor: '#E0F2FE' }}>
                  <Truck className="mx-auto mb-1" style={{ color: '#0EA5E9' }} size={20} />
                  <div className="text-xs font-medium" style={{ color: '#0EA5E9' }}>Free Delivery</div>
                  <div className="text-xs text-gray-600">Metro Cebu</div>
                </div>
                <div className="text-center py-2 rounded" style={{ backgroundColor: '#E0F2FE' }}>
                  <Wrench className="mx-auto mb-1" style={{ color: '#0EA5E9' }} size={20} />
                  <div className="text-xs font-medium" style={{ color: '#0EA5E9' }}>Professional</div>
                  <div className="text-xs text-gray-600">Installation</div>
                </div>
                <div className="text-center py-2 rounded" style={{ backgroundColor: '#E0F2FE' }}>
                  <ShieldCheck className="mx-auto mb-1" style={{ color: '#0EA5E9' }} size={20} />
                  <div className="text-xs font-medium" style={{ color: '#0EA5E9' }}>Official</div>
                  <div className="text-xs text-gray-600">Warranty</div>
                </div>
              </div>

              {}
              <div className="text-center">
                <button className="text-sm hover:underline" style={{ color: '#0EA5E9' }}>
                  Have questions? Chat with our AI assistant
                </button>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="mt-8 rounded-lg bg-white">
          {}
          <div className="flex overflow-x-auto border-b">
            <button
              onClick={() => setActiveTab('description')}
              className={`shrink-0 px-4 py-3 text-sm font-semibold transition-colors sm:px-6 sm:py-4 sm:text-base ${
                activeTab === 'description'
                  ? 'border-b-2'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'description' ? { borderColor: '#0EA5E9', color: '#0EA5E9' } : {}}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specifications')}
              className={`shrink-0 px-4 py-3 text-sm font-semibold transition-colors sm:px-6 sm:py-4 sm:text-base ${
                activeTab === 'specifications'
                  ? 'border-b-2'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'specifications' ? { borderColor: '#0EA5E9', color: '#0EA5E9' } : {}}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`shrink-0 px-4 py-3 text-sm font-semibold transition-colors sm:px-6 sm:py-4 sm:text-base ${
                activeTab === 'reviews'
                  ? 'border-b-2'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'reviews' ? { borderColor: '#0EA5E9', color: '#0EA5E9' } : {}}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          {}
          <div className="p-6">
            {activeTab === 'description' && (
              <div>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid md:grid-cols-2 gap-4">
                {product.specifications.map((spec) => (
                  <div key={spec.label} className="flex justify-between border-b pb-3">
                    <span className="font-medium text-gray-700">{spec.label}:</span>
                    <span className="text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="grid gap-6 border-b border-gray-200 pb-6 md:grid-cols-[180px_1fr_auto] md:items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
                    <p className="mt-1 text-3xl font-bold text-gray-900">
                      {liveCount ? liveRating.toFixed(1) : '—'}
                      <span className="text-lg font-semibold text-gray-500">/5</span>
                    </p>
                    <div className="mt-1 flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={18}
                          className={
                            i <= Math.round(liveRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {liveCount} {liveCount === 1 ? 'Review' : 'Reviews'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = dist[stars] ?? 0;
                      const pct = liveCount ? Math.round((count / liveCount) * 100) : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="w-14 shrink-0">{stars} Stars</span>
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-[#0C4A6E]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right text-gray-500">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setWriteReviewOpen(true)}
                    className="h-fit justify-self-start rounded-full border-2 border-[#0C4A6E] px-5 py-2.5 text-sm font-semibold text-[#0C4A6E] hover:bg-[#F0F9FF] md:justify-self-end"
                  >
                    Write a Review
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <label className="text-sm text-gray-600" htmlFor="review-sort">
                    Sort by
                  </label>
                  <select
                    id="review-sort"
                    value={reviewSort}
                    onChange={(e) =>
                      setReviewSort(e.target.value as 'newest' | 'highest' | 'lowest')
                    }
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800"
                  >
                    <option value="newest">Newest</option>
                    <option value="highest">Highest rating</option>
                    <option value="lowest">Lowest rating</option>
                  </select>
                </div>

                {reviewsLoading ? (
                  <p className="py-8 text-center text-gray-500">Loading reviews…</p>
                ) : sortedReviews.length === 0 ? (
                  <p className="py-10 text-center text-gray-600">
                    No reviews yet. Be the first to write a review!
                  </p>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {sortedReviews.map((review) => (
                      <div key={review.id} className="flex gap-3 py-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                          <User size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }
                              />
                            ))}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
                            <span className="font-semibold text-gray-900">{review.name}</span>
                            {!review.anonymous && review.loyaltyTier ? (
                              <LoyaltyBadge tier={review.loyaltyTier} compact />
                            ) : null}
                            {!review.anonymous && (
                              <BadgeCheck size={16} className="text-[#0EA5E9]" aria-label="Verified" />
                            )}
                            <span className="text-gray-500">(on {review.date})</span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-gray-800">
                            {review.comment}
                          </p>
                          {review.tags && review.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {review.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {review.images && review.images.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {review.images.map((url) => (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block h-16 w-16 overflow-hidden rounded-md border border-gray-200"
                                >
                                  <img src={url} alt="" className="h-full w-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                          {review.electricityImpact ? (
                            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                              <strong>⚡ Electricity Impact:</strong> {review.electricityImpact}
                            </div>
                          ) : null}
                          {review.roomSize && review.roomSize !== 'Not specified' ? (
                            <p className="mt-2 text-xs text-gray-500">Used in {review.roomSize}</p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleHelpful(review.id)}
                            aria-pressed={Boolean(review.helpfulByMe)}
                            className={
                              review.helpfulByMe
                                ? 'mt-3 rounded-full border border-[#0EA5E9] bg-sky-50 px-3 py-1 text-xs font-medium text-[#0EA5E9] hover:bg-sky-100'
                                : 'mt-3 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:border-[#0EA5E9] hover:text-[#0EA5E9]'
                            }
                          >
                            Helpful ({review.helpfulCount ?? 0})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      {showInquiryModal && (
        <ConversationalInquiryModal
          product={product}
          onClose={() => setShowInquiryModal(false)}
          onComplete={handleInquiryComplete}
        />
      )}

      <SpecialOffersModal
        open={offersOpen}
        onClose={() => setOffersOpen(false)}
        offers={resolvedPromos}
        highlightIndex={offerFocus}
        productName={`${product.brand} ${product.model}`}
      />

      <InstallmentOptionsModal
        open={installmentsOpen}
        onClose={() => setInstallmentsOpen(false)}
        price={discountedUnit}
        options={installmentOptions}
        productName={`${product.brand} ${product.model} · ${selectedHP || product.hp[0]}`}
      />

      <WriteReviewModal
        open={writeReviewOpen}
        onClose={() => setWriteReviewOpen(false)}
        product={product}
        productId={product.id}
        selectedHp={selectedHP || product.hp[0]}
        onSubmitted={() => {
          void loadReviews(product.id);
        }}
      />

      <ShareProductModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`${product.brand} ${product.model}`}
        text={`Check out ${product.brand} ${product.model} at Hamel Trading`}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />
      </div>
      <CompareLimitModal
        isOpen={compareLimitOpen}
        onClose={() => setCompareLimitOpen(false)}
        maxProducts={getCompareIds().length}
      />
    </>
  );
}
