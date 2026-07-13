import { Hono } from 'hono';
import { getSql } from '../db';
import { requireAuth, type AuthVariables } from '../middleware/auth';

export const messageRoutes = new Hono<{ Variables: AuthVariables }>();

/** Public create (contact form / AI) */
messageRoutes.post('/', async (c) => {
  const body = await c.req.json<{
    name?: string;
    contact?: string;
    channel?: string;
    body?: string;
  }>();
  const name = body.name?.trim() || 'Guest';
  const contact = body.contact?.trim() || '';
  const channel = body.channel?.trim() || 'contact';
  const text = body.body?.trim() || '';
  if (!text) return c.json({ error: 'body is required' }, 400);

  const sql = getSql();
  const rows = (await sql`
    insert into messages (name, contact, channel, body, status)
    values (${name}, ${contact}, ${channel}, ${text}, 'unread')
    returning id::text as id
  `) as { id: string }[];
  return c.json({ ok: true, id: rows[0]?.id });
});

messageRoutes.get('/', requireAuth, async (c) => {
  const limit = Math.min(Number(c.req.query('limit') || 100), 300);
  const status = c.req.query('status')?.trim();
  const sql = getSql();

  const rows = status
    ? ((await sql`
        select
          id::text as id, customer_id::text as customer_id, name, contact,
          channel, body, status, created_at::text as created_at
        from messages
        where status = ${status}
        order by created_at desc
        limit ${limit}
      `) as Record<string, unknown>[])
    : ((await sql`
        select
          id::text as id, customer_id::text as customer_id, name, contact,
          channel, body, status, created_at::text as created_at
        from messages
        order by created_at desc
        limit ${limit}
      `) as Record<string, unknown>[]);

  return c.json({ messages: rows });
});

messageRoutes.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ status?: string }>();
  if (!body.status) return c.json({ error: 'status required' }, 400);
  const sql = getSql();
  await sql`
    update messages
    set status = ${body.status}, updated_at = now()
    where id = ${id}::uuid
  `;
  return c.json({ ok: true });
});
