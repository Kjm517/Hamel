import { Search, MessageCircle } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router';
import { useEffect, useState, type ReactNode } from 'react';
import { SearchModal } from './SearchModal';
import { ContactOptionsModal } from './ContactOptionsModal';
import { hamelAssets } from '../data/hamelAssets';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useStoreSettings } from '../context/StoreSettingsContext';
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
}: {
  to: string;
  end?: boolean;
  isActiveWhen?: (pathname: string) => boolean;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        navLinkClass(isActiveWhen ? isActiveWhen(pathname) : isActive)
      }
    >
      {children}
    </NavLink>
  );
}

export function Navigation() {
  const { settings } = useStoreSettings();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [customNav, setCustomNav] = useState<PromoPage[]>(() => getNavPromoPages());
  const showCoolDealsIcon = settings.showCoolDealsNavIcon !== false;

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
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-8">
              <Link to="/" className="flex items-center gap-3">
                <ImageWithFallback
                  src={hamelAssets.branding.soloLogo}
                  alt="Hamel Trading"
                  className="h-11 w-auto object-contain"
                />
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#0EA5E9' }}>
                    HAMEL
                  </div>
                  <div className="text-xs text-gray-600">The Cooling Experts</div>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-8">
                <MainNavLink to="/" end>
                  Home
                </MainNavLink>
                <MainNavLink
                  to="/products"
                  isActiveWhen={(p) => p === '/products' || p.startsWith('/product/')}
                >
                  Products
                </MainNavLink>
                <MainNavLink to="/brands">Brands</MainNavLink>
                <MainNavLink to="/cool-deals">
                  <span className="inline-flex items-center gap-1.5">
                    {showCoolDealsIcon ? <CoolDealsPercentIcon /> : null}
                    Cool Deals
                  </span>
                </MainNavLink>
                <MainNavLink to="/why-hamel">Why Hamel</MainNavLink>
                {customNav.map((page) => {
                  const href = getPromoPageHref(page);
                  if (isExternalPromoLink(page)) {
                    return (
                      <a
                        key={page.id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={navLinkClass(false)}
                      >
                        {page.navLabel || page.title}
                      </a>
                    );
                  }
                  return (
                    <MainNavLink key={page.id} to={href || getPromoPagePath(page)}>
                      {page.navLabel || page.title}
                    </MainNavLink>
                  );
                })}
                <MainNavLink to="/contact">Contact</MainNavLink>
              </nav>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-600 hover:text-[#0EA5E9]"
                >
                  <Search size={22} />
                </button>
                <button
                  onClick={() => setIsContactOpen(true)}
                  className="px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity text-gray-900"
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

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ContactOptionsModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
