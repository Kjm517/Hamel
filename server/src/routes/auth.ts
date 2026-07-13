import { Hono } from 'hono';
import {
  findActiveEmployeeByIdentifier,
  findEmployeeById,
  hashPassword,
  mapEmployeePublic,
  signAccessToken,
  storePasswordResetToken,
  createResetToken,
  consumePasswordResetToken,
  verifyPassword,
  type DbEmployee,
} from '../auth';
import { env } from '../env';
import { getSql } from '../db';
import { requireAuth, type AuthVariables } from '../middleware/auth';

export const authRoutes = new Hono<{ Variables: AuthVariables }>();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{
    identifier?: string;
    password?: string;
  }>();

  const identifier = body.identifier?.trim() ?? '';
  const password = body.password ?? '';
  if (!identifier || !password) {
    return c.json({ error: 'Email/username and password are required.' }, 400);
  }

  const employee = await findActiveEmployeeByIdentifier(identifier);
  if (!employee) {
    return c.json(
      {
        error:
          'No active employee for that email or username. Run server/sql/001_schema.sql and npm run seed:admin.',
      },
      401
    );
  }

  if (!employee.password_hash) {
    return c.json(
      {
        error:
          'This employee has no password set. Run: cd Main/server && npm run seed:admin',
      },
      401
    );
  }

  const ok = await verifyPassword(password, employee.password_hash);
  if (!ok) {
    return c.json({ error: 'Wrong password.' }, 401);
  }

  const token = await signAccessToken(employee);
  return c.json({
    token,
    employee: mapEmployeePublic(employee),
    user: { id: employee.id, email: employee.email },
  });
});

authRoutes.post('/logout', (c) => c.json({ ok: true }));

authRoutes.get('/me', requireAuth, async (c) => {
  const employee = c.get('employee');
  return c.json({
    employee: mapEmployeePublic(employee),
    user: { id: employee.id, email: employee.email },
  });
});

authRoutes.patch('/me', requireAuth, async (c) => {
  const body = await c.req.json<{
    fullName?: string;
    phone?: string | null;
    avatarUrl?: string | null;
  }>();

  const current = c.get('employee');
  const fullName =
    body.fullName !== undefined ? body.fullName.trim() : current.full_name;
  if (!fullName) {
    return c.json({ error: 'Full name is required.' }, 400);
  }

  const phone =
    body.phone !== undefined ? body.phone?.trim() || null : current.phone;
  const avatarUrl =
    body.avatarUrl !== undefined
      ? body.avatarUrl?.trim() || null
      : current.avatar_url;

  const sql = getSql();
  const rows = (await sql`
    update employees
    set
      full_name = ${fullName},
      phone = ${phone},
      avatar_url = ${avatarUrl},
      updated_at = now()
    where id = ${current.id}::uuid
    returning
      id, full_name, email, username, phone, role, status, added_by,
      permissions, password_hash, avatar_url, created_at::text as created_at
  `) as DbEmployee[];

  const employee = rows[0];
  if (!employee) return c.json({ error: 'Employee not found' }, 404);

  return c.json({
    employee: mapEmployeePublic(employee),
    user: { id: employee.id, email: employee.email },
  });
});

authRoutes.post('/forgot-password', async (c) => {
  const body = await c.req.json<{ identifier?: string }>();
  const identifier = body.identifier?.trim() ?? '';
  if (!identifier) {
    return c.json({ error: 'Email or username is required.' }, 400);
  }

  const employee = await findActiveEmployeeByIdentifier(identifier);
  // Always return a generic success shape when employee missing (avoid enumeration),
  // but include email when found so the UI can show it.
  if (!employee) {
    return c.json({
      ok: true,
      email: null,
      message: 'If an account exists, a reset link was created.',
    });
  }

  const token = createResetToken();
  await storePasswordResetToken(employee.id, token);
  const resetUrl = `${env.publicBaseUrl()}/admin/reset-password?token=${token}`;
  console.log(`[password-reset] ${employee.email}: ${resetUrl}`);

  return c.json({
    ok: true,
    email: employee.email,
    message:
      'Password reset token created. Check the API server console for the link (SMTP not configured).',
    ...(env.exposeResetToken() ? { resetToken: token, resetUrl } : {}),
  });
});

authRoutes.post('/reset-password', async (c) => {
  const body = await c.req.json<{ token?: string; password?: string }>();
  const token = body.token?.trim() ?? '';
  const password = body.password ?? '';

  if (!token) {
    return c.json({ error: 'Reset token is required.' }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters.' }, 400);
  }

  const employeeId = await consumePasswordResetToken(token);
  if (!employeeId) {
    return c.json({ error: 'Invalid or expired reset token.' }, 400);
  }

  const hash = await hashPassword(password);
  const sql = getSql();
  await sql`
    update employees
    set password_hash = ${hash}, updated_at = now()
    where id = ${employeeId}::uuid
  `;

  const employee = await findEmployeeById(employeeId);
  if (!employee || employee.status !== 'Active') {
    return c.json({ ok: true });
  }

  const accessToken = await signAccessToken(employee);
  return c.json({
    ok: true,
    token: accessToken,
    employee: mapEmployeePublic(employee),
    user: { id: employee.id, email: employee.email },
  });
});

/** Change password while logged in. */
authRoutes.post('/change-password', requireAuth, async (c) => {
  const body = await c.req.json<{ password?: string }>();
  const password = body.password ?? '';
  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters.' }, 400);
  }

  const employee = c.get('employee');
  const hash = await hashPassword(password);
  const sql = getSql();
  await sql`
    update employees
    set password_hash = ${hash}, updated_at = now()
    where id = ${employee.id}::uuid
  `;

  return c.json({ ok: true });
});
