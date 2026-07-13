import { env } from '../env';

const GRAPH = 'https://graph.facebook.com/v21.0';

export function messengerConfigured(): boolean {
  return Boolean(env.messengerPageAccessToken());
}

export async function sendMessengerText(psid: string, text: string): Promise<void> {
  const token = env.messengerPageAccessToken();
  if (!token) {
    throw new Error('MESSENGER_PAGE_ACCESS_TOKEN is not set');
  }

  const res = await fetch(`${GRAPH}/me/messages?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: psid },
      messaging_type: 'RESPONSE',
      message: { text },
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(body.error?.message || `Messenger send failed (${res.status})`);
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
