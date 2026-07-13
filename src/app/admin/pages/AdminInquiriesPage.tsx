import { useEffect, useState } from 'react';
import {
  fetchInquiries,
  updateInquiryStatus,
  type InquiryRow,
  type InquiryStatus,
} from '../lib/inquiries-api';

const STATUSES: InquiryStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];

export function AdminInquiriesPage() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<InquiryRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInquiries({
        limit: 100,
        status: filter === 'all' ? undefined : filter,
      });
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filter]);

  const setStatus = async (id: string, status: InquiryStatus) => {
    await updateInquiryStatus(id, status);
    await load();
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders & Inquiries</h2>
          <p className="text-gray-600">Live inquiries from the storefront (Neon).</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {!loading && rows.length === 0 && (
        <p className="text-sm text-gray-500">No inquiries yet. Submit one from the storefront AI chat.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">HP / Qty</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-t border-gray-100 hover:bg-sky-50"
                onClick={() => setSelected(row)}
              >
                <td className="px-4 py-3 font-medium text-gray-900">{row.customerName}</td>
                <td className="px-4 py-3 text-gray-700">{row.product}</td>
                <td className="px-4 py-3 text-gray-600">{row.hpQty}</td>
                <td className="px-4 py-3 text-gray-500">{row.dateLabel}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize">
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelected(null)}>
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900">{selected.customerName}</h3>
            <p className="mt-1 text-sm text-gray-500">{selected.dateLabel}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-gray-500">Product</dt><dd className="font-medium">{selected.product}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd>{selected.phone || '—'}</dd></div>
              <div><dt className="text-gray-500">Address</dt><dd>{selected.address || '—'}</dd></div>
              <div><dt className="text-gray-500">Property</dt><dd>{[selected.propertyType, selected.floor].filter(Boolean).join(', ') || '—'}</dd></div>
              <div><dt className="text-gray-500">Schedule</dt><dd>{[selected.scheduleDate, selected.scheduleTime].filter(Boolean).join(', ') || '—'}</dd></div>
              <div><dt className="text-gray-500">Source</dt><dd>{selected.source || '—'}</dd></div>
            </dl>
            <label className="mt-6 block text-sm font-medium text-gray-700">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={selected.status}
                onChange={(e) => void setStatus(selected.id, e.target.value as InquiryStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-sm"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
