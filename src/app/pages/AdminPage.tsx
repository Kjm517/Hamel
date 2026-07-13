import { Navigate } from 'react-router';

/** Legacy /admin URL → dashboard (banner editor lives at /admin/banners). */
export function AdminPage() {
  return <Navigate to="/admin/dashboard" replace />;
}
