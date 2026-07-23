import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type SiteLoadingContextValue = {
  /** True when any page/route registered a pending load. */
  pageBusy: boolean;
  setPageLoading: (key: string, loading: boolean) => void;
};

const SiteLoadingContext = createContext<SiteLoadingContextValue | null>(null);

export function SiteLoadingProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<Record<string, true>>({});

  const setPageLoading = useCallback((key: string, loading: boolean) => {
    setKeys((prev) => {
      const has = Boolean(prev[key]);
      if (loading && has) return prev;
      if (!loading && !has) return prev;
      const next = { ...prev };
      if (loading) next[key] = true;
      else delete next[key];
      return next;
    });
  }, []);

  const pageBusy = Object.keys(keys).length > 0;

  const value = useMemo(
    () => ({ pageBusy, setPageLoading }),
    [pageBusy, setPageLoading]
  );

  return (
    <SiteLoadingContext.Provider value={value}>{children}</SiteLoadingContext.Provider>
  );
}

export function useSiteLoading() {
  const ctx = useContext(SiteLoadingContext);
  if (!ctx) throw new Error('useSiteLoading must be used within SiteLoadingProvider');
  return ctx;
}

/**
 * Register page-level loading with the full-screen dance loader.
 * Call from any storefront page that fetches data.
 */
export function usePageLoading(loading: boolean, key = 'page') {
  const ctx = useContext(SiteLoadingContext);


  const setPageLoading = ctx?.setPageLoading;

  useEffect(() => {
    if (!setPageLoading) return;
    setPageLoading(key, loading);
    return () => setPageLoading(key, false);
  }, [setPageLoading, key, loading]);
}
