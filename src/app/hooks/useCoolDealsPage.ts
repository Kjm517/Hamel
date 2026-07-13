import { useEffect, useState } from 'react';
import {
  getCoolDealsPage,
  loadCoolDealsPage,
  type CoolDealsPageConfig,
} from '../data/cool-deals-page';

export function useCoolDealsPage(): CoolDealsPageConfig {
  const [config, setConfig] = useState<CoolDealsPageConfig>(() => getCoolDealsPage());

  useEffect(() => {
    void loadCoolDealsPage().then(setConfig);
    const refresh = () => setConfig(getCoolDealsPage());
    window.addEventListener('hamel-cool-deals-updated', refresh);
    return () => window.removeEventListener('hamel-cool-deals-updated', refresh);
  }, []);

  return config;
}
