import { Hono } from 'hono';
import { getSql } from '../db';
import { requireAuth, requireManager, type AuthVariables } from '../middleware/auth';

export const eventRoutes = new Hono<{ Variables: AuthVariables }>();

eventRoutes.post('/', async (c) => {
  const body = await c.req.json<{
    eventType?: string;
    path?: string;
    meta?: unknown;
  }>();
  const eventType = body.eventType?.trim();
  if (!eventType) return c.json({ error: 'eventType required' }, 400);

  const sql = getSql();
  await sql`
    insert into site_events (event_type, path, meta)
    values (
      ${eventType},
      ${body.path ?? null},
      ${JSON.stringify(body.meta ?? {})}::jsonb
    )
  `;
  return c.json({ ok: true });
});

export const analyticsRoutes = new Hono<{ Variables: AuthVariables }>();

/**
 * Clear only anonymous analytics events (pageviews, chat opens, etc.).
 * Operational records such as inquiries, customers, products, and messages remain untouched.
 */
analyticsRoutes.delete('/events', requireAuth, requireManager, async (c) => {
  const sql = getSql();
  const deleted = (await sql`
    delete from site_events
    returning id
  `) as { id: string }[];

  return c.json({ ok: true, deleted: deleted.length });
});

analyticsRoutes.get('/summary', requireAuth, async (c) => {
  try {
  const sql = getSql();

  const inquiryStats = (await sql`
    select
      count(*)::int as total,
      count(*) filter (where status = 'pending')::int as pending,
      count(*) filter (where status = 'confirmed')::int as confirmed,
      count(*) filter (where status = 'completed')::int as completed,
      count(*) filter (where created_at >= date_trunc('month', now()))::int as this_month,
      count(*) filter (
        where status = 'completed' and created_at >= date_trunc('month', now())
      )::int as completed_this_month
    from inquiries
  `) as Record<string, number>[];

  const customerCount = (await sql`
    select count(*)::int as total from customers
  `) as { total: number }[];

  const productCount = (await sql`
    select count(*)::int as total from products
  `) as { total: number }[];

  const events7 = (await sql`
    select count(*)::int as total
    from site_events
    where created_at >= now() - interval '7 days'
      and event_type = 'pageview'
  `) as { total: number }[];

  const events30 = (await sql`
    select count(*)::int as total
    from site_events
    where created_at >= now() - interval '30 days'
      and event_type = 'pageview'
  `) as { total: number }[];

  const chatSessions = (await sql`
    select count(*)::int as total
    from site_events
    where created_at >= now() - interval '30 days'
      and event_type = 'chat_open'
  `) as { total: number }[];

  const unreadMessages = (await sql`
    select count(*)::int as total from messages where status = 'unread'
  `) as { total: number }[];

  const topPaths = (await sql`
    select path, count(*)::int as views
    from site_events
    where event_type = 'pageview'
      and created_at >= now() - interval '30 days'
      and path is not null
    group by path
    order by views desc
    limit 10
  `) as { path: string; views: number }[];

  const pageviewsByDayRaw = (await sql`
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
           count(*)::int as views
    from site_events
    where event_type = 'pageview'
      and created_at >= now() - interval '14 days'
    group by date_trunc('day', created_at)
    order by date_trunc('day', created_at)
  `) as { day: string; views: number }[];

  const inquiriesByDayRaw = (await sql`
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
           count(*)::int as day_count
    from inquiries
    where created_at >= now() - interval '14 days'
    group by date_trunc('day', created_at)
    order by date_trunc('day', created_at)
  `) as { day: string; day_count: number }[];

  const chatsByDayRaw = (await sql`
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
           count(*)::int as day_count
    from site_events
    where event_type = 'chat_open'
      and created_at >= now() - interval '14 days'
    group by date_trunc('day', created_at)
    order by date_trunc('day', created_at)
  `) as { day: string; day_count: number }[];

  function fillDays(
    rows: Array<{ day: string; value: number }>,
    days = 14
  ): Array<{ day: string; value: number; label: string }> {
    const map = new Map(rows.map((r) => [r.day, r.value]));
    const out: Array<{ day: string; value: number; label: string }> = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      out.push({ day: key, value: map.get(key) ?? 0, label });
    }
    return out;
  }

  const pageviewsByDay = fillDays(
    pageviewsByDayRaw.map((r) => ({ day: r.day, value: Number(r.views) }))
  );
  const inquiriesByDay = fillDays(
    inquiriesByDayRaw.map((r) => ({ day: r.day, value: Number(r.day_count) }))
  );
  const chatsByDay = fillDays(
    chatsByDayRaw.map((r) => ({ day: r.day, value: Number(r.day_count) }))
  );

  const inquiryStatus = [
    { name: 'Pending', value: Number(inquiryStats[0]?.pending ?? 0), color: '#F59E0B' },
    { name: 'Confirmed', value: Number(inquiryStats[0]?.confirmed ?? 0), color: '#3B82F6' },
    { name: 'Completed', value: Number(inquiryStats[0]?.completed ?? 0), color: '#10B981' },
    {
      name: 'Cancelled',
      value: Math.max(
        0,
        Number(inquiryStats[0]?.total ?? 0) -
          Number(inquiryStats[0]?.pending ?? 0) -
          Number(inquiryStats[0]?.confirmed ?? 0) -
          Number(inquiryStats[0]?.completed ?? 0)
      ),
      color: '#9CA3AF',
    },
  ].filter((s) => s.value > 0);

  const trafficSeries = pageviewsByDay.map((p, i) => ({
    day: p.day,
    label: p.label,
    pageviews: p.value,
    inquiries: inquiriesByDay[i]?.value ?? 0,
    chats: chatsByDay[i]?.value ?? 0,
  }));

  return c.json({
    inquiries: inquiryStats[0] ?? {},
    customers: customerCount[0]?.total ?? 0,
    products: productCount[0]?.total ?? 0,
    pageviews7d: events7[0]?.total ?? 0,
    pageviews30d: events30[0]?.total ?? 0,
    chatSessions30d: chatSessions[0]?.total ?? 0,
    unreadMessages: unreadMessages[0]?.total ?? 0,
    topPaths,
    trafficSeries,
    inquiryStatus,
  });
  } catch (err) {
    console.error('[analytics/summary]', err);
    return c.json(
      { error: err instanceof Error ? err.message : 'Analytics query failed' },
      500
    );
  }
});

export const dashboardRoutes = new Hono<{ Variables: AuthVariables }>();

dashboardRoutes.get('/summary', requireAuth, async (c) => {
  const sql = getSql();

  const inquiryStats = (await sql`
    select
      count(*)::int as total,
      count(*) filter (where status = 'pending')::int as pending,
      count(*) filter (
        where status = 'completed' and created_at >= date_trunc('month', now())
      )::int as completed_this_month
    from inquiries
  `) as Record<string, number>[];

  const customers = (await sql`
    select count(*)::int as total from customers
  `) as { total: number }[];

  const pageviews = (await sql`
    select count(*)::int as total
    from site_events
    where event_type = 'pageview'
      and created_at >= now() - interval '7 days'
  `) as { total: number }[];

  const chats = (await sql`
    select count(*)::int as total
    from site_events
    where event_type = 'chat_open'
      and created_at >= now() - interval '7 days'
  `) as { total: number }[];

  const products = (await sql`
    select count(*)::int as total from products
  `) as { total: number }[];

  const s = inquiryStats[0] ?? { total: 0, pending: 0, completed_this_month: 0 };

  return c.json({
    cards: [
      {
        label: 'Total Inquiries',
        value: String(s.total ?? 0),
        subtext: 'All time',
        icon: 'inquiries',
        tone: 'blue',
      },
      {
        label: 'Pending Orders',
        value: String(s.pending ?? 0),
        subtext: 'Needs attention',
        icon: 'pending',
        tone: 'yellow',
      },
      {
        label: 'Completed This Month',
        value: String(s.completed_this_month ?? 0),
        subtext: 'This calendar month',
        icon: 'completed',
        tone: 'green',
      },
      {
        label: 'Active Customers',
        value: String(customers[0]?.total ?? 0),
        subtext: 'From inquiries',
        icon: 'customers',
        tone: 'purple',
      },
      {
        label: 'Website Visitors (7d)',
        value: String(pageviews[0]?.total ?? 0),
        subtext: 'Pageviews last 7 days',
        icon: 'visitors',
        tone: 'blue',
      },
      {
        label: 'Catalog Products',
        value: String(products[0]?.total ?? 0),
        subtext: 'In Neon',
        icon: 'pageviews',
        tone: 'yellow',
      },
      {
        label: 'AI Chat Opens (7d)',
        value: String(chats[0]?.total ?? 0),
        subtext: 'Last 7 days',
        icon: 'chat',
        tone: 'purple',
      },
    ],
  });
});
