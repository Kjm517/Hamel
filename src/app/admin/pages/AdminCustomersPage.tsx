import { useEffect, useState } from 'react';
import { fetchCustomers, type CustomerRow } from '../lib/customers-api';
import { adminUi } from '../lib/admin-ui';

export function AdminCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setRows(await fetchCustomers());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-5">
      <p className={adminUi.pageIntro}>Created automatically from storefront inquiries.</p>
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
              <th className="px-[18px] py-3">Inquiries</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#f1f5f9]">
                <td className="px-[18px] py-3.5 font-semibold text-[#1e2a38]">{c.name}</td>
                <td className="px-3 py-3.5 text-[#516171]">{c.phone || '—'}</td>
                <td className="px-3 py-3.5 text-[#7a8899]">{c.address || '—'}</td>
                <td className="px-[18px] py-3.5 text-[#1e2a38]">{c.inquiryCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
