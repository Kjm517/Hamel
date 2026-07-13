import { apiFetch } from '../../lib/api';

export type StoreSettings = {
  whatsappNumber: string;
  businessHours: string;
  storeName: string;
  contactEmail: string;
  showAiChat: boolean;
  address: string;
  phoneDisplay: string;
  messengerUrl: string;
};

export const DEFAULT_STORE: StoreSettings = {
  whatsappNumber: '639171234567',
  businessHours: 'Mon–Sat 9:00 AM – 6:00 PM',
  storeName: 'Hamel Trading',
  contactEmail: 'hello@hamel.example',
  showAiChat: true,
  address: '123 Osmeña Boulevard\nCebu City, 6000\nCebu, Philippines',
  phoneDisplay: '(032) 123-4567',
  messengerUrl: 'https://m.me/fcmtradingservices',
};

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const res = await apiFetch<{ data: Partial<StoreSettings> | null }>('/api/settings/store', {
      auth: false,
    });
    return { ...DEFAULT_STORE, ...(res.data ?? {}) };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

export async function saveStoreSettings(data: StoreSettings): Promise<void> {
  await apiFetch('/api/settings/store', {
    method: 'PUT',
    body: { data },
  });
}

export async function trackEvent(
  eventType: string,
  path?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await apiFetch('/api/events', {
      method: 'POST',
      body: { eventType, path, meta },
      auth: false,
    });
  } catch {
    // ignore analytics failures
  }
}

export type AnalyticsSummary = {
  inquiries: {
    total?: number;
    pending?: number;
    confirmed?: number;
    completed?: number;
    this_month?: number;
    completed_this_month?: number;
  };
  customers: number;
  products: number;
  pageviews7d: number;
  pageviews30d: number;
  chatSessions30d: number;
  unreadMessages: number;
  topPaths: Array<{ path: string; views: number }>;
  trafficSeries?: Array<{
    day: string;
    label: string;
    pageviews: number;
    inquiries: number;
    chats: number;
  }>;
  inquiryStatus?: Array<{ name: string; value: number; color: string }>;
};

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  return apiFetch<AnalyticsSummary>('/api/analytics/summary');
}

export type DashboardCard = {
  label: string;
  value: string;
  subtext: string;
  icon: string;
  tone: string;
};

export async function fetchDashboardSummary(): Promise<{ cards: DashboardCard[] }> {
  return apiFetch('/api/dashboard/summary');
}
