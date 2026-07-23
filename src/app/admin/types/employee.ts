export type EmployeeRole = 'Manager' | 'Admin' | 'Staff' | 'Viewer';
export type EmployeeStatus = 'Active' | 'Inactive';

export type EmployeeRecord = {
  id: string;
  fullName: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: EmployeeRole;
  status: EmployeeStatus;
  addedBy: string | null;
  permissions: string[];
  authLinked: boolean;
  avatarUrl: string | null;
  createdAt: string;
};

export type EmployeeProfileInput = {
  fullName: string;
  phone?: string;
  avatarUrl?: string | null;
};

export type EmployeeUpsertInput = {
  fullName: string;
  email: string;
  username?: string;
  phone?: string;
  role: EmployeeRole;
  /** Required when creating; optional when editing (sets a new temporary password). */
  temporaryPassword?: string;
};

export const EMPLOYEE_ROLES: EmployeeRole[] = ['Manager', 'Admin', 'Staff', 'Viewer'];

export function canManageTeamMembers(role: EmployeeRole | null | undefined): boolean {
  return role === 'Manager' || role === 'Admin';
}

export function isFullAdminRole(role: EmployeeRole | null | undefined): boolean {
  return role === 'Manager' || role === 'Admin';
}

export function defaultPermissionsForRole(role: EmployeeRole): string[] {
  switch (role) {
    case 'Manager':
      return [
        'dashboard',
        'products',
        'inquiries',
        'services',
        'customers',
        'messages',
        'analytics',
        'settings',
        'employees',
      ];
    case 'Admin':
      return [
        'dashboard',
        'products',
        'inquiries',
        'services',
        'customers',
        'messages',
        'analytics',
        'settings',
        'employees',
      ];
    case 'Staff':
      return ['dashboard', 'services', 'customers', 'messages'];
    case 'Viewer':
      return ['dashboard', 'products'];
    default:
      return ['dashboard'];
  }
}

/** Menu / page gate. Manager & Admin see everything; Staff & Viewer use their permission list. */
export function employeeHasPermission(
  role: EmployeeRole | null | undefined,
  permissions: string[] | null | undefined,
  key: string
): boolean {
  if (isFullAdminRole(role)) return true;
  // Staff: no Products or Orders & Inquiries in the menu (bookings stay under Services).
  if (role === 'Staff' && (key === 'products' || key === 'inquiries')) return false;
  const perms =
    permissions && permissions.length > 0
      ? permissions
      : role
        ? defaultPermissionsForRole(role)
        : [];
  if (perms.includes(key)) return true;
  // Older Staff records may lack the newer `services` key.
  if (key === 'services' && role === 'Staff') return true;
  return false;
}
