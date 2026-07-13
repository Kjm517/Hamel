import {
  apiFetch,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  setRememberMePreference,
  type ApiUser,
} from '../../lib/api';
import type { EmployeeRecord } from '../types/employee';

export function getAdminRedirectBase() {
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export async function signInAdmin(
  identifier: string,
  password: string,
  rememberMe: boolean
) {
  setRememberMePreference(rememberMe);

  const res = await apiFetch<{
    token: string;
    employee: EmployeeRecord;
    user: ApiUser;
  }>('/api/auth/login', {
    method: 'POST',
    body: { identifier, password },
    auth: false,
  });

  setAccessToken(res.token);
  return res;
}

export async function signOutAdmin() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST', auth: false });
  } catch {
    // ignore
  }
  clearAccessToken();
}

export async function verifyAdminSession(): Promise<boolean> {
  if (!getAccessToken()) return false;
  try {
    await apiFetch('/api/auth/me');
    return true;
  } catch {
    return false;
  }
}

export async function sendPasswordResetEmail(identifier: string) {
  const res = await apiFetch<{
    ok: boolean;
    email: string | null;
    resetToken?: string;
    resetUrl?: string;
    message?: string;
  }>('/api/auth/forgot-password', {
    method: 'POST',
    body: { identifier },
    auth: false,
  });

  if (!res.email && !res.resetToken) {
    // Still succeed for UX, but surface a helpful message when nothing matched
    return { email: identifier, resetToken: res.resetToken, resetUrl: res.resetUrl };
  }

  return {
    email: res.email ?? identifier,
    resetToken: res.resetToken,
    resetUrl: res.resetUrl,
  };
}

/** Reset password using token from forgot-password flow. */
export async function resetAdminPasswordWithToken(token: string, password: string) {
  const res = await apiFetch<{
    ok: boolean;
    token?: string;
    employee?: EmployeeRecord;
    user?: ApiUser;
  }>('/api/auth/reset-password', {
    method: 'POST',
    body: { token, password },
    auth: false,
  });

  if (res.token) setAccessToken(res.token);
  return res;
}

/** Change password while authenticated (legacy name used by reset page when logged in). */
export async function updateAdminPassword(password: string) {
  await apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: { password },
  });
}
