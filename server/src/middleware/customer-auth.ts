import { createMiddleware } from 'hono/factory';
import {
  findCustomerAccountById,
  verifyCustomerToken,
  type DbCustomerAccount,
} from '../customer-auth';

export type CustomerAuthVariables = {
  account: DbCustomerAccount;
  token: string;
};

export const requireCustomer = createMiddleware<{ Variables: CustomerAuthVariables }>(
  async (c, next) => {
    const header = c.req.header('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const payload = await verifyCustomerToken(match[1]);
      const account = await findCustomerAccountById(payload.sub);
      if (!account || account.status !== 'active') {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      c.set('account', account);
      c.set('token', match[1]);
      await next();
    } catch {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }
);
