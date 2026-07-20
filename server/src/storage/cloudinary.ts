import { createHash, randomUUID } from 'node:crypto';
import { env } from '../env';

export function cloudinaryConfigured(): boolean {
  return Boolean(
    clean(env.cloudinaryCloudName()) &&
      clean(env.cloudinaryApiKey()) &&
      clean(env.cloudinaryApiSecret())
  );
}

function clean(value: string): string {
  return value
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^["']|["']$/g, '');
}

function resourceTypeFor(contentType: string): 'image' | 'video' | 'raw' {
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('image/')) return 'image';
  return 'raw';
}

type SignAlgo = 'sha1' | 'sha256';

/** Cloudinary signed-upload digest: sha1/sha256(sorted params + api_secret), NOT HMAC. */
function signParams(params: Record<string, string>, apiSecret: string, algo: SignAlgo): string {
  const toSign = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined && params[k] !== '')
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash(algo).update(`${toSign}${apiSecret}`).digest('hex');
}

function sanitizePublicId(raw: string): string {
  return raw
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9/_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || `upload-${Date.now()}`;
}

async function postSignedUpload(opts: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  buffer: Buffer;
  contentType: string;
  fileName: string;
  folder: string;
  publicId: string;
  algo: SignAlgo;
}): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // Sign folder + public_id separately (Cloudinary-recommended). Do not put folder into public_id.
  const paramsToSign: Record<string, string> = {
    folder: opts.folder,
    public_id: opts.publicId,
    timestamp,
  };
  const signature = signParams(paramsToSign, opts.apiSecret, opts.algo);

  const resourceType = resourceTypeFor(opts.contentType);
  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(opts.buffer)], {
      type: opts.contentType || 'application/octet-stream',
    }),
    opts.fileName
  );
  form.append('api_key', opts.apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('folder', opts.folder);
  form.append('public_id', opts.publicId);
  if (opts.algo === 'sha256') {
    form.append('signature_algorithm', 'sha256');
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(opts.cloudName)}/${resourceType}/upload`,
    { method: 'POST', body: form }
  );
  const data = (await res.json().catch(() => ({}))) as {
    secure_url?: string;
    url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!res.ok || (!data.secure_url && !data.url)) {
    return { ok: false, error: data.error?.message || `Cloudinary upload failed (${res.status})` };
  }

  return {
    ok: true,
    url: data.secure_url || data.url!,
    path: data.public_id || `${opts.folder}/${opts.publicId}`,
  };
}

/**
 * Unsigned upload via upload preset (optional). Create an unsigned preset in
 * Cloudinary → Settings → Upload → Upload presets, then set CLOUDINARY_UPLOAD_PRESET.
 */
async function postUnsignedUpload(opts: {
  cloudName: string;
  buffer: Buffer;
  contentType: string;
  fileName: string;
  folder: string;
  publicId: string;
  preset: string;
}): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
  const resourceType = resourceTypeFor(opts.contentType);
  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(opts.buffer)], {
      type: opts.contentType || 'application/octet-stream',
    }),
    opts.fileName
  );
  form.append('upload_preset', opts.preset);
  form.append('folder', opts.folder);
  form.append('public_id', opts.publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(opts.cloudName)}/${resourceType}/upload`,
    { method: 'POST', body: form }
  );
  const data = (await res.json().catch(() => ({}))) as {
    secure_url?: string;
    url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!res.ok || (!data.secure_url && !data.url)) {
    return { ok: false, error: data.error?.message || `Cloudinary unsigned upload failed (${res.status})` };
  }

  return {
    ok: true,
    url: data.secure_url || data.url!,
    path: data.public_id || `${opts.folder}/${opts.publicId}`,
  };
}

/**
 * Upload buffer to Cloudinary. Returns a permanent public HTTPS URL.
 */
export async function uploadBufferToCloudinary(opts: {
  buffer: Buffer;
  objectPath: string;
  contentType: string;
  fileName: string;
}): Promise<{ url: string; path: string }> {
  const cloudName = clean(env.cloudinaryCloudName());
  const apiKey = clean(env.cloudinaryApiKey());
  const apiSecret = clean(env.cloudinaryApiSecret());
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured');
  }

  const rootFolder = clean(env.cloudinaryFolder()) || 'hamel';
  const normalized = opts.objectPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const withoutExt = sanitizePublicId(normalized);
  // Split into folder + leaf so we sign `folder` and `public_id` separately.
  const parts = withoutExt.split('/').filter(Boolean);
  const leaf = parts.pop() || `upload-${randomUUID().slice(0, 8)}`;
  const subFolder = parts.join('/');
  const folder = subFolder ? `${rootFolder}/${subFolder}` : rootFolder;
  const publicId = leaf;

  const preset = clean(process.env.CLOUDINARY_UPLOAD_PRESET || '');
  if (preset) {
    const unsigned = await postUnsignedUpload({
      cloudName,
      buffer: opts.buffer,
      contentType: opts.contentType,
      fileName: opts.fileName || normalized,
      folder,
      publicId,
      preset,
    });
    if (unsigned.ok) return { url: unsigned.url, path: unsigned.path };
    // Fall through to signed upload if preset fails.
  }

  // Cloudinary accounts default to SHA-1 for upload signatures.
  const preferred = clean(process.env.CLOUDINARY_SIGN_ALGORITHM || 'sha1').toLowerCase();
  const order: SignAlgo[] =
    preferred === 'sha256' ? ['sha256', 'sha1'] : ['sha1', 'sha256'];

  let lastError = 'Cloudinary upload failed';
  for (const algo of order) {
    const result = await postSignedUpload({
      cloudName,
      apiKey,
      apiSecret,
      buffer: opts.buffer,
      contentType: opts.contentType,
      fileName: opts.fileName || normalized,
      folder,
      publicId,
      algo,
    });
    if (result.ok) return { url: result.url, path: result.path };
    lastError = result.error;
    if (!/invalid signature/i.test(result.error)) break;
  }

  if (/invalid signature/i.test(lastError)) {
    throw new Error(
      'Cloudinary rejected the upload signature. In Cloudinary Console → Settings → API Keys, copy a fresh API Secret into CLOUDINARY_API_SECRET (local .env and Vercel env), then restart/redeploy. Optional: set CLOUDINARY_UPLOAD_PRESET to an unsigned upload preset.'
    );
  }

  throw new Error(lastError);
}
