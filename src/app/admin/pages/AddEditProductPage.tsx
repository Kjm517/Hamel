import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Upload, Plus, X } from 'lucide-react';
import type { Product, ProductPromoEntry } from '../../data/products';
import { getHpUnitPrice, MAX_PRODUCT_PROMOS } from '../../data/products';
import { createProduct, fetchProductDetail, saveProduct } from '../../lib/catalog-api';
import { useProductTags } from '../../context/ProductTagsContext';
import type { ProductTag } from '../../data/productTags';
import { CornerTag, PromoBadge } from '../../components/PromoBadge';
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
  demoNewProductTemplate,
  FEATURE_OPTIONS,
  HP_OPTIONS,
  PRODUCT_BRANDS,
  PRODUCT_CATEGORIES,
  STOCK_OPTIONS,
} from '../data/admin-demo';

type StockStatus = (typeof STOCK_OPTIONS)[number];

export function AddEditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [product, setProduct] = useState<Product>(() => demoNewProductTemplate());
  const [modelNumber, setModelNumber] = useState('CS-CU-Z12ZKH');
  const [stockStatus, setStockStatus] = useState<StockStatus>('In Stock');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [tags, setTags] = useState('aircon, inverter, energy-efficient');
  const { tags: catalogTags } = useProductTags();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h2>
        <Link
          to="/admin/products"
          className="text-sm font-medium text-[#0EA5E9] hover:underline"
        >
          ← Back to Products
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
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
                  {PRODUCT_BRANDS.map((b) => (
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
              <Field label="Price per HP (updates storefront when customer selects HP)">
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
            <Field label="Vouchers (optional)">
              <div className="space-y-2">
                {(product.vouchers ?? []).map((voucher, index) => (
                  <div key={index} className="flex flex-wrap gap-2">
                    <input
                      value={voucher.code}
                      onChange={(e) =>
                        setProduct((p) => {
                          const vouchers = [...(p.vouchers ?? [])];
                          vouchers[index] = {
                            ...vouchers[index],
                            code: e.target.value.toUpperCase(),
                          };
                          return { ...p, vouchers };
                        })
                      }
                      placeholder="CODE"
                      className={`${inputClass} max-w-[140px]`}
                    />
                    <input
                      value={voucher.label}
                      onChange={(e) =>
                        setProduct((p) => {
                          const vouchers = [...(p.vouchers ?? [])];
                          vouchers[index] = { ...vouchers[index], label: e.target.value };
                          return { ...p, vouchers };
                        })
                      }
                      placeholder="₱1000 off voucher"
                      className={`${inputClass} min-w-[180px] flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProduct((p) => ({
                          ...p,
                          vouchers: (p.vouchers ?? []).filter((_, i) => i !== index),
                        }))
                      }
                      className="rounded-lg border border-gray-200 px-2 text-red-500 hover:bg-red-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setProduct((p) => ({
                      ...p,
                      vouchers: [...(p.vouchers ?? []), { code: '', label: '' }],
                    }))
                  }
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#0EA5E9]"
                >
                  <Plus size={14} /> Add voucher
                </button>
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

          <Section title="Corner badges (SALE, INV, TOP)">
            <p className="mb-3 text-xs text-gray-500">
              Small labels on the top-right of the product image. Manage types in{' '}
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
                      {promoCatalog.map((t) => (
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
                          Live countdown on the product page (Abenson-style). Leave empty to hide.
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
                  <PromoBadge
                    key={i}
                    badgeType={promo.badgeType}
                    label={promo.label}
                    cashPerMonth={promo.cashPerMonth}
                    iconUrl={promo.iconUrl}
                    iconEmoji={promo.iconEmoji}
                    iconBgColor={promo.iconBgColor}
                    textBgColor={promo.textBgColor}
                    subtitle={promo.subtitle}
                    size="md"
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
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center">
              <Upload className="mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">Drag & drop or click to upload</p>
              <p className="text-xs text-gray-500">Main product image</p>
            </div>
            <Field label="Image URL">
              <input
                required
                value={product.image}
                onChange={(e) => setProduct({ ...product, image: e.target.value })}
                className={inputClass}
              />
            </Field>
            {product.image && (
              <img
                src={product.image}
                alt=""
                className="h-32 w-full rounded-lg border border-gray-200 object-cover"
              />
            )}
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400"
                >
                  <Plus className="h-6 w-6" />
                </div>
              ))}
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

        <div className="fixed bottom-0 left-[260px] right-0 z-20 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
          <Link
            to="/admin/products"
            className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-amber-400 px-6 py-2.5 text-sm font-bold text-gray-900 hover:bg-amber-500 disabled:opacity-60"
          >
            {saving ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-gray-900">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]';
