import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Search, Ticket } from 'lucide-react';
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
import { AdminToggle } from '../components/AdminToggle';
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

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

function typeLabel(type: VoucherDiscountType) {
  if (type === 'percent') return 'Percent %';
  if (type === 'free_install') return 'Free installation';
  return 'Fixed ₱ off';
}

function valueLabel(v: StoreVoucher) {
  if (v.discountType === 'percent') return `${v.value}%`;
  if (v.discountType === 'free_install') return 'Free install';
  return `₱${v.value.toLocaleString('en-PH')}`;
}

function badgeFor(v: StoreVoucher) {
  if (!v.enabled) return { text: 'Off', className: adminUi.badgeGray };
  if (v.maxRedemptions > 0 && v.redemptionCount >= v.maxRedemptions) {
    return { text: 'Used up', className: adminUi.badgeAmber };
  }
  return { text: 'Active', className: adminUi.badgeGreen };
}

export function AdminVouchersPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const { products, loading: catalogLoading } = useCatalog();
  const [draft, setDraft] = useState<VouchersConfig>(defaultVouchers);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const addVoucher = () => {
    const next = emptyVoucher();
    setDraft((d) => ({ vouchers: [...d.vouchers, next] }));
    setEditingId(next.id);
  };

  const removeVoucher = async (id: string, label: string) => {
    const ok = await confirm({
      title: 'Delete this voucher?',
      description: `Remove ${label}? Remember to save vouchers after deleting.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setDraft((d) => ({
      vouchers: d.vouchers.filter((x) => x.id !== id),
    }));
    setEditingId((cur) => (cur === id ? null : cur));
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
        setEditingId(invalid.id);
        return;
      }
      await saveVouchers(draft);
      setSaved(true);
      setEditingId(null);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-5">
      {confirmDialog}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className={adminUi.pageIntro}>
          Discount codes for the product page and inquiry flow. Set the amount, who can use them,
          and how many redemptions are allowed.
        </p>
        <button type="button" onClick={addVoucher} className={adminUi.btnPrimary}>
          <Plus className="h-[17px] w-[17px]" strokeWidth={2.2} />
          Add voucher
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Vouchers saved.
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {draft.vouchers.length === 0 ? (
          <div className={`${adminUi.card} px-6 py-12 text-center text-sm text-[#9aa7b5]`}>
            No vouchers yet. Add one to get started.
          </div>
        ) : (
          draft.vouchers.map((v) => {
            const badge = badgeFor(v);
            const editing = editingId === v.id;
            const usedPct =
              v.maxRedemptions > 0
                ? Math.min(100, Math.round((v.redemptionCount / v.maxRedemptions) * 100))
                : 0;
            const q = (productSearch[v.id] || '').trim().toLowerCase();
            const filtered = storefrontProducts.filter((p) => {
              if (!q) return true;
              return `${p.brand} ${p.model} ${p.id}`.toLowerCase().includes(q);
            });

            return (
              <div key={v.id} className={`${adminUi.card} p-5`}>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0f2233] px-3 py-1.5 font-mono text-[13px] font-bold tracking-wide text-sky-300">
                    <Ticket className="h-3.5 w-3.5" />
                    {v.code || 'CODE'}
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-semibold text-[#1e2a38]">
                    {v.label || 'Untitled voucher'}
                  </span>
                  <span className={badge.className}>{badge.text}</span>
                  <label className="ml-auto flex items-center gap-2 text-[13px] text-[#516171]">
                    Active
                    <AdminToggle
                      checked={v.enabled}
                      onChange={(enabled) => patch(v.id, { enabled })}
                      label="Active"
                    />
                  </label>
                </div>

                {!editing ? (
                  <>
                    <div className="grid grid-cols-2 gap-x-[18px] gap-y-3.5 border-t border-[#f1f5f9] pt-4 sm:grid-cols-4">
                      <div>
                        <div className={adminUi.labelMuted}>Type</div>
                        <div className="mt-1 text-[13.5px] font-semibold text-[#1e2a38]">
                          {typeLabel(v.discountType)}
                        </div>
                      </div>
                      <div>
                        <div className={adminUi.labelMuted}>Value</div>
                        <div className="mt-1 text-[13.5px] font-bold text-[#0ea5e9]">
                          {valueLabel(v)}
                        </div>
                      </div>
                      <div>
                        <div className={adminUi.labelMuted}>Min spend</div>
                        <div className="mt-1 text-[13.5px] font-semibold text-[#1e2a38]">
                          {v.minSpend > 0
                            ? `₱${v.minSpend.toLocaleString('en-PH')}`
                            : 'None'}
                        </div>
                      </div>
                      <div>
                        <div className={adminUi.labelMuted}>Expires</div>
                        <div className="mt-1 text-[13.5px] font-semibold text-[#1e2a38]">
                          {v.expiresAt || 'No expiry'}
                        </div>
                      </div>
                      <div>
                        <div className={adminUi.labelMuted}>Who can use</div>
                        <div className="mt-1 text-[13.5px] font-semibold text-[#1e2a38]">
                          {VOUCHER_AUDIENCE_LABELS[v.audience]}
                        </div>
                      </div>
                      <div>
                        <div className={adminUi.labelMuted}>Applies to</div>
                        <div className="mt-1 text-[13.5px] font-semibold text-[#1e2a38]">
                          {v.categories?.length
                            ? v.categories.join(', ')
                            : v.productScope === 'all'
                              ? 'All products'
                              : `${v.productIds.length} selected`}
                        </div>
                      </div>
                      <div>
                        <div className={adminUi.labelMuted}>Max claims</div>
                        <div className="mt-1 text-[13.5px] font-semibold text-[#1e2a38]">
                          {v.maxRedemptions === 0 ? 'Unlimited' : v.maxRedemptions}
                        </div>
                      </div>
                      <div>
                        <div className={adminUi.labelMuted}>Redeemed</div>
                        <div className="mt-1 text-[13.5px] font-semibold text-[#1e2a38]">
                          {voucherLimitLabel(v)}
                        </div>
                      </div>
                    </div>

                    {v.maxRedemptions > 0 ? (
                      <div className="mt-3.5">
                        <div className="h-[7px] overflow-hidden rounded-full bg-[#eef3f8]">
                          <div
                            className="h-full rounded-full bg-[#0ea5e9]"
                            style={{ width: `${usedPct}%` }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-end gap-3.5 border-t border-[#f1f5f9] pt-3.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(v.id)}
                        className="text-[12.5px] font-semibold text-[#516171] hover:text-[#0ea5e9]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeVoucher(v.id, v.code || v.label || 'this voucher')}
                        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 border-t border-[#f1f5f9] pt-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <label className={adminUi.label}>
                        Code
                        <input
                          value={v.code}
                          onChange={(e) => patch(v.id, { code: e.target.value.toUpperCase() })}
                          className={`${adminUi.input} font-mono`}
                        />
                      </label>
                      <label className={`${adminUi.label} sm:col-span-2`}>
                        Label
                        <input
                          value={v.label}
                          onChange={(e) => patch(v.id, { label: e.target.value })}
                          className={adminUi.input}
                        />
                      </label>
                      <label className={adminUi.label}>
                        Type
                        <select
                          value={v.discountType}
                          onChange={(e) =>
                            patch(v.id, {
                              discountType: e.target.value as VoucherDiscountType,
                            })
                          }
                          className={adminUi.select}
                        >
                          <option value="fixed">Fixed ₱ off</option>
                          <option value="percent">Percent %</option>
                          <option value="free_install">Free installation</option>
                        </select>
                      </label>
                      <label className={adminUi.label}>
                        Value
                        <input
                          type="number"
                          value={v.value}
                          onChange={(e) => patch(v.id, { value: Number(e.target.value) || 0 })}
                          className={adminUi.input}
                        />
                      </label>
                      <label className={adminUi.label}>
                        Min spend ₱
                        <input
                          type="number"
                          value={v.minSpend}
                          onChange={(e) =>
                            patch(v.id, { minSpend: Number(e.target.value) || 0 })
                          }
                          className={adminUi.input}
                        />
                      </label>
                      <label className={adminUi.label}>
                        Expires
                        <input
                          value={v.expiresAt || ''}
                          onChange={(e) =>
                            patch(v.id, { expiresAt: e.target.value || undefined })
                          }
                          placeholder="2026-12-31"
                          className={adminUi.input}
                        />
                      </label>
                      <label className={`${adminUi.label} sm:col-span-2`}>
                        Who can use this
                        <select
                          value={v.audience}
                          onChange={(e) =>
                            patch(v.id, { audience: e.target.value as VoucherAudience })
                          }
                          className={adminUi.select}
                        >
                          {(Object.keys(VOUCHER_AUDIENCE_LABELS) as VoucherAudience[]).map(
                            (key) => (
                              <option key={key} value={key}>
                                {VOUCHER_AUDIENCE_LABELS[key]}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                      <label className={adminUi.label}>
                        Max customers / claims
                        <input
                          type="number"
                          min={0}
                          value={v.maxRedemptions}
                          onChange={(e) =>
                            patch(v.id, {
                              maxRedemptions: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className={adminUi.input}
                        />
                        <span className="mt-1 block text-[11px] font-normal text-[#9aa7b5]">
                          0 = unlimited
                        </span>
                      </label>
                    </div>

                    <div className="rounded-xl border border-[#eef3f8] bg-[#f9fbfd] p-3">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#9aa7b5]">
                        Applies to products
                      </p>
                      <div className="mb-3 flex flex-wrap gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-[#1e2a38]">
                          <input
                            type="radio"
                            name={`scope-${v.id}`}
                            checked={v.productScope === 'all'}
                            onChange={() =>
                              patch(v.id, {
                                productScope: 'all' as VoucherProductScope,
                                productIds: [],
                              })
                            }
                          />
                          All products
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-[#1e2a38]">
                          <input
                            type="radio"
                            name={`scope-${v.id}`}
                            checked={v.productScope === 'selected'}
                            onChange={() =>
                              patch(v.id, {
                                productScope: 'selected' as VoucherProductScope,
                              })
                            }
                          />
                          Selected products only
                        </label>
                      </div>

                      {v.productScope === 'selected' && (
                        <div>
                          <div className="relative mb-2">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aa7b5]" />
                            <input
                              value={productSearch[v.id] || ''}
                              onChange={(e) =>
                                setProductSearch((s) => ({ ...s, [v.id]: e.target.value }))
                              }
                              placeholder="Search brand or model…"
                              className="h-10 w-full rounded-[10px] border border-[#e4ebf2] bg-white py-2 pl-8 pr-3 text-sm"
                            />
                          </div>
                          {catalogLoading ? (
                            <p className="text-xs text-[#9aa7b5]">Loading products…</p>
                          ) : (
                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-[10px] border border-[#e4ebf2] bg-white p-2">
                              {filtered.length === 0 ? (
                                <p className="px-2 py-3 text-xs text-[#9aa7b5]">
                                  No products match.
                                </p>
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
                                      <span className="font-medium text-[#1e2a38]">
                                        {p.brand} {p.model}
                                      </span>
                                      <span className="ml-1 text-xs text-[#9aa7b5]">{p.id}</span>
                                    </span>
                                  </label>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-[12.5px] font-semibold text-[#516171] hover:text-[#0ea5e9]"
                      >
                        Done editing
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeVoucher(v.id, v.code || v.label || 'this voucher')}
                        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className={adminUi.btnAmber}
        >
          {saving ? 'Saving…' : 'Save vouchers'}
        </button>
        <p className="text-xs text-[#9aa7b5]">
          After saving, open a{' '}
          <Link to="/admin/products" className="font-semibold text-[#0EA5E9] hover:underline">
            product
          </Link>{' '}
          to check which codes apply.
        </p>
      </div>
    </div>
  );
}
