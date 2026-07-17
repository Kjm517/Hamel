import { useEffect, useState } from 'react';
import { Copy, Sparkles, SlidersHorizontal } from 'lucide-react';
import {
  fetchInquiries,
  generateInquiryReplyDraft,
  leadScoreLabel,
  rescoreInquiry,
  updateInquiryPriority,
  updateInquiryStatus,
  type InquiryRow,
  type InquiryStatus,
  type LeadScore,
} from '../lib/inquiries-api';

const STATUSES: InquiryStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
const PRIORITIES: LeadScore[] = ['high', 'medium', 'low'];

function leadBadge(score: LeadScore | null | undefined) {
  if (score === 'high') {
    return 'bg-red-100 text-red-800';
  }
  if (score === 'medium') {
    return 'bg-amber-100 text-amber-900';
  }
  if (score === 'low') {
    return 'bg-slate-100 text-slate-700';
  }
  return 'bg-gray-100 text-gray-500';
}

export function AdminInquiriesPage() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [leadFilter, setLeadFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<InquiryRow | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [priorityMode, setPriorityMode] = useState<'manual' | 'auto'>('manual');
  const [manualPriority, setManualPriority] = useState<LeadScore>('medium');
  const [prioritySaving, setPrioritySaving] = useState(false);
  const [priorityError, setPriorityError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInquiries({
        limit: 100,
        status: filter === 'all' ? undefined : filter,
        leadScore: leadFilter === 'all' ? undefined : leadFilter,
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
  }, [filter, leadFilter]);

  const openInquiry = (row: InquiryRow) => {
    setSelected(row);
    setDraftError(null);
    setCopied(false);
    setPriorityError(null);
    setPriorityMode('manual');
    setManualPriority(row.leadScore ?? 'medium');
  };

  const applyPriorityLocal = (next: InquiryRow) => {
    setSelected(next);
    setRows((prev) => prev.map((r) => (r.id === next.id ? next : r)));
    setManualPriority(next.leadScore ?? 'medium');
  };

  const setStatus = async (id: string, status: InquiryStatus) => {
    await updateInquiryStatus(id, status);
    await load();
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  const onGenerateDraft = async () => {
    if (!selected) return;
    setDraftLoading(true);
    setDraftError(null);
    try {
      const res = await generateInquiryReplyDraft(selected.id);
      const next = { ...selected, aiReplyDraft: res.draft };
      setSelected(next);
      setRows((prev) => prev.map((r) => (r.id === next.id ? next : r)));
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Could not generate draft');
    } finally {
      setDraftLoading(false);
    }
  };

  const onAutoScore = async () => {
    if (!selected) return;
    setPrioritySaving(true);
    setPriorityError(null);
    try {
      const res = await rescoreInquiry(selected.id);
      applyPriorityLocal({
        ...selected,
        leadScore: res.leadScore,
        leadReasons: res.leadReasons,
      });
    } catch (e) {
      setPriorityError(e instanceof Error ? e.message : 'Auto-score failed');
    } finally {
      setPrioritySaving(false);
    }
  };

  const onManualSave = async () => {
    if (!selected) return;
    setPrioritySaving(true);
    setPriorityError(null);
    try {
      const res = await updateInquiryPriority(selected.id, manualPriority);
      applyPriorityLocal({
        ...selected,
        leadScore: res.leadScore,
        leadReasons: res.leadReasons,
      });
    } catch (e) {
      setPriorityError(e instanceof Error ? e.message : 'Could not save priority');
    } finally {
      setPrioritySaving(false);
    }
  };

  const copyDraft = async () => {
    if (!selected?.aiReplyDraft) return;
    await navigator.clipboard.writeText(selected.aiReplyDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders & Inquiries</h2>
          <p className="text-gray-600">
            Live inquiries with lead scoring and AI reply drafts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
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
              <th className="px-4 py-3">Priority</th>
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
                onClick={() => openInquiry(row)}
              >
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${leadBadge(row.leadScore)}`}
                  >
                    {leadScoreLabel(row.leadScore)}
                  </span>
                </td>
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selected.customerName}</h3>
                <p className="mt-1 text-sm text-gray-500">{selected.dateLabel}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${leadBadge(selected.leadScore)}`}
              >
                {selected.leadScore ? leadScoreLabel(selected.leadScore) : 'Unscored'}
              </span>
            </div>

            {selected.leadReasons && selected.leadReasons.length > 0 && (
              <ul className="mt-3 list-inside list-disc text-xs text-gray-600">
                {selected.leadReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}

            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Product</dt>
                <dd className="font-medium">{selected.product}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd>{selected.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd>{selected.address || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Property</dt>
                <dd>
                  {[selected.propertyType, selected.floor].filter(Boolean).join(', ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Schedule</dt>
                <dd>
                  {[selected.scheduleDate, selected.scheduleTime].filter(Boolean).join(', ') ||
                    '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Notes</dt>
                <dd className="whitespace-pre-wrap">{selected.notes || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Source</dt>
                <dd>{selected.source || '—'}</dd>
              </div>
            </dl>

            <div className="mt-6 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h4 className="text-sm font-semibold text-gray-900">Priority</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriorityMode('manual')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
                    priorityMode === 'manual'
                      ? 'border-[#0EA5E9] bg-white text-[#0EA5E9]'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <SlidersHorizontal size={15} />
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityMode('auto')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
                    priorityMode === 'auto'
                      ? 'border-[#0EA5E9] bg-white text-[#0EA5E9]'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Sparkles size={15} />
                  Auto-score
                </button>
              </div>

              {priorityMode === 'manual' ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Set the priority yourself.</p>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={manualPriority}
                    onChange={(e) => setManualPriority(e.target.value as LeadScore)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {leadScoreLabel(p)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={prioritySaving}
                    onClick={() => void onManualSave()}
                    className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {prioritySaving ? 'Saving…' : 'Save priority'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Score from phone, schedule, quantity, notes, and other inquiry details.
                  </p>
                  <button
                    type="button"
                    disabled={prioritySaving}
                    onClick={() => void onAutoScore()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0EA5E9] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    {prioritySaving ? 'Scoring…' : 'Run auto-score'}
                  </button>
                </div>
              )}
              {priorityError && <p className="text-xs text-red-600">{priorityError}</p>}
            </div>

            <label className="mt-6 block text-sm font-medium text-gray-700">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={selected.status}
                onChange={(e) => void setStatus(selected.id, e.target.value as InquiryStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-gray-900">AI reply draft</h4>
              <button
                type="button"
                onClick={() => void onGenerateDraft()}
                disabled={draftLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0EA5E9] px-3 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                <Sparkles size={16} />
                {draftLoading
                  ? 'Generating…'
                  : selected.aiReplyDraft
                    ? 'Regenerate draft'
                    : 'Generate reply draft'}
              </button>
              {draftError && <p className="text-xs text-red-600">{draftError}</p>}
              {selected.aiReplyDraft && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{selected.aiReplyDraft}</p>
                  <button
                    type="button"
                    onClick={() => void copyDraft()}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#0EA5E9] hover:underline"
                  >
                    <Copy size={14} />
                    {copied ? 'Copied' : 'Copy to clipboard'}
                  </button>
                </div>
              )}
            </div>

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
