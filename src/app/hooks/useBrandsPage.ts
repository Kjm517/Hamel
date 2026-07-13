import { useEffect, useState } from 'react';
import { getBrandsPage, loadBrandsPage, type BrandsPageConfig } from '../data/brands-page';

export function useBrandsPage(): BrandsPageConfig {
  const [config, setConfig] = useState<BrandsPageConfig>(() => getBrandsPage());

  useEffect(() => {
    void loadBrandsPage().then(setConfig);
    const refresh = () => setConfig(getBrandsPage());
    window.addEventListener('hamel-brands-page-updated', refresh);
    return () => window.removeEventListener('hamel-brands-page-updated', refresh);
  }, []);

  return config;
}
