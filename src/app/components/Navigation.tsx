import { Search, MessageCircle, Menu, Home, Package, Percent, Mail } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router';
import { useEffect, useState, type ReactNode } from 'react';
import { SearchModal } from './SearchModal';
import { ContactOptionsModal } from './ContactOptionsModal';
import { hamelAssets } from '../data/hamelAssets';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useStoreSettings } from '../context/StoreSettingsContext';
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
  return `font-medium pb-0.5 border-b-2 transition-colors ${
    isActive
      ? 'text-[#0EA5E9] border-[#0EA5E9]'
      : 'text-gray-700 border-transparent hover:text-[#0EA5E9]'
  }`;
}

function mobileNavLinkClass(isActive: boolean) {
  return `block rounded-lg px-3 py-3 text-base font-semibold transition-colors ${
    isActive ? 'bg-[#E0F2FE] text-[#0EA5E9]' : 'text-gray-800 hover:bg-gray-50'
  }`;
}

function CoolDealsPercentIcon() {
  return (
    <span
      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#0EA5E9] text-[10px] font-black leading-none text-white shadow-sm"
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
}: {
  customNav: PromoPage[];
  showCoolDealsIcon: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
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
          {showCoolDealsIcon ? <CoolDealsPercentIcon /> : null}
          Cool Deals
        </span>
      </MainNavLink>
      <MainNavLink to="/why-hamel" mobile={mobile} onNavigate={onNavigate}>
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
      active ? 'text-[#0EA5E9]' : 'text-gray-500'
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
}: {
  customNav: PromoPage[];
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 pb-8">
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

export function Navigation() {
  const { settings } = useStoreSettings();
  const { pathname } = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
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
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3 sm:gap-6 lg:gap-8">
              <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
                <ImageWithFallback
                  src={hamelAssets.branding.soloLogo}
                  alt="Hamel Trading"
                  className="h-9 w-auto shrink-0 object-contain sm:h-11"
                />
                <div className="min-w-0">
                  <div className="text-xl font-bold leading-tight sm:text-2xl" style={{ color: '#0EA5E9' }}>
                    HAMEL
                  </div>
                  <div className="hidden text-xs text-gray-600 sm:block">The Cooling Experts</div>
                </div>
              </Link>

              <nav className="hidden items-center gap-8 lg:flex">
                <NavLinks customNav={customNav} showCoolDealsIcon={showCoolDealsIcon} />
              </nav>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="flex h-11 w-11 items-center justify-center text-gray-600 hover:text-[#0EA5E9]"
                  aria-label="Search"
                >
                  <Search size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsContactOpen(true)}
                  className="flex items-center gap-2 rounded-full px-3 py-2 font-semibold text-gray-900 transition-opacity hover:opacity-90 sm:px-6 sm:py-2.5"
                  style={{ backgroundColor: '#FFC107' }}
                >
                  <MessageCircle size={18} />
                  <span className="hidden md:inline">Chat with Us</span>
                </button>
              </div>
            </div>
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
            <MoreMenu customNav={customNav} onNavigate={() => setMoreOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ContactOptionsModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
