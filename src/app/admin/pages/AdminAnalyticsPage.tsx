import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  fetchAnalyticsSummary,
  resetAnalyticsEvents,
  type AnalyticsSummary,
} from '../lib/ops-api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { adminUi } from '../lib/admin-ui';

const SKY = '#0EA5E9';
const AMBER = '#F59E0B';
const EMERALD = '#10B981';

function ChartCard({
  title,
  subtitle,
  children,
  empty,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className={`${adminUi.card} p-5`}>
      <div className="mb-4">
        <h3 className="font-semibold text-[#1e2a38]">{title}</h3>
        {subtitle && <p className="text-[12px] text-[#9aa7b5]">{subtitle}</p>}
      </div>
      {empty ? (
        <div className="flex h-56 items-center justify-center text-sm text-[#9aa7b5]">
          No data yet — browse the storefront to generate pageviews.
        </div>
      ) : (
        <div className="h-64 w-full">{children}</div>
      )}
    </div>
  );
}

export function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    void fetchAnalyticsSummary()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load analytics'));
  }, []);

  const resetAnalytics = async () => {
    setResetting(true);
    setError(null);
    try {
      await resetAnalyticsEvents();
      setData(await fetchAnalyticsSummary());
      setResetOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset analytics');
    } finally {
      setResetting(false);
    }
  };

  const cards = data
    ? [
        { label: 'Inquiries (all)', value: data.inquiries.total ?? 0 },
        { label: 'Pending', value: data.inquiries.pending ?? 0 },
        { label: 'Completed (month)', value: data.inquiries.completed_this_month ?? 0 },
        { label: 'Customers', value: data.customers },
        { label: 'Products', value: data.products },
        { label: 'Pageviews (7d)', value: data.pageviews7d },
        { label: 'Pageviews (30d)', value: data.pageviews30d },
        { label: 'Chat opens (30d)', value: data.chatSessions30d },
        { label: 'Unread messages', value: data.unreadMessages },
      ]
    : [];

  const traffic = data?.trafficSeries ?? [];
  const hasTraffic = traffic.some((d) => d.pageviews > 0 || d.inquiries > 0 || d.chats > 0);
  const status = data?.inquiryStatus ?? [];
  const paths = useMemo(
    () =>
      (data?.topPaths ?? []).map((p) => ({
        ...p,
        short: p.path.length > 24 ? `${p.path.slice(0, 22)}…` : p.path,
      })),
    [data?.topPaths]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className={adminUi.pageIntro}>Live metrics from Neon + pageview beacons.</p>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="inline-flex h-[42px] items-center gap-2 rounded-[11px] border border-red-200 bg-white px-3.5 text-[13.5px] font-semibold text-red-600 transition hover:bg-red-50"
        >
          <RotateCcw size={16} />
          Reset analytics
        </button>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {!data && !error && <p className="text-sm text-[#9aa7b5]">Loading…</p>}

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`${adminUi.card} p-5`}>
            <p className={adminUi.sectionLabel}>{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-[#1e2a38]">{c.value}</p>
          </div>
        ))}
      </div>

      {data && (
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Traffic (14 days)"
            subtitle="Pageviews, inquiries, and AI chat opens"
            empty={!hasTraffic}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={traffic} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SKY} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={SKY} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} width={32} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  name="Pageviews"
                  stroke={SKY}
                  fill="url(#pvFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="inquiries"
                  name="Inquiries"
                  stroke={AMBER}
                  fill="transparent"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="chats"
                  name="Chat opens"
                  stroke={EMERALD}
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Inquiry status"
            subtitle="Breakdown of all inquiries"
            empty={status.length === 0}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={status}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {status.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Top paths (30d)"
            subtitle="Most viewed storefront routes"
            empty={paths.length === 0}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paths}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis
                  type="category"
                  dataKey="short"
                  width={100}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <Tooltip
                  formatter={(value: number) => [value, 'Views']}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { path?: string } | undefined)?.path ?? ''
                  }
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="views" name="Views" fill={SKY} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Inquiries over time"
            subtitle="New inquiries per day (14 days)"
            empty={!traffic.some((d) => d.inquiries > 0)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={traffic} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} width={32} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="inquiries" name="Inquiries" fill={AMBER} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset analytics data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes tracked page views and chat-open events. Products, customers,
              messages, and inquiries will not be changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetting}
              onClick={(event) => {
                event.preventDefault();
                void resetAnalytics();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {resetting ? 'Resetting…' : 'Reset analytics'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
