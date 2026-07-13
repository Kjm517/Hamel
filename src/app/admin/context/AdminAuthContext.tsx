import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  apiFetch,
  getAccessToken,
  type ApiUser,
} from '../../lib/api';
import type { EmployeeRecord } from '../types/employee';
import { canManageTeamMembers } from '../types/employee';

export type AdminSession = {
  accessToken: string;
  user: ApiUser;
};

type AdminAuthContextValue = {
  session: AdminSession | null;
  user: ApiUser | null;
  employee: EmployeeRecord | null;
  loading: boolean;
  employeeLoading: boolean;
  canManageTeam: boolean;
  refreshSession: () => Promise<void>;
  refreshEmployee: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [employeeLoading, setEmployeeLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setSession(null);
      setEmployee(null);
      setLoading(false);
      setEmployeeLoading(false);
      return;
    }

    try {
      const res = await apiFetch<{ employee: EmployeeRecord; user: ApiUser }>('/api/auth/me');
      setSession({ accessToken: token, user: res.user });
      setEmployee(res.employee);
    } catch {
      setSession(null);
      setEmployee(null);
    } finally {
      setLoading(false);
      setEmployeeLoading(false);
    }
  }, []);

  const refreshEmployee = useCallback(async () => {
    if (!getAccessToken()) {
      setEmployee(null);
      setEmployeeLoading(false);
      return;
    }
    setEmployeeLoading(true);
    try {
      const res = await apiFetch<{ employee: EmployeeRecord; user: ApiUser }>('/api/auth/me');
      setEmployee(res.employee);
      setSession((prev) =>
        prev
          ? { ...prev, user: res.user }
          : { accessToken: getAccessToken()!, user: res.user }
      );
    } catch {
      setEmployee(null);
      setSession(null);
    } finally {
      setEmployeeLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();

    const onAuthChanged = () => {
      void refreshSession();
    };
    window.addEventListener('hamel:auth-changed', onAuthChanged);
    return () => window.removeEventListener('hamel:auth-changed', onAuthChanged);
  }, [refreshSession]);

  const canManageTeam = canManageTeamMembers(employee?.role);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      employee,
      loading,
      employeeLoading,
      canManageTeam,
      refreshSession,
      refreshEmployee,
    }),
    [session, employee, loading, employeeLoading, canManageTeam, refreshSession, refreshEmployee]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
