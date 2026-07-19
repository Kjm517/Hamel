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

function kindStyle(kind: NotificationItem['kind']) {
  if (kind === 'inquiry') return 'bg-[#fef3c7] text-[#b45309]';
  if (kind === 'customer') return 'bg-[#dcfce7] text-[#15803d]';
  return 'bg-[#e0f2fe] text-[#0369a1]';
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
        className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#e4ebf2] bg-white text-[#516171] transition hover:border-sky-300 hover:bg-[#f0f9ff] hover:text-[#0369a1]"
        aria-label={
          count > 0 ? `Notifications — ${count} items needing attention` : 'Notifications'
        }
        aria-expanded={open}
        title="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 ? (
          <span className="absolute right-[7px] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9.5px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[50px] z-[60] w-[380px] overflow-hidden rounded-2xl border border-[#e8eef4] bg-white shadow-[0_20px_48px_-16px_rgba(15,31,46,0.35)]">
            <div className="flex items-start justify-between gap-2.5 px-[18px] pb-3 pt-4">
              <div>
                <p className="text-[15px] font-extrabold text-[#1e2a38]">Notifications</p>
                <p className="mt-px text-xs text-[#9aa7b5]">
                  Messages, pending inquiries &amp; new customers
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 px-[18px] pb-3 text-[11.5px] font-bold">
              <span className="inline-flex items-center rounded-full bg-[#e0f2fe] px-2.5 py-0.5 text-[#0369a1]">
                {messageCount} message{messageCount === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[#b45309]">
                {inquiryCount} inquir{inquiryCount === 1 ? 'y' : 'ies'}
              </span>
              <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[#15803d]">
                {customerCount} customer{customerCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="max-h-[340px] overflow-y-auto border-t border-[#f1f5f9]">
              {loading && items.length === 0 ? (
                <p className="px-[18px] py-8 text-center text-sm text-[#9aa7b5]">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-[18px] py-8 text-center text-sm text-[#9aa7b5]">
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
                      className="flex gap-3 border-b border-[#f5f8fb] px-[18px] py-3.5 hover:bg-[#f7fbfe]"
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${kindStyle(item.kind)}`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-[#1e2a38]">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[#516171]">
                          {item.detail}
                        </span>
                        <span className="mt-1 block text-[11px] text-[#9aa7b5]">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="grid grid-cols-3 gap-px border-t border-[#eef3f8] bg-[#eef3f8]">
              <Link
                to="/admin/messages"
                onClick={() => setOpen(false)}
                className="bg-white px-2 py-2.5 text-center text-xs font-bold text-[#516171] hover:text-[#0ea5e9]"
              >
                Messages
              </Link>
              <Link
                to="/admin/inquiries"
                onClick={() => setOpen(false)}
                className="bg-white px-2 py-2.5 text-center text-xs font-bold text-[#516171] hover:text-[#0ea5e9]"
              >
                Inquiries
              </Link>
              <Link
                to="/admin/customers"
                onClick={() => setOpen(false)}
                className="bg-white px-2 py-2.5 text-center text-xs font-bold text-[#516171] hover:text-[#0ea5e9]"
              >
                Customers
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
