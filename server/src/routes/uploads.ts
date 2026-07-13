import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { env } from '../env';
import { requireAuth, type AuthVariables } from '../middleware/auth';

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

async function saveUploadedImage(
  file: File,
  requestedPath: string | null,
  defaultPrefix: string
): Promise<{ url: string; path: string }> {
  if (!file.type.startsWith('image/')) {
    throw Object.assign(new Error('Please choose an image file (PNG, JPG, WebP, etc.).'), {
      status: 400,
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw Object.assign(new Error('Image must be 3 MB or smaller.'), { status: 400 });
  }

  const ext = file.name.includes('.')
    ? (file.name.split('.').pop()?.toLowerCase() ?? 'png')
    : 'png';
  const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) ? ext : 'png';
  const objectPath =
    requestedPath ||
    `${defaultPrefix}/${(file.name.replace(/\.[^.]+$/, '') || 'image')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .slice(0, 48)}-${randomUUID().slice(0, 8)}.${safeExt}`;

  const uploadDir = env.uploadDir();
  const fullPath = join(uploadDir, objectPath);
  await mkdir(join(fullPath, '..'), { recursive: true });
  await writeFile(fullPath, buffer);

  const url = `${env.publicBaseUrl()}/uploads/${objectPath.replace(/\\/g, '/')}`;
  return { url, path: objectPath };
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
    const result = await saveUploadedImage(file, requestedPath, 'tag-icons');
    return c.json(result);
  } catch (err) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? Number((err as { status: number }).status)
        : 500;
    return c.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      status === 400 ? 400 : 500
    );
  }
});

/** Public image upload for storefront review photos (reviews/ only). */
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

  if (requestedPath && !requestedPath.startsWith('reviews/')) {
    return c.json({ error: 'Public uploads must use the reviews/ path.' }, 400);
  }
  if (!requestedPath) {
    requestedPath = null;
  }

  try {
    const result = await saveUploadedImage(file, requestedPath, 'reviews');
    if (!result.path.startsWith('reviews/')) {
      return c.json({ error: 'Invalid upload path.' }, 400);
    }
    return c.json(result);
  } catch (err) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? Number((err as { status: number }).status)
        : 500;
    return c.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      status === 400 ? 400 : 500
    );
  }
});

uploadRoutes.get('/health', async (c) => {
  try {
    await mkdir(env.uploadDir(), { recursive: true });
    return c.json({ ok: true });
  } catch (err) {
    return c.json({
      ok: false,
      message: err instanceof Error ? err.message : 'Upload directory unavailable',
    });
  }
});
