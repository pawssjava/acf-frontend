import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import logoWhite from '../../assets/LogoWhiteTheme.svg';
import logoBlack from '../../assets/LogoBlackTheme.svg';
import styles from './Footer.module.css';

export default function Footer() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src={theme === 'dark' ? logoBlack : logoWhite} alt="ACF" className={styles.logo} />
          <p>{t('footer.tagline')}</p>
        </div>
        <nav className={styles.links}>
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
        <p className={styles.copy}>© {new Date().getFullYear()} ACF. {t('footer.rights')}</p>
      </div>
    </footer>
  );
}
