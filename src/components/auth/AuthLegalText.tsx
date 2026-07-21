import { useTranslation } from 'react-i18next';
import { getDocumentUrl, toDocumentLang, type DocumentType } from '../../api/documents';

interface AuthLegalTextProps {
  className?: string;
  linkClassName?: string;
  translationKey: 'auth' | 'register';
}

export default function AuthLegalText({ className, linkClassName, translationKey }: AuthLegalTextProps) {
  const { t, i18n } = useTranslation();
  const lang = toDocumentLang(i18n.language);

  const openDocument = (type: DocumentType) => {
    getDocumentUrl(type, lang)
      .then(url => window.open(url, '_blank', 'noopener,noreferrer'))
      .catch(() => {});
  };

  return (
    <p className={className}>
      {t(`${translationKey}.legalPrefix`)}
      <button type="button" className={linkClassName} onClick={() => openDocument('useragreement')}>
        {t(`${translationKey}.legalAgreementLink`)}
      </button>
      {t(`${translationKey}.legalMiddle`)}
      <button type="button" className={linkClassName} onClick={() => openDocument('consent')}>
        {t(`${translationKey}.legalConsentLink`)}
      </button>
      {t(`${translationKey}.legalSuffix`)}
    </p>
  );
}
