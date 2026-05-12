import i18n from '../i18n';

interface TrilingualErrorData {
  error_kz?: string;
  error_ru?: string;
  error_en?: string;
}

const NETWORK_FALLBACK: Record<string, string> = {
  kk: 'Желі қатесі. Қайта байқап көріңіз',
  ru: 'Ошибка сети. Попробуйте ещё раз',
  en: 'Network error. Please try again',
};

export function getApiError(err: unknown): string {
  const lang = i18n.language;
  const data = (err as { response?: { data?: TrilingualErrorData } })?.response?.data;

  if (!data) return NETWORK_FALLBACK[lang] ?? NETWORK_FALLBACK.en;

  if (lang === 'kk') return data.error_kz ?? data.error_en ?? NETWORK_FALLBACK.kk;
  if (lang === 'ru') return data.error_ru ?? data.error_en ?? NETWORK_FALLBACK.ru;
  return data.error_en ?? NETWORK_FALLBACK.en;
}
