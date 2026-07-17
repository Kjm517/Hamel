import { Hono } from 'hono';
import { completeChat } from '../ai';
import { loadCatalogProducts, loadStoreSettings } from '../ai/context';
import { detectChatLocale } from '../ai/language';
import { buildSystemPrompt } from '../ai/prompt';
import type { ChatMessage } from '../ai/types';

export const chatRoutes = new Hono();

type IncomingMessage = {
  role?: string;
  content?: string;
  text?: string;
  sender?: string;
  imageUrl?: string;
  image_url?: string;
};

function normalizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const item of raw as IncomingMessage[]) {
    const content = String(item.content ?? item.text ?? '').trim();
    const imageUrl = String(item.imageUrl ?? item.image_url ?? '').trim() || undefined;
    if (!content && !imageUrl) continue;
    const roleRaw = String(item.role ?? item.sender ?? '').toLowerCase();
    const role: ChatMessage['role'] =
      roleRaw === 'assistant' || roleRaw === 'ai' ? 'assistant' : 'user';
    out.push({
      role,
      content: content || (imageUrl ? 'Please estimate aircon HP for this room photo.' : ''),
      imageUrl,
    });
  }
  return out.slice(-16);
}

chatRoutes.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    message?: string;
    messages?: IncomingMessage[];
    imageUrl?: string;
  };

  const history = normalizeMessages(body.messages);
  const latest = String(body.message ?? '').trim();
  const latestImage = String(body.imageUrl ?? '').trim() || undefined;
  if (latest || latestImage) {
    const last = history[history.length - 1];
    const same =
      last &&
      last.role === 'user' &&
      last.content === (latest || last.content) &&
      (last.imageUrl || undefined) === latestImage;
    if (!same) {
      history.push({
        role: 'user',
        content: latest || 'Please estimate aircon HP for this room photo.',
        imageUrl: latestImage,
      });
    }
  }

  if (!history.length || history[history.length - 1]?.role !== 'user') {
    return c.json({ error: 'message is required' }, 400);
  }

  const [products, settings] = await Promise.all([
    loadCatalogProducts(60),
    loadStoreSettings(),
  ]);

  const lastUserText = history[history.length - 1]?.content ?? '';
  const preferredLocale = detectChatLocale(lastUserText);

  const system = buildSystemPrompt({
    products,
    settings,
    preferredLocale,
  });

  try {
    const result = await completeChat({ system, messages: history });
    return c.json({
      reply: result.text,
      provider: result.provider,
      model: result.model,
      locale: preferredLocale,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI chat failed';
    console.error('[chat]', message);
    return c.json({
      reply:
        "Sorry — I'm having trouble reaching the AI right now. You can still browse products, or talk to our team on Messenger / WhatsApp from the Contact page.",
      error: message,
    });
  }
});
