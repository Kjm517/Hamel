import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  defaultProductTags,
  getProductTagsFromLocalStorage,
  setProductTagsCache,
  type ProductTag,
} from '../data/productTags';
import { fetchProductTagsFromDb } from '../lib/product-tags-api';

type ProductTagsContextValue = {
  tags: ProductTag[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const ProductTagsContext = createContext<ProductTagsContextValue | null>(null);

export function ProductTagsProvider({ children }: { children: ReactNode }) {
  const [tags, setTags] = useState<ProductTag[]>(() =>
    getProductTagsFromLocalStorage() ?? defaultProductTags
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await fetchProductTagsFromDb();
      setTags(loaded);
      setProductTagsCache(loaded);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load tags';
      setError(message);
      const fallback = getProductTagsFromLocalStorage() ?? defaultProductTags;
      setTags(fallback);
      setProductTagsCache(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onUpdated = () => void reload();
    window.addEventListener('hamel-product-tags-updated', onUpdated);
    return () => window.removeEventListener('hamel-product-tags-updated', onUpdated);
  }, [reload]);

  return (
    <ProductTagsContext.Provider value={{ tags, loading, error, reload }}>
      {children}
    </ProductTagsContext.Provider>
  );
}

export function useProductTags() {
  const ctx = useContext(ProductTagsContext);
  if (!ctx) {
    throw new Error('useProductTags must be used within ProductTagsProvider');
  }
  return ctx;
}
