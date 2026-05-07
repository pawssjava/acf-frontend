import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNewsList } from '../api/news';
import { getTournaments } from '../api/tournaments';
import type { News, Tournament } from '../types';
import { useAuth } from '../context/AuthContext';
import TournamentCard from '../components/tournament/TournamentCard';
import NewsCard from '../components/news/NewsCard';
import styles from './Home.module.css';
import heroImg from '../assets/hero.png';

const PARTNERS = ['AKF', 'AKF', 'AKF', 'AKF', 'AKF', 'AKF', 'AKF', 'AKF'];

const FAQ_ITEMS = [
  { q: 'Как зарегистрироваться на турнир?', a: 'Зарегистрируйтесь на платформе, затем перейдите на страницу турнира и нажмите "Участвовать".' },
  { q: 'Как зарегистрироваться на платформе?', a: 'Нажмите "Регистрация" в шапке сайта и следуйте инструкциям — введите номер телефона и подтвердите код из SMS.' },
  { q: 'Как проходят турниры?', a: 'Турниры проходят в онлайн-формате по расписанию. Все подробности можно найти на странице конкретного турнира.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [news, setNews] = useState<News[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <h1>Академия<br />Кибер Футбола</h1>
            <p>Участвуй в турнирах, прокачивай навыки, побеждай</p>
            <div className={styles.heroActions}>
              <Link to="/tournaments" className={styles.heroBtnPrimary}>Турниры</Link>
              {isAuthenticated
                ? <Link to="/profile" className={styles.heroBtnOutline}>Мой профиль</Link>
                : <Link to="/register" className={styles.heroBtnOutline}>Регистрация</Link>
              }
            </div>
          </div>
        </div>
      </section>

      <div className={styles.container}>
        {/* Tournaments */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Турниры</h2>
            <Link to="/tournaments" className={styles.seeAll}>Все турниры →</Link>
          </div>
          {tournaments.length > 0 ? (
            <div className={styles.grid3}>
              {tournaments.map(t => <TournamentCard key={t.id} tournament={t} />)}
            </div>
          ) : (
            <p className={styles.empty}>Турниры загружаются...</p>
          )}
        </section>

        {/* News */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Блог</h2>
            <Link to="/news" className={styles.seeAll}>Все новости →</Link>
          </div>
          {news.length > 0 ? (
            <div className={styles.grid3}>
              {news.map(n => <NewsCard key={n.id} news={n} />)}
            </div>
          ) : (
            <p className={styles.empty}>Новости загружаются...</p>
          )}
        </section>

        {/* Partners */}
        <section className={styles.section} id="partners">
          <h2>Партнеры</h2>
          <div className={styles.partnersGrid}>
            {PARTNERS.map((p, i) => (
              <div key={i} className={styles.partnerLogo}>{p}</div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.section}>
          <h2>Часто задаваемые вопросы</h2>
          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item, i) => (
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
