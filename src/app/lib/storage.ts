import { apiFetch, getApiBase } from './api';

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/** Public URL for a relative upload path. */
export function getPublicStorageUrl(objectPath: string): string {
  const path = objectPath.replace(/^\//, '');
  if (path.startsWith('uploads/')) {
    return `${getApiBase()}/${path}`;
  }
  return `${getApiBase()}/uploads/${path}`;
}

export function isStorageObjectPath(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v.startsWith('http://') || v.startsWith('https://')) return false;
  if (v.startsWith('data:')) return false;
  if (v.startsWith('/')) return false;
  return true;
}

export function resolveStorageImageUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const v = value.trim();
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('/')) {
    return v;
  }
  return getPublicStorageUrl(v);
}

export function normalizeStoragePathForDb(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  const base = getApiBase();
  const prefixes = [
    `${base}/uploads/`,
    '/uploads/',
    `${typeof window !== 'undefined' ? window.location.origin : ''}/uploads/`,
  ].filter(Boolean);

  for (const prefix of prefixes) {
    if (v.startsWith(prefix)) return v.slice(prefix.length);
  }
  if (isStorageObjectPath(v)) return v.replace(/^\//, '');
  return v;
}

const TAG_ICON_FILE_NAMES: Record<string, string[]> = {
  'tag-flash-15': ['tag-flash-15.png', '15-off.png', 'flash.png'],
  'tag-free-install': ['tag-free-install.png', 'free-install.png'],
  'tag-5000-off': ['tag-5000-off.png', '5000-off.png'],
  'tag-cool-cash': ['tag-cool-cash.png', 'cool-cash.png'],
  'tag-bundle': ['tag-bundle.png', 'bundle.png'],
};

export function getDefaultTagIconPaths(tagId: string): string[] {
  return TAG_ICON_FILE_NAMES[tagId] ?? [`${tagId}.png`, `${tagId}.webp`, `${tagId}.svg`, `${tagId}.jpg`];
}

export function buildTagIconStoragePath(file: File): string {
  const ext = file.name.includes('.')
    ? (file.name.split('.').pop()?.toLowerCase() ?? 'png')
    : 'png';
  const base =
    file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'icon';
  const unique =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now());
  return `tag-icons/${base}-${unique}.${ext}`;
}

export async function checkStorageBucket(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await apiFetch<{ ok: boolean; message?: string }>('/api/uploads/health', { auth: false });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Upload service unavailable',
    };
  }
}

export async function uploadToPublicStorage(file: File, objectPath?: string): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (PNG, JPG, WebP, etc.).');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image must be 3 MB or smaller.');
  }

  const form = new FormData();
  form.append('file', file);
  if (objectPath) form.append('path', objectPath.replace(/^\//, ''));

  const res = await apiFetch<{ url: string }>('/api/uploads', {
    method: 'POST',
    formData: form,
  });
  return res.url;
}

/** @deprecated Use checkStorageBucket — kept for AdminTagsPage import compatibility */
export const DEFAULT_STORAGE_BUCKET = 'uploads';
