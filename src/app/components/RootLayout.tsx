import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { CatalogProvider } from '../context/CatalogContext';
import { ProductTagsProvider } from '../context/ProductTagsContext';
import { StoreSettingsProvider, useStoreSettings } from '../context/StoreSettingsContext';
import { SiteLoadingProvider } from '../context/SiteLoadingContext';
import { CustomerAuthProvider } from '../context/CustomerAuthContext';
import { ClaimedVouchersProvider } from '../context/ClaimedVouchersContext';
import { trackEvent } from '../admin/lib/ops-api';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { CustomerAuthModal } from './CustomerAuthModal';
import { GlobalAIChatBot } from './GlobalAIChatBot';
import { SitePromoPopup } from './SitePromoPopup';
import { SiteLoadingScreen } from './SiteLoadingScreen';
import { MaintenancePage } from '../pages/MaintenancePage';
import { CountdownPage } from '../pages/CountdownPage';

function StorefrontShell() {
  const location = useLocation();
  const { settings, reload } = useStoreSettings();
  const underMaintenance = settings.maintenanceMode === true;
  const countdownActive = settings.countdownEnabled === true;
  const onMaintenanceRoute = location.pathname === '/maintenance';
  const onCountdownRoute = location.pathname === '/countdown';
  const hideChrome = underMaintenance || countdownActive || onMaintenanceRoute || onCountdownRoute;

  useEffect(() => {
    void trackEvent('pageview', location.pathname + location.search);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onUpdated = () => void reload();
    window.addEventListener('hamel-store-settings-updated', onUpdated);
    return () => window.removeEventListener('hamel-store-settings-updated', onUpdated);
  }, [reload]);

  if (underMaintenance) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
        <SiteLoadingScreen />
        <main className="flex-1">
          <MaintenancePage />
        </main>
      </div>
    );
  }

  if (countdownActive) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
        <SiteLoadingScreen />
        <main className="flex-1">
          <CountdownPage />
        </main>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col overflow-x-hidden ${
        hideChrome ? 'bg-white' : 'pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0'
      }`}
    >
      <SiteLoadingScreen />
      {!hideChrome ? <Navigation /> : null}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideChrome ? <Footer /> : null}
      {!hideChrome && settings.showAiChat ? <GlobalAIChatBot /> : null}
      {!hideChrome ? <SitePromoPopup /> : null}
      {!hideChrome ? <CustomerAuthModal /> : null}
    </div>
  );
}

export function RootLayout() {
  return (
    <StoreSettingsProvider>
      <ProductTagsProvider>
        <CatalogProvider>
          <SiteLoadingProvider>
            <CustomerAuthProvider>
              <ClaimedVouchersProvider>
                <StorefrontShell />
              </ClaimedVouchersProvider>
            </CustomerAuthProvider>
          </SiteLoadingProvider>
        </CatalogProvider>
      </ProductTagsProvider>
    </StoreSettingsProvider>
  );
}
