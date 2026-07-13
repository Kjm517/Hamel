import { useEffect, useState } from 'react';
import { getPromoPages, loadPromoPages, type PromoPage } from '../data/promo-pages';

export function usePromoPages(): PromoPage[] {
  const [pages, setPages] = useState<PromoPage[]>(() => getPromoPages());

  useEffect(() => {
    void loadPromoPages().then(setPages);
    const refresh = () => setPages(getPromoPages());
    window.addEventListener('hamel-promo-pages-updated', refresh);
    return () => window.removeEventListener('hamel-promo-pages-updated', refresh);
  }, []);

  return pages;
}

export function usePublishedPromoPages(): PromoPage[] {
  const pages = usePromoPages();
  return pages.filter((p) => p.published);
}
