import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { CatalogProvider } from '../context/CatalogContext';
import { ProductTagsProvider } from '../context/ProductTagsContext';
import { StoreSettingsProvider, useStoreSettings } from '../context/StoreSettingsContext';
import { SiteLoadingProvider } from '../context/SiteLoadingContext';
import { trackEvent } from '../admin/lib/ops-api';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { GlobalAIChatBot } from './GlobalAIChatBot';
import { SitePromoPopup } from './SitePromoPopup';
import { SiteLoadingScreen } from './SiteLoadingScreen';

function StorefrontShell() {
  const location = useLocation();
  const { settings, reload } = useStoreSettings();

  useEffect(() => {
    void trackEvent('pageview', location.pathname + location.search);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onUpdated = () => void reload();
    window.addEventListener('hamel-store-settings-updated', onUpdated);
    return () => window.removeEventListener('hamel-store-settings-updated', onUpdated);
  }, [reload]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteLoadingScreen />
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {settings.showAiChat ? <GlobalAIChatBot /> : null}
      <SitePromoPopup />
    </div>
  );
}

export function RootLayout() {
  return (
    <StoreSettingsProvider>
      <ProductTagsProvider>
        <CatalogProvider>
          <SiteLoadingProvider>
            <StorefrontShell />
          </SiteLoadingProvider>
        </CatalogProvider>
      </ProductTagsProvider>
    </StoreSettingsProvider>
  );
}
