import { useEffect, useState, type FormEvent } from 'react';
import { Copy, Check, Eye, Trash2, X } from 'lucide-react';
import {
  assignCustomerClaim,
  deleteCustomer,
  fetchCustomerDetail,
  fetchCustomers,
  removeCustomerClaim,
  updateCustomer,
  type CustomerClaim,
  type CustomerDetail,
  type CustomerRow,
  type LoyaltyTier,
} from '../lib/customers-api';
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';
import { loadVouchers, type StoreVoucher } from '../../data/vouchers';

function LoyaltyChip({ tier }: { tier: LoyaltyTier | null }) {
  if (!tier) return null;
  const styles: Record<LoyaltyTier, string> = {
    bronze: 'bg-[#f5e6d3] text-[#8b5a2b]',
    silver: 'bg-[#e8eef4] text-[#64748b]',
    gold: 'bg-[#fef3c7] text-[#b45309]',
  };
  const labels: Record<LoyaltyTier, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[tier]}`}
    >
      {labels[tier]}
    </span>
  );
}

export function AdminCustomersPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchCustomers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async (row: CustomerRow) => {
    const ok = await confirm({
      title: `Delete ${row.name}?`,
      description:
        row.inquiryCount > 0
          ? `This removes the customer record. Their ${row.inquiryCount} inquir${
              row.inquiryCount === 1 ? 'y stays' : 'ies stay'
            } in Orders & Inquiries.`
          : 'This removes the customer record. This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;

    setDeletingId(row.id);
    setError(null);
    try {
      await deleteCustomer(row.id);
      setRows((prev) => prev.filter((c) => c.id !== row.id));
      if (detailId === row.id) setDetailId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete customer');
    } finally {
      setDeletingId(null);
    }
  };

  const onSaved = (updated: CustomerRow) => {
    setRows((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  };

  return (
    <div className="space-y-5">
      {confirmDialog}
      <p className={adminUi.pageIntro}>
        People who sent an inquiry or registered on the storefront. Open a row to edit details,
        set a loyalty badge, or assign vouchers.
      </p>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-[#9aa7b5]">Loading…</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-[#9aa7b5]">No customers yet.</p>
      )}
      <div className={`${adminUi.card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[13.5px]">
            <thead>
              <tr className={adminUi.tableHead}>
                <th className="px-[18px] py-3">Customer ID</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Address</th>
                <th className="px-3 py-3">Inquiries</th>
                <th className="px-[18px] py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-[#f1f5f9]">
                  <td className="px-[18px] py-3.5 font-mono text-[12.5px] font-semibold text-[#0369a1]">
                    {c.customerCode}
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-[#1e2a38]">{c.name}</span>
                      <LoyaltyChip tier={c.loyaltyTier} />
                      {!c.hasAccount ? (
                        <span className={adminUi.badgeGray}>No account</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-[#516171]">{c.email || '—'}</td>
                  <td className="px-3 py-3.5 text-[#516171]">{c.phone || '—'}</td>
                  <td className="max-w-[200px] truncate px-3 py-3.5 text-[#7a8899]">
                    {c.address || '—'}
                  </td>
                  <td className="px-3 py-3.5 text-[#1e2a38]">{c.inquiryCount}</td>
                  <td className="px-[18px] py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailId(c.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#9aa7b5] transition hover:bg-sky-50 hover:text-[#0ea5e9]"
                        title="View / edit"
                        aria-label={`View ${c.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === c.id}
                        onClick={() => void handleDelete(c)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#9aa7b5] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Delete"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailId ? (
        <CustomerDetailPanel
          customerId={detailId}
          onClose={() => setDetailId(null)}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}

function CustomerDetailPanel({
  customerId,
  onClose,
  onSaved,
}: {
  customerId: string;
  onClose: () => void;
  onSaved: (row: CustomerRow) => void;
}) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loyaltyTier, setLoyaltyTier] = useState<LoyaltyTier | ''>('');

  const [catalog, setCatalog] = useState<StoreVoucher[]>([]);
  const [voucherId, setVoucherId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchCustomerDetail(customerId);
      setDetail(d);
      setName(d.customer.name);
      setPhone(d.customer.phone ?? '');
      setEmail(d.customer.email ?? '');
      setAddress(d.customer.address ?? '');
      setLoyaltyTier(d.customer.loyaltyTier ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
    void loadVouchers().then((cfg) =>
      setCatalog((cfg.vouchers ?? []).filter((v) => v.enabled))
    );
  }, [customerId]);

  const copyCode = async () => {
    if (!detail?.customer.customerCode) return;
    try {
      await navigator.clipboard.writeText(detail.customer.customerCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateCustomer(customerId, {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        loyaltyTier: loyaltyTier || null,
      });
      onSaved(updated);
      setDetail((prev) => (prev ? { ...prev, customer: { ...prev.customer, ...updated } } : prev));
      setSuccess('Customer saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const assignCatalog = async () => {
    if (!voucherId) return;
    setAssigning(true);
    setError(null);
    try {
      const claim = await assignCustomerClaim(customerId, { voucherId });
      setDetail((prev) =>
        prev ? { ...prev, claims: [claim, ...prev.claims.filter((c) => c.id !== claim.id)] } : prev
      );
      setVoucherId('');
      setSuccess('Voucher assigned.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign voucher');
    } finally {
      setAssigning(false);
    }
  };

  const assignCustom = async () => {
    if (!customTitle.trim()) return;
    setAssigning(true);
    setError(null);
    try {
      const claim = await assignCustomerClaim(customerId, {
        title: customTitle.trim(),
        voucherCode: customCode.trim() || undefined,
      });
      setDetail((prev) =>
        prev ? { ...prev, claims: [claim, ...prev.claims.filter((c) => c.id !== claim.id)] } : prev
      );
      setCustomTitle('');
      setCustomCode('');
      setSuccess('Custom perk assigned.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign perk');
    } finally {
      setAssigning(false);
    }
  };

  const removeClaim = async (claim: CustomerClaim) => {
    setError(null);
    try {
      await removeCustomerClaim(customerId, claim.id);
      setDetail((prev) =>
        prev ? { ...prev, claims: prev.claims.filter((c) => c.id !== claim.id) } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove claim');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#eef3f7] px-5 py-4">
          <div>
            <p className={adminUi.sectionLabel}>Customer details</p>
            {detail ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#eff8ff] px-2.5 py-1 font-mono text-[13px] font-bold text-[#0369a1] hover:bg-[#e0f2fe]"
                  title="Copy Customer ID"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {detail.customer.customerCode}
                </button>
                <LoyaltyChip tier={detail.customer.loyaltyTier} />
              </div>
            ) : (
              <p className="mt-1 text-sm text-[#9aa7b5]">Loading…</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#9aa7b5] hover:bg-[#f7fafd] hover:text-[#1e2a38]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {success}
            </div>
          ) : null}

          {loading || !detail ? (
            <p className="text-sm text-[#9aa7b5]">Loading customer…</p>
          ) : (
            <div className="space-y-6">
              <form onSubmit={(e) => void save(e)} className="space-y-3">
                <label className="block">
                  <span className={adminUi.label}>Name</span>
                  <input
                    className={adminUi.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className={adminUi.label}>Email</span>
                  <input
                    type="email"
                    className={adminUi.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={adminUi.label}>Phone</span>
                  <input
                    className={adminUi.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={adminUi.label}>Address</span>
                  <textarea
                    className={adminUi.textarea}
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={adminUi.label}>Loyalty badge</span>
                  <select
                    className={adminUi.select}
                    value={loyaltyTier}
                    onChange={(e) =>
                      setLoyaltyTier((e.target.value as LoyaltyTier | '') || '')
                    }
                  >
                    <option value="">None</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                  </select>
                </label>
                <div className="flex gap-2 pt-1">
                  <button type="button" className={adminUi.btnGhost} onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className={adminUi.btnPrimary}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>

              <section>
                <p className={adminUi.sectionLabel}>Vouchers</p>
                {!detail.customer.hasAccount ? (
                  <p className="mt-2 text-[13px] text-[#7a8899]">
                    This customer has no storefront account yet. They must register before you can
                    assign vouchers.
                  </p>
                ) : (
                  <div className="mt-2 space-y-3">
                    <ul className="space-y-2">
                      {detail.claims.length === 0 ? (
                        <li className="text-[13px] text-[#9aa7b5]">No vouchers assigned.</li>
                      ) : (
                        detail.claims.map((claim) => (
                          <li
                            key={claim.id}
                            className="flex items-start justify-between gap-2 rounded-xl border border-[#e8eef4] bg-[#f9fbfd] px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="m-0 text-sm font-semibold text-[#1e2a38]">
                                {claim.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#7a8899]">
                                {claim.voucherCode ? `Code ${claim.voucherCode} · ` : ''}
                                {claim.source === 'admin' ? 'Admin' : 'Cool Deals'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void removeClaim(claim)}
                              className="shrink-0 text-[12px] font-semibold text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </li>
                        ))
                      )}
                    </ul>

                    <div className="rounded-xl border border-[#e8eef4] p-3 space-y-2">
                      <p className="m-0 text-[12px] font-semibold text-[#516171]">
                        Assign catalog voucher
                      </p>
                      <select
                        className={adminUi.select}
                        value={voucherId}
                        onChange={(e) => setVoucherId(e.target.value)}
                      >
                        <option value="">Select voucher…</option>
                        {catalog.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.code} — {v.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!voucherId || assigning}
                        onClick={() => void assignCatalog()}
                        className={adminUi.btnSoft}
                      >
                        Assign voucher
                      </button>
                    </div>

                    <div className="rounded-xl border border-[#e8eef4] p-3 space-y-2">
                      <p className="m-0 text-[12px] font-semibold text-[#516171]">
                        Custom perk
                      </p>
                      <input
                        className={adminUi.input}
                        placeholder="Title"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                      />
                      <input
                        className={adminUi.input}
                        placeholder="Code (optional)"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                      />
                      <button
                        type="button"
                        disabled={!customTitle.trim() || assigning}
                        onClick={() => void assignCustom()}
                        className={adminUi.btnSoft}
                      >
                        Add custom perk
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {detail.inquiries.length > 0 ? (
                <section>
                  <p className={adminUi.sectionLabel}>Recent inquiries</p>
                  <ul className="mt-2 space-y-1.5">
                    {detail.inquiries.slice(0, 8).map((inq) => (
                      <li
                        key={inq.id}
                        className="rounded-lg border border-[#f1f5f9] px-3 py-2 text-[12.5px] text-[#516171]"
                      >
                        <span className="font-semibold text-[#1e2a38]">
                          {inq.productLabel || 'Inquiry'}
                        </span>
                        {' · '}
                        {inq.status}
                        {' · '}
                        {new Date(inq.createdAt).toLocaleDateString('en-PH')}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
