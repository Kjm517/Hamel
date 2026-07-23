import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { env } from '../env';
import { requireAuth, type AuthVariables } from '../middleware/auth';
import { cloudinaryConfigured, uploadBufferToCloudinary } from '../storage/cloudinary';
import { resolvePublicMediaUrl } from '../storage/public-url';

const MAX_IMAGE_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_BYTES = 300 * 1024 * 1024;

async function saveUploadedMedia(
  file: File,
  requestedPath: string | null,
  defaultPrefix: string,
  allowVideo = false
): Promise<{ url: string; path: string; storage: 'cloudinary' | 'local' }> {
  if (!file.type.startsWith('image/') && !(allowVideo && file.type === 'video/mp4')) {
    throw Object.assign(new Error('Please choose an image or MP4 video.'), {
      status: 400,
    });
  }

  const maxUploadBytes = file.type === 'video/mp4' ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
  const maxUploadMB = file.type === 'video/mp4' ? 300 : 25;
  if (file.size > maxUploadBytes) {
    throw Object.assign(new Error(`File must be ${maxUploadMB} MB or smaller.`), { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > maxUploadBytes) {
    throw Object.assign(new Error(`File must be ${maxUploadMB} MB or smaller.`), { status: 400 });
  }

  const ext = file.name.includes('.')
    ? (file.name.split('.').pop()?.toLowerCase() ?? 'png')
    : 'png';
  const safeExt = [
    'png',
    'jpg',
    'jpeg',
    'webp',
    'gif',
    'svg',
    ...(allowVideo ? ['mp4'] : []),
  ].includes(ext)
    ? ext
    : 'png';
  const objectPath =
    requestedPath ||
    `${defaultPrefix}/${(file.name.replace(/\.[^.]+$/, '') || 'image')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .slice(0, 48)}-${randomUUID().slice(0, 8)}.${safeExt}`;

  if (cloudinaryConfigured()) {
    try {
      const result = await uploadBufferToCloudinary({
        buffer,
        objectPath,
        contentType: file.type || (safeExt === 'mp4' ? 'video/mp4' : `image/${safeExt}`),
        fileName: file.name || objectPath,
      });

      if (!process.env.VERCEL) {
        try {
          const uploadDir = env.uploadDir();
          const fullPath = join(uploadDir, objectPath);
          await mkdir(join(fullPath, '..'), { recursive: true });
          await writeFile(fullPath, buffer);
        } catch {

        }
      }
      return { ...result, storage: 'cloudinary' };
    } catch (err) {

      if (process.env.VERCEL) throw err;

      console.warn(
        '[uploads] Cloudinary failed, falling back to local disk:',
        err instanceof Error ? err.message : err
      );
    }
  }

  if (process.env.VERCEL) {
    throw Object.assign(
      new Error(
        'Cloudinary is not configured on this deployment. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Vercel → Settings → Environment Variables, then redeploy.'
      ),
      { status: 503 }
    );
  }

  const uploadDir = env.uploadDir();
  const fullPath = join(uploadDir, objectPath);
  await mkdir(join(fullPath, '..'), { recursive: true });
  await writeFile(fullPath, buffer);

  const url = `${env.publicBaseUrl()}/uploads/${objectPath.replace(/\\/g, '/')}`;
  return { url, path: objectPath, storage: 'local' };
}

export const uploadRoutes = new Hono<{ Variables: AuthVariables }>();

uploadRoutes.post('/', requireAuth, async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || typeof file === 'string') {
    return c.json({ error: 'file is required' }, 400);
  }

  const requestedPath =
    typeof body.path === 'string' && body.path.trim()
      ? body.path.trim().replace(/^\/+/, '')
      : null;

  try {
    const result = await saveUploadedMedia(
      file,
      requestedPath,
      'tag-icons',
      requestedPath?.startsWith('promo-popups/') ?? false
    );
    return c.json(result);
  } catch (err) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? Number((err as { status: number }).status)
        : 500;
    return c.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      status === 400 || status === 503 ? (status as 400 | 503) : 500
    );
  }
});

const PUBLIC_UPLOAD_PREFIXES = ['reviews/', 'chat-rooms/'] as const;

/** Public image upload for storefront reviews and chat room photos. */
uploadRoutes.post('/public', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || typeof file === 'string') {
    return c.json({ error: 'file is required' }, 400);
  }

  let requestedPath =
    typeof body.path === 'string' && body.path.trim()
      ? body.path.trim().replace(/^\/+/, '')
      : null;

  if (
    requestedPath &&
    !PUBLIC_UPLOAD_PREFIXES.some((prefix) => requestedPath!.startsWith(prefix))
  ) {
    return c.json(
      { error: 'Public uploads must use the reviews/ or chat-rooms/ path.' },
      400
    );
  }
  if (!requestedPath) {
    requestedPath = null;
  }

  const defaultPrefix =
    requestedPath?.startsWith('chat-rooms/') ? 'chat-rooms' : 'reviews';

  try {
    const result = await saveUploadedMedia(file, requestedPath, defaultPrefix);
    return c.json(result);
  } catch (err) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? Number((err as { status: number }).status)
        : 500;
    return c.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      status === 400 || status === 503 ? (status as 400 | 503) : 500
    );
  }
});

/**
 * Resolve a stored object path to a durable public URL (Cloudinary on Vercel).
 * Used by the Vercel rewrite: /uploads/* → /api/uploads/file?path=*
 */
uploadRoutes.get('/file', async (c) => {
  const raw = c.req.query('path')?.trim() || '';
  const objectPath = decodeURIComponent(raw).replace(/^\/+/, '');
  if (!objectPath || objectPath.includes('..')) {
    return c.json({ error: 'Invalid path' }, 400);
  }
  const url = resolvePublicMediaUrl(objectPath);
  if (!url) return c.json({ error: 'Not found' }, 404);
  if (/^https?:\/\//i.test(url)) {
    return c.redirect(url, 302);
  }

  const base = env.publicBaseUrl().replace(/\/$/, '');
  return c.redirect(`${base}/uploads/${objectPath}`, 302);
});

uploadRoutes.get('/health', async (c) => {
  if (cloudinaryConfigured()) {
    return c.json({
      ok: true,
      storage: 'cloudinary',
      cloud: env.cloudinaryCloudName(),
      folder: env.cloudinaryFolder(),
    });
  }

  try {
    await mkdir(env.uploadDir(), { recursive: true });
    return c.json({
      ok: true,
      storage: 'local',
      warning:
        'Using local disk. On Vercel this is temporary — set CLOUDINARY_* env vars for durable media.',
    });
  } catch (err) {
    return c.json({
      ok: false,
      storage: 'local',
      message: err instanceof Error ? err.message : 'Upload directory unavailable',
    });
  }
});
