/**
 * Upload local tag chip/icon files to Cloudinary and store absolute HTTPS URLs
 * on product_tags. Required for Vercel (no persistent /uploads disk).
 *
 * Usage (from server/): npx tsx scripts/backfill-tag-media-cloudinary.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { uploadBufferToCloudinary, cloudinaryConfigured } from '../src/storage/cloudinary';

function loadEnv() {
  const path = resolve(process.cwd(), '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

function isRemoteUrl(value: string | null | undefined): boolean {
  return Boolean(value && /^https?:\/\//i.test(value.trim()));
}

function contentTypeFor(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

async function uploadLocalPath(objectPath: string): Promise<string | null> {
  const cleaned = objectPath.replace(/^\/+/, '').replace(/^uploads\//, '');
  if (!cleaned || isRemoteUrl(cleaned)) return objectPath;

  const fullPath = resolve(process.cwd(), 'uploads', cleaned);
  if (!existsSync(fullPath)) {
    console.warn(`  missing local file: ${fullPath}`);
    return null;
  }

  const buffer = readFileSync(fullPath);
  const result = await uploadBufferToCloudinary({
    buffer,
    objectPath: cleaned,
    contentType: contentTypeFor(fullPath),
    fileName: cleaned.split('/').pop() || cleaned,
  });
  console.log(`  uploaded ${cleaned} -> ${result.url}`);
  return result.url;
}

async function main() {
  if (!cloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured in server/.env');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const sql = neon(process.env.DATABASE_URL);
  const rows = (await sql`
    select id, name, chip_image_url, icon_url
    from product_tags
    order by sort_order nulls last, name
  `) as Array<{
    id: string;
    name: string;
    chip_image_url: string | null;
    icon_url: string | null;
  }>;

  console.log(`Found ${rows.length} product tags`);

  for (const row of rows) {
    console.log(`\n${row.id} (${row.name})`);
    let chip = row.chip_image_url;
    let icon = row.icon_url;

    if (chip && !isRemoteUrl(chip)) {
      chip = (await uploadLocalPath(chip)) ?? chip;
    } else {
      console.log(`  chip already remote or empty`);
    }

    if (icon && !isRemoteUrl(icon)) {
      icon = (await uploadLocalPath(icon)) ?? icon;
    }

    if (chip !== row.chip_image_url || icon !== row.icon_url) {
      await sql`
        update product_tags
        set
          chip_image_url = ${chip},
          icon_url = ${icon},
          updated_at = now()
        where id = ${row.id}
      `;
      console.log(`  DB updated`);
    }
  }

  console.log('\nDone. Redeploy is not required — production reads the same Neon DB.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
