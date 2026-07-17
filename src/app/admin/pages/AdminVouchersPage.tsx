import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router';
import {
  defaultVouchers,
  loadVouchers,
  saveVouchers,
  VOUCHER_AUDIENCE_LABELS,
  voucherLimitLabel,
  type StoreVoucher,
  type VoucherAudience,
  type VoucherDiscountType,
  type VoucherProductScope,
  type VouchersConfig,
} from '../../data/vouchers';
import { useCatalog } from '../../context/CatalogContext';
import { isStorefrontProduct } from '../../lib/catalog-product';

function emptyVoucher(): StoreVoucher {
  return {
    id: `v-${Date.now()}`,
    code: '',
    label: '',
    discountType: 'fixed',
    value: 500,
    minSpend: 0,
    enabled: true,
    productScope: 'all',
    productIds: [],
    audience: 'everyone',
    maxRedemptions: 100,
    redemptionCount: 0,
  };
}

export function AdminVouchersPage() {
  const { products, loading: catalogLoading } = useCatalog();
  const [draft, setDraft] = useState<VouchersConfig>(defaultVouchers);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState<Record<string, string>>({});

  const storefrontProducts = useMemo(
    () => products.filter(isStorefrontProduct),
    [products]
  );

  useEffect(() => {
    void loadVouchers().then(setDraft);
  }, []);

  const patch = (id: string, next: Partial<StoreVoucher>) => {
    setDraft((prev) => ({
      vouchers: prev.vouchers.map((v) => (v.id === id ? { ...v, ...next } : v)),
    }));
  };

  const toggleProduct = (voucherId: string, productId: string) => {
    setDraft((prev) => ({
      vouchers: prev.vouchers.map((v) => {
        if (v.id !== voucherId) return v;
        const has = v.productIds.includes(productId);
        const productIds = has
          ? v.productIds.filter((id) => id !== productId)
          : [...v.productIds, productId];
        return { ...v, productScope: 'selected' as const, productIds };
      }),
    }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const invalid = draft.vouchers.find(
        (v) => v.productScope === 'selected' && v.productIds.length === 0
      );
      if (invalid) {
        setError(
          `Voucher ${invalid.code || invalid.label || 'untitled'} is set to specific products but none are selected.`
        );
        return;
      }
      await saveVouchers(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vouchers</h2>
          <p className="text-sm text-gray-600">
            Platform vouchers for product detail and inquiry. Set product scope, who can claim,
            and how many customers can apply each code (0 = unlimited).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft((d) => ({ vouchers: [...d.vouchers, emptyVoucher()] }))}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add voucher
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          Vouchers saved.
        </div>
      )}

      <div className="space-y-4">
        {draft.vouchers.map((v) => {
          const q = (productSearch[v.id] || '').trim().toLowerCase();
          const filtered = storefrontProducts.filter((p) => {
            if (!q) return true;
            const hay = `${p.brand} ${p.model} ${p.id}`.toLowerCase();
            return hay.includes(q);
          });
          return (
            <div key={v.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-xs font-medium text-gray-600">
                  Code
                  <input
                    value={v.code}
                    onChange={(e) => patch(v.id, { code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                  Label
                  <input
                    value={v.label}
                    onChange={(e) => patch(v.id, { label: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Type
                  <select
                    value={v.discountType}
                    onChange={(e) =>
                      patch(v.id, { discountType: e.target.value as VoucherDiscountType })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="fixed">Fixed ₱ off</option>
                    <option value="percent">Percent %</option>
                    <option value="free_install">Free installation</option>
                  </select>
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Value
                  <input
                    type="number"
                    value={v.value}
                    onChange={(e) => patch(v.id, { value: Number(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Min spend ₱
                  <input
                    type="number"
                    value={v.minSpend}
                    onChange={(e) => patch(v.id, { minSpend: Number(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Expires
                  <input
                    value={v.expiresAt || ''}
                    onChange={(e) => patch(v.id, { expiresAt: e.target.value || undefined })}
                    placeholder="2026-12-31"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                  Who can use this
                  <select
                    value={v.audience}
                    onChange={(e) =>
                      patch(v.id, { audience: e.target.value as VoucherAudience })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {(Object.keys(VOUCHER_AUDIENCE_LABELS) as VoucherAudience[]).map((key) => (
                      <option key={key} value={key}>
                        {VOUCHER_AUDIENCE_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Max customers / claims
                  <input
                    type="number"
                    min={0}
                    value={v.maxRedemptions}
                    onChange={(e) =>
                      patch(v.id, { maxRedemptions: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <span className="mt-1 block text-[11px] text-gray-500">
                    0 = unlimited. Count increases when a shopper submits an inquiry with this
                    voucher.
                  </span>
                </label>
                <div className="text-xs font-medium text-gray-600">
                  Usage
                  <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                    <span>{voucherLimitLabel(v)}</span>
                    {v.redemptionCount > 0 && (
                      <button
                        type="button"
                        onClick={() => patch(v.id, { redemptionCount: 0 })}
                        className="text-xs font-semibold text-[#0EA5E9] hover:underline"
                      >
                        Reset count
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Applies to products
                </p>
                <div className="mb-3 flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="radio"
                      name={`scope-${v.id}`}
                      checked={v.productScope === 'all'}
                      onChange={() => patch(v.id, { productScope: 'all' as VoucherProductScope, productIds: [] })}
                    />
                    All products
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="radio"
                      name={`scope-${v.id}`}
                      checked={v.productScope === 'selected'}
                      onChange={() =>
                        patch(v.id, { productScope: 'selected' as VoucherProductScope })
                      }
                    />
                    Selected products only
                  </label>
                </div>

                {v.productScope === 'selected' && (
                  <div>
                    <div className="relative mb-2">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <input
                        value={productSearch[v.id] || ''}
                        onChange={(e) =>
                          setProductSearch((s) => ({ ...s, [v.id]: e.target.value }))
                        }
                        placeholder="Search brand or model…"
                        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm"
                      />
                    </div>
                    {catalogLoading ? (
                      <p className="text-xs text-gray-500">Loading products…</p>
                    ) : (
                      <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
                        {filtered.length === 0 ? (
                          <p className="px-2 py-3 text-xs text-gray-500">No products match.</p>
                        ) : (
                          filtered.map((p) => (
                            <label
                              key={p.id}
                              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#F0F9FF]"
                            >
                              <input
                                type="checkbox"
                                checked={v.productIds.includes(p.id)}
                                onChange={() => toggleProduct(v.id, p.id)}
                              />
                              <span className="min-w-0 truncate">
                                <span className="font-medium text-gray-900">
                                  {p.brand} {p.model}
                                </span>
                                <span className="ml-1 text-xs text-gray-400">{p.id}</span>
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      {v.productIds.length} product{v.productIds.length === 1 ? '' : 's'} selected
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={v.enabled}
                    onChange={(e) => patch(v.id, { enabled: e.target.checked })}
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ vouchers: d.vouchers.filter((x) => x.id !== v.id) }))
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-amber-500 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save vouchers'}
        </button>
        <p className="text-xs text-gray-500">
          Tip: open a{' '}
          <Link to="/admin/products" className="font-semibold text-[#0EA5E9] hover:underline">
            product
          </Link>{' '}
          to see which vouchers apply to it.
        </p>
      </div>
    </div>
  );
}
