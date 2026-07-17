import { createHash } from 'node:crypto';
import { env } from '../env';

export function cloudinaryConfigured(): boolean {
  return Boolean(
    env.cloudinaryCloudName() && env.cloudinaryApiKey() && env.cloudinaryApiSecret()
  );
}

function resourceTypeFor(contentType: string): 'image' | 'video' | 'raw' {
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('image/')) return 'image';
  return 'raw';
}

type SignAlgo = 'sha1' | 'sha256';

function signParams(params: Record<string, string>, apiSecret: string, algo: SignAlgo): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash(algo).update(`${toSign}${apiSecret}`).digest('hex');
}

async function postSignedUpload(opts: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  buffer: Buffer;
  contentType: string;
  fileName: string;
  publicId: string;
  algo: SignAlgo;
}): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  // Use public_id with folder path only — avoids folder+public_id signature edge cases.
  const paramsToSign: Record<string, string> = {
    public_id: opts.publicId,
    timestamp: String(timestamp),
  };
  if (opts.algo === 'sha256') {
    // signature_algorithm is sent but NOT included in the string-to-sign.
  }
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
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
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
    path: data.public_id || opts.publicId,
  };
}

/**
 * Signed upload to Cloudinary. Returns a permanent public HTTPS URL.
 * `objectPath` becomes public_id under folder `hamel/` (without extension).
 */
export async function uploadBufferToCloudinary(opts: {
  buffer: Buffer;
  objectPath: string;
  contentType: string;
  fileName: string;
}): Promise<{ url: string; path: string }> {
  const cloudName = env.cloudinaryCloudName();
  const apiKey = env.cloudinaryApiKey();
  const apiSecret = env.cloudinaryApiSecret();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured');
  }

  const folder = env.cloudinaryFolder().replace(/^\/+|\/+$/g, '') || 'hamel';
  const normalized = opts.objectPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const withoutExt = normalized.replace(/\.[^.]+$/, '') || `upload-${Date.now()}`;
  const publicId = withoutExt.startsWith(`${folder}/`)
    ? withoutExt
    : `${folder}/${withoutExt}`;

  const preferred = (process.env.CLOUDINARY_SIGN_ALGORITHM || 'sha256').trim().toLowerCase();
  const order: SignAlgo[] =
    preferred === 'sha1' ? ['sha1', 'sha256'] : ['sha256', 'sha1'];

  let lastError = 'Cloudinary upload failed';
  for (const algo of order) {
    const result = await postSignedUpload({
      cloudName,
      apiKey,
      apiSecret,
      buffer: opts.buffer,
      contentType: opts.contentType,
      fileName: opts.fileName || normalized,
      publicId,
      algo,
    });
    if (result.ok) return { url: result.url, path: result.path };
    lastError = result.error;
    // Retry with the other algorithm only for signature mismatches.
    if (!/invalid signature/i.test(result.error)) break;
  }

  throw new Error(lastError);
}
