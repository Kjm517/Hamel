import { detectChatLocale, localeLabel, type ChatLocale } from './language';

type CatalogProduct = {
  id: string;
  brand?: string;
  model?: string;
  category?: string;
  priceStart?: number;
  priceEnd?: number;
  hp?: string[];
  features?: string[];
  tier?: string;
  isActive?: boolean;
};

type StoreSettings = {
  storeName?: string;
  address?: string;
  phoneDisplay?: string;
  contactEmail?: string;
  businessHours?: string;
  messengerUrl?: string;
  whatsappNumber?: string;
};

function money(n: number | undefined): string {
  if (!Number.isFinite(n)) return 'N/A';
  return `₱${Number(n).toLocaleString('en-PH')}`;
}

export function buildSystemPrompt(opts: {
  products: CatalogProduct[];
  settings?: StoreSettings | null;
  customerMemory?: string | null;
  preferredLocale?: ChatLocale | null;
}): string {
  const store = opts.settings?.storeName?.trim() || 'Hamel Trading';
  const active = opts.products.filter((p) => p.isActive !== false).slice(0, 40);

  const catalogLines = active.map((p) => {
    const hp = Array.isArray(p.hp) && p.hp.length ? p.hp.join('/') : 'N/A';
    const feats = Array.isArray(p.features) ? p.features.slice(0, 4).join(', ') : '';
    return `- [${p.id}] ${p.brand ?? ''} ${p.model ?? ''} | ${p.category ?? 'AC'} | HP: ${hp} | ${money(p.priceStart)}–${money(p.priceEnd)}${feats ? ` | ${feats}` : ''}`;
  });

  const contactBits = [
    opts.settings?.address ? `Address: ${opts.settings.address}` : null,
    opts.settings?.phoneDisplay ? `Phone: ${opts.settings.phoneDisplay}` : null,
    opts.settings?.whatsappNumber ? `WhatsApp: ${opts.settings.whatsappNumber}` : null,
    opts.settings?.messengerUrl ? `Messenger: ${opts.settings.messengerUrl}` : null,
    opts.settings?.contactEmail ? `Email: ${opts.settings.contactEmail}` : null,
    opts.settings?.businessHours ? `Hours: ${opts.settings.businessHours}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const localeHint = opts.preferredLocale
    ? `Detected customer language: ${localeLabel(opts.preferredLocale)}. Reply primarily in that language (or natural Taglish/Bisaya mix if they use it), while keeping Hamel's friendly dealer tone.`
    : `Detect the customer's language each turn (English, Tagalog/Taglish, or Cebuano/Bisaya) and reply in the same language. Keep a consistent friendly Hamel tone.`;

  const memoryBlock = opts.customerMemory?.trim()
    ? `\nKnown customer context (from their account / past chats — use gently, do not invent):\n${opts.customerMemory.trim()}\n`
    : '';

  return `You are the AI shopping assistant for ${store}, an authorized aircon dealer in Metro Cebu, Philippines.

Goals:
- Help customers choose the right aircon (HP/room size, brand, budget, inverter vs non-inverter).
- Answer about pricing ranges, installments, installation, delivery, warranty, and maintenance.
- Be concise, friendly, and practical.
- ${localeHint}
- Prefer recommending products from the live catalog below. Use exact brand/model names and price ranges from the catalog.
- Use store contact / hours from settings when asked. Do not invent stock, exact final quotes, warranty years, or unofficial discounts.
- For firm quotes, site visits, or payment processing, invite them to inquire / talk to a human (Messenger, WhatsApp, or Contact page).
- If unsure, say so briefly and offer handoff to the sales team.

Room / HP estimates:
- If the customer shares room dimensions (sqm, length×width) or a room photo, give a practical HP range (e.g. 0.5–1.0 HP, 1.0–1.5 HP) with clear caveats (sun exposure, ceiling height, people, open areas).
- Rough guide (Philippines residential, typical ceiling): ~10–12 sqm → 0.5–1.0 HP; ~12–18 sqm → 1.0–1.5 HP; ~18–25 sqm → 1.5–2.0 HP; larger / multi-zone → suggest multiple units or site survey.
- Photos: comment on visible room size cues only; never claim exact BTU from a photo alone. Always invite a free site check for a firm recommendation.
- Then suggest 1–2 matching catalog products in that HP band when available.

Store contact:
${contactBits || 'Use the website Contact page / Messenger / WhatsApp for human help.'}
${memoryBlock}
Live catalog (id | product | category | HP | price range):
${catalogLines.length ? catalogLines.join('\n') : '(No products loaded — give general aircon advice and ask them to browse /products.)'}

Reply format:
- Use light Markdown: **bold** for product names, bullet lists with - or *
- Short paragraphs or bullets
- No markdown tables
- End with a helpful follow-up question when useful`;
}

export function buildInquiryReplyDraftPrompt(opts: {
  inquiry: Record<string, unknown>;
  products: CatalogProduct[];
  settings?: StoreSettings | null;
}): string {
  const base = buildSystemPrompt({
    products: opts.products,
    settings: opts.settings,
  });

  const i = opts.inquiry;
  return `${base}

You are now drafting a short reply that a Hamel sales admin can send to this customer (Messenger / SMS / email). Write in the customer's likely language (Taglish OK for PH customers). Be warm, specific to their inquiry, and invite next steps (confirm schedule, site visit, or quote). Do not invent prices beyond catalog ranges. Do not include internal lead-score jargon.

Inquiry details:
- Name: ${i.customer_name ?? ''}
- Product: ${i.product_label ?? '—'}
- HP: ${i.hp ?? '—'}
- Qty: ${i.quantity ?? '—'}
- Phone: ${i.phone ?? '—'}
- Address: ${i.address ?? '—'}
- Property: ${[i.property_type, i.floor].filter(Boolean).join(', ') || '—'}
- Schedule: ${[i.schedule_date, i.schedule_time].filter(Boolean).join(', ') || '—'}
- Notes: ${i.notes ?? '—'}
- Source: ${i.source ?? '—'}

Output only the customer-facing message body (no subject line, no "Draft:" prefix).`;
}

export { detectChatLocale };
