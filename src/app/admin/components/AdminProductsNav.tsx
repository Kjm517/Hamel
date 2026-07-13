import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { ChevronDown, Package, Plus, List } from 'lucide-react';

function subLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2 rounded-lg py-2 pl-9 pr-3 text-sm font-medium transition-colors ${
    isActive ? 'bg-[#E0F2FE] text-[#0EA5E9]' : 'text-gray-600 hover:bg-gray-100'
  }`;
}

export function AdminProductsNav() {
  const location = useLocation();
  const onProducts =
    location.pathname === '/admin/products' ||
    location.pathname.startsWith('/admin/products/');
  const [open, setOpen] = useState(onProducts);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          onProducts
            ? 'border-l-[3px] border-[#0EA5E9] bg-[#E0F2FE] text-[#0EA5E9]'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Package className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">Products</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ProductsNavChildren />
      )}
    </div>
  );
}

function ProductsNavChildren() {
  return (
    <div className="mt-1 space-y-0.5">
      <NavLink to="/admin/products" end className={subLinkClass}>
        <List className="h-4 w-4" />
        All Products
      </NavLink>
      <NavLink to="/admin/products/new" className={subLinkClass}>
        <Plus className="h-4 w-4" />
        Add New Product
      </NavLink>
    </div>
  );
}
