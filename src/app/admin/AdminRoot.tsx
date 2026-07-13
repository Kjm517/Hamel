import { Outlet } from 'react-router';
import { CatalogProvider } from '../context/CatalogContext';
import { ProductTagsProvider } from '../context/ProductTagsContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

export function AdminRoot() {
  return (
    <AdminAuthProvider>
      <ProductTagsProvider>
        <CatalogProvider>
          <Outlet />
        </CatalogProvider>
      </ProductTagsProvider>
    </AdminAuthProvider>
  );
}
