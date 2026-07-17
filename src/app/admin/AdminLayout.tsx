import { NavLink, Outlet, Link, useNavigate } from 'react-router';
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
  Search,
  Sparkles,
  CreditCard,
  Ticket,
  Megaphone,
} from 'lucide-react';
import { useAdminAuth } from './context/AdminAuthContext';
import { signOutAdmin } from './lib/admin-auth';
import { AdminProductsNav } from './components/AdminProductsNav';
import { AdminNotificationsBell } from './components/AdminNotificationsBell';
import { resolveStorageImageUrl } from '../lib/storage';

const navMain = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/pages', label: 'Website pages', icon: Image },
  { to: '/admin/promo-event', label: 'Promo event', icon: Sparkles },
  { to: '/admin/promo-popup', label: 'Promo popups', icon: Megaphone },
  { to: '/admin/tags', label: 'Tags', icon: Bookmark },
  { to: '/admin/installments', label: 'Card installments', icon: CreditCard },
  { to: '/admin/vouchers', label: 'Vouchers', icon: Ticket },
] as const;

const navAfterProducts = [
  { to: '/admin/inquiries', label: 'Orders & Inquiries', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/promos', label: 'Promotions', icon: Tag },
  { to: '/admin/employees', label: 'Team Members', icon: UserCog, managerOnly: true },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'border-l-[3px] border-[#0EA5E9] bg-[#E0F2FE] text-[#0EA5E9]'
      : 'text-gray-700 hover:bg-gray-100'
  }`;
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
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';

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
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-[#0EA5E9] font-bold text-white`}
    >
      {initials}
    </span>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, employee, canManageTeam } = useAdminAuth();

  const navTail = navAfterProducts.filter(
    (item) => !('managerOnly' in item && item.managerOnly) || canManageTeam
  );

  const displayName = employee?.fullName || user?.email?.split('@')[0] || 'Admin';

  const handleSignOut = async () => {
    await signOutAdmin();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-5">
          <div className="text-lg font-bold text-[#0EA5E9]">❄️ HAMEL</div>
          <div className="text-xs text-gray-500">Admin Panel</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navMain.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navClass}>
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
          <AdminProductsNav />
          {navTail.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navClass}>
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 border-t border-gray-200 p-4">
          {employee && (
            <Link
              to="/admin/profile"
              className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-gray-50"
            >
              <ProfileAvatar
                name={employee.fullName}
                email={user?.email}
                avatarUrl={employee.avatarUrl}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{employee.fullName}</p>
                <p className="text-xs text-gray-500">{employee.role}</p>
              </div>
            </Link>
          )}
          {user?.email && (
            <p className="truncate px-1 text-xs text-gray-500" title={user.email}>
              {user.email}
            </p>
          )}
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#0EA5E9]"
          >
            <ExternalLink className="h-4 w-4" />
            View storefront
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6">
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search…"
              className="w-full rounded-full border border-gray-200 py-2 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <AdminNotificationsBell />
            <Link
              to="/admin/profile"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1 hover:border-[#0EA5E9] hover:bg-[#F0F9FF]"
              title="My profile"
            >
              <ProfileAvatar
                name={employee?.fullName}
                email={user?.email}
                avatarUrl={employee?.avatarUrl}
                size="sm"
              />
              <span className="hidden text-sm font-medium text-gray-800 md:inline">
                {displayName}
              </span>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
