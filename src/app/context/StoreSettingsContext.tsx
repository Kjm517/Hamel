import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_STORE,
  fetchStoreSettings,
  type StoreSettings,
} from '../admin/lib/ops-api';
import {
  buildMessengerUrl,
  buildTelHref,
  buildViberUrl,
  buildWhatsAppUrl,
  formatWhatsAppDisplay,
} from '../lib/store-contact';

type StoreSettingsContextValue = {
  settings: StoreSettings;
  loading: boolean;
  reload: () => Promise<void>;
  whatsappUrl: (message?: string) => string;
  messengerUrl: (opts?: { message?: string; ref?: string }) => string;
  viberUrl: string;
  telHref: string;
  whatsappDisplay: string;
};

const StoreSettingsContext = createContext<StoreSettingsContextValue | null>(null);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchStoreSettings();
      setSettings(next);
      if (typeof document !== 'undefined' && next.storeName) {
        document.title = next.storeName;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<StoreSettingsContextValue>(
    () => ({
      settings,
      loading,
      reload,
      whatsappUrl: (message?: string) => buildWhatsAppUrl(settings.whatsappNumber, message),
      messengerUrl: (opts?: { message?: string; ref?: string }) =>
        buildMessengerUrl(settings.messengerUrl, opts),
      viberUrl: buildViberUrl(settings.whatsappNumber),
      telHref: buildTelHref(settings.phoneDisplay || settings.whatsappNumber),
      whatsappDisplay: formatWhatsAppDisplay(settings.whatsappNumber),
    }),
    [settings, loading, reload]
  );

  return (
    <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>
  );
}

export function useStoreSettings(): StoreSettingsContextValue {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error('useStoreSettings must be used within StoreSettingsProvider');
  }
  return ctx;
}
