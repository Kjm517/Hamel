import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

/** Minimal .env loader (no dotenv dependency). */
function loadDotEnv() {
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
}

loadDotEnv();

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  databaseUrl: () => required('DATABASE_URL'),
  jwtSecret: () => required('JWT_SECRET'),
  port: () => Number(process.env.PORT || 8787),
  uploadDir: () => resolve(root, process.env.UPLOAD_DIR?.trim() || 'uploads'),
  publicBaseUrl: () =>
    (process.env.PUBLIC_BASE_URL?.trim() || 'http://localhost:5173').replace(/\/$/, ''),
  exposeResetToken: () => process.env.DEV_EXPOSE_RESET_TOKEN === 'true',

  /** Comma-separated browser origins allowed to call the API (Vercel + local). */
  corsOrigins: (): string[] => {
    const defaults = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    const extra = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean);
    return [...new Set([...defaults, ...extra])];
  },

  /** claude (default sample) | gemini (client later) */
  aiProvider: (): 'claude' | 'gemini' => {
    const v = (process.env.AI_PROVIDER || 'claude').trim().toLowerCase();
    return v === 'gemini' ? 'gemini' : 'claude';
  },
  anthropicApiKey: () => process.env.ANTHROPIC_API_KEY?.trim() || '',
  anthropicModel: () =>
    process.env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-4-5-20251001',
  geminiApiKey: () => process.env.GEMINI_API_KEY?.trim() || '',
  geminiModel: () => process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash',

  /** Messenger Platform (Page → customer, Faith Hugs–style). */
  messengerPageAccessToken: () => process.env.MESSENGER_PAGE_ACCESS_TOKEN?.trim() || '',
  messengerVerifyToken: () =>
    process.env.MESSENGER_VERIFY_TOKEN?.trim() || 'hamel_messenger_verify',
  messengerPageUsername: () => process.env.MESSENGER_PAGE_USERNAME?.trim() || '',
};
