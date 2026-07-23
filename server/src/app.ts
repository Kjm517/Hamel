import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { mkdirSync } from 'node:fs';
import { env } from './env';
import { authRoutes } from './routes/auth';
import { customerAuthRoutes } from './routes/customer-auth';
import { customerClaimRoutes } from './routes/customer-claims';
import { contentRoutes } from './routes/content';
import { customerRoutes } from './routes/customers';
import { employeeRoutes } from './routes/employees';
import { inquiryRoutes } from './routes/inquiries';
import { messageRoutes } from './routes/messages';
import { analyticsRoutes, dashboardRoutes, eventRoutes } from './routes/ops';
import { productRoutes } from './routes/products';
import { productTagRoutes } from './routes/product-tags';
import { reviewRoutes } from './routes/reviews';
import { chatRoutes } from './routes/chat';
import { settingsRoutes } from './routes/settings';
import { uploadRoutes } from './routes/uploads';
import { messengerRoutes } from './routes/messenger';

const isVercel = Boolean(process.env.VERCEL);

function ensureUploadDir() {
  try {
    mkdirSync(env.uploadDir(), { recursive: true });
  } catch (err) {
    console.warn('[api] upload dir not created', err);
  }
}

/** Shared Hono app for local Node server and Vercel serverless. */
export function createApp() {
  ensureUploadDir();

  const app = new Hono();

  app.use(
    '*',
    cors({
      origin: (origin) => {
        const allowed = env.corsOrigins();
        if (!origin) return allowed[0] ?? '*';
        if (allowed.includes(origin)) return origin;

        if (isVercel && /\.vercel\.app$/i.test(origin)) return origin;
        return '';
      },
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );

  app.get('/api/health', (c) =>
    c.json({ ok: true, service: 'hamel-api', vercel: isVercel })
  );

  app.route('/api/auth', authRoutes);
  app.route('/api/account/claims', customerClaimRoutes);
  app.route('/api/account', customerAuthRoutes);
  app.route('/api/products', productRoutes);
  app.route('/api/reviews', reviewRoutes);
  app.route('/api/chat', chatRoutes);
  app.route('/api/messenger', messengerRoutes);
  app.route('/api/product-tags', productTagRoutes);
  app.route('/api/employees', employeeRoutes);
  app.route('/api/inquiries', inquiryRoutes);
  app.route('/api/customers', customerRoutes);
  app.route('/api/messages', messageRoutes);
  app.route('/api/content', contentRoutes);
  app.route('/api/settings', settingsRoutes);
  app.route('/api/events', eventRoutes);
  app.route('/api/analytics', analyticsRoutes);
  app.route('/api/dashboard', dashboardRoutes);
  app.route('/api/uploads', uploadRoutes);

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: err.message || 'Internal server error' }, 500);
  });

  return app;
}
