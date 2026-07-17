import { Hono } from 'hono';
import { completeChat } from '../ai';
import { loadCatalogProducts, loadStoreSettings } from '../ai/context';
import { scoreInquiryLead } from '../ai/lead-score';
import { buildInquiryReplyDraftPrompt } from '../ai/prompt';
import { getSql } from '../db';
import { requireAuth, type AuthVariables } from '../middleware/auth';

type InquiryInput = {
  customerName?: string;
  productLabel?: string;
  productId?: string;
  quantity?: string;
  phone?: string;
  address?: string;
  propertyType?: string;
  floor?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  hp?: string;
  notes?: string;
  source?: string;
  status?: string;
};

async function upsertCustomer(input: {
  name: string;
  phone?: string | null;
  address?: string | null;
}): Promise<string | null> {
  const sql = getSql();
  const phone = input.phone?.trim() || null;
  const name = input.name.trim();
  const address = input.address?.trim() || null;
  if (!name) return null;

  if (phone) {
    const existing = (await sql`
      select id::text as id from customers where phone = ${phone} limit 1
    `) as { id: string }[];
    if (existing[0]) {
      await sql`
        update customers
        set name = ${name},
            address = coalesce(${address}, address),
            updated_at = now()
        where id = ${existing[0].id}::uuid
      `;
      return existing[0].id;
    }
  }

  const rows = (await sql`
    insert into customers (name, phone, address)
    values (${name}, ${phone}, ${address})
    returning id::text as id
  `) as { id: string }[];
  return rows[0]?.id ?? null;
}

export const inquiryRoutes = new Hono<{ Variables: AuthVariables }>();

/** Public create from storefront */
inquiryRoutes.post('/', async (c) => {
  const body = (await c.req.json()) as InquiryInput;
  const customerName = body.customerName?.trim() ?? '';
  if (!customerName) return c.json({ error: 'customerName is required' }, 400);

  const customerId = await upsertCustomer({
    name: customerName,
    phone: body.phone,
    address: body.address,
  });

  const lead = scoreInquiryLead({
    productLabel: body.productLabel,
    productId: body.productId,
    quantity: body.quantity,
    phone: body.phone,
    address: body.address,
    propertyType: body.propertyType,
    scheduleDate: body.scheduleDate,
    scheduleTime: body.scheduleTime,
    hp: body.hp,
    notes: body.notes,
  });

  const sql = getSql();
  const leadReasonsJson = JSON.stringify(lead.reasons);

  const insertWithLead = async () => {
    if (customerId) {
      return (await sql`
        insert into inquiries (
          status, customer_name, product_label, product_id, quantity,
          phone, address, property_type, floor, schedule_date, schedule_time,
          hp, notes, source, customer_id, lead_score, lead_reasons
        ) values (
          'pending',
          ${customerName},
          ${body.productLabel ?? null},
          ${body.productId ?? null},
          ${body.quantity ?? null},
          ${body.phone ?? null},
          ${body.address ?? null},
          ${body.propertyType ?? null},
          ${body.floor ?? null},
          ${body.scheduleDate ?? null},
          ${body.scheduleTime ?? null},
          ${body.hp ?? null},
          ${body.notes ?? null},
          ${body.source ?? 'storefront'},
          ${customerId}::uuid,
          ${lead.score},
          ${leadReasonsJson}::jsonb
        )
        returning id::text as id
      `) as { id: string }[];
    }
    return (await sql`
      insert into inquiries (
        status, customer_name, product_label, product_id, quantity,
        phone, address, property_type, floor, schedule_date, schedule_time,
        hp, notes, source, lead_score, lead_reasons
      ) values (
        'pending',
        ${customerName},
        ${body.productLabel ?? null},
        ${body.productId ?? null},
        ${body.quantity ?? null},
        ${body.phone ?? null},
        ${body.address ?? null},
        ${body.propertyType ?? null},
        ${body.floor ?? null},
        ${body.scheduleDate ?? null},
        ${body.scheduleTime ?? null},
        ${body.hp ?? null},
        ${body.notes ?? null},
        ${body.source ?? 'storefront'},
        ${lead.score},
        ${leadReasonsJson}::jsonb
      )
      returning id::text as id
    `) as { id: string }[];
  };

  const insertLegacy = async () => {
    if (customerId) {
      return (await sql`
        insert into inquiries (
          status, customer_name, product_label, product_id, quantity,
          phone, address, property_type, floor, schedule_date, schedule_time,
          hp, notes, source, customer_id
        ) values (
          'pending',
          ${customerName},
          ${body.productLabel ?? null},
          ${body.productId ?? null},
          ${body.quantity ?? null},
          ${body.phone ?? null},
          ${body.address ?? null},
          ${body.propertyType ?? null},
          ${body.floor ?? null},
          ${body.scheduleDate ?? null},
          ${body.scheduleTime ?? null},
          ${body.hp ?? null},
          ${body.notes ?? null},
          ${body.source ?? 'storefront'},
          ${customerId}::uuid
        )
        returning id::text as id
      `) as { id: string }[];
    }
    return (await sql`
      insert into inquiries (
        status, customer_name, product_label, product_id, quantity,
        phone, address, property_type, floor, schedule_date, schedule_time,
        hp, notes, source
      ) values (
        'pending',
        ${customerName},
        ${body.productLabel ?? null},
        ${body.productId ?? null},
        ${body.quantity ?? null},
        ${body.phone ?? null},
        ${body.address ?? null},
        ${body.propertyType ?? null},
        ${body.floor ?? null},
        ${body.scheduleDate ?? null},
        ${body.scheduleTime ?? null},
        ${body.hp ?? null},
        ${body.notes ?? null},
        ${body.source ?? 'storefront'}
      )
      returning id::text as id
    `) as { id: string }[];
  };

  let rows: { id: string }[];
  try {
    rows = await insertWithLead();
  } catch {
    rows = await insertLegacy();
  }

  return c.json({
    ok: true,
    id: rows[0]?.id,
    customerId,
    leadScore: lead.score,
    leadReasons: lead.reasons,
  });
});

inquiryRoutes.get('/', requireAuth, async (c) => {
  const limit = Math.min(Number(c.req.query('limit') || 50), 200);
  const status = c.req.query('status')?.trim();
  const leadScore = c.req.query('leadScore')?.trim();
  const sql = getSql();

  try {
    const rows =
      status && leadScore
        ? ((await sql`
            select
              id::text as id, status, customer_name, product_label, product_id, quantity,
              phone, address, property_type, floor, schedule_date, schedule_time,
              hp, notes, source, customer_id::text as customer_id,
              lead_score, lead_reasons, ai_reply_draft,
              ai_reply_draft_at::text as ai_reply_draft_at,
              created_at::text as created_at, updated_at::text as updated_at
            from inquiries
            where status = ${status} and lead_score = ${leadScore}
            order by
              case lead_score when 'high' then 0 when 'hot' then 0 when 'medium' then 1 when 'warm' then 1 else 2 end,
              created_at desc
            limit ${limit}
          `) as Record<string, unknown>[])
        : status
          ? ((await sql`
              select
                id::text as id, status, customer_name, product_label, product_id, quantity,
                phone, address, property_type, floor, schedule_date, schedule_time,
                hp, notes, source, customer_id::text as customer_id,
                lead_score, lead_reasons, ai_reply_draft,
                ai_reply_draft_at::text as ai_reply_draft_at,
                created_at::text as created_at, updated_at::text as updated_at
              from inquiries
              where status = ${status}
              order by
                case lead_score when 'high' then 0 when 'hot' then 0 when 'medium' then 1 when 'warm' then 1 else 2 end,
                created_at desc
              limit ${limit}
            `) as Record<string, unknown>[])
          : leadScore
            ? ((await sql`
                select
                  id::text as id, status, customer_name, product_label, product_id, quantity,
                  phone, address, property_type, floor, schedule_date, schedule_time,
                  hp, notes, source, customer_id::text as customer_id,
                  lead_score, lead_reasons, ai_reply_draft,
                  ai_reply_draft_at::text as ai_reply_draft_at,
                  created_at::text as created_at, updated_at::text as updated_at
                from inquiries
                where lead_score = ${leadScore}
                order by
                  case lead_score when 'high' then 0 when 'hot' then 0 when 'medium' then 1 when 'warm' then 1 else 2 end,
                  created_at desc
                limit ${limit}
              `) as Record<string, unknown>[])
            : ((await sql`
                select
                  id::text as id, status, customer_name, product_label, product_id, quantity,
                  phone, address, property_type, floor, schedule_date, schedule_time,
                  hp, notes, source, customer_id::text as customer_id,
                  lead_score, lead_reasons, ai_reply_draft,
                  ai_reply_draft_at::text as ai_reply_draft_at,
                  created_at::text as created_at, updated_at::text as updated_at
                from inquiries
                order by
                  case lead_score when 'high' then 0 when 'hot' then 0 when 'medium' then 1 when 'warm' then 1 else 2 end,
                  created_at desc
                limit ${limit}
              `) as Record<string, unknown>[]);

    return c.json({ inquiries: rows });
  } catch {
    const rows = status
      ? ((await sql`
          select
            id::text as id, status, customer_name, product_label, product_id, quantity,
            phone, address, property_type, floor, schedule_date, schedule_time,
            hp, notes, source, customer_id::text as customer_id,
            created_at::text as created_at, updated_at::text as updated_at
          from inquiries
          where status = ${status}
          order by created_at desc
          limit ${limit}
        `) as Record<string, unknown>[])
      : ((await sql`
          select
            id::text as id, status, customer_name, product_label, product_id, quantity,
            phone, address, property_type, floor, schedule_date, schedule_time,
            hp, notes, source, customer_id::text as customer_id,
            created_at::text as created_at, updated_at::text as updated_at
          from inquiries
          order by created_at desc
          limit ${limit}
        `) as Record<string, unknown>[]);
    return c.json({ inquiries: rows });
  }
});

inquiryRoutes.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  try {
    const rows = (await sql`
      select
        id::text as id, status, customer_name, product_label, product_id, quantity,
        phone, address, property_type, floor, schedule_date, schedule_time,
        hp, notes, source, customer_id::text as customer_id,
        lead_score, lead_reasons, ai_reply_draft,
        ai_reply_draft_at::text as ai_reply_draft_at,
        created_at::text as created_at, updated_at::text as updated_at
      from inquiries
      where id = ${id}::uuid
      limit 1
    `) as Record<string, unknown>[];
    if (!rows[0]) return c.json({ error: 'Not found' }, 404);
    return c.json({ inquiry: rows[0] });
  } catch {
    const rows = (await sql`
      select
        id::text as id, status, customer_name, product_label, product_id, quantity,
        phone, address, property_type, floor, schedule_date, schedule_time,
        hp, notes, source, customer_id::text as customer_id,
        created_at::text as created_at, updated_at::text as updated_at
      from inquiries
      where id = ${id}::uuid
      limit 1
    `) as Record<string, unknown>[];
    if (!rows[0]) return c.json({ error: 'Not found' }, 404);
    return c.json({ inquiry: rows[0] });
  }
});

inquiryRoutes.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json()) as {
    status?: string;
    notes?: string;
    leadScore?: string;
  };
  const sql = getSql();

  if (body.status) {
    await sql`
      update inquiries
      set status = ${body.status}, updated_at = now()
      where id = ${id}::uuid
    `;
  }
  if (body.notes !== undefined) {
    await sql`
      update inquiries
      set notes = ${body.notes}, updated_at = now()
      where id = ${id}::uuid
    `;
  }
  if (body.leadScore !== undefined) {
    const raw = String(body.leadScore).toLowerCase();
    const score =
      raw === 'high' || raw === 'hot'
        ? 'high'
        : raw === 'medium' || raw === 'warm'
          ? 'medium'
          : raw === 'low' || raw === 'cold'
            ? 'low'
            : null;
    if (!score) return c.json({ error: 'leadScore must be high, medium, or low' }, 400);
    try {
      await sql`
        update inquiries
        set lead_score = ${score},
            lead_reasons = ${JSON.stringify(['Set manually by admin'])}::jsonb,
            updated_at = now()
        where id = ${id}::uuid
      `;
    } catch (err) {
      return c.json(
        {
          error:
            err instanceof Error
              ? err.message
              : 'Could not save priority — run sql/008_ai_features.sql in Neon.',
        },
        500
      );
    }
    return c.json({ ok: true, leadScore: score, leadReasons: ['Set manually by admin'] });
  }
  return c.json({ ok: true });
});

inquiryRoutes.patch('/:id/complete', requireAuth, async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  await sql`
    update inquiries
    set status = 'completed', updated_at = now()
    where id = ${id}::uuid
  `;
  return c.json({ ok: true });
});

/** Recompute lead score from current inquiry fields */
inquiryRoutes.post('/:id/score', requireAuth, async (c) => {
  const id = c.req.param('id');
  const sql = getSql();
  const rows = (await sql`
    select product_label, product_id, quantity, phone, address, property_type,
           schedule_date, schedule_time, hp, notes
    from inquiries where id = ${id}::uuid limit 1
  `) as Record<string, string | null>[];
  if (!rows[0]) return c.json({ error: 'Not found' }, 404);

  const row = rows[0];
  const lead = scoreInquiryLead({
    productLabel: row.product_label,
    productId: row.product_id,
    quantity: row.quantity,
    phone: row.phone,
    address: row.address,
    propertyType: row.property_type,
    scheduleDate: row.schedule_date,
    scheduleTime: row.schedule_time,
    hp: row.hp,
    notes: row.notes,
  });

  try {
    await sql`
      update inquiries
      set lead_score = ${lead.score},
          lead_reasons = ${JSON.stringify(lead.reasons)}::jsonb,
          updated_at = now()
      where id = ${id}::uuid
    `;
  } catch (err) {
    return c.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Could not save lead score — run sql/008_ai_features.sql in Neon.',
        leadScore: lead.score,
        leadReasons: lead.reasons,
      },
      500
    );
  }

  return c.json({ ok: true, leadScore: lead.score, leadReasons: lead.reasons });
});

/** AI-suggested admin reply draft */
inquiryRoutes.post('/:id/draft-reply', requireAuth, async (c) => {
  const id = c.req.param('id');
  const sql = getSql();

  let inquiry: Record<string, unknown> | null = null;
  try {
    const rows = (await sql`
      select
        id::text as id, status, customer_name, product_label, product_id, quantity,
        phone, address, property_type, floor, schedule_date, schedule_time,
        hp, notes, source, customer_id::text as customer_id,
        lead_score, lead_reasons, ai_reply_draft,
        ai_reply_draft_at::text as ai_reply_draft_at,
        created_at::text as created_at, updated_at::text as updated_at
      from inquiries where id = ${id}::uuid limit 1
    `) as Record<string, unknown>[];
    inquiry = rows[0] ?? null;
  } catch {
    const rows = (await sql`
      select
        id::text as id, status, customer_name, product_label, product_id, quantity,
        phone, address, property_type, floor, schedule_date, schedule_time,
        hp, notes, source, customer_id::text as customer_id,
        created_at::text as created_at, updated_at::text as updated_at
      from inquiries where id = ${id}::uuid limit 1
    `) as Record<string, unknown>[];
    inquiry = rows[0] ?? null;
  }

  if (!inquiry) return c.json({ error: 'Not found' }, 404);

  const [products, settings] = await Promise.all([
    loadCatalogProducts(60),
    loadStoreSettings(),
  ]);

  const system = buildInquiryReplyDraftPrompt({
    inquiry,
    products,
    settings,
  });

  try {
    const result = await completeChat({
      system,
      messages: [
        {
          role: 'user',
          content:
            'Draft a short customer reply for this inquiry now. Output only the message body.',
        },
      ],
    });

    try {
      await sql`
        update inquiries
        set ai_reply_draft = ${result.text},
            ai_reply_draft_at = now(),
            updated_at = now()
        where id = ${id}::uuid
      `;
    } catch {
      // migration may not be applied yet — still return draft
    }

    return c.json({
      draft: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Draft failed';
    return c.json({ error: message }, 500);
  }
});
