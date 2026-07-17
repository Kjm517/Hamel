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
    window.addEventListener('hamel-cool-deals-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-cool-deals-updated', refresh);
    };
  }, []);

  return config;
}
