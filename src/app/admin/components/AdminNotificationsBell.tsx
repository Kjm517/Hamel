import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Bell, ClipboardList, MessageSquare, Users } from 'lucide-react';
import { fetchMessages } from '../lib/messages-api';
import { fetchInquiries, formatRelativeTime } from '../lib/inquiries-api';
import { fetchCustomers } from '../lib/customers-api';

type NotificationItem = {
  id: string;
  kind: 'message' | 'inquiry' | 'customer';
  title: string;
  detail: string;
  href: string;
  createdAt: string;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function kindIcon(kind: NotificationItem['kind']) {
  if (kind === 'inquiry') return ClipboardList;
  if (kind === 'customer') return Users;
  return MessageSquare;
}

function kindLabel(kind: NotificationItem['kind']) {
  if (kind === 'inquiry') return 'Order / inquiry';
  if (kind === 'customer') return 'Customer';
  return 'Message';
}

export function AdminNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [messages, inquiries, customers] = await Promise.all([
        fetchMessages(30).catch(() => []),
        fetchInquiries({ limit: 30, status: 'pending' }).catch(() => []),
        fetchCustomers(30).catch(() => []),
      ]);

      const weekAgo = Date.now() - WEEK_MS;
      const next: NotificationItem[] = [];

      for (const message of messages.filter((m) => m.status === 'unread')) {
        next.push({
          id: `message-${message.id}`,
          kind: 'message',
          title: message.name || 'New message',
          detail: message.body?.trim() || 'Unread contact message',
          href: '/admin/messages',
          createdAt: message.createdAt,
        });
      }

      for (const inquiry of inquiries) {
        next.push({
          id: `inquiry-${inquiry.id}`,
          kind: 'inquiry',
          title: inquiry.customerName || 'New inquiry',
          detail: `${inquiry.product} · ${inquiry.hpQty}`,
          href: '/admin/inquiries',
          createdAt: inquiry.createdAt,
        });
      }

      for (const customer of customers) {
        const created = new Date(customer.createdAt).getTime();
        if (Number.isNaN(created) || created < weekAgo) continue;
        next.push({
          id: `customer-${customer.id}`,
          kind: 'customer',
          title: customer.name || 'New customer',
          detail: customer.phone || customer.email || 'Added this week',
          href: '/admin/customers',
          createdAt: customer.createdAt,
        });
      }

      next.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(next.slice(0, 12));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const count = items.length;
  const messageCount = items.filter((i) => i.kind === 'message').length;
  const inquiryCount = items.filter((i) => i.kind === 'inquiry').length;
  const customerCount = items.filter((i) => i.kind === 'customer').length;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#0EA5E9]"
        aria-label={
          count > 0 ? `Notifications — ${count} items needing attention` : 'Notifications'
        }
        aria-expanded={open}
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[22rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Messages, pending inquiries, and new customers
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-gray-100 px-4 py-2.5 text-[11px] font-semibold">
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-800">
              {messageCount} message{messageCount === 1 ? '' : 's'}
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-900">
              {inquiryCount} inquir{inquiryCount === 1 ? 'y' : 'ies'}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">
              {customerCount} customer{customerCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                You’re all caught up.
              </p>
            ) : (
              items.map((item) => {
                const Icon = kindIcon(item.kind);
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 border-b border-gray-50 px-4 py-3 hover:bg-[#F0F9FF]"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {kindLabel(item.kind)}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-semibold text-gray-900">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-gray-600">
                        {item.detail}
                      </span>
                      <span className="mt-1 block text-[11px] text-gray-400">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          <div className="grid grid-cols-3 gap-px border-t border-gray-100 bg-gray-100">
            <Link
              to="/admin/messages"
              onClick={() => setOpen(false)}
              className="bg-white px-2 py-2.5 text-center text-xs font-semibold text-gray-700 hover:text-[#0EA5E9]"
            >
              Messages
            </Link>
            <Link
              to="/admin/inquiries"
              onClick={() => setOpen(false)}
              className="bg-white px-2 py-2.5 text-center text-xs font-semibold text-gray-700 hover:text-[#0EA5E9]"
            >
              Inquiries
            </Link>
            <Link
              to="/admin/customers"
              onClick={() => setOpen(false)}
              className="bg-white px-2 py-2.5 text-center text-xs font-semibold text-gray-700 hover:text-[#0EA5E9]"
            >
              Customers
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
