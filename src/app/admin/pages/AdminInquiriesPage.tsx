import { useEffect, useState } from 'react';
import { Copy, Sparkles, SlidersHorizontal, Trash2 } from 'lucide-react';
import {
  deleteInquiry,
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
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

const STATUSES: InquiryStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
const PRIORITIES: LeadScore[] = ['high', 'medium', 'low'];

function leadBadge(score: LeadScore | null | undefined) {
  if (score === 'high') {
    return 'inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800';
  }
  if (score === 'medium') {
    return adminUi.badgeAmber;
  }
  if (score === 'low') {
    return adminUi.badgeGray;
  }
  return adminUi.badgeGray;
}

function statusBadge(status: InquiryStatus | string) {
  if (status === 'completed') return adminUi.badgeGreen;
  if (status === 'pending') return adminUi.badgeAmber;
  if (status === 'confirmed') return adminUi.badgeSky;
  if (status === 'cancelled') return adminUi.badgeRed;
  return adminUi.badgeGray;
}

function statusLabel(status: InquiryStatus | string) {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function AdminInquiriesPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
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
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async (row: InquiryRow) => {
    const ok = await confirm({
      title: 'Delete this inquiry?',
      description: `Remove the inquiry from ${row.customerName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteInquiry(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      if (selected?.id === row.id) setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete inquiry');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {confirmDialog}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className={adminUi.pageIntro}>
          Customer inquiries from the site. Review priority, update status, or draft a reply.
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value)}
            className="h-10 rounded-[10px] border border-[#e4ebf2] bg-white px-3 text-[13.5px] text-[#516171] focus:border-sky-300 focus:outline-none"
          >
            <option value="all">All priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 rounded-[10px] border border-[#e4ebf2] bg-white px-3 text-[13.5px] text-[#516171] focus:border-sky-300 focus:outline-none"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-[#9aa7b5]">Loading…</p>}

      {!loading && rows.length === 0 && (
        <p className="text-sm text-[#9aa7b5]">
          No inquiries yet. They’ll show up here when someone asks from the website.
        </p>
      )}

      <div className={`${adminUi.card} overflow-hidden`}>
        <table className="min-w-full text-left text-[13.5px]">
          <thead>
            <tr className={adminUi.tableHead}>
              <th className="px-[18px] py-3">Priority</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">HP / Qty</th>
              <th className="px-3 py-3">When</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-[18px] py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-t border-[#f1f5f9] hover:bg-[#f0f9ff]"
                onClick={() => openInquiry(row)}
              >
                <td className="px-[18px] py-3.5">
                  <span className={leadBadge(row.leadScore)}>
                    {leadScoreLabel(row.leadScore)}
                  </span>
                </td>
                <td className="px-3 py-3.5 font-semibold text-[#1e2a38]">{row.customerName}</td>
                <td className="px-3 py-3.5 text-[#516171]">{row.product}</td>
                <td className="px-3 py-3.5 text-[#7a8899]">{row.hpQty}</td>
                <td className="px-3 py-3.5 text-[#9aa7b5]">{row.dateLabel}</td>
                <td className="px-3 py-3.5">
                  <span className={statusBadge(row.status)}>{statusLabel(row.status)}</span>
                </td>
                <td className="px-[18px] py-3.5 text-right">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(row);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#9aa7b5] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete"
                    aria-label={`Delete inquiry from ${row.customerName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
              <div className="flex flex-col items-end gap-2">
                <span className={leadBadge(selected.leadScore)}>
                  {selected.leadScore ? leadScoreLabel(selected.leadScore) : 'Unscored'}
                </span>
                <span className={statusBadge(selected.status)}>{statusLabel(selected.status)}</span>
              </div>
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
                    {statusLabel(s)}
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

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={deleting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                onClick={() => void handleDelete(selected)}
              >
                <Trash2 size={15} />
                Delete inquiry
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-gray-200 py-2 text-sm"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
