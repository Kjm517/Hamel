import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Users,
  Eye,
  MousePointerClick,
  TrendingUp,
  MessageSquare,
  Plus,
  BarChart3,
  Package,
} from 'lucide-react';
import {
  fetchRecentInquiries,
  type InquiryRow,
  type InquiryStatus,
} from '../lib/inquiries-api';
import {
  fetchAnalyticsSummary,
  fetchDashboardSummary,
  type AnalyticsSummary,
  type DashboardCard,
} from '../lib/ops-api';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { isStorefrontProduct } from '../../lib/catalog-product';
import { hamelAssets } from '../../data/hamelAssets';
import { fetchMessages } from '../lib/messages-api';

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
  blue: 'bg-[#e0f2fe] text-[#0ea5e9]',
  yellow: 'bg-[#fef3c7] text-[#d97706]',
  green: 'bg-[#dcfce7] text-[#16a34a]',
  purple: 'bg-[#ede9fe] text-[#7c3aed]',
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  pending: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-sky-50 text-sky-800',
  completed: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-red-50 text-red-700',
};

const BRAND_BAR_COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#0284c7', '#0369a1'];

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstName(full?: string | null, email?: string | null) {
  const fromName = full?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  const fromEmail = email?.split('@')[0];
  if (fromEmail) return fromEmail;
  return 'there';
}

function subtextParts(subtext: string) {
  const match = subtext.match(/^(↑\s*[^%\s]+%?|Needs attention|↓\s*[^%\s]+%?)\s*(.*)$/i);
  if (match) {
    const emphasis = match[1];
    const rest = match[2]?.trim();
    const isWarn = /need|attention/i.test(emphasis);
    return {
      emphasis,
      rest,
      emphasisClass: isWarn ? 'text-[#d97706] font-bold' : 'text-[#16a34a] font-bold',
    };
  }
  if (/need|attention/i.test(subtext)) {
    return { emphasis: subtext, rest: '', emphasisClass: 'text-[#d97706] font-bold' };
  }
  return { emphasis: '', rest: subtext, emphasisClass: '' };
}

export function DashboardPage() {
  const { employee, user } = useAdminAuth();
  const { products } = useCatalog();
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loadingInquiries, setLoadingInquiries] = useState(true);

  const loadInquiries = useCallback(async () => {
    setLoadingInquiries(true);
    try {
      setInquiries(await fetchRecentInquiries(5));
    } catch {
      setInquiries([]);
    } finally {
      setLoadingInquiries(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries();
    void fetchDashboardSummary()
      .then((res) => setCards(res.cards ?? []))
      .catch(() => setCards([]));
    void fetchAnalyticsSummary()
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
    void fetchMessages(40)
      .then((msgs) => setUnreadMessages(msgs.filter((m) => m.status === 'unread').length))
      .catch(() => setUnreadMessages(0));
  }, [loadInquiries]);

  const pendingCount =
    analytics?.inquiries?.pending ??
    cards.find((c) => /pending/i.test(c.label))?.value ??
    '0';
  const pendingNum =
    typeof pendingCount === 'number'
      ? pendingCount
      : Number(String(pendingCount).replace(/[^\d]/g, '')) || 0;

  const name = firstName(employee?.fullName, user?.email);
  const greeting = greetingForNow();

  const traffic = useMemo(() => {
    const series = analytics?.trafficSeries ?? [];
    if (series.length === 0) return [];
    return series.slice(-14);
  }, [analytics]);

  const topBrands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products.filter(isStorefrontProduct)) {
      const brand = p.brand?.trim() || 'Other';
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] ?? 1;
    return sorted.map(([brand, count], i) => ({
      name: brand,
      val: String(count),
      pct: Math.max(8, Math.round((count / max) * 100)),
      color: BRAND_BAR_COLORS[i % BRAND_BAR_COLORS.length],
    }));
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      if (!isStorefrontProduct(p)) return false;
      const stock = (p as { stockStatus?: string; stock?: number }).stockStatus;
      if (stock === 'Low Stock') return true;
      const n = (p as { stock?: number }).stock;
      return typeof n === 'number' && n > 0 && n <= 3;
    }).length;
  }, [products]);

  return (
    <div className="space-y-[22px]">
      {/* Hero */}
      <div className="relative mb-0 flex items-center gap-[18px] overflow-hidden rounded-[18px] bg-gradient-to-br from-[#0ea5e9] via-[#0284c7] to-[#075985] px-[26px] py-[22px] text-white">
        <div className="relative z-[1] min-w-0 flex-1">
          <div className="text-[13px] font-semibold opacity-85">
            {greeting}, {name} 👋
          </div>
          <div className="mt-0.5 text-[22px] font-extrabold">
            Here&apos;s how Hamel is doing today
          </div>
          <div className="mt-1.5 text-[13.5px] opacity-90">
            You have{' '}
            <strong>
              {pendingNum} new {pendingNum === 1 ? 'inquiry' : 'inquiries'}
            </strong>{' '}
            and{' '}
            <strong>
              {unreadMessages} unread {unreadMessages === 1 ? 'message' : 'messages'}
            </strong>{' '}
            waiting.
          </div>
        </div>
        <Link
          to="/admin/products/new"
          className="relative z-[1] inline-flex h-[42px] shrink-0 items-center gap-1.5 rounded-[11px] bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] px-[18px] text-[13.5px] font-bold text-[#422006] shadow-[0_6px_16px_-6px_rgba(245,158,11,0.8)] hover:brightness-105"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          Add product
        </Link>
        <img
          src={hamelAssets.mascot.cta}
          alt=""
          className="pointer-events-none absolute bottom-[-20px] right-[190px] w-[130px] opacity-30"
        />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(cards.length > 0 ? cards : Array.from({ length: 4 })).map((card, i) => {
          if (!card || typeof card === 'number') {
            return (
              <div
                key={`skeleton-${i}`}
                className="h-[128px] animate-pulse rounded-2xl border border-[#e8eef4] bg-white"
              />
            );
          }
          const Icon = ICONS[card.icon] ?? ClipboardList;
          const parts = subtextParts(card.subtext);
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-[#e8eef4] bg-white px-[18px] pb-4 pt-[18px] shadow-[0_1px_2px_rgba(30,42,56,0.03)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-[#7a8899]">{card.label}</span>
                <span
                  className={`flex h-[38px] w-[38px] items-center justify-center rounded-[11px] ${TONE_BG[card.tone] ?? TONE_BG.blue}`}
                >
                  <Icon className="h-[19px] w-[19px]" />
                </span>
              </div>
              <p className="mt-3 text-[30px] font-extrabold tracking-[-0.02em] text-[#1e2a38]">
                {card.value}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px]">
                {parts.emphasis ? (
                  <span className={parts.emphasisClass}>{parts.emphasis}</span>
                ) : null}
                {parts.rest ? <span className="text-[#9aa7b5]">{parts.rest}</span> : null}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main + sidebar */}
      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-[18px]">
          {/* Traffic */}
          <div className="rounded-2xl border border-[#e8eef4] bg-white px-[22px] py-5 shadow-[0_1px_2px_rgba(30,42,56,0.03)]">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="m-0 text-[15.5px] font-bold text-[#1e2a38]">Website traffic</h3>
                <p className="mt-0.5 text-[12.5px] text-[#9aa7b5]">
                  Pageviews &amp; inquiries · last 14 days
                </p>
              </div>
              <div className="flex gap-3.5 text-xs font-semibold text-[#516171]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#0ea5e9]" />
                  Pageviews
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#f59e0b]" />
                  Inquiries
                </span>
              </div>
            </div>
            <div className="h-[210px] w-full">
              {traffic.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[#9aa7b5]">
                  No traffic data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={traffic} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashPvFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#eef3f8" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#b4c0cc', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#b4c0cc', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e8eef4',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pageviews"
                      name="Pageviews"
                      stroke="#0ea5e9"
                      strokeWidth={2.5}
                      fill="url(#dashPvFill)"
                    />
                    <Line
                      type="monotone"
                      dataKey="inquiries"
                      name="Inquiries"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent inquiries */}
          <div className="overflow-hidden rounded-2xl border border-[#e8eef4] bg-white shadow-[0_1px_2px_rgba(30,42,56,0.03)]">
            <div className="flex items-center justify-between border-b border-[#eef3f8] px-[22px] py-[18px]">
              <h3 className="m-0 text-[15.5px] font-bold text-[#1e2a38]">Recent inquiries</h3>
              <Link
                to="/admin/inquiries"
                className="text-[13px] font-semibold text-[#0ea5e9] hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="bg-[#f9fbfd]">
                    <th className="px-[22px] py-2.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#9aa7b5]">
                      Customer
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#9aa7b5]">
                      Product
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#9aa7b5]">
                      When
                    </th>
                    <th className="px-[22px] py-2.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#9aa7b5]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingInquiries ? (
                    <tr>
                      <td colSpan={4} className="px-[22px] py-10 text-center text-[#9aa7b5]">
                        Loading inquiries…
                      </td>
                    </tr>
                  ) : inquiries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-[22px] py-10 text-center text-[#9aa7b5]">
                        No inquiries yet.
                      </td>
                    </tr>
                  ) : (
                    inquiries.map((row) => (
                      <tr key={row.id} className="border-t border-[#f1f5f9]">
                        <td className="px-[22px] py-3.5 font-semibold text-[#1e2a38]">
                          {row.customerName}
                        </td>
                        <td className="px-3 py-3.5 text-[#516171]">
                          <div>{row.product}</div>
                          <div className="text-[11.5px] text-[#9aa7b5]">{row.hpQty}</div>
                        </td>
                        <td className="px-3 py-3.5 text-[#516171]">{row.dateLabel}</td>
                        <td className="px-[22px] py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11.5px] font-bold capitalize ${STATUS_STYLES[row.status]}`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-[18px]">
          <div className="rounded-2xl border border-[#e8eef4] bg-white p-5 shadow-[0_1px_2px_rgba(30,42,56,0.03)]">
            <h3 className="mb-3.5 text-[15px] font-bold text-[#1e2a38]">Quick actions</h3>
            <div className="flex flex-col gap-2.5">
              <Link
                to="/admin/products/new"
                className="flex w-full items-center gap-2.5 rounded-[11px] border border-[#e8eef4] bg-white px-3.5 py-2.5 text-left text-[13.5px] font-semibold text-[#1e2a38] hover:border-sky-300 hover:bg-[#f0f9ff]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#e0f2fe] text-[#0ea5e9]">
                  <Plus className="h-[17px] w-[17px]" />
                </span>
                Add new product
              </Link>
              <Link
                to="/admin/inquiries"
                className="flex w-full items-center gap-2.5 rounded-[11px] border border-[#e8eef4] bg-white px-3.5 py-2.5 text-left text-[13.5px] font-semibold text-[#1e2a38] hover:border-sky-300 hover:bg-[#f0f9ff]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#fef3c7] text-[#d97706]">
                  <ClipboardList className="h-[17px] w-[17px]" />
                </span>
                Review pending orders
              </Link>
              <Link
                to="/admin/analytics"
                className="flex w-full items-center gap-2.5 rounded-[11px] border border-[#e8eef4] bg-white px-3.5 py-2.5 text-left text-[13.5px] font-semibold text-[#1e2a38] hover:border-sky-300 hover:bg-[#f0f9ff]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#dcfce7] text-[#16a34a]">
                  <BarChart3 className="h-[17px] w-[17px]" />
                </span>
                Open analytics
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e8eef4] bg-white p-5 shadow-[0_1px_2px_rgba(30,42,56,0.03)]">
            <h3 className="m-0 text-[15px] font-bold text-[#1e2a38]">Top brands</h3>
            <p className="mb-3.5 mt-1 text-xs text-[#9aa7b5]">By catalog share</p>
            {topBrands.length === 0 ? (
              <p className="text-sm text-[#9aa7b5]">No products yet.</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {topBrands.map((b) => (
                  <div key={b.name}>
                    <div className="mb-1.5 flex justify-between text-[12.5px]">
                      <span className="font-semibold text-[#1e2a38]">{b.name}</span>
                      <span className="font-semibold text-[#9aa7b5]">{b.val}</span>
                    </div>
                    <div className="h-[7px] overflow-hidden rounded-full bg-[#eef3f8]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${b.pct}%`, background: b.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#d6ecfb] bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] p-[18px]">
            <img
              src={hamelAssets.mascot.assistance}
              alt=""
              className="h-[58px] w-[58px] shrink-0 object-contain"
            />
            <div>
              <div className="text-[13.5px] font-bold text-[#0369a1]">Tip from Hamel</div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-[#38607a]">
                {lowStockCount > 0 ? (
                  <>
                    {lowStockCount} product{lowStockCount === 1 ? '' : 's'}{' '}
                    {lowStockCount === 1 ? 'is' : 'are'} low on stock. Update inventory to keep
                    listings live.
                  </>
                ) : (
                  <>
                    Keep listings fresh — review pending inquiries and publish new products this
                    week.
                  </>
                )}
              </div>
              {lowStockCount > 0 ? (
                <Link
                  to="/admin/products"
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold text-[#0ea5e9] hover:underline"
                >
                  <Package className="h-3.5 w-3.5" />
                  View products
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
