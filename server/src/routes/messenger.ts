import { Hono } from 'hono';
import { env } from '../env';
import { messengerConfigured } from '../messenger/send';
import {
  deliverViaRecentConversation,
  expectMessengerHandoff,
  handleMessengerInboundMessage,
  handleMessengerReferral,
} from '../messenger/inquiry-confirm';

type MessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    referral?: { ref?: string; source?: string; type?: string };
  };
  postback?: {
    payload?: string;
    referral?: { ref?: string; source?: string; type?: string };
  };
  referral?: { ref?: string; source?: string; type?: string };
};

type WebhookBody = {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: MessagingEvent[];
  }>;
};

function extractRef(event: MessagingEvent): string | undefined {
  return (
    event.referral?.ref ||
    event.message?.referral?.ref ||
    event.postback?.referral?.ref ||
    (event.postback?.payload?.startsWith('inquiry_') ? event.postback.payload : undefined)
  );
}

export const messengerRoutes = new Hono();

/** Public status for storefront (ref flow vs text-prefill fallback). */
messengerRoutes.get('/status', (c) =>
  c.json({
    configured: messengerConfigured(),
    pageUsername: env.messengerPageUsername() || null,
  })
);

/**
 * Storefront calls this right before opening m.me so the next inbound
 * Messenger message can be matched to this inquiry (Page → customer reply).
 */
messengerRoutes.post('/expect', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { inquiryId?: string } | null;
  const inquiryId = body?.inquiryId?.trim();
  if (!inquiryId) return c.json({ error: 'inquiryId is required' }, 400);
  expectMessengerHandoff(inquiryId);
  return c.json({ ok: true });
});

/**
 * After the customer opens Messenger, the storefront polls this so the Page
 * can send the grey-bubble confirmation even if Meta webhooks are delayed.
 */
messengerRoutes.post('/deliver', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { inquiryId?: string } | null;
  const inquiryId = body?.inquiryId?.trim();
  if (!inquiryId) return c.json({ error: 'inquiryId is required' }, 400);
  expectMessengerHandoff(inquiryId);
  const result = await deliverViaRecentConversation(inquiryId);
  return c.json(result, result.sent || result.reason === 'Already sent' ? 200 : 409);
});

/**
 * Meta webhook verification (GET).
 * Callback URL: https://YOUR_PUBLIC_API/api/messenger/webhook
 */
messengerRoutes.get('/webhook', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');
  const verify = env.messengerVerifyToken();

  if (mode === 'subscribe' && token && verify && token === verify && challenge) {
    return c.text(challenge);
  }
  return c.text('Forbidden', 403);
});

/**
 * Meta webhook events (POST).
 * Subscribe to: messages, messaging_postbacks, messaging_referrals
 */
messengerRoutes.post('/webhook', async (c) => {
  const body = (await c.req.json().catch(() => null)) as WebhookBody | null;
  if (!body || body.object !== 'page') {
    return c.json({ ok: true });
  }

  console.log('[messenger] webhook event', JSON.stringify(body).slice(0, 2000));

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const psid = event.sender?.id;
      if (!psid || event.message?.is_echo) continue;

      const ref = extractRef(event);
      if (ref) {
        await handleMessengerReferral(psid, ref);
        continue;
      }

      // Any customer message (kickoff "Hi", etc.) → Page sends inquiry details
      if (event.message?.text || event.message?.mid || event.postback) {
        await handleMessengerInboundMessage(psid);
      }
    }
  }

  return c.json({ ok: true });
});
