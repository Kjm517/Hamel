import { Hono } from 'hono';
import {
  defaultPermissionsForRole,
  hashPassword,
  mapEmployeePublic,
  type DbEmployee,
  type EmployeeRole,
  type EmployeeStatus,
} from '../auth';
import { getSql } from '../db';
import { requireAuth, requireManager, type AuthVariables } from '../middleware/auth';

export const employeeRoutes = new Hono<{ Variables: AuthVariables }>();

employeeRoutes.use('*', requireAuth);

employeeRoutes.get('/', requireManager, async (c) => {
  const sql = getSql();
  const rows = (await sql`
    select
      id, full_name, email, username, phone, role, status, added_by,
      permissions, password_hash, avatar_url, created_at::text as created_at
    from employees
    order by
      case role
        when 'Manager' then 1
        when 'Admin' then 2
        when 'Staff' then 3
        else 4
      end,
      full_name asc
  `) as DbEmployee[];
  return c.json({
    employees: rows.map(mapEmployeePublic),
  });
});

employeeRoutes.post('/', requireManager, async (c) => {
  const body = await c.req.json<{
    fullName?: string;
    email?: string;
    username?: string;
    phone?: string;
    role?: EmployeeRole;
    temporaryPassword?: string;
    password?: string;
  }>();

  const fullName = body.fullName?.trim() ?? '';
  const email = body.email?.trim().toLowerCase() ?? '';
  const username = body.username?.trim() || null;
  const phone = body.phone?.trim() || null;
  const role = (body.role ?? 'Staff') as EmployeeRole;
  const temporaryPassword = (body.temporaryPassword ?? body.password ?? '').trim();

  if (!fullName || !email) {
    return c.json({ error: 'fullName and email are required.' }, 400);
  }
  if (temporaryPassword.length < 8) {
    return c.json({ error: 'Temporary password must be at least 8 characters.' }, 400);
  }

  const current = c.get('employee');
  const permissions = defaultPermissionsForRole(role);
  const passwordHash = await hashPassword(temporaryPassword);
  const sql = getSql();

  try {
    const rows = (await sql`
      insert into employees (
        full_name, email, username, phone, role, status, added_by, permissions, password_hash
      ) values (
        ${fullName}, ${email}, ${username}, ${phone}, ${role}, 'Active',
        ${current.full_name}, ${permissions}, ${passwordHash}
      )
      returning
        id, full_name, email, username, phone, role, status, added_by,
        permissions, password_hash, avatar_url, created_at::text as created_at
    `) as DbEmployee[];
    return c.json({ employee: mapEmployeePublic(rows[0]) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('unique') || message.includes('duplicate')) {
      return c.json({ error: 'An employee with this email or username already exists.' }, 409);
    }
    throw err;
  }
});

employeeRoutes.patch('/:id', requireManager, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    fullName?: string;
    email?: string;
    username?: string;
    phone?: string;
    role?: EmployeeRole;
    status?: EmployeeStatus;
    temporaryPassword?: string;
    password?: string;
  }>();

  const sql = getSql();

  if (body.status === 'Active' || body.status === 'Inactive') {
    await sql`
      update employees
      set status = ${body.status}, updated_at = now()
      where id = ${id}::uuid
    `;
    return c.json({ ok: true });
  }

  const fullName = body.fullName?.trim() ?? '';
  const email = body.email?.trim().toLowerCase() ?? '';
  const username = body.username?.trim() || null;
  const phone = body.phone?.trim() || null;
  const role = (body.role ?? 'Staff') as EmployeeRole;
  const permissions = defaultPermissionsForRole(role);
  const temporaryPassword = (body.temporaryPassword ?? body.password ?? '').trim();

  if (temporaryPassword && temporaryPassword.length < 8) {
    return c.json({ error: 'Temporary password must be at least 8 characters.' }, 400);
  }

  try {
    const passwordHash = temporaryPassword ? await hashPassword(temporaryPassword) : null;
    const rows = (await sql`
      update employees
      set
        full_name = ${fullName},
        email = ${email},
        username = ${username},
        phone = ${phone},
        role = ${role},
        permissions = ${permissions},
        password_hash = coalesce(${passwordHash}, password_hash),
        updated_at = now()
      where id = ${id}::uuid
      returning
        id, full_name, email, username, phone, role, status, added_by,
        permissions, password_hash, avatar_url, created_at::text as created_at
    `) as DbEmployee[];
    if (!rows.length) return c.json({ error: 'Employee not found' }, 404);
    return c.json({ employee: mapEmployeePublic(rows[0]) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('unique') || message.includes('duplicate')) {
      return c.json({ error: 'An employee with this email or username already exists.' }, 409);
    }
    throw err;
  }
});

employeeRoutes.delete('/:id', requireManager, async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  await sql`delete from employees where id = ${id}::uuid`;
  return c.json({ ok: true });
});
