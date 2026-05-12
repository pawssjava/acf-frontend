const KK_MONTHS_LONG = [
  'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
  'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан',
];

const KK_MONTHS_SHORT = [
  'қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау',
  'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел',
];

export function fmtDate(
  iso: string,
  lang: string,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  const d = new Date(iso);

  if (lang === 'kk' && (opts.month === 'long' || opts.month === 'short')) {
    const day = opts.day === '2-digit'
      ? String(d.getDate()).padStart(2, '0')
      : String(d.getDate());
    const month = opts.month === 'long'
      ? KK_MONTHS_LONG[d.getMonth()]
      : KK_MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear();
    let result = `${day} ${month} ${year}`;
    if (opts.hour !== undefined) {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      result += `, ${h}:${m}`;
    }
    return result;
  }

  const locale = lang === 'en' ? 'en-US' : 'ru-RU';
  return opts.hour !== undefined
    ? d.toLocaleString(locale, opts)
    : d.toLocaleDateString(locale, opts);
}
