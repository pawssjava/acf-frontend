import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNewsList } from '../api/news';
import { getTournaments } from '../api/tournaments';
import type { News, Tournament } from '../types';
import { useAuth } from '../context/AuthContext';
import TournamentCard from '../components/tournament/TournamentCard';
import NewsCard from '../components/news/NewsCard';
import styles from './Home.module.css';
import heroImg from '../assets/hero.png';

const PARTNERS = ['AKF', 'AKF', 'AKF', 'AKF', 'AKF', 'AKF', 'AKF', 'AKF'];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [news, setNews] = useState<News[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = t('home.faqItems', { returnObjects: true }) as Array<{ q: string; a: string }>;

  useEffect(() => {
    getNewsList().then(r => setNews(r.data.slice(0, 3))).catch(() => {});
    getTournaments().then(r => setTournaments(r.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <img src={heroImg} alt="ACF Hero" className={styles.heroImg} />
          <div className={styles.heroOverlay} />
          <div className={styles.heroText}>
            <h1>{t('home.heroTitle').split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}</h1>
            <p>{t('home.heroSubtitle')}</p>
            <div className={styles.heroActions}>
              <Link to="/tournaments" className={styles.heroBtnPrimary}>{t('nav.tournaments')}</Link>
              {isAuthenticated
                ? <Link to="/profile" className={styles.heroBtnOutline}>{t('home.myProfile')}</Link>
                : <Link to="/register" className={styles.heroBtnOutline}>{t('home.register')}</Link>
              }
            </div>
          </div>
        </div>
      </section>

      <div className={styles.container}>
        {/* Tournaments */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{t('home.tournaments')}</h2>
            <Link to="/tournaments" className={styles.seeAll}>{t('home.allTournaments')}</Link>
          </div>
          {tournaments.length > 0 ? (
            <div className={styles.grid3}>
              {tournaments.map(tour => <TournamentCard key={tour.id} tournament={tour} />)}
            </div>
          ) : (
            <p className={styles.empty}>{t('home.tournamentsLoading')}</p>
          )}
        </section>

        {/* News */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{t('home.blog')}</h2>
            <Link to="/news" className={styles.seeAll}>{t('home.allNews')}</Link>
          </div>
          {news.length > 0 ? (
            <div className={styles.grid3}>
              {news.map(n => <NewsCard key={n.id} news={n} />)}
            </div>
          ) : (
            <p className={styles.empty}>{t('home.newsLoading')}</p>
          )}
        </section>

        {/* Partners */}
        <section className={styles.section} id="partners">
          <h2>{t('home.partners')}</h2>
          <div className={styles.partnersGrid}>
            {PARTNERS.map((p, i) => (
              <div key={i} className={styles.partnerLogo}>{p}</div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.section}>
          <h2>{t('home.faq')}</h2>
          <div className={styles.faqList}>
            {faqItems.map((item, i) => (
              <div key={i} className={styles.faqItem}>
                <button className={styles.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{item.q}</span>
                  <span className={styles.faqIcon}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <p className={styles.faqA}>{item.a}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
