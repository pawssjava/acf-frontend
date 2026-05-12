import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './NotFound.module.css';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1>404</h1>
      <p>{t('notFound.message')}</p>
      <Link to="/" className={styles.homeLink}>{t('notFound.home')}</Link>
    </div>
  );
}
