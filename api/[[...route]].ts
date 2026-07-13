import { handle } from 'hono/vercel';
import { createApp } from '../server/src/app';

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

const app = createApp();

export default handle(app);
