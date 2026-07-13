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

export function useBanner(page: PageKey): BannerConfig {
  const [banner, setBanner] = useState<BannerConfig>(() => getBanners()[page]);

  useEffect(() => {
    void loadBanners().then((store) => setBanner(store[page]));
    const refresh = () => setBanner(getBanners()[page]);
    window.addEventListener('hamel-banners-updated', refresh);
    return () => window.removeEventListener('hamel-banners-updated', refresh);
  }, [page]);

  return banner;
}

export function useHeroSlides(): BannerConfig[] {
  const [slides, setSlides] = useState<BannerConfig[]>(() => getBanners().heroSlides);

  useEffect(() => {
    void loadBanners().then((store) => setSlides(store.heroSlides));
    const refresh = () => setSlides(getBanners().heroSlides);
    window.addEventListener('hamel-banners-updated', refresh);
    return () => window.removeEventListener('hamel-banners-updated', refresh);
  }, []);

  return slides;
}

export function useFeaturedCollection(): FeaturedCollectionConfig {
  const [config, setConfig] = useState<FeaturedCollectionConfig>(() => getBanners().featuredCollection);

  useEffect(() => {
    void loadBanners().then((store) => setConfig(store.featuredCollection));
    const refresh = () => setConfig(getBanners().featuredCollection);
    window.addEventListener('hamel-banners-updated', refresh);
    return () => window.removeEventListener('hamel-banners-updated', refresh);
  }, []);

  return config;
}

export function usePromoBanners(): [PromoBannerItem, PromoBannerItem, PromoBannerItem] {
  const [banners, setBanners] = useState(() => getBanners().promoBanners);

  useEffect(() => {
    void loadBanners().then((store) => setBanners(store.promoBanners));
    const refresh = () => setBanners(getBanners().promoBanners);
    window.addEventListener('hamel-banners-updated', refresh);
    return () => window.removeEventListener('hamel-banners-updated', refresh);
  }, []);

  return banners;
}

export function useCoolDealsBanner(): CoolDealsBannerConfig {
  const [config, setConfig] = useState<CoolDealsBannerConfig>(() => getBanners().coolDealsBanner);

  useEffect(() => {
    void loadBanners().then((store) => setConfig(store.coolDealsBanner));
    const refresh = () => setConfig(getBanners().coolDealsBanner);
    window.addEventListener('hamel-banners-updated', refresh);
    return () => window.removeEventListener('hamel-banners-updated', refresh);
  }, []);

  return config;
}
