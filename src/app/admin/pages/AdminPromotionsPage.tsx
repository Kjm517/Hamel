import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useCatalog } from '../../context/CatalogContext';
import type { Product } from '../../data/products';

function hasPromos(p: Product): boolean {
  const promos = (p as Product & { promos?: unknown[] }).promos;
  return Array.isArray(promos) && promos.length > 0;
}

export function AdminPromotionsPage() {
  const { products, loading } = useCatalog();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const list = products.filter(hasPromos);
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (p) =>
        p.name?.toLowerCase().includes(needle) ||
        p.brand?.toLowerCase().includes(needle) ||
        p.model?.toLowerCase().includes(needle)
    );
  }, [products, q]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Promotions</h2>
        <p className="text-gray-600">
          Products with active promo tags in catalog data. Edit a product to change promos.
        </p>
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products…"
        className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      {loading && <p className="text-sm text-gray-500">Loading catalog…</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-gray-500">No products with promos yet.</p>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Promos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const promos = ((p as Product & { promos?: unknown[] }).promos ?? []) as unknown[];
              return (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name || p.model}</td>
                  <td className="px-4 py-3 text-gray-600">{p.brand}</td>
                  <td className="px-4 py-3">{promos.length}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/products/${p.id}/edit`}
                      className="text-sm font-medium text-[#0EA5E9] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
