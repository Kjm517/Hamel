import { Search, MessageCircle, Menu, Home, Package, Percent, Mail, Wrench, User, LogOut, Ticket, UserRoundPen, KeyRound } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router';
import { useEffect, useState, type ReactNode } from 'react';
import { SearchModal } from './SearchModal';
import { ContactOptionsModal } from './ContactOptionsModal';
import { BookMaintenanceModal } from './BookMaintenanceModal';
import { MyVouchersModal } from './MyVouchersModal';
import { AccountSettingsModal } from './AccountSettingsModal';
import { LoyaltyBadge } from './LoyaltyBadge';
import { hamelAssets } from '../data/hamelAssets';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import {
  getNavPromoPages,
  getPromoPageHref,
  getPromoPagePath,
  isExternalPromoLink,
  loadPromoPages,
  type PromoPage,
} from '../data/promo-pages';

function navLinkClass(isActive: boolean) {
  return `relative inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 text-[14px] font-medium transition-colors xl:px-3 xl:text-[15px] ${
    isActive
      ? 'font-semibold text-[#0EA5E9] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#0EA5E9]'
      : 'text-[#535763] hover:text-[#0EA5E9] hover:after:absolute hover:after:inset-x-2 hover:after:bottom-0 hover:after:h-0.5 hover:after:rounded-full hover:after:bg-[#7DD3FC]'
  }`;
}

function mobileNavLinkClass(isActive: boolean) {
  return `block rounded-2xl px-3 py-3 text-base font-semibold transition-colors ${
    isActive ? 'bg-[#E0F2FE] text-[#0EA5E9]' : 'text-[#0E1C3A] hover:bg-[#FBFBFD]'
  }`;
}

function CoolDealsPercentIcon() {
  return (
    <span
      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#0EA5E9] text-[10px] font-extrabold leading-none text-white"
      aria-hidden
    >
      %
    </span>
  );
}

function MainNavLink({
  to,
  end,
  isActiveWhen,
  children,
  onNavigate,
  mobile,
}: {
  to: string;
  end?: boolean;
  isActiveWhen?: (pathname: string) => boolean;
  children: ReactNode;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const { pathname } = useLocation();
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        (mobile ? mobileNavLinkClass : navLinkClass)(
          isActiveWhen ? isActiveWhen(pathname) : isActive
        )
      }
    >
      {children}
    </NavLink>
  );
}

function NavLinks({
  customNav,
  showCoolDealsIcon,
  mobile,
  onNavigate,
  onRequestService,
}: {
  customNav: PromoPage[];
  showCoolDealsIcon: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
  onRequestService?: () => void;
}) {
  return (
    <>
      <MainNavLink to="/" end mobile={mobile} onNavigate={onNavigate}>
        Home
      </MainNavLink>
      <MainNavLink
        to="/products"
        isActiveWhen={(p) => p === '/products' || p.startsWith('/product/')}
        mobile={mobile}
        onNavigate={onNavigate}
      >
        Products
      </MainNavLink>
      <MainNavLink to="/brands" mobile={mobile} onNavigate={onNavigate}>
        Brands
      </MainNavLink>
      <MainNavLink to="/cool-deals" mobile={mobile} onNavigate={onNavigate}>
        <span className="inline-flex items-center gap-1.5">
          {showCoolDealsIcon && !mobile ? <CoolDealsPercentIcon /> : null}
          Cool Deals
        </span>
      </MainNavLink>
      <MainNavLink to="/why-hamel" mobile={mobile} onNavigate={onNavigate}>
        Why Hamel
      </MainNavLink>
      {onRequestService && !mobile ? (
        <button type="button" onClick={onRequestService} className={navLinkClass(false)}>
          Service
        </button>
      ) : null}
      {customNav.map((page) => {
        const href = getPromoPageHref(page);
        if (isExternalPromoLink(page)) {
          return (
            <a
              key={page.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onNavigate}
              className={mobile ? mobileNavLinkClass(false) : navLinkClass(false)}
            >
              {page.navLabel || page.title}
            </a>
          );
        }
        return (
          <MainNavLink
            key={page.id}
            to={href || getPromoPagePath(page)}
            mobile={mobile}
            onNavigate={onNavigate}
          >
            {page.navLabel || page.title}
          </MainNavLink>
        );
      })}
      <MainNavLink to="/contact" mobile={mobile} onNavigate={onNavigate}>
        Contact
      </MainNavLink>
    </>
  );
}

const BOTTOM_TAB_ITEMS = [
  { to: '/', end: true, label: 'Home', icon: Home },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/cool-deals', label: 'Cool Deals', icon: Percent },
  { to: '/contact', label: 'Contact', icon: Mail },
] as const;

function BottomTabBar({
  moreActive,
  onMoreClick,
}: {
  moreActive: boolean;
  onMoreClick: () => void;
}) {
  const tabClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold leading-tight ${
      active ? 'text-[#0EA5E9]' : 'text-[#889296]'
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      {BOTTOM_TAB_ITEMS.map(({ to, end, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => tabClass(isActive)}>
          <Icon size={22} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onMoreClick}
        className={tabClass(moreActive)}
        aria-label="More navigation options"
      >
        <Menu size={22} strokeWidth={2} />
        More
      </button>
    </nav>
  );
}

function MoreMenu({
  customNav,
  onNavigate,
  onBook,
}: {
  customNav: PromoPage[];
  onNavigate: () => void;
  onBook: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 pb-8">
      <button
        type="button"
        onClick={onBook}
        className="mb-1 flex items-center gap-2.5 rounded-2xl bg-[#E0F2FE] px-3 py-3 text-base font-bold text-[#0E1C3A] transition-colors hover:bg-[#BAE6FD]/70"
      >
        <Wrench size={20} className="text-[#0EA5E9]" />
        Request a Service
      </button>
      <MainNavLink to="/brands" mobile onNavigate={onNavigate}>
        Brands
      </MainNavLink>
      <MainNavLink to="/why-hamel" mobile onNavigate={onNavigate}>
        Why Hamel
      </MainNavLink>
      {customNav.map((page) => {
        const href = getPromoPageHref(page);
        if (isExternalPromoLink(page)) {
          return (
            <a
              key={page.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onNavigate}
              className={mobileNavLinkClass(false)}
            >
              {page.navLabel || page.title}
            </a>
          );
        }
        return (
          <MainNavLink
            key={page.id}
            to={href || getPromoPagePath(page)}
            mobile
            onNavigate={onNavigate}
          >
            {page.navLabel || page.title}
          </MainNavLink>
        );
      })}
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AccountControl() {
  const { isAuthenticated, customer, openAuth, signOut, refresh } = useCustomerAuth();
  const [vouchersOpen, setVouchersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState<
    'menu' | 'profile' | 'password' | 'email'
  >('menu');

  const openSettings = (panel: 'menu' | 'profile' | 'password' | 'email' = 'menu') => {
    setSettingsPanel(panel);
    setSettingsOpen(true);
    void refresh();
  };

  if (!isAuthenticated || !customer) {
    return (
      <button
        type="button"
        onClick={() => openAuth({ view: 'login' })}
        className="hidden text-[15px] font-semibold text-[#5A6B72] transition-colors hover:text-[#0EA5E9] lg:inline"
        aria-label="Sign in"
      >
        Sign in
      </button>
    );
  }

  return (
    <>
      <DropdownMenu
        onOpenChange={(open) => {
          if (open) void refresh();
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-2xl border border-[#C5C1BD] bg-white py-1 pl-1 pr-1 transition-colors hover:border-[#0EA5E9] lg:pr-3"
            aria-label="Account menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0EA5E9] text-[13px] font-bold text-white">
              {initialsOf(customer.name)}
            </span>
            <span className="hidden max-w-[120px] truncate text-sm font-semibold text-[#0E1C3A] lg:inline">
              {customer.name.split(/\s+/)[0]}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-1.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{customer.name}</span>
              <LoyaltyBadge tier={customer.loyaltyTier} />
            </span>
            <span className="truncate text-xs font-normal text-gray-500">{customer.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => openSettings('menu')}
            className="flex cursor-pointer items-center gap-2"
          >
            <UserRoundPen size={16} className="text-[#0EA5E9]" />
            Account settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => openSettings('profile')}
            className="flex cursor-pointer items-center gap-2"
          >
            <User size={16} className="text-[#0EA5E9]" />
            Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => openSettings('email')}
            className="flex cursor-pointer items-center gap-2"
          >
            <Mail size={16} className="text-[#0EA5E9]" />
            Change email
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => openSettings('password')}
            className="flex cursor-pointer items-center gap-2"
          >
            <KeyRound size={16} className="text-[#0EA5E9]" />
            Change password
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setVouchersOpen(true)}
            className="flex cursor-pointer items-center gap-2"
          >
            <Ticket size={16} className="text-[#0EA5E9]" />
            My vouchers
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => void signOut()}
            className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600"
          >
            <LogOut size={16} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <MyVouchersModal open={vouchersOpen} onOpenChange={setVouchersOpen} />
      <AccountSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialPanel={settingsPanel}
      />
    </>
  );
}

export function Navigation() {
  const { settings } = useStoreSettings();
  const { pathname } = useLocation();
  const { openAuth, isAuthenticated } = useCustomerAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [customNav, setCustomNav] = useState<PromoPage[]>(() => getNavPromoPages());
  const showCoolDealsIcon = settings.showCoolDealsNavIcon !== false;
  const moreActive =
    pathname === '/brands' ||
    pathname === '/why-hamel' ||
    customNav.some((page) => getPromoPagePath(page) === pathname);

  useEffect(() => {
    const refresh = () => setCustomNav(getNavPromoPages());
    const reload = () => {
      void loadPromoPages().then(refresh);
    };

    reload();
    window.addEventListener('hamel-promo-pages-updated', refresh);
    window.addEventListener('focus', reload);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'hamel_promo_pages_ping') reload();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('hamel-promo-pages-updated', refresh);
      window.removeEventListener('focus', reload);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#C5C1BD]/60 bg-[#FBFBFD]">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-3 px-4 sm:h-[80px] sm:gap-5 sm:px-6 lg:gap-8 lg:px-8 xl:gap-10 xl:px-10">
            {/* Brand */}
            <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Hamel Trading home">
              <ImageWithFallback
                src={hamelAssets.branding.soloLogo}
                alt=""
                className="h-10 w-10 shrink-0 object-contain sm:h-[46px] sm:w-[46px]"
              />
              <div className="leading-none">
                <div className="text-[20px] font-extrabold tracking-tight text-[#0E1C3A] sm:text-[23px]">
                  HAMEL
                </div>
                <div className="mt-1 hidden text-[11px] font-medium text-[#889296] sm:block">
                  The Cooling Experts
                </div>
              </div>
            </Link>

            {/* Center nav — desktop */}
            <nav
              className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto lg:flex xl:gap-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Primary"
            >
              <NavLinks
                customNav={customNav}
                showCoolDealsIcon={showCoolDealsIcon}
                onRequestService={() => setIsBookOpen(true)}
              />
            </nav>

            {/* Actions */}
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3.5 lg:ml-0">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-2xl bg-[#DDE6F0] text-[#535763] transition-colors hover:bg-[#7DD3FC]/40 hover:text-[#0EA5E9]"
                aria-label="Search"
              >
                <Search size={19} strokeWidth={2.2} />
              </button>

              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => openAuth({ view: 'login' })}
                  className="hidden text-[15px] font-semibold text-[#535763] transition-colors hover:text-[#0EA5E9] lg:inline"
                >
                  Sign in
                </button>
              ) : (
                <AccountControl />
              )}

              {/* Mobile sign-in icon when logged out */}
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => openAuth({ view: 'login' })}
                  className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-2xl border border-[#C5C1BD] text-[#535763] transition-colors hover:text-[#0EA5E9] lg:hidden"
                  aria-label="Sign in"
                >
                  <User size={18} />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#F5B301] px-3 text-[14px] font-bold text-[#0E1C3A] shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-colors hover:bg-[#E6A600] sm:px-5 sm:text-[15px]"
              >
                <MessageCircle size={17} strokeWidth={2.2} />
                <span className="hidden sm:inline">Chat with Us</span>
              </button>
            </div>
        </div>
      </header>

      <BottomTabBar moreActive={moreActive} onMoreClick={() => setMoreOpen(true)} />

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[75vh] gap-0 rounded-t-2xl bg-white p-0 lg:hidden">
          <SheetHeader className="border-b border-gray-100 px-4 py-4 text-left">
            <SheetTitle className="text-lg font-bold text-[#0EA5E9]">More</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto">
            <MoreMenu
              customNav={customNav}
              onNavigate={() => setMoreOpen(false)}
              onBook={() => {
                setMoreOpen(false);
                setIsBookOpen(true);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ContactOptionsModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <BookMaintenanceModal isOpen={isBookOpen} onClose={() => setIsBookOpen(false)} />
    </>
  );
}
