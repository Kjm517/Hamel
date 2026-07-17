import { useEffect, useState } from 'react';
import { getBrandsPage, loadBrandsPage, type BrandsPageConfig } from '../data/brands-page';
import { usePageLoading } from '../context/SiteLoadingContext';

/** Load brands admin config. Pass trackPageLoading:false when used as a secondary data source. */
export function useBrandsPage(options?: { trackPageLoading?: boolean }): BrandsPageConfig {
  const trackPageLoading = options?.trackPageLoading !== false;
  const [config, setConfig] = useState<BrandsPageConfig>(() => getBrandsPage());
  const [loading, setLoading] = useState(true);
  usePageLoading(trackPageLoading ? loading : false, 'brands-page');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadBrandsPage().then((next) => {
      if (cancelled) return;
      setConfig(next);
      setLoading(false);
    });
    const refresh = () => setConfig(getBrandsPage());
    window.addEventListener('hamel-brands-page-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-brands-page-updated', refresh);
    };
  }, []);

  return config;
}
