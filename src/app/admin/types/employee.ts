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

export function defaultPermissionsForRole(role: EmployeeRole): string[] {
  switch (role) {
    case 'Manager':
      return [
        'dashboard',
        'products',
        'inquiries',
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
        'customers',
        'messages',
        'analytics',
        'settings',
        'employees',
      ];
    case 'Staff':
      return ['dashboard', 'products', 'inquiries', 'customers', 'messages'];
    case 'Viewer':
      return ['dashboard', 'products'];
    default:
      return ['dashboard'];
  }
}
