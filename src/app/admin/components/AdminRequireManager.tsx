import { Navigate, Outlet } from 'react-router';
import { useAdminAuth } from '../context/AdminAuthContext';

export function AdminRequireManager() {
  const { loading, employeeLoading, canManageTeam } = useAdminAuth();

  if (loading || employeeLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  if (!canManageTeam) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
