import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { mkdirSync } from 'node:fs';
import { env } from './env';
import { authRoutes } from './routes/auth';
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

mkdirSync(env.uploadDir(), { recursive: true });

const app = new Hono();

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.get('/api/health', (c) => c.json({ ok: true, service: 'hamel-api' }));

app.route('/api/auth', authRoutes);
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

app.use(
  '/uploads/*',
  serveStatic({
    root: './',
    rewriteRequestPath: (path) => path.replace(/^\/uploads/, '/uploads'),
  })
);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

const port = env.port();
const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`Hamel API listening on http://localhost:${port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other process, then restart.`);
    process.exit(1);
  }
  throw err;
});
