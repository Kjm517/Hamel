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

/**
 * Signed upload to Cloudinary. Returns a permanent public HTTPS URL.
 * `objectPath` is used as the public_id under folder `hamel/` (without extension).
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

  const folder = env.cloudinaryFolder();
  const normalized = opts.objectPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const publicId = normalized.replace(/\.[^.]+$/, '') || `upload-${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000);

  // Params included in the signature must be sorted alphabetically.
  const paramsToSign: Record<string, string> = {
    folder,
    public_id: publicId,
    timestamp: String(timestamp),
  };
  const toSign = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join('&');
  const signature = createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');

  const resourceType = resourceTypeFor(opts.contentType);
  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(opts.buffer)], {
      type: opts.contentType || 'application/octet-stream',
    }),
    opts.fileName || normalized
  );
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);
  form.append('public_id', publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
    { method: 'POST', body: form }
  );
  const data = (await res.json().catch(() => ({}))) as {
    secure_url?: string;
    url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!res.ok || (!data.secure_url && !data.url)) {
    throw new Error(data.error?.message || `Cloudinary upload failed (${res.status})`);
  }

  return {
    url: data.secure_url || data.url!,
    path: data.public_id || `${folder}/${publicId}`,
  };
}
