import { Link, useSearchParams } from 'react-router';
import { Plus, Search, Edit, Trash2, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { deleteProduct, fetchProductList, saveProduct } from '../../lib/catalog-api';
import { AdminToggle } from '../components/AdminToggle';
import {
  DEMO_ADMIN_PRODUCTS,
  PRODUCT_BRANDS,
  PRODUCT_CATEGORIES,
  enrichProductForAdmin,
  type AdminProductRow,
} from '../data/admin-demo';
import { useBrandsPage } from '../../hooks/useBrandsPage';
import { deriveProductBrandChoices } from '../../data/brands-page';
import { adminUi } from '../lib/admin-ui';
import { useAdminConfirm } from '../components/AdminConfirmDialog';

function formatPriceRange(p: AdminProductRow) {
  const fmt = (n: number) =>
    `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
  return `${fmt(p.priceStart)} - ${fmt(p.priceEnd)}`;
}

const STOCK_CLASS = {
  'In Stock': 'bg-emerald-50 text-emerald-700',
  'Low Stock': 'bg-amber-50 text-amber-800',
  'Out of Stock': 'bg-slate-100 text-slate-600',
};

const PAGE_SIZE = 5;

export function AdminProductsPage() {
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '');
  const [brandFilter, setBrandFilter] = useState('all');
  const brandsConfig = useBrandsPage({ trackPageLoading: false });
  const brandChoices = useMemo(() => {
    const fromAdmin = deriveProductBrandChoices(brandsConfig);
    return fromAdmin.length > 0 ? fromAdmin : PRODUCT_BRANDS;
  }, [brandsConfig]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [usingDemo, setUsingDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q != null) setSearchTerm(q);
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchProductList();
      if (list.length === 0) {
        setProducts(DEMO_ADMIN_PRODUCTS);
        setUsingDemo(true);
      } else {
        setProducts(list.map((p, i) => enrichProductForAdmin(p, i)));
        setUsingDemo(false);
      }
    } catch {
      setProducts(DEMO_ADMIN_PRODUCTS);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        const hay = `${p.model} ${p.brand} ${p.category} ${p.modelNumber}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (brandFilter !== 'all' && p.brand !== brandFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      return true;
    });
  }, [products, searchTerm, brandFilter, categoryFilter]);

  const lowStock = products.filter((p) => p.stockStatus === 'Low Stock').length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const handleToggleActive = async (row: AdminProductRow, next: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === row.id ? { ...p, isActive: next } : p))
    );
    if (usingDemo || row.id.startsWith('demo-')) return;
    try {
      const { stockStatus, isActive: _a, lastModifiedBy, lastModifiedAgo, modelNumber, ...product } =
        row;
      await saveProduct({ ...product, isActive: next });
    } catch (e) {
      setProducts((prev) =>
        prev.map((p) => (p.id === row.id ? { ...p, isActive: !next } : p))
      );
      window.alert(e instanceof Error ? e.message : 'Could not update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (usingDemo || id.startsWith('demo-')) {
      window.alert('Demo products are for preview only.');
      return;
    }
    const ok = await confirm({
      title: 'Delete this product?',
      description: 'This permanently removes the product from the database. This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteProduct(id);
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-5">
      {confirmDialog}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="m-0 text-[14px] text-[#7a8899]">
          {products.length} products
          {brandChoices.length ? ` across ${brandChoices.length} brands` : ''}
          {lowStock > 0 ? ` · ${lowStock} low on stock` : ''}
          {usingDemo ? (
            <span className="ml-2 text-amber-700">· sample data (API offline)</span>
          ) : null}
        </p>
        <Link to="/admin/products/new" className={adminUi.btnAmber}>
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Add New Product
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className={`${adminUi.card} overflow-hidden`}>
        <div className="flex flex-wrap gap-3 border-b border-[#eef3f8] px-[18px] py-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa7b5]" />
            <input
              type="text"
              placeholder="Search products…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-[10px] border border-[#e4ebf2] bg-[#f7fafd] py-0 pl-9 pr-3.5 text-[13.5px] text-[#1e2a38] focus:border-sky-300 focus:bg-white focus:outline-none"
            />
          </div>
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-[10px] border border-[#e4ebf2] bg-white px-3 text-[13.5px] text-[#516171]"
          >
            <option value="all">All Brands</option>
            {brandChoices.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-[10px] border border-[#e4ebf2] bg-white px-3 text-[13.5px] text-[#516171]"
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button type="button" className={adminUi.btnGhost + ' !h-10'}>
            <SlidersHorizontal className="h-[15px] w-[15px]" />
            More Filters
          </button>
        </div>

        {loading ? (
          <p className="py-12 text-center text-[#9aa7b5]">Loading products…</p>
        ) : pageItems.length === 0 ? (
          <p className="py-12 text-center text-[#9aa7b5]">No products found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-[13.5px]">
                <thead>
                  <tr className={adminUi.tableHead}>
                    <th className="px-[18px] py-3">Product</th>
                    <th className="px-3 py-3">Brand</th>
                    <th className="px-3 py-3">HP Options</th>
                    <th className="px-3 py-3">Price Range</th>
                    <th className="px-3 py-3">Active</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3">Last Modified</th>
                    <th className="px-[18px] py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-[#f1f5f9] hover:bg-[#f9fbfd]"
                    >
                      <td className="px-[18px] py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt=""
                            className="h-11 w-11 rounded-[9px] border border-[#e8eef4] object-cover"
                          />
                          <div>
                            <p className="font-bold text-[#1e2a38]">{p.model}</p>
                            <p className="text-[11.5px] text-[#9aa7b5]">{p.modelNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={adminUi.badgeSky}>{p.brand}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.hp.slice(0, 3).map((hp) => (
                            <span
                              key={hp}
                              className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold text-[#516171]"
                            >
                              {hp}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-semibold text-[#1e2a38]">
                        {formatPriceRange(p)}
                      </td>
                      <td className="px-3 py-3">
                        <AdminToggle
                          checked={p.isActive}
                          onChange={(next) => void handleToggleActive(p, next)}
                          label={`${p.model} active`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${STOCK_CLASS[p.stockStatus]}`}
                        >
                          {p.stockStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[#1e2a38]">{p.lastModifiedBy}</p>
                        <p className="text-[11.5px] text-[#9aa7b5]">{p.lastModifiedAgo}</p>
                      </td>
                      <td className="px-[18px] py-3">
                        <div className="flex justify-end gap-1.5">
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4ebf2] bg-white text-[#0ea5e9] hover:bg-[#e0f2fe]"
                            aria-label="Edit"
                          >
                            <Edit className="h-[15px] w-[15px]" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleDelete(p.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4ebf2] bg-white text-red-500 hover:bg-red-50"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-[15px] w-[15px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-[#eef3f8] px-[18px] py-3.5 sm:flex-row">
              <p className="text-[13px] text-[#9aa7b5]">
                Showing {(pageSafe - 1) * PAGE_SIZE + 1}-
                {Math.min(pageSafe * PAGE_SIZE, filtered.length)} of {filtered.length} products
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 rounded-lg border border-[#e4ebf2] bg-white px-3 text-[13px] text-[#9aa7b5] disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`h-8 min-w-8 rounded-lg text-[13px] ${
                      n === pageSafe
                        ? 'bg-[#0ea5e9] font-bold text-white'
                        : 'border border-[#e4ebf2] bg-white text-[#516171]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 rounded-lg border border-[#e4ebf2] bg-white px-3 text-[13px] text-[#516171] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
