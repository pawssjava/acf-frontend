import { publicClient } from './client';

export type DocumentType = 'consent' | 'privacy' | 'useragreement';
export type DocumentLang = 'ru' | 'en' | 'kz';

export const toDocumentLang = (i18nLang: string): DocumentLang =>
  i18nLang === 'kk' ? 'kz' : i18nLang === 'en' ? 'en' : 'ru';

export const getDocumentUrl = (type: DocumentType, lang: DocumentLang): Promise<string> =>
  publicClient
    .get<{ url: string }>('/api/documents/download', { params: { type, lang } })
    .then(r => r.data.url);
