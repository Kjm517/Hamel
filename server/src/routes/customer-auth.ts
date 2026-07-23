import { Hono } from 'hono';
import {
  consumeVerificationCode,
  createCustomerAccount,
  createVerificationCode,
  findCustomerAccountByEmail,
  hashPassword,
  mapCustomerPublic,
  signCustomerToken,
  storeVerificationCode,
  updateCustomerEmail,
  updateCustomerPassword,
  updateCustomerProfile,
  verifyPassword,
} from '../customer-auth';
import { sendEmail, verificationEmailHtml } from '../mail';
import { env } from '../env';
import {
  requireCustomer,
  type CustomerAuthVariables,
} from '../middleware/customer-auth';

export const customerAuthRoutes = new Hono<{ Variables: CustomerAuthVariables }>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Generate + persist a fresh code and email it. Returns a dev code in dev mode. */
async function issueVerificationCode(
  accountId: string,
  email: string
): Promise<{ devCode?: string }> {
  const code = createVerificationCode();
  await storeVerificationCode(accountId, code);

  const result = await sendEmail({
    to: email,
    subject: 'Your Hamel verification code',
    html: verificationEmailHtml(code),
    text: `Your Hamel verification code is ${code}. It expires in 15 minutes.`,
  });

  if (!result.sent) {
    // No provider configured (or send failed) — log so local dev can proceed.
    console.log(`[customer-verify] ${email}: code ${code}`);
  }

  return env.exposeResetToken() ? { devCode: code } : {};
}

customerAuthRoutes.post('/register', async (c) => {
  const body = await c.req.json<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  }>();

  const name = body.name?.trim() ?? '';
  const email = body.email?.trim() ?? '';
  const password = body.password ?? '';
  const phone = body.phone?.trim() || null;

  if (!name) return c.json({ error: 'Your name is required.' }, 400);
  if (!EMAIL_RE.test(email)) {
    return c.json({ error: 'Enter a valid email address.' }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters.' }, 400);
  }

  const existing = await findCustomerAccountByEmail(email);
  if (existing) {
    return c.json(
      { error: 'An account with that email already exists. Try signing in.' },
      409
    );
  }

  const passwordHash = await hashPassword(password);
  const account = await createCustomerAccount({ name, email, phone, passwordHash });

  const { devCode } = await issueVerificationCode(account.id, account.email);

  return c.json({
    ok: true,
    requiresVerification: true,
    email: account.email,
    ...(devCode ? { devCode } : {}),
  });
});

customerAuthRoutes.post('/verify-email', async (c) => {
  const body = await c.req.json<{ email?: string; code?: string }>();
  const email = body.email?.trim() ?? '';
  const code = body.code?.trim() ?? '';

  if (!email || !code) {
    return c.json({ error: 'Email and code are required.' }, 400);
  }

  const account = await findCustomerAccountByEmail(email);
  if (!account) {
    return c.json({ error: 'No account found for that email.' }, 404);
  }
  if (account.email_verified_at) {
    const token = await signCustomerToken(account);
    return c.json({ ok: true, token, customer: mapCustomerPublic(account) });
  }

  const ok = await consumeVerificationCode(account.id, code);
  if (!ok) {
    return c.json({ error: 'That code is invalid or has expired.' }, 400);
  }

  const fresh = (await findCustomerAccountByEmail(email)) ?? account;
  const token = await signCustomerToken(fresh);
  return c.json({ ok: true, token, customer: mapCustomerPublic(fresh) });
});

customerAuthRoutes.post('/resend-code', async (c) => {
  const body = await c.req.json<{ email?: string }>();
  const email = body.email?.trim() ?? '';
  if (!email) return c.json({ error: 'Email is required.' }, 400);

  const account = await findCustomerAccountByEmail(email);
  // Don't leak whether the account exists / is already verified.
  if (!account || account.email_verified_at) {
    return c.json({ ok: true });
  }

  const { devCode } = await issueVerificationCode(account.id, account.email);
  return c.json({ ok: true, ...(devCode ? { devCode } : {}) });
});

customerAuthRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const email = body.email?.trim() ?? '';
  const password = body.password ?? '';

  if (!email || !password) {
    return c.json({ error: 'Email and password are required.' }, 400);
  }

  const account = await findCustomerAccountByEmail(email);
  if (!account || account.status !== 'active') {
    return c.json({ error: 'Wrong email or password.' }, 401);
  }

  const ok = await verifyPassword(password, account.password_hash);
  if (!ok) {
    return c.json({ error: 'Wrong email or password.' }, 401);
  }

  if (!account.email_verified_at) {
    // Registered but never verified — send a new code and ask for it.
    const { devCode } = await issueVerificationCode(account.id, account.email);
    return c.json(
      {
        requiresVerification: true,
        email: account.email,
        ...(devCode ? { devCode } : {}),
      },
      403
    );
  }

  const token = await signCustomerToken(account);
  return c.json({ ok: true, token, customer: mapCustomerPublic(account) });
});

customerAuthRoutes.post('/logout', (c) => c.json({ ok: true }));

customerAuthRoutes.get('/me', requireCustomer, async (c) => {
  const account = c.get('account');
  return c.json({ customer: mapCustomerPublic(account) });
});

customerAuthRoutes.patch('/profile', requireCustomer, async (c) => {
  const account = c.get('account');
  const body = await c.req.json<{ name?: string; phone?: string | null }>();
  const name = body.name?.trim() ?? '';
  const phoneRaw = body.phone;
  const phone =
    phoneRaw === null || phoneRaw === undefined
      ? null
      : String(phoneRaw).trim() || null;

  if (!name) return c.json({ error: 'Your name is required.' }, 400);

  const fresh = await updateCustomerProfile(account.id, { name, phone });
  return c.json({ ok: true, customer: mapCustomerPublic(fresh) });
});

customerAuthRoutes.post('/change-password', requireCustomer, async (c) => {
  const account = c.get('account');
  const body = await c.req.json<{
    currentPassword?: string;
    newPassword?: string;
  }>();
  const currentPassword = body.currentPassword ?? '';
  const newPassword = body.newPassword ?? '';

  if (!currentPassword) {
    return c.json({ error: 'Current password is required.' }, 400);
  }
  if (newPassword.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters.' }, 400);
  }

  const ok = await verifyPassword(currentPassword, account.password_hash);
  if (!ok) {
    return c.json({ error: 'Current password is incorrect.' }, 401);
  }

  await updateCustomerPassword(account.id, await hashPassword(newPassword));
  return c.json({ ok: true });
});

customerAuthRoutes.post('/change-email', requireCustomer, async (c) => {
  const account = c.get('account');
  const body = await c.req.json<{
    newEmail?: string;
    password?: string;
  }>();
  const newEmail = body.newEmail?.trim() ?? '';
  const password = body.password ?? '';

  if (!EMAIL_RE.test(newEmail)) {
    return c.json({ error: 'Enter a valid email address.' }, 400);
  }
  if (!password) {
    return c.json({ error: 'Password is required to change your email.' }, 400);
  }

  const ok = await verifyPassword(password, account.password_hash);
  if (!ok) {
    return c.json({ error: 'Password is incorrect.' }, 401);
  }

  if (newEmail.toLowerCase() === account.email.toLowerCase()) {
    return c.json({ error: 'That is already your current email.' }, 400);
  }

  const taken = await findCustomerAccountByEmail(newEmail);
  if (taken) {
    return c.json({ error: 'That email is already in use.' }, 409);
  }

  const fresh = await updateCustomerEmail(account.id, newEmail);
  const { devCode } = await issueVerificationCode(fresh.id, fresh.email);
  const token = await signCustomerToken(fresh);

  return c.json({
    ok: true,
    token,
    customer: mapCustomerPublic(fresh),
    requiresVerification: true,
    email: fresh.email,
    ...(devCode ? { devCode } : {}),
  });
});
