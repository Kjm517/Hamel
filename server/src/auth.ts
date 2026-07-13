import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { getSql } from './db';
import { env } from './env';

export type EmployeeRole = 'Manager' | 'Admin' | 'Staff' | 'Viewer';
export type EmployeeStatus = 'Active' | 'Inactive';

export type DbEmployee = {
  id: string;
  full_name: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: EmployeeRole;
  status: EmployeeStatus;
  added_by: string | null;
  permissions: string[];
  password_hash: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: EmployeeRole;
};

function secretKey() {
  return new TextEncoder().encode(env.jwtSecret());
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAccessToken(employee: DbEmployee): Promise<string> {
  return new SignJWT({
    email: employee.email,
    role: employee.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(employee.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secretKey());
  const sub = payload.sub;
  const email = typeof payload.email === 'string' ? payload.email : '';
  const role = payload.role as EmployeeRole;
  if (!sub || !email || !role) throw new Error('Invalid token payload');
  return { sub, email, role };
}

export function mapEmployeePublic(row: DbEmployee) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    username: row.username,
    phone: row.phone,
    role: row.role,
    status: row.status,
    addedBy: row.added_by,
    permissions: row.permissions ?? [],
    authLinked: Boolean(row.password_hash),
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export async function findActiveEmployeeByIdentifier(
  identifier: string
): Promise<DbEmployee | null> {
  const sql = getSql();
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const rows = (await sql`
    select
      id, full_name, email, username, phone, role, status, added_by,
      permissions, password_hash, avatar_url, created_at::text as created_at
    from employees
    where status = 'Active'
      and (
        lower(email) = lower(${trimmed})
        or lower(coalesce(username, '')) = lower(${trimmed})
      )
    limit 1
  `) as DbEmployee[];

  return rows[0] ?? null;
}

export async function findEmployeeById(id: string): Promise<DbEmployee | null> {
  const sql = getSql();
  const rows = (await sql`
    select
      id, full_name, email, username, phone, role, status, added_by,
      permissions, password_hash, avatar_url, created_at::text as created_at
    from employees
    where id = ${id}::uuid
    limit 1
  `) as DbEmployee[];
  return rows[0] ?? null;
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createResetToken(): string {
  return randomBytes(32).toString('hex');
}

export async function storePasswordResetToken(employeeId: string, token: string) {
  const sql = getSql();
  const tokenHash = hashResetToken(token);
  await sql`
    delete from password_reset_tokens
    where employee_id = ${employeeId}::uuid
       or expires_at < now()
  `;
  await sql`
    insert into password_reset_tokens (employee_id, token_hash, expires_at)
    values (${employeeId}::uuid, ${tokenHash}, now() + interval '1 hour')
  `;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const sql = getSql();
  const tokenHash = hashResetToken(token);
  const rows = (await sql`
    select employee_id::text as employee_id
    from password_reset_tokens
    where token_hash = ${tokenHash}
      and expires_at > now()
    limit 1
  `) as { employee_id: string }[];

  const row = rows[0];
  if (!row) return null;

  await sql`delete from password_reset_tokens where token_hash = ${tokenHash}`;
  return row.employee_id;
}

export function defaultPermissionsForRole(role: EmployeeRole): string[] {
  switch (role) {
    case 'Manager':
    case 'Admin':
      return [
        'dashboard',
        'products',
        'inquiries',
        'customers',
        'messages',
        'analytics',
        'settings',
        'employees',
      ];
    case 'Staff':
      return ['dashboard', 'products', 'inquiries', 'customers', 'messages'];
    case 'Viewer':
      return ['dashboard', 'products'];
    default:
      return ['dashboard'];
  }
}

export function canManageTeam(role: EmployeeRole): boolean {
  return role === 'Manager' || role === 'Admin';
}
