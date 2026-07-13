/** HTML &lt;input type="color"&gt; requires #rrggbb (6 hex digits). */
export function hexForColorInput(value: string | undefined | null): string {
  const raw = (value ?? '').trim();
  if (!raw) return '#000000';

  const short = /^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/.exec(raw);
  if (short) {
    const [, r, g, b] = short;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
    return raw.toUpperCase();
  }

  return '#000000';
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hexForColorInput(hex).slice(1);
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isLightBackground(hex: string): boolean {
  try {
    return relativeLuminance(hex) > 0.45;
  } catch {
    return false;
  }
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Pick a readable text color on the given background (WCAG-ish minimum 3:1). */
export function readableOnBackground(text: string, bg: string, fallback: string): string {
  try {
    if (contrastRatio(text, bg) >= 3) return text;
    return relativeLuminance(bg) > 0.45 ? '#1F2937' : '#F3F4F6';
  } catch {
    // ignore invalid hex
  }
  return fallback;
}
