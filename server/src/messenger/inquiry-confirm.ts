import { env } from '../env';
import { getSql } from '../db';
import {
  formatInquiryConfirmation,
  messengerConfigured,
  sendMessengerText,
  type InquiryForMessenger,
} from './send';

const INQUIRY_REF_RE = /^inquiry[_-]?([0-9a-f-]{36})$/i;
const GRAPH = 'https://graph.facebook.com/v21.0';

/** Short-lived handoffs: inquiry waiting for the next Messenger PSID. */
const pendingByInquiry = new Map<string, number>();
const PENDING_TTL_MS = 60 * 60 * 1000;

export function parseInquiryRef(ref: string | undefined | null): string | null {
  if (!ref?.trim()) return null;
  const m = ref.trim().match(INQUIRY_REF_RE);
  return m?.[1] ?? null;
}

export function expectMessengerHandoff(inquiryId: string): void {
  const id = inquiryId.trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  pendingByInquiry.set(id, Date.now());
  prunePending();
}

function prunePending(): void {
  const now = Date.now();
  for (const [id, at] of pendingByInquiry) {
    if (now - at > PENDING_TTL_MS) pendingByInquiry.delete(id);
  }
}

function takeLatestPendingInquiryId(): string | null {
  prunePending();
  let best: string | null = null;
  let bestAt = 0;
  for (const [id, at] of pendingByInquiry) {
    if (at >= bestAt) {
      best = id;
      bestAt = at;
    }
  }
  if (best) pendingByInquiry.delete(best);
  return best;
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

  await sql`
    update inquiries
    set
      messenger_psid = ${psid},
      messenger_confirmation_sent_at = now(),
      updated_at = now()
    where id = ${inquiryId}::uuid
  `;

  if (row.customer_id) {
    await sql`
      update customers
      set messenger_psid = ${psid}, updated_at = now()
      where id = ${row.customer_id}::uuid
    `;
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
  const inquiryId = takeLatestPendingInquiryId();
  if (!inquiryId) {
    const sql = getSql();
    const rows = (await sql`
      select id::text as id
      from inquiries
      where messenger_confirmation_sent_at is null
        and created_at > now() - interval '1 hour'
      order by created_at desc
      limit 1
    `) as { id: string }[];
    if (!rows[0]) {
      console.log(`[messenger] No pending inquiry for PSID ${psid}`);
      return;
    }
    await deliverConfirmation(psid, rows[0].id);
    return;
  }
  await deliverConfirmation(psid, inquiryId);
}

/**
 * Webhook-independent fallback: find the most recently active conversation
 * and send the inquiry from the Page (same as Faith Hugs grey bubble).
 */
export async function deliverViaRecentConversation(
  inquiryId: string
): Promise<{ sent: boolean; reason?: string; psid?: string }> {
  const token = env.messengerPageAccessToken();
  if (!token) return { sent: false, reason: 'Messenger not configured' };

  const fields = encodeURIComponent(
    'participants,updated_time,messages.limit(1){message,from}'
  );
  const res = await fetch(
    `${GRAPH}/me/conversations?fields=${fields}&limit=5&access_token=${encodeURIComponent(token)}`
  );
  const data = (await res.json()) as {
    data?: Array<{
      updated_time?: string;
      participants?: { data?: Array<{ id?: string; name?: string }> };
    }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    return { sent: false, reason: data.error?.message || 'Failed to list conversations' };
  }

  const cutoff = Date.now() - 15 * 60 * 1000;

  for (const thread of data.data ?? []) {
    const updated = thread.updated_time ? Date.parse(thread.updated_time) : 0;
    if (updated && updated < cutoff) continue;

    const people = thread.participants?.data ?? [];
    const pageParticipant = people.find((p) =>
      /trading|hamel|fcm/i.test(p.name || '')
    );
    const userParticipant = people.find((p) => p.id && p.id !== pageParticipant?.id);
    const targetPsid = userParticipant?.id;
    if (!targetPsid) continue;

    const result = await sendInquiryConfirmationToPsid(inquiryId, targetPsid);
    if (result.sent || result.reason === 'Already sent') {
      return { ...result, psid: targetPsid };
    }
  }

  return {
    sent: false,
    reason: 'No recent Messenger conversation — open the FCM chat from the button first',
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
