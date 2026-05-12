import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNewsById } from '../api/news';
import type { News } from '../types';
import { useAuth } from '../context/AuthContext';
import styles from './DetailPage.module.css';

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getNewsById(Number(id))
      .then(r => setNews(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className={styles.loading}>{t('news.loading')}</div>;
  if (!news) return <div className={styles.notFound}>{t('news.notFound')}</div>;

  const locale = i18n.language === 'kk' ? 'kk-KZ' : i18n.language === 'en' ? 'en-US' : 'ru-RU';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/news" className={styles.back}>{t('news.backToBlog')}</Link>
          {user?.isAdmin && (
            <Link to={`/admin/news/${id}/edit`} className={styles.back}>{t('news.edit')}</Link>
          )}
        </div>

        {news.image && (
          <div className={styles.cover}>
            <img src={news.image} alt={news.title} />
          </div>
        )}

        <div className={styles.content}>
          <p className={styles.date}>
            {new Date(news.createdDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className={styles.title}>{news.title}</h1>
          <div className={styles.body}>
            {news.description.split('\n').map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
