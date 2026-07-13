import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Users,
  Eye,
  MousePointerClick,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import {
  completeInquiry,
  fetchRecentInquiries,
  isPersistedInquiryId,
  type InquiryRow,
  type InquiryStatus,
} from '../lib/inquiries-api';
import { fetchDashboardSummary, type DashboardCard } from '../lib/ops-api';

const ICONS: Record<string, typeof ClipboardList> = {
  inquiries: ClipboardList,
  pending: Clock,
  completed: CheckCircle2,
  customers: Users,
  visitors: Eye,
  pageviews: MousePointerClick,
  bounce: TrendingUp,
  chat: MessageSquare,
};

const TONE_BG: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  yellow: 'bg-amber-100 text-amber-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  pending: 'border border-orange-200 bg-orange-50 text-orange-700',
  confirmed: 'border border-blue-200 bg-blue-50 text-blue-700',
  completed: 'border border-green-200 bg-green-50 text-green-700',
  cancelled: 'border border-gray-200 bg-gray-50 text-gray-600',
};

export function DashboardPage() {
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    setLoadingInquiries(true);
    setInquiryError(null);
    try {
      setInquiries(await fetchRecentInquiries(5));
    } catch (e) {
      setInquiries([]);
      setInquiryError(e instanceof Error ? e.message : 'Could not load inquiries');
    } finally {
      setLoadingInquiries(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries();
    void fetchDashboardSummary()
      .then((res) => setCards(res.cards ?? []))
      .catch(() => setCards([]));
  }, [loadInquiries]);

  const handleComplete = async (row: InquiryRow) => {
    if (row.status === 'completed') return;
    setCompletingId(row.id);
    setInquiryError(null);
    const previous = inquiries;
    setInquiries((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, status: 'completed' as const } : r))
    );
    try {
      if (isPersistedInquiryId(row.id)) {
        await completeInquiry(row.id);
      }
    } catch (e) {
      setInquiries(previous);
      setInquiryError(e instanceof Error ? e.message : 'Could not mark inquiry complete');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Overview of your Hamel store</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = ICONS[card.icon] ?? ClipboardList;
          return (
            <div
              key={card.label}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{card.subtext}</p>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE_BG[card.tone] ?? TONE_BG.blue}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Recent Inquiries</h3>
        </div>

        {inquiryError && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {inquiryError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Customer Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Product</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">HP / QTY</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingInquiries ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading inquiries…</td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No inquiries yet.</td>
                </tr>
              ) : (
                inquiries.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4 font-medium text-gray-900">{row.customerName}</td>
                    <td className="px-6 py-4 text-gray-700">{row.product}</td>
                    <td className="px-6 py-4 text-gray-600">{row.hpQty}</td>
                    <td className="px-6 py-4 text-gray-600">{row.dateLabel}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {row.status !== 'completed' && (
                        <button
                          type="button"
                          disabled={completingId === row.id}
                          onClick={() => void handleComplete(row)}
                          className="rounded-md bg-[#0EA5E9] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0284C7] disabled:opacity-60"
                        >
                          {completingId === row.id ? 'Saving…' : 'Complete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <Link to="/admin/inquiries" className="text-sm font-medium text-[#0EA5E9] hover:underline">
            View All Inquiries →
          </Link>
        </div>
      </div>
    </div>
  );
}
