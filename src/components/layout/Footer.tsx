import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { downloadDocument, toDocumentLang } from '../../api/documents';
import logoWhite from '../../assets/LogoWhiteTheme.svg';
import logoBlack from '../../assets/LogoBlackTheme.svg';
import styles from './Footer.module.css';

export default function Footer() {
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const lang = toDocumentLang(i18n.language);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <img src={theme === 'dark' ? logoBlack : logoWhite} alt="ACF" className={styles.logo} />
            <p className={styles.tagline}>{t('footer.tagline')}</p>
            <p className={styles.subtitle}>{t('footer.subtitle')}</p>
          </div>
          <nav className={styles.links}>
            <Link to="/about">{t('nav.about')}</Link>
            <Link to="/contacts">{t('nav.contacts')}</Link>
            <Link to="/tournaments">{t('nav.tournaments')}</Link>
            <Link to="/news">{t('nav.blog')}</Link>
            {isAuthenticated
              ? <Link to="/profile">{t('nav.profile')}</Link>
              : <>
                  <Link to="/login">{t('nav.login')}</Link>
                  <Link to="/register">{t('footer.register')}</Link>
                </>
            }
          </nav>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <p><span>{t('footer.fullName')}</span> {t('footer.fullNameValue')}</p>
            <p><span>{t('footer.bin')}</span> {t('footer.binValue')}</p>
            <p><span>{t('footer.address')}</span> {t('footer.addressValue')}</p>
            <p><span>{t('footer.phone')}</span> {t('footer.phoneValue')}</p>
          </div>
          <div className={styles.policies}>
            <button type="button" onClick={() => downloadDocument('privacy', lang)}>
              {t('footer.privacyPolicy')}
            </button>
            <button type="button" onClick={() => downloadDocument('useragreement', lang)}>
              {t('footer.termsOfUse')}
            </button>
            <button type="button" onClick={() => downloadDocument('consent', lang)}>
              {t('footer.dataConsent')}
            </button>
          </div>
        </div>

        <p className={styles.copy}>© {new Date().getFullYear()} ACF. {t('footer.rights')}</p>
      </div>
    </footer>
  );
}
