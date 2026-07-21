import { BASE_URL } from './client';

export type DocumentType = 'consent' | 'privacy' | 'useragreement';
export type DocumentLang = 'ru' | 'en' | 'kz';

export const toDocumentLang = (i18nLang: string): DocumentLang =>
  i18nLang === 'kk' ? 'kz' : i18nLang === 'en' ? 'en' : 'ru';

export const getDocumentDownloadUrl = (type: DocumentType, lang: DocumentLang) =>
  `${BASE_URL}/api/documents/download?type=${type}&lang=${lang}`;

export function downloadDocument(type: DocumentType, lang: DocumentLang) {
  const url = getDocumentDownloadUrl(type, lang);
  fetch(url)
    .then(r => {
      if (!r.ok) throw new Error('Download failed');
      return r.blob();
    })
    .then(blob => {
      const a = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      a.download = `${type}_${lang}.pdf`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    })
    .catch(() => {
      // CORS not available — fall back to navigation which will let the browser handle it
      window.open(url, '_blank', 'noopener,noreferrer');
    });
}
