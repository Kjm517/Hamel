import { env } from '../env';

const GRAPH = 'https://graph.facebook.com/v21.0';

export function messengerConfigured(): boolean {
  return Boolean(env.messengerPageAccessToken());
}

type GraphError = { message?: string; code?: number; error_subcode?: number };

async function postMessage(
  token: string,
  body: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`${GRAPH}/me/messages?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: GraphError };
  if (!res.ok) {
    return {
      ok: false,
      error: data.error?.message || `Messenger send failed (${res.status})`,
    };
  }
  return { ok: true };
}

/**
 * Send Page → customer text. Tries RESPONSE first (post-referral window),
 * then HUMAN_AGENT tag (common for sales follow-up after m.me open).
 */
export async function sendMessengerText(psid: string, text: string): Promise<void> {
  const token = env.messengerPageAccessToken();
  if (!token) {
    throw new Error('MESSENGER_PAGE_ACCESS_TOKEN is not set');
  }

  const attempts: Record<string, unknown>[] = [
    {
      recipient: { id: psid },
      messaging_type: 'RESPONSE',
      message: { text },
    },
    {
      recipient: { id: psid },
      messaging_type: 'UPDATE',
      message: { text },
    },
    {
      recipient: { id: psid },
      messaging_type: 'MESSAGE_TAG',
      tag: 'HUMAN_AGENT',
      message: { text },
    },
  ];

  let lastError = 'Messenger send failed';
  for (const body of attempts) {
    const result = await postMessage(token, body);
    if (result.ok) return;
    lastError = result.error;
    console.warn('[messenger] send attempt failed', body.messaging_type, lastError);
  }
  throw new Error(lastError);
}

export async function getMessengerPageIdentity(): Promise<{
  id: string;
  name: string;
} | null> {
  const token = env.messengerPageAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(
      `${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`
    );
    const data = (await res.json()) as { id?: string; name?: string; error?: GraphError };
    if (!res.ok || !data.id) return null;
    return { id: data.id, name: data.name || '' };
  } catch {
    return null;
  }
}

export type InquiryForMessenger = {
  customer_name: string | null;
  phone: string | null;
  address: string | null;
  property_type: string | null;
  floor: string | null;
  product_label: string | null;
  quantity: string | null;
  hp: string | null;
  schedule_date: string | null;
  schedule_time: string | null;
  notes: string | null;
};

/** Faith Hugs–style confirmation from the Page → customer. */
export function formatInquiryConfirmation(row: InquiryForMessenger): string {
  const property = [row.property_type, row.floor].filter(Boolean).join(', ') || '—';
  const schedule = [row.schedule_date, row.schedule_time].filter(Boolean).join(', ') || '—';
  const order = [
    row.quantity ? `${row.quantity} ×` : '1 ×',
    row.product_label || 'Aircon',
    row.hp ? `(${row.hp})` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const payment =
    row.notes
      ?.split('|')
      .map((p) => p.trim())
      .find((p) => p.toLowerCase().startsWith('payment:'))
      ?.replace(/^payment:\s*/i, '') || 'To confirm with team';

  return [
    'Thank you for your Hamel Trading inquiry! Here are your order details:',
    '',
    `Name: ${row.customer_name || '—'}`,
    `Phone Number: ${row.phone || '—'}`,
    `Address: ${row.address || '—'}`,
    `Property: ${property}`,
    `Order: ${order}`,
    `Schedule: ${schedule}`,
    `Payment: ${payment}`,
    '',
    'Our team will follow up shortly. Salamat! ❄️',
  ].join('\n');
}
