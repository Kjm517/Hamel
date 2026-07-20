import { apiFetch, getApiBase } from './api';

const MAX_IMAGE_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_BYTES = 300 * 1024 * 1024;

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

  // Stale absolute URLs from local dev — remap to current API uploads base.
  const localUpload = v.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/uploads\/(.+)$/i);
  if (localUpload?.[1]) {
    return getPublicStorageUrl(localUpload[1]);
  }

  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:')) {
    return v;
  }
  // Site-relative paths like /hamel/... stay as-is; /uploads/... go through API base when needed.
  if (v.startsWith('/uploads/')) {
    return getPublicStorageUrl(v.replace(/^\/uploads\//, ''));
  }
  if (v.startsWith('/')) {
    return v;
  }
  return getPublicStorageUrl(v);
}

export function normalizeStoragePathForDb(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();

  // Keep remote CDN URLs (Cloudinary, etc.) as absolute — never strip them to a local path.
  if (/^https?:\/\//i.test(v)) {
    const isLocalUpload =
      /\/uploads\//i.test(v) &&
      (/localhost|127\.0\.0\.1/i.test(v) ||
        (typeof window !== 'undefined' && v.startsWith(`${window.location.origin}/uploads/`)));
    if (!isLocalUpload) return v;
  }

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
  return buildMediaStoragePath(file, 'tag-icons');
}

/** Generic media path for banners, heroes, cool-deals, etc. */
export function buildMediaStoragePath(file: File, folder = 'media'): string {
  const ext = file.name.includes('.')
    ? (file.name.split('.').pop()?.toLowerCase() ?? 'png')
    : 'png';
  const base =
    file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'image';
  const unique =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now());
  const safeFolder = folder.replace(/^\/+|\/+$/g, '') || 'media';
  return `${safeFolder}/${base}-${unique}.${ext}`;
}

/** Convenience for admin upload fields: `remoteUpload={{ getObjectPath: mediaPathFor('banners') }}`. */
export function mediaPathFor(folder: string): (file: File) => string {
  return (file) => buildMediaStoragePath(file, folder);
}

export async function checkStorageBucket(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await apiFetch<{
      ok: boolean;
      message?: string;
      warning?: string;
      storage?: string;
    }>('/api/uploads/health', { auth: false });
    if (!res.ok) {
      return { ok: false, message: res.message || 'Upload service unavailable' };
    }
    if (res.storage === 'local' && res.warning) {
      return { ok: false, message: res.warning };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Upload service unavailable',
    };
  }
}

export async function uploadToPublicStorage(file: File, objectPath?: string): Promise<string> {
  if (!file.type.startsWith('image/') && file.type !== 'video/mp4') {
    throw new Error('Please choose an image or MP4 video.');
  }
  const maxUploadBytes = file.type === 'video/mp4' ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
  if (file.size > maxUploadBytes) {
    throw new Error(`File must be ${file.type === 'video/mp4' ? 300 : 25} MB or smaller.`);
  }

  const form = new FormData();
  form.append('file', file);
  if (objectPath) form.append('path', objectPath.replace(/^\//, ''));

  const res = await apiFetch<{ url?: string; path?: string }>('/api/uploads', {
    method: 'POST',
    formData: form,
  });
  const url = res.url?.trim();
  if (!url) {
    throw new Error('Upload succeeded but no public URL was returned.');
  }
  return url;
}

/** @deprecated Use checkStorageBucket — kept for AdminTagsPage import compatibility */
export const DEFAULT_STORAGE_BUCKET = 'uploads';
