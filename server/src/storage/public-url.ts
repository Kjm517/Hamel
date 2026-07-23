import { env } from '../env';
import { cloudinaryConfigured } from './cloudinary';

/** Turn a stored media value into a browser-fetchable absolute URL. */
export function resolvePublicMediaUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (/^https?:\/\//i.test(v) || v.startsWith('data:')) return v;

  const objectPath = v.replace(/^\/+/, '').replace(/^uploads\//, '');
  if (!objectPath) return null;



  if (cloudinaryConfigured()) {
    const cloud = env.cloudinaryCloudName();
    const folder = env.cloudinaryFolder().replace(/^\/+|\/+$/g, '') || 'hamel';
    const withoutExt = objectPath.replace(/\.[^.]+$/, '') || objectPath;
    const publicId = withoutExt.startsWith(`${folder}/`)
      ? withoutExt
      : `${folder}/${withoutExt}`;

    const ext = objectPath.match(/(\.[a-z0-9]+)$/i)?.[1] ?? '';
    return `https://res.cloudinary.com/${cloud}/image/upload/${publicId}${ext}`;
  }

  const base = env.publicBaseUrl().replace(/\/$/, '');
  return `${base}/uploads/${objectPath}`;
}
