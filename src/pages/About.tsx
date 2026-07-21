import { useTranslation } from 'react-i18next';
import styles from './About.module.css';

export default function About() {
  const { t } = useTranslation();

  const features = [
    {
      title: t('about.feature1Title'),
      desc: t('about.feature1Desc'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
    },
    {
      title: t('about.feature2Title'),
      desc: t('about.feature2Desc'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      title: t('about.feature3Title'),
      desc: t('about.feature3Desc'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>{t('about.title')}</h1>
        <p className={styles.description}>{t('about.description')}</p>

        <div className={styles.features}>
          {features.map(f => (
            <div className={styles.featureCard} key={f.title}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <div className={styles.goalCard}>
            <span className={styles.label}>
              <span className={styles.labelDot} />
              {t('about.goalLabel')}
            </span>
            <h2 className={styles.blockTitle}>{t('about.goalTitle')}</h2>
            <p className={styles.blockDesc}>{t('about.goalDesc')}</p>
          </div>

          <div className={styles.brandCard}>
            <span className={styles.label}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              {t('about.brandLabel')}
            </span>
            <h2 className={styles.blockTitle}>{t('about.brandTitle')}</h2>
            <p className={styles.blockDesc}>{t('about.brandDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
