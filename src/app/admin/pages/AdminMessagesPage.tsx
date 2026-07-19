import { useEffect, useState } from 'react';
import { fetchMessages, setMessageStatus, type MessageRow } from '../lib/messages-api';
import { adminUi } from '../lib/admin-ui';

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
    <div className="space-y-5">
      <p className={adminUi.pageIntro}>
        Messages from contact forms and chat sessions.
      </p>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-[#9aa7b5]">Loading…</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-[#9aa7b5]">No messages yet.</p>
      )}
      <div className="space-y-3">
        {rows.map((m) => (
          <div key={m.id} className={`${adminUi.card} p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[#1e2a38]">{m.name}</p>
                <p className="text-[12px] text-[#9aa7b5]">
                  {m.channel} · {m.contact || 'no contact'} ·{' '}
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
              <select
                value={m.status}
                onChange={(e) =>
                  void setMessageStatus(m.id, e.target.value as MessageRow['status']).then(load)
                }
                className="h-8 rounded-[9px] border border-[#e4ebf2] bg-[#f7fafd] px-2 text-[12px] text-[#516171] focus:border-sky-300 focus:bg-white focus:outline-none"
              >
                <option value="unread">unread</option>
                <option value="read">read</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[13.5px] text-[#516171]">{m.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
