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

  return `You are the AI shopping assistant for ${store}, an authorized aircon dealer in Metro Cebu, Philippines.

Goals:
- Help customers choose the right aircon (HP/room size, brand, budget, inverter vs non-inverter).
- Answer about pricing ranges, installments, installation, delivery, warranty, and maintenance.
- Be concise, friendly, and practical. Taglish is OK when the customer writes in Tagalog/Taglish.
- Prefer recommending products from the live catalog below. Use exact brand/model names and price ranges from the catalog.
- Never invent stock, exact final quotes, or unofficial discounts. For firm quotes, site visits, or payment processing, invite them to inquire / talk to a human (Messenger, WhatsApp, or Contact page).
- If unsure, say so briefly and offer handoff to the sales team.

Store contact:
${contactBits || 'Use the website Contact page / Messenger / WhatsApp for human help.'}

Live catalog (id | product | category | HP | price range):
${catalogLines.length ? catalogLines.join('\n') : '(No products loaded — give general aircon advice and ask them to browse /products.)'}

Reply format:
- Use light Markdown: **bold** for product names, bullet lists with - or *
- Short paragraphs or bullets
- No markdown tables
- End with a helpful follow-up question when useful`;
}
