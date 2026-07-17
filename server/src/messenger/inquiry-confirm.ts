import { env } from '../env';
import { getSql } from '../db';
import {
  formatInquiryConfirmation,
  getMessengerPageIdentity,
  messengerConfigured,
  sendMessengerText,
  type InquiryForMessenger,
} from './send';

const INQUIRY_REF_RE = /^inquiry[_-]?([0-9a-f-]{36})$/i;
const GRAPH = 'https://graph.facebook.com/v21.0';

/** In-memory fallback when DB handoff column is not migrated yet. */
const pendingByInquiry = new Map<string, number>();
const PENDING_TTL_MS = 60 * 60 * 1000;

export function parseInquiryRef(ref: string | undefined | null): string | null {
  if (!ref?.trim()) return null;
  const m = ref.trim().match(INQUIRY_REF_RE);
  return m?.[1] ?? null;
}

function prunePendingMemory(): void {
  const now = Date.now();
  for (const [id, at] of pendingByInquiry) {
    if (now - at > PENDING_TTL_MS) pendingByInquiry.delete(id);
  }
}

/** Mark inquiry as waiting for Messenger open (Page will send confirmation). */
export async function expectMessengerHandoff(inquiryId: string): Promise<void> {
  const id = inquiryId.trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;

  pendingByInquiry.set(id, Date.now());
  prunePendingMemory();

  const sql = getSql();
  try {
    await sql`
      update inquiries
      set messenger_handoff_at = now(), updated_at = now()
      where id = ${id}::uuid
        and messenger_confirmation_sent_at is null
    `;
  } catch (err) {
    console.warn(
      '[messenger] handoff column missing — run sql/009_messenger_handoff.sql',
      err instanceof Error ? err.message : err
    );
  }
}

async function takeLatestPendingInquiryId(): Promise<string | null> {
  prunePendingMemory();

  const sql = getSql();
  try {
    const rows = (await sql`
      select id::text as id
      from inquiries
      where messenger_confirmation_sent_at is null
        and messenger_handoff_at is not null
        and messenger_handoff_at > now() - interval '1 hour'
      order by messenger_handoff_at desc
      limit 1
    `) as { id: string }[];
    if (rows[0]?.id) {
      pendingByInquiry.delete(rows[0].id);
      return rows[0].id;
    }
  } catch {
    // fall through to memory / created_at fallback
  }

  let best: string | null = null;
  let bestAt = 0;
  for (const [id, at] of pendingByInquiry) {
    if (at >= bestAt) {
      best = id;
      bestAt = at;
    }
  }
  if (best) {
    pendingByInquiry.delete(best);
    return best;
  }

  try {
    const rows = (await sql`
      select id::text as id
      from inquiries
      where messenger_confirmation_sent_at is null
        and created_at > now() - interval '1 hour'
      order by created_at desc
      limit 1
    `) as { id: string }[];
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function sendInquiryConfirmationToPsid(
  inquiryId: string,
  psid: string
): Promise<{ sent: boolean; reason?: string }> {
  if (!messengerConfigured()) {
    return { sent: false, reason: 'Messenger not configured' };
  }

  const sql = getSql();
  const rows = (await sql`
    select
      id::text as id,
      customer_name,
      phone,
      address,
      property_type,
      floor,
      product_label,
      quantity,
      hp,
      schedule_date,
      schedule_time,
      notes,
      customer_id::text as customer_id,
      messenger_confirmation_sent_at::text as messenger_confirmation_sent_at
    from inquiries
    where id = ${inquiryId}::uuid
    limit 1
  `) as (InquiryForMessenger & {
    id: string;
    customer_id: string | null;
    messenger_confirmation_sent_at: string | null;
  })[];

  const row = rows[0];
  if (!row) return { sent: false, reason: 'Inquiry not found' };

  if (row.messenger_confirmation_sent_at) {
    return { sent: false, reason: 'Already sent' };
  }

  const text = formatInquiryConfirmation(row);
  await sendMessengerText(psid, text);

  try {
    await sql`
      update inquiries
      set
        messenger_psid = ${psid},
        messenger_confirmation_sent_at = now(),
        messenger_handoff_at = null,
        updated_at = now()
      where id = ${inquiryId}::uuid
    `;
  } catch {
    await sql`
      update inquiries
      set
        messenger_psid = ${psid},
        messenger_confirmation_sent_at = now(),
        updated_at = now()
      where id = ${inquiryId}::uuid
    `;
  }

  if (row.customer_id) {
    try {
      // Clear any other customer row that already owns this PSID (unique index).
      await sql`
        update customers
        set messenger_psid = null, updated_at = now()
        where messenger_psid = ${psid}
          and id <> ${row.customer_id}::uuid
      `;
      await sql`
        update customers
        set messenger_psid = ${psid}, updated_at = now()
        where id = ${row.customer_id}::uuid
      `;
    } catch (err) {
      console.warn(
        '[messenger] customer PSID link skipped',
        err instanceof Error ? err.message : err
      );
    }
  }

  pendingByInquiry.delete(inquiryId);
  return { sent: true };
}

/** Handle m.me ?ref=inquiry_<uuid> (or first message after that link). */
export async function handleMessengerReferral(
  psid: string,
  ref: string | undefined | null
): Promise<void> {
  const inquiryId = parseInquiryRef(ref);
  if (!inquiryId) return;
  await deliverConfirmation(psid, inquiryId);
}

/** Any customer message → Page sends the pending inquiry confirmation. */
export async function handleMessengerInboundMessage(psid: string): Promise<void> {
  const inquiryId = await takeLatestPendingInquiryId();
  if (!inquiryId) {
    console.log(`[messenger] No pending inquiry for PSID ${psid}`);
    return;
  }
  await deliverConfirmation(psid, inquiryId);
}

/**
 * Webhook-independent fallback: find the most recently active conversation
 * and send the inquiry from the Page (Faith Hugs grey bubble).
 */
export async function deliverViaRecentConversation(
  inquiryId: string
): Promise<{ sent: boolean; reason?: string; psid?: string }> {
  const token = env.messengerPageAccessToken();
  if (!token) return { sent: false, reason: 'Messenger not configured' };

  const page = await getMessengerPageIdentity();
  const pageId = page?.id;

  const fields = encodeURIComponent(
    'participants,updated_time,snippet,messages.limit(2){message,from,created_time}'
  );
  const res = await fetch(
    `${GRAPH}/me/conversations?fields=${fields}&limit=10&access_token=${encodeURIComponent(token)}`
  );
  const data = (await res.json()) as {
    data?: Array<{
      updated_time?: string;
      participants?: { data?: Array<{ id?: string; name?: string }> };
    }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    console.warn('[messenger] conversations list failed', data.error?.message);
    return { sent: false, reason: data.error?.message || 'Failed to list conversations' };
  }

  const cutoff = Date.now() - 30 * 60 * 1000;
  const tried = new Set<string>();

  for (const thread of data.data ?? []) {
    const updated = thread.updated_time ? Date.parse(thread.updated_time) : 0;
    if (updated && updated < cutoff) continue;

    const people = thread.participants?.data ?? [];
    const userParticipant = people.find((p) => {
      if (!p.id) return false;
      if (pageId && p.id === pageId) return false;
      // Skip obvious page-named participants when page id unknown
      if (!pageId && /hamel|trading|fcm|page/i.test(p.name || '')) return false;
      return true;
    });
    const targetPsid = userParticipant?.id;
    if (!targetPsid || tried.has(targetPsid)) continue;
    tried.add(targetPsid);

    try {
      const result = await sendInquiryConfirmationToPsid(inquiryId, targetPsid);
      if (result.sent || result.reason === 'Already sent') {
        return { ...result, psid: targetPsid };
      }
      if (result.reason) {
        console.warn('[messenger] deliver to', targetPsid, result.reason);
      }
    } catch (err) {
      console.warn(
        '[messenger] deliver attempt failed',
        targetPsid,
        err instanceof Error ? err.message : err
      );
    }
  }

  return {
    sent: false,
    reason:
      'No recent Messenger conversation found. Open the Hamel Trading chat from the button, then wait a few seconds — or ensure the webhook tunnel is running.',
  };
}

async function deliverConfirmation(psid: string, inquiryId: string): Promise<void> {
  try {
    const result = await sendInquiryConfirmationToPsid(inquiryId, psid);
    if (result.sent) {
      console.log(`[messenger] Page sent inquiry confirmation ${inquiryId} → ${psid}`);
    } else if (result.reason && result.reason !== 'Already sent') {
      console.warn(`[messenger] Skip confirm ${inquiryId}: ${result.reason}`);
    }
  } catch (err) {
    console.error('[messenger] Failed to send inquiry confirmation', err);
  }
}
