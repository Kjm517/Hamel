import { apiFetch } from '../../lib/api';
import {
  defaultPermissionsForRole,
  type EmployeeProfileInput,
  type EmployeeRecord,
  type EmployeeStatus,
  type EmployeeUpsertInput,
} from '../types/employee';

export async function fetchCurrentEmployee(): Promise<EmployeeRecord | null> {
  try {
    const res = await apiFetch<{ employee: EmployeeRecord }>('/api/auth/me');
    return res.employee ?? null;
  } catch {
    return null;
  }
}

export async function updateMyProfile(
  input: EmployeeProfileInput
): Promise<EmployeeRecord> {
  const res = await apiFetch<{ employee: EmployeeRecord }>('/api/auth/me', {
    method: 'PATCH',
    body: {
      fullName: input.fullName,
      phone: input.phone,
      avatarUrl: input.avatarUrl,
    },
  });
  return res.employee;
}

export async function fetchEmployees(): Promise<EmployeeRecord[]> {
  const res = await apiFetch<{ employees: EmployeeRecord[] }>('/api/employees');
  return res.employees ?? [];
}

export async function createEmployee(
  input: EmployeeUpsertInput,
  _addedBy: string
): Promise<EmployeeRecord> {
  const res = await apiFetch<{ employee: EmployeeRecord }>('/api/employees', {
    method: 'POST',
    body: {
      fullName: input.fullName,
      email: input.email,
      username: input.username,
      phone: input.phone,
      role: input.role,
      temporaryPassword: input.temporaryPassword,
      permissions: defaultPermissionsForRole(input.role),
    },
  });
  return res.employee;
}

export async function updateEmployee(
  id: string,
  input: EmployeeUpsertInput
): Promise<EmployeeRecord> {
  const res = await apiFetch<{ employee: EmployeeRecord }>(`/api/employees/${id}`, {
    method: 'PATCH',
    body: {
      fullName: input.fullName,
      email: input.email,
      username: input.username,
      phone: input.phone,
      role: input.role,
      temporaryPassword: input.temporaryPassword?.trim() || undefined,
    },
  });
  return res.employee;
}

export async function setEmployeeStatus(id: string, status: EmployeeStatus): Promise<void> {
  await apiFetch(`/api/employees/${id}`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function removeEmployee(id: string): Promise<void> {
  await apiFetch(`/api/employees/${id}`, { method: 'DELETE' });
}
