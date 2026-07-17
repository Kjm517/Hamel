import { useState, useEffect } from 'react';
import {
  getBanners,
  loadBanners,
  type PageKey,
  type FeaturedCollectionConfig,
  type PromoBannerItem,
  type CoolDealsBannerConfig,
} from '../data/banners';
import type { BannerConfig } from '../components/PageBanner';
import { usePageLoading } from '../context/SiteLoadingContext';

export function useBanner(page: PageKey): BannerConfig {
  const [banner, setBanner] = useState<BannerConfig>(() => getBanners()[page]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading, `banner:${page}`);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadBanners().then((store) => {
      if (cancelled) return;
      setBanner(store[page]);
      setLoading(false);
    });
    const refresh = () => setBanner(getBanners()[page]);
    window.addEventListener('hamel-banners-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-banners-updated', refresh);
    };
  }, [page]);

  return banner;
}

export function useHeroSlides(): BannerConfig[] {
  const [slides, setSlides] = useState<BannerConfig[]>(() => getBanners().heroSlides);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading, 'hero-slides');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadBanners().then((store) => {
      if (cancelled) return;
      setSlides(store.heroSlides);
      setLoading(false);
    });
    const refresh = () => setSlides(getBanners().heroSlides);
    window.addEventListener('hamel-banners-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-banners-updated', refresh);
    };
  }, []);

  return slides;
}

export function useFeaturedCollection(): FeaturedCollectionConfig {
  const [config, setConfig] = useState<FeaturedCollectionConfig>(() => getBanners().featuredCollection);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading, 'featured-collection');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadBanners().then((store) => {
      if (cancelled) return;
      setConfig(store.featuredCollection);
      setLoading(false);
    });
    const refresh = () => setConfig(getBanners().featuredCollection);
    window.addEventListener('hamel-banners-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-banners-updated', refresh);
    };
  }, []);

  return config;
}

export function usePromoBanners(): [PromoBannerItem, PromoBannerItem, PromoBannerItem] {
  const [banners, setBanners] = useState(() => getBanners().promoBanners);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading, 'promo-banners');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadBanners().then((store) => {
      if (cancelled) return;
      setBanners(store.promoBanners);
      setLoading(false);
    });
    const refresh = () => setBanners(getBanners().promoBanners);
    window.addEventListener('hamel-banners-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-banners-updated', refresh);
    };
  }, []);

  return banners;
}

export function useCoolDealsBanner(): CoolDealsBannerConfig {
  const [config, setConfig] = useState<CoolDealsBannerConfig>(() => getBanners().coolDealsBanner);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading, 'cool-deals-banner');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadBanners().then((store) => {
      if (cancelled) return;
      setConfig(store.coolDealsBanner);
      setLoading(false);
    });
    const refresh = () => setConfig(getBanners().coolDealsBanner);
    window.addEventListener('hamel-banners-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('hamel-banners-updated', refresh);
    };
  }, []);

  return config;
}
