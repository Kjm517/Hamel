import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useCatalog } from '../../context/CatalogContext';
import type { Product } from '../../data/products';
import { adminUi } from '../lib/admin-ui';

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
    <div className="space-y-5">
      <p className={adminUi.pageIntro}>
        Products that currently have promo stickers. Open a product to change them.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products…"
        className={`${adminUi.input} !mt-0 max-w-md`}
      />
      {loading && <p className="text-sm text-[#9aa7b5]">Loading catalog…</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-[#9aa7b5]">No products with promos yet.</p>
      )}
      <div className={`${adminUi.card} overflow-hidden`}>
        <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[13.5px]">
          <thead>
            <tr className={adminUi.tableHead}>
              <th className="px-[18px] py-3">Product</th>
              <th className="px-3 py-3">Brand</th>
              <th className="px-3 py-3">Promos</th>
              <th className="px-[18px] py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const promos = ((p as Product & { promos?: unknown[] }).promos ?? []) as unknown[];
              return (
                <tr key={p.id} className="border-t border-[#f1f5f9]">
                  <td className="px-[18px] py-3.5 font-semibold text-[#1e2a38]">
                    {p.name || p.model}
                  </td>
                  <td className="px-3 py-3.5 text-[#7a8899]">{p.brand}</td>
                  <td className="px-3 py-3.5 text-[#1e2a38]">{promos.length}</td>
                  <td className="px-[18px] py-3.5 text-right">
                    <Link
                      to={`/admin/products/${p.id}/edit`}
                      className="text-[13px] font-semibold text-[#0ea5e9] hover:underline"
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
    </div>
  );
}
