

const REMEMBER_ME_KEY = 'hamel_admin_remember_me';
const TOKEN_KEY = 'hamel_admin_token';

export type ApiUser = {
  id: string;
  email: string;
};

export function getRememberMePreference(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
}

export function setRememberMePreference(remember: boolean) {
  localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');

  const token = getAccessToken();
  clearAccessToken();
  if (token) setAccessToken(token);
}

function tokenStorage(): Storage {
  return getRememberMePreference() ? localStorage : sessionStorage;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
  clearAccessToken();
  tokenStorage().setItem(TOKEN_KEY, token);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hamel:auth-changed'));
  }
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hamel:auth-changed'));
  }
}

/** Base URL for API. Empty string = same origin (Vite proxy). */
export function getApiBase(): string {
  return (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '') || '';
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  formData?: FormData;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = {
    method: options.method ?? (options.body || options.formData ? 'POST' : 'GET'),
  };

  if (options.formData) {
    init.body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  init.headers = headers;

  const res = await fetch(`${getApiBase()}${path}`, init);
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    let message =
      data && typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    if (
      (res.status === 404 || res.status === 405) &&
      !getApiBase() &&
      typeof window !== 'undefined' &&
      /\.vercel\.app$/i.test(window.location.hostname)
    ) {
      message =
        'API is not reachable on this deployment. Set DATABASE_URL and JWT_SECRET in Vercel, redeploy, then try again.';
    }
    if (res.status === 401 && options.auth !== false) {
      clearAccessToken();
    }
    throw new ApiError(message, res.status);
  }

  return data as T;
}
