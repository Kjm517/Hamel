import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Plus, X, ExternalLink } from 'lucide-react';
import type { Product, ProductPromoEntry } from '../../data/products';
import { getHpUnitPrice, MAX_PRODUCT_PROMOS } from '../../data/products';
import { createProduct, fetchProductDetail, saveProduct } from '../../lib/catalog-api';
import { useProductTags } from '../../context/ProductTagsContext';
import type { ProductTag } from '../../data/productTags';
import { CornerTag, PromoChip } from '../../components/PromoBadge';
import { ImageUrlOrUploadField } from '../components/ImageUrlOrUploadField';
import { mediaPathFor } from '../../lib/storage';
import {
  CORNER_AUTO_RULE_LABELS,
  isCornerTag,
  isPromoTag,
} from '../../data/productTags';
import {
  cornerTagBgColor,
  cornerTagTextColor,
  resolveProductCornerTags,
} from '../../lib/product-corner-tags';
import {
  createPromoEntryFromTag,
  fromDatetimeLocalValue,
  getProductPromoList,
  resolveProductPromos,
  toDatetimeLocalValue,
} from '../../lib/product-promos';
import {
  listVouchersForProduct,
  loadVouchers,
  VOUCHER_AUDIENCE_LABELS,
  voucherLimitLabel,
  type StoreVoucher,
} from '../../data/vouchers';
import {
  demoNewProductTemplate,
  FEATURE_OPTIONS,
  HP_OPTIONS,
  PRODUCT_BRANDS,
  PRODUCT_CATEGORIES,
  STOCK_OPTIONS,
} from '../data/admin-demo';
import { useBrandsPage } from '../../hooks/useBrandsPage';
import { deriveProductBrandChoices } from '../../data/brands-page';
import { adminUi } from '../lib/admin-ui';

type StockStatus = (typeof STOCK_OPTIONS)[number];

export function AddEditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const brandsConfig = useBrandsPage({ trackPageLoading: false });
  const [product, setProduct] = useState<Product>(() => demoNewProductTemplate());
  const [modelNumber, setModelNumber] = useState('CS-CU-Z12ZKH');

  const brandChoices = useMemo(() => {
    const fromAdmin = deriveProductBrandChoices(brandsConfig);
    const base = fromAdmin.length > 0 ? fromAdmin : PRODUCT_BRANDS;
    if (product.brand && !base.some((b) => b.toLowerCase() === product.brand.toLowerCase())) {
      return [...base, product.brand];
    }
    return base;
  }, [brandsConfig, product.brand]);
  const [stockStatus, setStockStatus] = useState<StockStatus>('In Stock');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [tags, setTags] = useState('aircon, inverter, energy-efficient');
  const { tags: catalogTags } = useProductTags();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vouchersForProduct, setVouchersForProduct] = useState<StoreVoucher[]>([]);

  useEffect(() => {
    void loadVouchers().then((cfg) => {
      setVouchersForProduct(listVouchersForProduct(product.id, cfg));
    });
  }, [product.id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { product: p } = await fetchProductDetail(id);
        if (!cancelled) {
          setProduct(p);
          setModelNumber(p.model.split(' ').pop() ?? '');
          setMetaTitle(p.model);
          setMetaDescription(p.description.slice(0, 120));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const promoList = getProductPromoList(product);
  const resolvedPromos = resolveProductPromos(product, catalogTags);
  const promoCatalog = catalogTags.filter(isPromoTag);
  const cornerCatalog = catalogTags.filter(isCornerTag);
  const previewCornerTags = resolveProductCornerTags(product, catalogTags);
  const usingAutoCornerTags = product.cornerTagIds === undefined;

  const setPromoList = (list: ProductPromoEntry[]) => {
    const capped = list.slice(0, MAX_PRODUCT_PROMOS);
    setProduct((p) => ({
      ...p,
      promos: capped.length > 0 ? capped : undefined,
      promo: undefined,
    }));
  };

  const updatePromoAt = (index: number, patch: Partial<ProductPromoEntry>) => {
    const list = [...getProductPromoList(product)];
    if (!list[index]) return;
    list[index] = { ...list[index], ...patch };
    setPromoList(list);
  };

  const setPromoTagAt = (index: number, tagId: string) => {
    if (!tagId) {
      setPromoList(getProductPromoList(product).filter((_, i) => i !== index));
      return;
    }
    const entry = createPromoEntryFromTag(
      tagId,
      catalogTags,
      getProductPromoList(product)[index]
    );
    if (!entry) return;
    const list = [...getProductPromoList(product)];
    list[index] = entry;
    setPromoList(list);
  };

  const addPromoSlot = () => {
    const list = getProductPromoList(product);
    if (list.length >= MAX_PRODUCT_PROMOS) return;
    setPromoList([
      ...list,
      {
        tagId: '',
        type: 'percentage',
        value: 15,
        label: '',
        badgeType: 'flash-sale',
      },
    ]);
  };

  const toggleHp = (hp: string) => {
    setProduct((p) => {
      const nextHp = p.hp.includes(hp) ? p.hp.filter((h) => h !== hp) : [...p.hp, hp];
      const variants = [...(p.hpVariants ?? [])];
      const nextVariants = nextHp.map((h) => {
        const existing = variants.find((v) => v.hp === h);
        if (existing) return existing;
        return { hp: h, price: getHpUnitPrice({ ...p, hp: nextHp }, h) };
      });
      const prices = nextVariants.map((v) => v.price).filter((n) => n > 0);
      return {
        ...p,
        hp: nextHp,
        hpVariants: nextVariants,
        priceStart: prices.length ? Math.min(...prices) : p.priceStart,
        priceEnd: prices.length ? Math.max(...prices) : p.priceEnd,
      };
    });
  };

  const setHpVariantPrice = (hp: string, price: number) => {
    setProduct((p) => {
      const nextVariants = (p.hp.length ? p.hp : [hp]).map((h) => {
        const existing = p.hpVariants?.find((v) => v.hp === h);
        if (h === hp) return { hp: h, price };
        return existing ?? { hp: h, price: getHpUnitPrice(p, h) };
      });
      const prices = nextVariants.map((v) => v.price).filter((n) => n > 0);
      return {
        ...p,
        hpVariants: nextVariants,
        priceStart: prices.length ? Math.min(...prices) : p.priceStart,
        priceEnd: prices.length ? Math.max(...prices) : p.priceEnd,
      };
    });
  };

  const toggleFeature = (feature: string) => {
    setProduct((p) => ({
      ...p,
      features: p.features.includes(feature)
        ? p.features.filter((f) => f !== feature)
        : [...p.features, feature],
    }));
  };

  const updateSpec = (index: number, field: 'label' | 'value', value: string) => {
    setProduct((p) => {
      const specs = [...p.specifications];
      specs[index] = { ...specs[index], [field]: value };
      return { ...p, specifications: specs };
    });
  };

  const addSpec = () => {
    setProduct((p) => ({
      ...p,
      specifications: [...p.specifications, { label: '', value: '' }],
    }));
  };

  const removeSpec = (index: number) => {
    setProduct((p) => ({
      ...p,
      specifications: p.specifications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: Product = {
      ...product,
      images: product.image
        ? [product.image, ...product.images.filter((u) => u !== product.image)]
        : product.images,
    };
    try {
      if (isEdit && id) {
        await saveProduct({ ...payload, id });
      } else {
        if (!payload.id.trim()) {
          setError('Product ID is required (e.g. 9).');
          setSaving(false);
          return;
        }
        await createProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-600">Loading product…</p>;
  }

  return (
    <div className="pb-24">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={adminUi.pageIntro}>
          {isEdit
            ? 'Update photos, pricing, stock, and promos for this unit.'
            : 'Add a new aircon to the catalog — photos, price, and specs.'}
        </p>
        <Link
          to="/admin/products"
          className="text-[13.5px] font-semibold text-[#0ea5e9] hover:underline"
        >
          ← Back to Products
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Basic Information">
            {!isEdit && (
              <Field label="Product ID">
                <input
                  required
                  value={product.id}
                  onChange={(e) => setProduct({ ...product, id: e.target.value })}
                  className={inputClass}
                  placeholder="9"
                />
              </Field>
            )}
            <Field label="Product Name">
              <input
                required
                value={product.model}
                onChange={(e) => setProduct({ ...product, model: e.target.value })}
                className={inputClass}
                placeholder="e.g., Panasonic Aero Series"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand">
                <select
                  required
                  value={product.brand}
                  onChange={(e) => setProduct({ ...product, brand: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select Brand</option>
                  {brandChoices.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select
                  required
                  value={product.category}
                  onChange={(e) => setProduct({ ...product, category: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select Category</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Model Number">
              <input
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                className={inputClass}
                placeholder="e.g., CS-CU-Z12ZKH"
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={4}
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                className={inputClass}
                placeholder="Enter product description..."
              />
            </Field>
          </Section>

          <Section title="Pricing & Availability">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price Start">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={product.priceStart || ''}
                    onChange={(e) =>
                      setProduct({ ...product, priceStart: Number(e.target.value) })
                    }
                    className={`${inputClass} pl-8`}
                  />
                </div>
              </Field>
              <Field label="Price End">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={product.priceEnd || ''}
                    onChange={(e) => setProduct({ ...product, priceEnd: Number(e.target.value) })}
                    className={`${inputClass} pl-8`}
                  />
                </div>
              </Field>
            </div>
            <Field label="Horsepower (HP) Options">
              <div className="flex flex-wrap gap-3">
                {HP_OPTIONS.map((hp) => (
                  <label key={hp} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={product.hp.includes(hp)}
                      onChange={() => toggleHp(hp)}
                      className="h-4 w-4 rounded border-gray-300 text-[#0EA5E9]"
                    />
                    {hp}
                  </label>
                ))}
              </div>
            </Field>
            {product.hp.length > 0 ? (
              <Field label="Price per HP (shown when the customer picks a size)">
                <div className="space-y-2">
                  {product.hp.map((hp) => (
                    <div key={hp} className="flex items-center gap-3">
                      <span className="w-16 text-sm font-medium text-gray-700">{hp}</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                        <input
                          type="number"
                          min={0}
                          value={
                            product.hpVariants?.find((v) => v.hp === hp)?.price ??
                            getHpUnitPrice(product, hp)
                          }
                          onChange={(e) => setHpVariantPrice(hp, Number(e.target.value) || 0)}
                          className={`${inputClass} pl-8`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Price Start / End above stay in sync as the min and max of these HP prices.
                </p>
              </Field>
            ) : null}
            <Field label="Vouchers (from Vouchers page)">
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-600">
                  Manage codes, product targeting, and who can claim them on the{' '}
                  <Link
                    to="/admin/vouchers"
                    className="inline-flex items-center gap-1 font-semibold text-[#0EA5E9] hover:underline"
                  >
                    Vouchers
                    <ExternalLink size={12} />
                  </Link>{' '}
                  page. Below are vouchers that currently apply to this product.
                </p>
                {vouchersForProduct.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No platform vouchers apply to this product yet. Create one and set scope to
                    “All products” or select this product.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {vouchersForProduct.map((v) => (
                      <li
                        key={v.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white bg-white px-2.5 py-2 text-sm"
                      >
                        <span>
                          <span className="font-mono font-bold text-gray-900">{v.code}</span>
                          <span className="ml-2 text-gray-600">{v.label}</span>
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#0369A1]">
                          {v.productScope === 'all' ? 'All products' : 'This product'}
                          {' · '}
                          {VOUCHER_AUDIENCE_LABELS[v.audience]}
                          {' · '}
                          {voucherLimitLabel(v)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/admin/vouchers"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#0EA5E9]"
                >
                  <Plus size={14} /> Manage vouchers
                </Link>
              </div>
            </Field>
            <Field label="Compare — Summary (optional)">
              <textarea
                rows={3}
                value={product.compare?.summary ?? ''}
                onChange={(e) =>
                  setProduct((p) => ({
                    ...p,
                    compare: { ...p.compare, summary: e.target.value },
                  }))
                }
                className={inputClass}
                placeholder="Short summary shown on the compare page"
              />
            </Field>
            <Field label="Compare — What’s in the Box (one item per line)">
              <textarea
                rows={3}
                value={(product.compare?.whatsInBox ?? []).join('\n')}
                onChange={(e) =>
                  setProduct((p) => ({
                    ...p,
                    compare: {
                      ...p.compare,
                      whatsInBox: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                className={inputClass}
                placeholder={'Indoor unit\nOutdoor unit\nRemote control'}
              />
            </Field>
            <Field label="Compare — Product Features (one item per line)">
              <textarea
                rows={3}
                value={(product.compare?.productFeatures ?? []).join('\n')}
                onChange={(e) =>
                  setProduct((p) => ({
                    ...p,
                    compare: {
                      ...p.compare,
                      productFeatures: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                className={inputClass}
                placeholder={'Inverter\nWi-Fi Control\nAuto Clean'}
              />
            </Field>
            <Field label="Stock Status">
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                className={inputClass}
              >
                {STOCK_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          <Section title="Corner tags (−20%, INVERTER)">
            <p className="mb-3 text-xs text-gray-500">
              Pill tags above the product title (solid discount or outline spec). Manage types in{' '}
              <Link to="/admin/tags" className="font-medium text-[#0EA5E9] hover:underline">
                Admin → Tags → Corner badges
              </Link>
              .
            </p>
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={usingAutoCornerTags}
                onChange={(e) => {
                  if (e.target.checked) {
                    setProduct((p) => {
                      const { cornerTagIds: _, ...rest } = p;
                      return rest;
                    });
                  } else {
                    setProduct((p) => ({ ...p, cornerTagIds: [] }));
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-[#0EA5E9]"
              />
              Use automatic rules (SALE / INV / TOP when product matches)
            </label>
            {!usingAutoCornerTags && (
              <div className="mb-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                {cornerCatalog.length === 0 ? (
                  <p className="text-xs text-gray-500">No corner badges in catalog yet — add them in Admin → Tags.</p>
                ) : (
                  cornerCatalog.map((tag) => (
                    <label key={tag.id} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={product.cornerTagIds?.includes(tag.id) ?? false}
                        onChange={(e) => {
                          const ids = product.cornerTagIds ?? [];
                          const next = e.target.checked
                            ? [...ids, tag.id]
                            : ids.filter((id) => id !== tag.id);
                          setProduct((p) => ({ ...p, cornerTagIds: next.slice(0, 4) }));
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-[#0EA5E9]"
                      />
                      <CornerTag
                        label={tag.name}
                        color={cornerTagTextColor(tag)}
                        bgColor={cornerTagBgColor(tag)}
                      />
                      <span className="text-xs text-gray-500">
                        {CORNER_AUTO_RULE_LABELS[tag.autoApply ?? 'manual']}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
            {previewCornerTags.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <span className="mb-2 block text-xs text-gray-500">Preview on card:</span>
                <div className="inline-flex flex-col items-stretch gap-1">
                  {previewCornerTags.map((tag) => (
                    <CornerTag
                      key={tag.id}
                      label={tag.name}
                      color={cornerTagTextColor(tag)}
                      bgColor={cornerTagBgColor(tag)}
                    />
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="Promo tags (card stickers)">
            <p className="mb-3 text-xs text-gray-500">
              Add up to {MAX_PRODUCT_PROMOS} tags from{' '}
              <Link to="/admin/tags" className="font-medium text-[#0EA5E9] hover:underline">
                Admin → Tags
              </Link>
              . They appear on the product image in listings.
            </p>

            <div className="space-y-4">
              {promoList.length === 0 && (
                <p className="text-sm text-gray-500">No promo tags on this product yet.</p>
              )}
              {promoList.map((promo, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Tag {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPromoList(promoList.filter((_, i) => i !== index))
                      }
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <Field label="Catalog tag">
                    <select
                      value={promo.tagId ?? ''}
                      onChange={(e) => setPromoTagAt(index, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select a tag…</option>
                      {promoCatalog
                        // Keep this row's selected tag visible, but hide tags
                        // already assigned to another promo slot.
                        .filter(
                          (t) =>
                            t.id === promo.tagId ||
                            !promoList.some(
                              (otherPromo, otherIndex) =>
                                otherIndex !== index && otherPromo.tagId === t.id
                            )
                        )
                        .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.style})
                        </option>
                      ))}
                    </select>
                  </Field>
                  {promo.tagId && (
                    <>
                      {(promo.type === 'percentage' || promo.type === 'fixed') && (
                        <Field
                          label={
                            promo.type === 'percentage'
                              ? 'Discount (%)'
                              : 'Discount amount (₱)'
                          }
                        >
                          <input
                            type="number"
                            min={0}
                            value={promo.value || ''}
                            onChange={(e) =>
                              updatePromoAt(index, { value: Number(e.target.value) })
                            }
                            className={inputClass}
                          />
                        </Field>
                      )}
                      {promo.type === 'cash-deal' && (
                        <Field label="Monthly amount (₱)">
                          <input
                            type="number"
                            min={0}
                            value={promo.cashPerMonth ?? ''}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              updatePromoAt(index, {
                                cashPerMonth: n,
                                label: `₱${n.toLocaleString()}/mo`,
                              });
                            }}
                            className={inputClass}
                          />
                        </Field>
                      )}
                      <Field label="Valid until label (optional)">
                        <input
                          value={promo.validUntil ?? ''}
                          onChange={(e) =>
                            updatePromoAt(index, { validUntil: e.target.value })
                          }
                          className={inputClass}
                          placeholder="July 16, 2026"
                        />
                      </Field>
                      <Field label="Countdown ends at (optional)">
                        <input
                          type="datetime-local"
                          value={toDatetimeLocalValue(promo.promoEndsAt)}
                          onChange={(e) =>
                            updatePromoAt(index, {
                              promoEndsAt: fromDatetimeLocalValue(e.target.value),
                            })
                          }
                          className={inputClass}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Optional countdown on the product page. Leave blank to hide it.
                        </p>
                      </Field>
                    </>
                  )}
                </div>
              ))}
            </div>

            {promoList.length < MAX_PRODUCT_PROMOS && (
              <button
                type="button"
                onClick={addPromoSlot}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#0EA5E9] hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add promo tag ({promoList.length}/{MAX_PRODUCT_PROMOS})
              </button>
            )}

            {resolvedPromos.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
                <span className="w-full text-xs text-gray-500">Preview:</span>
                {resolvedPromos.map((promo, i) => (
                  <PromoChip
                    key={i}
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
                    size="card"
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title="Specifications">
            <div className="space-y-2">
              {product.specifications.map((spec, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={spec.label}
                    onChange={(e) => updateSpec(i, 'label', e.target.value)}
                    className={inputClass}
                    placeholder="Label"
                  />
                  <input
                    value={spec.value}
                    onChange={(e) => updateSpec(i, 'value', e.target.value)}
                    className={inputClass}
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(i)}
                    className="shrink-0 rounded p-2 text-red-600 hover:bg-red-50"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSpec}
              className="mt-2 text-sm font-medium text-[#0EA5E9] hover:underline"
            >
              + Add More
            </button>
          </Section>

          <Section title="Features">
            <div className="space-y-2">
              {FEATURE_OPTIONS.map((feature) => (
                <label key={feature} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={product.features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    className="h-4 w-4 rounded border-gray-300 text-[#0EA5E9]"
                  />
                  {feature}
                </label>
              ))}
            </div>
            <button type="button" className="mt-2 text-sm font-medium text-[#0EA5E9] hover:underline">
              + Add Custom Feature
            </button>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Product Images">
            <ImageUrlOrUploadField
              label="Main product photo"
              value={product.image}
              onChange={(url) =>
                setProduct((p) => ({
                  ...p,
                  image: url,
                  images: url
                    ? [url, ...p.images.filter((u) => u && u !== url)]
                    : p.images.filter((u) => u && u !== p.image),
                }))
              }
              remoteUpload={{ getObjectPath: mediaPathFor('products') }}
              hint="Upload to cloud storage (Cloudinary). Paste a public URL only if the file is already hosted."
            />
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Extra gallery photos
              </p>
              {[0, 1, 2].map((slot) => {
                const gallery = product.images.filter((u) => u && u !== product.image);
                const value = gallery[slot] || '';
                return (
                  <ImageUrlOrUploadField
                    key={slot}
                    label={`Gallery photo ${slot + 1}`}
                    value={value}
                    onChange={(url) => {
                      setProduct((p) => {
                        const extras = p.images.filter((u) => u && u !== p.image);
                        const next = [...extras];
                        if (url) next[slot] = url;
                        else next.splice(slot, 1);
                        const cleaned = next.filter(Boolean);
                        return {
                          ...p,
                          images: p.image ? [p.image, ...cleaned.filter((u) => u !== p.image)] : cleaned,
                        };
                      });
                    }}
                    remoteUpload={{ getObjectPath: mediaPathFor('products') }}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="SEO & Tags">
            <Field label="Meta Title">
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className={inputClass}
                placeholder="SEO-friendly title"
              />
            </Field>
            <Field label="Meta Description">
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className={inputClass}
                placeholder="Short description for search engines"
              />
            </Field>
            <Field label="Tags">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={inputClass}
                placeholder="aircon, inverter, energy-efficient"
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated</p>
            </Field>
          </Section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-end gap-2 border-t border-[#e8eef4] bg-white px-3 py-3 shadow-[0_-4px_20px_rgba(30,42,56,0.06)] sm:gap-3 sm:px-6 sm:py-4 lg:left-[260px]">
          <Link to="/admin/products" className={adminUi.btnGhost}>
            Cancel
          </Link>
          <button type="button" className={adminUi.btnGhost}>
            Save Draft
          </button>
          <button type="submit" disabled={saving} className={adminUi.btnAmber}>
            {saving ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`${adminUi.card} p-6`}>
      <h3 className="mb-4 text-[16px] font-bold text-[#1e2a38]">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={adminUi.label}>{label}</span>
      <div>{children}</div>
    </label>
  );
}

const inputClass = adminUi.input;
