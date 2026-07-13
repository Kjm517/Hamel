import { createMiddleware } from 'hono/factory';
import {
  canManageTeam,
  findEmployeeById,
  mapEmployeePublic,
  verifyAccessToken,
  type DbEmployee,
} from '../auth';

export type AuthVariables = {
  employee: DbEmployee;
  token: string;
};

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const header = c.req.header('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await verifyAccessToken(match[1]);
    const employee = await findEmployeeById(payload.sub);
    if (!employee || employee.status !== 'Active') {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    c.set('employee', employee);
    c.set('token', match[1]);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

export const requireManager = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const employee = c.get('employee');
  if (!canManageTeam(employee.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
});

export { mapEmployeePublic };
