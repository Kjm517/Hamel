import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { env } from './env';
import { createApp } from './app';

const app = createApp();

app.use(
  '/uploads/*',
  serveStatic({
    root: './',
    rewriteRequestPath: (path) => path.replace(/^\/uploads/, '/uploads'),
  })
);

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
