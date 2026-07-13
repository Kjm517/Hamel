import { useEffect, useState } from 'react';
import { fetchMessages, setMessageStatus, type MessageRow } from '../lib/messages-api';

export function AdminMessagesPage() {
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await fetchMessages());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <p className="text-gray-600">Contact and AI session messages.</p>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && rows.length === 0 && <p className="text-sm text-gray-500">No messages yet.</p>}
      <div className="space-y-3">
        {rows.map((m) => (
          <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500">
                  {m.channel} · {m.contact || 'no contact'} · {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
              <select
                value={m.status}
                onChange={(e) =>
                  void setMessageStatus(m.id, e.target.value as MessageRow['status']).then(load)
                }
                className="rounded border border-gray-200 px-2 py-1 text-xs"
              >
                <option value="unread">unread</option>
                <option value="read">read</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{m.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
