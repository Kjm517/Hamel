export type ChatLocale = 'en' | 'tl' | 'ceb';

const CEBUANO_HINTS =
  /\b(unsa|asa|pila|pwede|gusto|ko|ninyo|inyo|nimo|kani|kana|mao|naa|wala|salamat|maayong|adlaw|gabii|kaayo|bay|oy|lagi|gyud|jud|naa'y|palihog|tabangi|tagalugtaw)\b/i;

const TAGALOG_HINTS =
  /\b(po|opo|ho|ano|saan|magkano|gusto|ko|natin|ninyo|kayo|ito|iyan|yan|meron|may|wala|salamat|magandang|umaga|gabi|pwede|puwede|ba|nga|lang|naman|talaga|kasi|para|hindi|oo|sige|pakiusap|tulong|aircon|unit)\b/i;

/** Lightweight locale guess from customer text (Tagalog / Cebuano / English). */
export function detectChatLocale(text: string): ChatLocale {
  const t = text.trim();
  if (!t) return 'en';

  const cebHits = (t.match(CEBUANO_HINTS) || []).length;
  const tlHits = (t.match(TAGALOG_HINTS) || []).length;
  const hasLatinOnly = /^[\x00-\x7F\s.,!?'"()\-₱0-9]+$/.test(t);

  if (cebHits >= 2 && cebHits > tlHits) return 'ceb';
  if (cebHits >= 1 && /gyud|jud|kaayo|palihog|maayong/i.test(t)) return 'ceb';
  if (tlHits >= 2 || /\b(po|opo|magkano|hindi|sige)\b/i.test(t)) return 'tl';
  if (!hasLatinOnly && tlHits >= 1) return 'tl';
  return 'en';
}

export function localeLabel(locale: ChatLocale): string {
  if (locale === 'tl') return 'Tagalog / Taglish';
  if (locale === 'ceb') return 'Cebuano / Bisaya';
  return 'English';
}
