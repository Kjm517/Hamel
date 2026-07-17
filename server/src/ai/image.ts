import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '../env';

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

export type ImagePayload = {
  mediaType: string;
  base64: string;
};

/** Resolve a chat image URL to base64 when it points at our local /uploads files. */
export async function resolveImagePayload(imageUrl: string | undefined): Promise<ImagePayload | null> {
  if (!imageUrl?.trim()) return null;
  const url = imageUrl.trim();

  const marker = '/uploads/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  const objectPath = url.slice(idx + marker.length).replace(/^\/+/, '');
  if (!objectPath || objectPath.includes('..')) return null;

  try {
    const fullPath = join(env.uploadDir(), objectPath);
    const buf = await readFile(fullPath);
    const ext = objectPath.split('.').pop()?.toLowerCase() || 'png';
    const mediaType = MIME_BY_EXT[ext] || 'image/jpeg';
    return { mediaType, base64: buf.toString('base64') };
  } catch {
    return null;
  }
}
