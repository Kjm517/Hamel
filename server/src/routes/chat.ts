import { Hono } from 'hono';
import { completeChat } from '../ai';
import { buildSystemPrompt } from '../ai/prompt';
import type { ChatMessage } from '../ai/types';
import { getSql } from '../db';
import type { AuthVariables } from '../middleware/auth';

export const chatRoutes = new Hono<{ Variables: AuthVariables }>();

type IncomingMessage = {
  role?: string;
  content?: string;
  text?: string;
  sender?: string;
};

function normalizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const item of raw as IncomingMessage[]) {
    const content = String(item.content ?? item.text ?? '').trim();
    if (!content) continue;
    const roleRaw = String(item.role ?? item.sender ?? '').toLowerCase();
    const role: ChatMessage['role'] =
      roleRaw === 'assistant' || roleRaw === 'ai' ? 'assistant' : 'user';
    out.push({ role, content });
  }
  // Keep last 16 turns to control cost/context
  return out.slice(-16);
}

chatRoutes.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    message?: string;
    messages?: IncomingMessage[];
  };

  const history = normalizeMessages(body.messages);
  const latest = String(body.message ?? '').trim();
  if (latest) {
    const last = history[history.length - 1];
    if (!(last && last.role === 'user' && last.content === latest)) {
      history.push({ role: 'user', content: latest });
    }
  }

  if (!history.length || history[history.length - 1]?.role !== 'user') {
    return c.json({ error: 'message is required' }, 400);
  }

  const sql = getSql();

  const productRows = (await sql`
    select id, data
    from products
    order by id asc
    limit 60
  `) as { id: string; data: Record<string, unknown> }[];

  const products = productRows.map((row) => {
    const d = row.data ?? {};
    return {
      id: row.id,
      brand: typeof d.brand === 'string' ? d.brand : undefined,
      model: typeof d.model === 'string' ? d.model : undefined,
      category: typeof d.category === 'string' ? d.category : undefined,
      priceStart: Number(d.priceStart) || 0,
      priceEnd: Number(d.priceEnd) || Number(d.priceStart) || 0,
      hp: Array.isArray(d.hp) ? d.hp.map(String) : [],
      features: Array.isArray(d.features) ? d.features.map(String) : [],
      tier: typeof d.tier === 'string' ? d.tier : undefined,
      isActive: d.isActive !== false,
    };
  });

  let settings: Record<string, unknown> | null = null;
  try {
    const rows = (await sql`
      select data from site_settings where key = 'store' limit 1
    `) as { data: Record<string, unknown> }[];
    settings = rows[0]?.data ?? null;
  } catch {
    settings = null;
  }

  const system = buildSystemPrompt({
    products,
    settings: settings as {
      storeName?: string;
      address?: string;
      phoneDisplay?: string;
      contactEmail?: string;
      businessHours?: string;
      messengerUrl?: string;
      whatsappNumber?: string;
    } | null,
  });

  try {
    const result = await completeChat({ system, messages: history });
    return c.json({
      reply: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI chat failed';
    console.error('[chat]', message);
    // Always return a usable reply so the storefront bubble stays helpful.
    return c.json({
      reply:
        "Sorry — I'm having trouble reaching the AI right now. You can still browse products, or talk to our team on Messenger / WhatsApp from the Contact page.",
      error: message,
    });
  }
});
