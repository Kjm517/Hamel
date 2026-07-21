import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Image,
  ClipboardList,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  UserCog,
  Tag,
  Bookmark,
  ExternalLink,
  LogOut,
  Sparkles,
  CreditCard,
  Ticket,
  Megaphone,
  Package,
  PanelsTopLeft,
  FileText,
  User,
  Menu,
} from 'lucide-react';
import { useAdminAuth } from './context/AdminAuthContext';
import { signOutAdmin } from './lib/admin-auth';
import { AdminNotificationsBell } from './components/AdminNotificationsBell';
import { AdminGlobalSearch } from './components/AdminGlobalSearch';
import { resolveStorageImageUrl } from '../lib/storage';
import { hamelAssets } from '../data/hamelAssets';
import { getAdminPageMeta } from './lib/admin-page-meta';
import { fetchInquiries } from './lib/inquiries-api';
import { fetchMessages } from './lib/messages-api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  managerOnly?: boolean;
  badge?: 'inquiries' | 'messages';
  match?: (pathname: string, search: string) => boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: 'Main',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Catalog',
    items: [
      {
        to: '/admin/products',
        label: 'Products',
        icon: Package,
        match: (pathname) =>
          pathname === '/admin/products' || pathname.startsWith('/admin/products/'),
      },
      {
        to: '/admin/pages',
        label: 'Website pages',
        icon: Image,
        end: true,
        match: (pathname, search) => {
          if (pathname !== '/admin/pages') return false;
          const tab = new URLSearchParams(search).get('tab');
          return tab !== 'promo';
        },
      },
      {
        to: '/admin/banners',
        label: 'Banners',
        icon: PanelsTopLeft,
      },
    ],
  },
  {
    label: 'Sales',
    items: [
      {
        to: '/admin/inquiries',
        label: 'Orders & Inquiries',
        icon: ClipboardList,
        badge: 'inquiries',
      },
      { to: '/admin/customers', label: 'Customers', icon: Users },
      { to: '/admin/messages', label: 'Messages', icon: MessageSquare, badge: 'messages' },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: '/admin/analytics', label: 'Analytics', icon: BarChart3 }],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/admin/promos', label: 'Promotions', icon: Tag },
      { to: '/admin/vouchers', label: 'Vouchers', icon: Ticket },
      { to: '/admin/tags', label: 'Tags', icon: Bookmark },
      { to: '/admin/promo-event', label: 'Promo events', icon: Sparkles },
      { to: '/admin/promo-popup', label: 'Promo pop-ups', icon: Megaphone },
      { to: '/admin/promo-pages', label: 'Promo pages', icon: FileText },
    ],
  },
  {
    label: 'Payments',
    items: [{ to: '/admin/installments', label: 'Installments', icon: CreditCard }],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/employees', label: 'Team members', icon: UserCog, managerOnly: true },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
      { to: '/admin/profile', label: 'My profile', icon: User },
    ],
  },
];

function navClass(active: boolean) {
  return [
    'flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold transition-colors',
    active
      ? 'bg-[#e0f2fe] text-[#0369a1]'
      : 'text-[#516171] hover:bg-[#e0f2fe] hover:text-[#0369a1]',
  ].join(' ');
}

function ProfileAvatar({
  name,
  email,
  avatarUrl,
  size = 'md',
}: {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
}) {
  const src = resolveStorageImageUrl(avatarUrl ?? undefined);
  const initials = (name?.trim() || email || 'AD').slice(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'h-9 w-9 text-[13px]' : 'h-9 w-9 text-sm';

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-[#0ea5e9] font-bold text-white`}
    >
      {initials}
    </span>
  );
}

function isItemActive(
  item: NavItem,
  pathname: string,
  search: string,
  isActive: boolean
) {
  if (item.match) return item.match(pathname, search);
  return isActive;
}

function SidebarContent({
  pathname,
  search,
  canManageTeam,
  pendingInquiries,
  unreadMessages,
  displayName,
  role,
  avatarUrl,
  onSignOut,
  onNavigate,
}: {
  pathname: string;
  search: string;
  canManageTeam: boolean;
  pendingInquiries: number;
  unreadMessages: number;
  displayName: string;
  role?: string | null;
  avatarUrl?: string | null;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-[11px] px-5 pb-[18px] pt-5">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#e0f2fe] to-[#f0f9ff] shadow-[inset_0_0_0_1px_#d6ecfb]">
          <img
            src={hamelAssets.branding.soloLogo}
            alt="Hamel"
            className="h-[30px] w-[30px] object-contain"
          />
        </div>
        <div className="leading-none">
          <div className="text-[17px] font-extrabold tracking-[0.04em] text-[#0ea5e9]">
            HAMEL
          </div>
          <div className="mt-0.5 text-[11px] font-semibold tracking-[0.02em] text-[#93a2b3]">
            Admin console
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3 pt-1">
        {navSections.map((section) => {
          const items = section.items.filter(
            (item) => !item.managerOnly || canManageTeam
          );
          if (items.length === 0) return null;
          return (
            <div key={section.label}>
              <div
                className={`px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa7b5] ${
                  section.label === 'Main' ? 'mb-1.5 mt-2' : 'mb-1.5 mt-[18px]'
                }`}
              >
                {section.label}
              </div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    navClass(isItemActive(item, pathname, search, isActive))
                  }
                >
                  <item.icon className="h-[19px] w-[19px] shrink-0" strokeWidth={2} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge === 'inquiries' && pendingInquiries > 0 ? (
                    <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-px text-[11px] font-bold text-white">
                      {pendingInquiries > 99 ? '99+' : pendingInquiries}
                    </span>
                  ) : null}
                  {item.badge === 'messages' && unreadMessages > 0 ? (
                    <span className="ml-auto rounded-full bg-[#e0f2fe] px-1.5 py-px text-[11px] font-bold text-[#0369a1]">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[#eef3f8] p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-[#f7fafd] p-2">
          <Link
            to="/admin/profile"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg hover:opacity-90"
          >
            <ProfileAvatar name={displayName} avatarUrl={avatarUrl} size="sm" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13.5px] font-bold text-[#1e2a38]">
                {displayName}
              </p>
              <p className="text-[11.5px] text-[#93a2b3]">{role || 'Admin'}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="shrink-0 rounded-lg p-1.5 text-[#93a2b3] hover:bg-white hover:text-[#0369a1]"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, employee, canManageTeam } = useAdminAuth();
  const [pendingInquiries, setPendingInquiries] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const displayName = employee?.fullName || user?.email?.split('@')[0] || 'Admin';
  const pageMeta = getAdminPageMeta(location.pathname, location.search);

  useEffect(() => {
    let cancelled = false;
    const loadBadges = async () => {
      try {
        const [inquiries, messages] = await Promise.all([
          fetchInquiries({ limit: 50, status: 'pending' }).catch(() => []),
          fetchMessages(50).catch(() => []),
        ]);
        if (cancelled) return;
        setPendingInquiries(inquiries.length);
        setUnreadMessages(messages.filter((m) => m.status === 'unread').length);
      } catch {
        if (!cancelled) {
          setPendingInquiries(0);
          setUnreadMessages(0);
        }
      }
    };
    void loadBadges();
    const timer = window.setInterval(() => void loadBadges(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOutAdmin();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div
      className="flex min-h-screen bg-[#f4f8fc] text-[#1e2a38]"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 flex-col border-r border-[#e8eef4] bg-white lg:flex">
        <SidebarContent
          pathname={location.pathname}
          search={location.search}
          canManageTeam={canManageTeam}
          pendingInquiries={pendingInquiries}
          unreadMessages={unreadMessages}
          displayName={displayName}
          role={employee?.role}
          avatarUrl={employee?.avatarUrl}
          onSignOut={() => void handleSignOut()}
        />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="flex w-[min(85vw,300px)] flex-col gap-0 bg-white p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent
            pathname={location.pathname}
            search={location.search}
            canManageTeam={canManageTeam}
            pendingInquiries={pendingInquiries}
            unreadMessages={unreadMessages}
            displayName={displayName}
            role={employee?.role}
            avatarUrl={employee?.avatarUrl}
            onSignOut={() => void handleSignOut()}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-[#e8eef4] bg-white/85 px-4 backdrop-blur-md sm:gap-[18px] sm:px-7">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#516171] hover:bg-[#f0f9ff] lg:hidden"
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="text-[11.5px] font-semibold tracking-[0.02em] text-[#93a2b3]">
              {pageMeta.crumb}
            </div>
            <h1 className="mt-px truncate text-[19px] font-extrabold tracking-[-0.01em] text-[#1e2a38]">
              {pageMeta.title}
            </h1>
          </div>

          <AdminGlobalSearch />

          <div className="ml-auto flex items-center gap-2.5">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e4ebf2] bg-white px-2.5 text-[13px] font-semibold text-[#516171] transition hover:border-sky-300 hover:bg-[#f0f9ff] hover:text-[#0369a1] sm:px-3.5"
            >
              <ExternalLink className="h-[15px] w-[15px]" />
              <span className="hidden sm:inline">Storefront</span>
            </Link>
            <AdminNotificationsBell />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
