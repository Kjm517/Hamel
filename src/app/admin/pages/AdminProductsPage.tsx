import { Link } from 'react-router';
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

function formatPriceRange(p: AdminProductRow) {
  const fmt = (n: number) =>
    `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
  return `${fmt(p.priceStart)} - ${fmt(p.priceEnd)}`;
}

const STOCK_CLASS = {
  'In Stock': 'bg-green-100 text-green-800',
  'Low Stock': 'bg-orange-100 text-orange-800',
  'Out of Stock': 'bg-gray-100 text-gray-600',
};

const PAGE_SIZE = 5;

export function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [usingDemo, setUsingDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const handleToggleActive = async (row: AdminProductRow, next: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === row.id ? { ...p, isActive: next } : p))
    );
    if (usingDemo || row.id.startsWith('demo-')) return;
    try {
      const { stockStatus, isActive: _a, lastModifiedBy, lastModifiedAgo, modelNumber, ...product } = row;
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
    if (!window.confirm('Delete this product from the database?')) return;
    try {
      await deleteProduct(id);
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products Management</h2>
          {usingDemo && (
            <p className="mt-1 text-xs text-amber-700">Showing sample data — start the API + Neon to load your catalog.</p>
          )}
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-6 py-3 font-bold text-gray-900 transition-colors hover:bg-amber-500"
        >
          <Plus className="h-5 w-5" />
          Add New Product
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
            />
          </div>
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All Brands</option>
            {PRODUCT_BRANDS.map((b) => (
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
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            More Filters
          </button>
        </div>

        {loading ? (
          <p className="py-12 text-center text-gray-600">Loading products…</p>
        ) : pageItems.length === 0 ? (
          <p className="py-12 text-center text-gray-600">No products found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="pb-3 pr-4 font-semibold">Image</th>
                    <th className="pb-3 pr-4 font-semibold">Name & Model</th>
                    <th className="pb-3 pr-4 font-semibold">Brand</th>
                    <th className="pb-3 pr-4 font-semibold">HP Options</th>
                    <th className="pb-3 pr-4 font-semibold">Price Range</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 pr-4 font-semibold">Stock</th>
                    <th className="pb-3 pr-4 font-semibold">Last Modified</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        <img
                          src={p.image}
                          alt=""
                          className="h-12 w-12 rounded-md border border-gray-200 object-cover"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-gray-900">{p.model}</p>
                        <p className="text-xs text-gray-500">{p.modelNumber}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                          {p.brand}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {p.hp.slice(0, 3).map((hp) => (
                            <span
                              key={hp}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                            >
                              {hp}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">{formatPriceRange(p)}</td>
                      <td className="py-3 pr-4">
                        <AdminToggle
                          checked={p.isActive}
                          onChange={(next) => void handleToggleActive(p, next)}
                          label={`${p.model} active`}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STOCK_CLASS[p.stockStatus]}`}
                        >
                          {p.stockStatus}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-gray-900">{p.lastModifiedBy}</p>
                        <p className="text-xs text-gray-500">{p.lastModifiedAgo}</p>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="rounded p-1.5 text-[#0EA5E9] hover:bg-blue-50"
                            aria-label="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleDelete(p.id)}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row">
              <p className="text-sm text-gray-600">
                Showing {(pageSafe - 1) * PAGE_SIZE + 1}-
                {Math.min(pageSafe * PAGE_SIZE, filtered.length)} of {filtered.length} products
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-[2rem] rounded px-2 py-1.5 text-sm ${
                      n === pageSafe
                        ? 'bg-[#0EA5E9] font-semibold text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
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
