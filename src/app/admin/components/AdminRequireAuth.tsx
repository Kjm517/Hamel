import { Navigate, Outlet, useLocation } from 'react-router';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminIdleLogout } from '../hooks/useAdminIdleLogout';

export function AdminRequireAuth() {
  const { session, loading } = useAdminAuth();
  const location = useLocation();
  useAdminIdleLogout(Boolean(session));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <p className="text-gray-600">Checking session…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
