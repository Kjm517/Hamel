import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { products as seedProducts } from "../data/products";
import type { Product } from "../data/products";
import { loadCatalogProducts } from "../lib/catalog-api";

type CatalogContextValue = {
  products: Product[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await loadCatalogProducts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load catalog");
      setProducts(seedProducts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onCatalogUpdated = () => void reload();
    window.addEventListener("hamel-catalog-updated", onCatalogUpdated);
    return () => window.removeEventListener("hamel-catalog-updated", onCatalogUpdated);
  }, [reload]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [reload]);

  return (
    <CatalogContext.Provider value={{ products, loading, error, reload }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
