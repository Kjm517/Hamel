/** Lightweight checks so inquiry chat rejects obvious fake / keyboard-smash answers. */

const KEYBOARD_NOISE =
  /^(asdf+|qwer+|zxcv+|hjkl+|test+|dummy+|sample+|xxx+|aaa+|asd+g*|dsg+|qwe+|yt+|ewq+)/i;

const PLACEHOLDER_WORDS =
  /\b(test|testing|asdf|qwerty|lorem|ipsum|foo|bar|baz|xxx|n\/a|na|none|asdfg|asdgasdg)\b/i;

/** Repeated chunks like "asdg asdg" or "adsgadsg". */
function hasSpammyRepetition(s: string): boolean {
  const compact = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (compact.length < 6) return false;
  if (/(.{3,6})\1{1,}/.test(compact)) return true;
  // alternating smash: asdgasdg / dsgasdga
  if (/(asd|dsg|adsg|gasd|qwe|zxc){2,}/i.test(compact)) return true;
  return false;
}

function vowelRatio(lettersOnly: string): number {
  if (!lettersOnly) return 0;
  const vowels = (lettersOnly.match(/[aeiou]/g) || []).length;
  return vowels / lettersOnly.length;
}

export function looksLikeGibberish(text: string): boolean {
  const raw = text.trim();
  if (raw.length < 2) return true;
  if (KEYBOARD_NOISE.test(raw.replace(/\s+/g, ''))) return true;
  if (PLACEHOLDER_WORDS.test(raw)) return true;
  if (hasSpammyRepetition(raw)) return true;

  const letters = raw.toLowerCase().replace(/[^a-z]/g, '');
  if (letters.length >= 8 && vowelRatio(letters) < 0.18) return true;
  // Almost no spaces and long nonsense
  if (!/\s/.test(raw) && letters.length >= 10 && vowelRatio(letters) < 0.25) return true;
  return false;
}

export type FieldValidation = { ok: true; value: string } | { ok: false; message: string };

export function validateInquiryName(input: string): FieldValidation {
  const value = input.trim().replace(/\s+/g, ' ');
  if (value.length < 2) {
    return { ok: false, message: 'Please enter your real name (at least 2 characters).' };
  }
  if (!/[a-zA-ZÀ-ÿÑñ]/.test(value)) {
    return { ok: false, message: 'Please use your real name with letters.' };
  }
  if (looksLikeGibberish(value) || /^[a-z]{1,3}$/i.test(value)) {
    return {
      ok: false,
      message:
        'That doesn’t look like a real name. Please type your full name (e.g. **Juan Dela Cruz**).',
    };
  }
  if (value.length > 80) {
    return { ok: false, message: 'That name looks too long — please enter your full name only.' };
  }
  return { ok: true, value };
}

/** Accept PH mobiles: 09XXXXXXXXX, +63 9XX…, 639… */
export function validateInquiryPhone(input: string): FieldValidation {
  const digits = input.replace(/\D/g, '');
  let normalized = digits;

  if (/^63\d{10}$/.test(digits)) normalized = `0${digits.slice(2)}`;
  else if (/^9\d{9}$/.test(digits)) normalized = `0${digits}`;

  if (!/^09\d{9}$/.test(normalized)) {
    return {
      ok: false,
      message:
        'Please enter a valid PH mobile number (e.g. **0917 123 4567**). Landlines won’t work for SMS follow-up.',
    };
  }
  // Reject obvious fake patterns
  if (/^(\d)\1{10}$/.test(normalized) || /^09(123456789|000000000|111111111)$/.test(normalized)) {
    return {
      ok: false,
      message: 'That number doesn’t look real. Please enter the mobile you actually use.',
    };
  }
  return { ok: true, value: normalized };
}

const ADDRESS_HINT =
  /\b(st|street|ave|avenue|rd|road|blvd|brgy|barangay|purok|sitio|city|ceb|cebu|manila|quezon|davao|iloilo|bacolod|liloan|tayud|mandaue|lapu|talisay|consolacion|ph|philippines|blk|block|lot|phase|village|subdivision|condo|tower|unit|simborio)\b/i;

export function validateInquiryAddress(input: string): FieldValidation {
  const value = input.trim().replace(/\s+/g, ' ');
  if (value.length < 8) {
    return {
      ok: false,
      message:
        'Please share a bit more — barangay and city/municipality help a lot (house/street number is optional).',
    };
  }
  if (looksLikeGibberish(value)) {
    return {
      ok: false,
      message:
        'That doesn’t look like a real address. Please include barangay and city/municipality (street or house number is optional).',
    };
  }

  const words = value.split(/\s+/).filter(Boolean);
  const hasNumber = /\d/.test(value);
  const hasHint = ADDRESS_HINT.test(value);
  const multiPlace = words.length >= 2 && value.length >= 10;

  // House/street number is optional — barangay + city (e.g. "Simborio Tayud Liloan") is enough
  if (!hasNumber && !hasHint && !multiPlace) {
    return {
      ok: false,
      message:
        'Please add your barangay and city/municipality. Street or house number is optional if you don’t have one.',
    };
  }
  return { ok: true, value };
}

export function validateInquiryBeforeSubmit(data: {
  name?: string;
  address?: string;
  contactNumber?: string;
}): { ok: true } | { ok: false; message: string } {
  const name = validateInquiryName(data.name || '');
  if (!name.ok) return name;
  const address = validateInquiryAddress(data.address || '');
  if (!address.ok) return address;
  const phone = validateInquiryPhone(data.contactNumber || '');
  if (!phone.ok) return phone;
  return { ok: true };
}
