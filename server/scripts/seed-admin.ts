import { hashPassword } from '../src/auth';
import { getSql } from '../src/db';
import '../src/env';

const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD?.trim() || 'HamelAdmin1!';
const email = process.env.SEED_ADMIN_EMAIL?.trim() || 'manager@hamel.example';
const username = process.env.SEED_ADMIN_USERNAME?.trim() || 'manager';

async function main() {
  const sql = getSql();
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  await sql`
    insert into employees (
      full_name, email, username, phone, role, status, added_by, permissions, password_hash
    ) values (
      'Hamel Manager',
      ${email},
      ${username},
      null,
      'Manager',
      'Active',
      'seed',
      array['dashboard','products','inquiries','customers','messages','analytics','settings','employees']::text[],
      ${passwordHash}
    )
    on conflict (email) do update set
      username = excluded.username,
      role = 'Manager',
      status = 'Active',
      password_hash = excluded.password_hash,
      permissions = excluded.permissions,
      updated_at = now()
  `;

  console.log(`Seeded admin employee:`);
  console.log(`  email:    ${email}`);
  console.log(`  username: ${username}`);
  console.log(`  password: ${DEFAULT_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
