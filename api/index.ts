import { handle } from 'hono/vercel';
import { createApp } from '../server/src/app.js';

/**
 * Single Vercel serverless entry for all /api/* routes.
 * Set NODEJS_HELPERS=0 in Vercel env (required for Hono POST body parsing).
 */
export const config = {
  maxDuration: 60,
  memory: 1024,
};

const app = createApp();

export default handle(app);
