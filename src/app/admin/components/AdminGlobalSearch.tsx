import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { Search, Package, ClipboardList, Users, Loader2 } from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';
import { isStorefrontProduct } from '../../lib/catalog-product';
import { fetchInquiries } from '../lib/inquiries-api';
import { fetchCustomers } from '../lib/customers-api';

type SearchHit = {
  id: string;
  kind: 'product' | 'inquiry' | 'customer';
  title: string;
  detail: string;
  href: string;
};

const KIND_META = {
  product: { label: 'Product', icon: Package, tone: 'bg-[#e0f2fe] text-[#0369a1]' },
  inquiry: { label: 'Inquiry', icon: ClipboardList, tone: 'bg-[#fef3c7] text-[#b45309]' },
  customer: { label: 'Customer', icon: Users, tone: 'bg-[#dcfce7] text-[#15803d]' },
} as const;

export function AdminGlobalSearch() {
  const navigate = useNavigate();
  const { products } = useCatalog();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteHits, setRemoteHits] = useState<SearchHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();

  const productHits = useMemo(() => {
    if (q.length < 1) return [] as SearchHit[];
    return products
      .filter(isStorefrontProduct)
      .filter((p) => `${p.brand} ${p.model} ${p.id}`.toLowerCase().includes(q))
      .slice(0, 6)
      .map((p) => ({
        id: `product-${p.id}`,
        kind: 'product' as const,
        title: `${p.brand} ${p.model}`,
        detail: p.id,
        href: `/admin/products/${encodeURIComponent(p.id)}/edit`,
      }));
  }, [products, q]);

  useEffect(() => {
    if (q.length < 2) {
      setRemoteHits([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const [inquiries, customers] = await Promise.all([
            fetchInquiries({ limit: 40 }).catch(() => []),
            fetchCustomers(40).catch(() => []),
          ]);
          if (cancelled) return;

          const inquiryHits: SearchHit[] = inquiries
            .filter((row) =>
              `${row.customerName} ${row.product} ${row.phone} ${row.email}`
                .toLowerCase()
                .includes(q)
            )
            .slice(0, 5)
            .map((row) => ({
              id: `inquiry-${row.id}`,
              kind: 'inquiry',
              title: row.customerName || 'Inquiry',
              detail: `${row.product} · ${row.status}`,
              href: '/admin/inquiries',
            }));

          const customerHits: SearchHit[] = customers
            .filter((c) =>
              `${c.name} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q)
            )
            .slice(0, 5)
            .map((c) => ({
              id: `customer-${c.id}`,
              kind: 'customer',
              title: c.name || 'Customer',
              detail: c.phone || c.email || 'Customer',
              href: '/admin/customers',
            }));

          setRemoteHits([...inquiryHits, ...customerHits]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q]);

  const hits = useMemo(() => {
    if (q.length < 1) return [] as SearchHit[];
    return [...productHits, ...remoteHits].slice(0, 12);
  }, [productHits, remoteHits, q]);

  useEffect(() => {
    setActiveIndex(0);
  }, [hits.length, q]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const go = (hit: SearchHit) => {
    setOpen(false);
    setQuery('');
    navigate(hit.href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (hits[activeIndex]) go(hits[activeIndex]);
      else if (q) navigate(`/admin/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const showPanel = open && q.length > 0;

  return (
    <div className="relative ml-2 hidden max-w-[380px] flex-1 md:block" ref={rootRef}>
      <Search className="pointer-events-none absolute left-[13px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#9aa7b5]" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search products, inquiries, customers…"
        className="h-10 w-full rounded-full border border-[#e4ebf2] bg-[#f7fafd] py-0 pl-[38px] pr-3.5 text-[13.5px] text-[#1e2a38] placeholder:text-[#9aa7b5] transition focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-sky-500/12"
        aria-label="Search admin"
        aria-expanded={showPanel}
        aria-controls="admin-global-search-results"
        autoComplete="off"
      />

      {showPanel ? (
        <div
          id="admin-global-search-results"
          className="absolute left-0 right-0 top-[46px] z-50 overflow-hidden rounded-2xl border border-[#e8eef4] bg-white shadow-[0_20px_48px_-16px_rgba(15,31,46,0.35)]"
        >
          {loading && hits.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-[#9aa7b5]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : hits.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#9aa7b5]">
              No matches for “{query.trim()}”.
            </p>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto py-1">
              {hits.map((hit, index) => {
                const meta = KIND_META[hit.kind];
                const Icon = meta.icon;
                const active = index === activeIndex;
                return (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => go(hit)}
                      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left ${
                        active ? 'bg-[#f0f9ff]' : 'hover:bg-[#f7fbfe]'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${meta.tone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-bold text-[#1e2a38]">
                          {hit.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[#7a8899]">
                          {meta.label} · {hit.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-[#eef3f8] px-3.5 py-2 text-[11px] text-[#9aa7b5]">
            Enter to open · ↑↓ to move · Esc to close
          </div>
        </div>
      ) : null}
    </div>
  );
}
