import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteCustomer, fetchCustomers, type CustomerRow } from '../lib/customers-api';
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

export function AdminCustomersPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete customer');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {confirmDialog}
      <p className={adminUi.pageIntro}>
        People who sent an inquiry. New ones show up here automatically.
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
        <table className="min-w-full text-left text-[13.5px]">
          <thead>
            <tr className={adminUi.tableHead}>
              <th className="px-[18px] py-3">Name</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Address</th>
              <th className="px-3 py-3">Inquiries</th>
              <th className="px-[18px] py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#f1f5f9]">
                <td className="px-[18px] py-3.5 font-semibold text-[#1e2a38]">{c.name}</td>
                <td className="px-3 py-3.5 text-[#516171]">{c.phone || '—'}</td>
                <td className="px-3 py-3.5 text-[#7a8899]">{c.address || '—'}</td>
                <td className="px-3 py-3.5 text-[#1e2a38]">{c.inquiryCount}</td>
                <td className="px-[18px] py-3.5 text-right">
                  <button
                    type="button"
                    disabled={deletingId === c.id}
                    onClick={() => void handleDelete(c)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#9aa7b5] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete"
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
