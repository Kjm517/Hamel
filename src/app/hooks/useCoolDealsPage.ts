import { useEffect, useState } from 'react';
import {
  getCoolDealsPage,
  loadCoolDealsPage,
  type CoolDealsPageConfig,
} from '../data/cool-deals-page';
import { usePageLoading } from '../context/SiteLoadingContext';

export function useCoolDealsPage(): CoolDealsPageConfig {
  const [config, setConfig] = useState<CoolDealsPageConfig>(() => getCoolDealsPage());
  const [loading, setLoading] = useState(true);
  usePageLoading(loading, 'cool-deals-page');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadCoolDealsPage().then((next) => {
      if (cancelled) return;
      setConfig(next);
      setLoading(false);
    });
    const refresh = () => setConfig(getCoolDealsPage());
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void loadCoolDealsPage().then((next) => {
        if (!cancelled) setConfig(next);
      });
    };
    window.addEventListener('hamel-cool-deals-updated', refresh);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-cool-deals-updated', refresh);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  return config;
}
