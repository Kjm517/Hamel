export type LeadScore = 'high' | 'medium' | 'low';

export type LeadScoreInput = {
  productLabel?: string | null;
  productId?: string | null;
  quantity?: string | null;
  phone?: string | null;
  address?: string | null;
  propertyType?: string | null;
  scheduleDate?: string | null;
  scheduleTime?: string | null;
  hp?: string | null;
  notes?: string | null;
};

export type LeadScoreResult = {
  score: LeadScore;
  reasons: string[];
};

export function leadScoreLabel(score: LeadScore | string | null | undefined): string {
  if (score === 'high' || score === 'hot') return 'High Priority';
  if (score === 'medium' || score === 'warm') return 'Medium Priority';
  if (score === 'low' || score === 'cold') return 'Low Priority';
  return '—';
}

/** Normalize legacy hot/warm/cold values to high/medium/low. */
export function normalizeLeadScore(raw: string | null | undefined): LeadScore | null {
  if (raw === 'high' || raw === 'hot') return 'high';
  if (raw === 'medium' || raw === 'warm') return 'medium';
  if (raw === 'low' || raw === 'cold') return 'low';
  return null;
}

function parseQty(raw: string | null | undefined): number {
  const n = Number(String(raw ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr?.trim()) return null;
  const d = new Date(dateStr.trim());
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

/** Rule-based lead scoring for storefront inquiries (no AI call). */
export function scoreInquiryLead(input: LeadScoreInput): LeadScoreResult {
  const reasons: string[] = [];
  let points = 0;

  const hasPhone = Boolean(input.phone?.trim());
  const hasAddress = Boolean(input.address?.trim());
  const hasProduct = Boolean(input.productLabel?.trim() || input.productId?.trim());
  const hasHp = Boolean(input.hp?.trim());
  const hasSchedule = Boolean(input.scheduleDate?.trim() || input.scheduleTime?.trim());
  const qty = parseQty(input.quantity);
  const notes = (input.notes ?? '').toLowerCase();
  const until = daysUntil(input.scheduleDate);

  if (hasPhone) {
    points += 1;
    reasons.push('Phone provided');
  }
  if (hasAddress) {
    points += 1;
    reasons.push('Address provided');
  }
  if (hasProduct) {
    points += 1;
    reasons.push('Product selected');
  }
  if (hasHp) {
    points += 1;
    reasons.push('HP specified');
  }
  if (hasSchedule) {
    points += 2;
    reasons.push('Install schedule set');
  }
  if (until != null && until >= 0 && until <= 7) {
    points += 3;
    reasons.push('Wants install within 7 days');
  } else if (until != null && until >= 0 && until <= 14) {
    points += 1;
    reasons.push('Wants install within 2 weeks');
  }
  if (qty >= 3) {
    points += 3;
    reasons.push(`High quantity (${qty} units)`);
  } else if (qty >= 2) {
    points += 1;
    reasons.push(`Multi-unit (${qty})`);
  }
  if (input.propertyType?.trim()) {
    points += 1;
    reasons.push('Property type noted');
  }

  const urgencyKeywords = [
    'asap',
    'urgent',
    'ready to buy',
    'ready na',
    'bili na',
    'buy now',
    'budget',
    'cash',
    'deposit',
    'today',
    'tomorrow',
    'this week',
  ];
  if (urgencyKeywords.some((k) => notes.includes(k))) {
    points += 3;
    reasons.push('Notes show purchase urgency');
  }

  let score: LeadScore = 'low';
  if (points >= 8) score = 'high';
  else if (points >= 4) score = 'medium';

  if (reasons.length === 0) reasons.push('Limited contact or product details');

  return { score, reasons: reasons.slice(0, 6) };
}
