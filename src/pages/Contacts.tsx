import { useTranslation } from 'react-i18next';
import heroImg from '../assets/contactsHero.png';
import styles from './Contacts.module.css';

export default function Contacts() {
  const { t } = useTranslation();

  const legalFields: [string, string][] = [
    [t('contacts.fullName'), t('contacts.fullNameValue')],
    [t('contacts.bin'), t('contacts.binValue')],
    [t('contacts.address'), t('contacts.addressValue')],
    [t('contacts.country'), t('contacts.countryValue')],
    [t('contacts.founded'), t('contacts.foundedValue')],
    [t('contacts.brand'), t('contacts.brandValue')],
    [t('contacts.project'), t('contacts.projectValue')],
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>{t('contacts.title')}</h1>

        <div className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.imageWrap}>
              <img src={heroImg} alt="" className={styles.image} />
            </div>

            <div className={styles.infoCard}>
              <h2 className={styles.sectionTitle}>{t('contacts.infoTitle')}</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.iconCircle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.itemLabel}>{t('contacts.phone')}</div>
                    <div className={styles.itemValue}>{t('contacts.phoneValue')}</div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.iconCircle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.itemLabel}>{t('contacts.email')}</div>
                    <div className={styles.itemValue}>{t('contacts.emailValue')}</div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.iconCircle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.itemLabel}>{t('contacts.support')}</div>
                    <div className={styles.itemValue}>{t('contacts.supportValue')}</div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.iconCircle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <div>
                    <div className={styles.itemLabel}>{t('contacts.region')}</div>
                    <div className={styles.itemValue}>{t('contacts.regionValue')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.legalCard}>
            <h2 className={styles.sectionTitle}>{t('contacts.legalTitle')}</h2>
            <dl className={styles.legalList}>
              {legalFields.map(([label, value]) => (
                <div className={styles.legalRow} key={label}>
                  <dt className={styles.legalLabel}>{label}</dt>
                  <dd className={styles.legalValue}>{value}</dd>
                </div>
              ))}
            </dl>

            <div className={styles.note}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.noteIcon}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p>{t('contacts.note')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
