/** Shared visual tokens for the redesigned admin console. */

export const adminUi = {
  pageIntro: 'm-0 max-w-[560px] text-[14px] leading-relaxed text-[#7a8899]',
  card: 'rounded-2xl border border-[#e8eef4] bg-white shadow-[0_1px_2px_rgba(30,42,56,0.03)]',
  cardPad: 'p-5',
  sectionLabel:
    'text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#7a8899]',
  label: 'text-[13px] font-semibold text-[#516171]',
  labelMuted: 'text-[11px] font-semibold text-[#9aa7b5]',
  input:
    'mt-1.5 h-[42px] w-full rounded-[10px] border border-[#e4ebf2] bg-[#f7fafd] px-[13px] text-[14px] text-[#1e2a38] transition placeholder:text-[#9aa7b5] focus:border-sky-300 focus:bg-white focus:outline-none',
  select:
    'mt-1.5 h-[42px] w-full rounded-[10px] border border-[#e4ebf2] bg-[#f7fafd] px-[13px] text-[14px] text-[#1e2a38] transition focus:border-sky-300 focus:bg-white focus:outline-none',
  textarea:
    'mt-1.5 w-full rounded-[10px] border border-[#e4ebf2] bg-[#f7fafd] px-[13px] py-2.5 text-[14px] text-[#1e2a38] transition placeholder:text-[#9aa7b5] focus:border-sky-300 focus:bg-white focus:outline-none',
  btnPrimary:
    'inline-flex h-11 items-center gap-2 rounded-xl bg-[#0ea5e9] px-[18px] text-[14px] font-bold text-white shadow-[0_6px_16px_-8px_rgba(14,165,233,0.8)] transition hover:bg-[#0284c7] disabled:opacity-60',
  btnAmber:
    'inline-flex h-[42px] items-center gap-1.5 rounded-[11px] bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] px-[18px] text-[13.5px] font-bold text-[#422006] shadow-[0_6px_16px_-8px_rgba(245,158,11,0.75)] transition hover:brightness-105 disabled:opacity-60',
  btnGhost:
    'inline-flex h-[42px] items-center gap-1.5 rounded-[11px] border border-[#e4ebf2] bg-white px-[15px] text-[13.5px] font-semibold text-[#516171] transition hover:bg-[#f7fafd]',
  btnSoft:
    'inline-flex h-[34px] items-center gap-1.5 rounded-[9px] border border-[#e4ebf2] bg-white px-3 text-[12.5px] font-semibold text-[#516171] transition hover:bg-[#f7fafd]',
  tip: 'flex gap-2.5 rounded-xl border border-[#d6ecfb] bg-[#eff8ff] px-4 py-3 text-[13px] leading-relaxed text-[#38607a]',
  tableHead:
    'bg-[#f9fbfd] text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#9aa7b5]',
  badgeSky:
    'inline-flex items-center rounded-full bg-[#e0f2fe] px-2.5 py-0.5 text-[11px] font-bold text-[#0369a1]',
  badgeAmber:
    'inline-flex items-center rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[11px] font-bold text-[#b45309]',
  badgeGreen:
    'inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[11px] font-bold text-[#15803d]',
  badgeGray:
    'inline-flex items-center rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[11px] font-bold text-[#64748b]',
  badgeRed:
    'inline-flex items-center rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-[11px] font-bold text-[#b91c1c]',
} as const;
