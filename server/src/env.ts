import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const isVercel = Boolean(process.env.VERCEL);

/** Minimal .env loader for local Node. Skipped on Vercel (uses dashboard env). */
function loadDotEnv() {
  if (isVercel) return;
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const root = resolve(__dirname, '..');
    const path = resolve(root, '.env');
    if (!existsSync(path)) return;
    const text = readFileSync(path, 'utf8');
    for (const line of text.split(/\r?\n/)) {
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
  } catch {
    // ignore — env may be injected by the host
  }
}

loadDotEnv();

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function serverRoot(): string {
  try {
    return resolve(dirname(fileURLToPath(import.meta.url)), '..');
  } catch {
    return process.cwd();
  }
}

export const env = {
  databaseUrl: () => required('DATABASE_URL'),
  jwtSecret: () => required('JWT_SECRET'),
  port: () => Number(process.env.PORT || 8787),
  uploadDir: () => {
    if (isVercel) {
      return resolve('/tmp', process.env.UPLOAD_DIR?.trim() || 'hamel-uploads');
    }
    return resolve(serverRoot(), process.env.UPLOAD_DIR?.trim() || 'uploads');
  },
  publicBaseUrl: () => {
    const fromEnv = process.env.PUBLIC_BASE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`;
    }
    return 'http://localhost:5173';
  },
  exposeResetToken: () => process.env.DEV_EXPOSE_RESET_TOKEN === 'true',

  corsOrigins: (): string[] => {
    const defaults = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    const extra = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean);
    return [...new Set([...defaults, ...extra])];
  },

  aiProvider: (): 'claude' | 'gemini' => {
    const v = (process.env.AI_PROVIDER || 'claude').trim().toLowerCase();
    return v === 'gemini' ? 'gemini' : 'claude';
  },
  anthropicApiKey: () => process.env.ANTHROPIC_API_KEY?.trim() || '',
  anthropicModel: () =>
    process.env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-4-5-20251001',
  geminiApiKey: () => process.env.GEMINI_API_KEY?.trim() || '',
  geminiModel: () => process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash',

  messengerPageAccessToken: () => process.env.MESSENGER_PAGE_ACCESS_TOKEN?.trim() || '',
  messengerVerifyToken: () =>
    process.env.MESSENGER_VERIFY_TOKEN?.trim() || 'hamel_messenger_verify',
  messengerPageUsername: () => process.env.MESSENGER_PAGE_USERNAME?.trim() || '',
  resendApiKey: () => process.env.RESEND_API_KEY?.trim() || '',
  resendFrom: () => process.env.RESEND_FROM?.trim() || 'Hamel Trading <onboarding@resend.dev>',

  /** Free-tier Cloudinary (temporary media). When set, uploads skip local disk. */
  cloudinaryCloudName: () =>
    (process.env.CLOUDINARY_CLOUD_NAME || '').trim().replace(/^["']|["']$/g, ''),
  cloudinaryApiKey: () =>
    (process.env.CLOUDINARY_API_KEY || '').trim().replace(/^["']|["']$/g, ''),
  cloudinaryApiSecret: () =>
    (process.env.CLOUDINARY_API_SECRET || '').trim().replace(/^["']|["']$/g, ''),
  cloudinaryFolder: () =>
    (process.env.CLOUDINARY_FOLDER || 'hamel').trim().replace(/^["']|["']$/g, '') || 'hamel',
};
