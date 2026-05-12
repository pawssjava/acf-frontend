import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNewsList } from '../api/news';
import type { News } from '../types';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/news/NewsCard';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import styles from './ListPage.module.css';

export default function NewsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    getNewsList()
      .then(r => setNews(r.data))
      .catch(() => setToast({ message: t('news.loadError'), type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>{t('news.title')}</h1>
          {user?.isAdmin && (
            <Link to="/admin/news/new">
              <Button size="sm">{t('news.newArticle')}</Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>{t('news.loading')}</div>
        ) : news.length === 0 ? (
          <div className={styles.empty}>{t('news.empty')}</div>
        ) : (
          <div className={styles.grid3}>
            {news.map(n => <NewsCard key={n.id} news={n} />)}
          </div>
        )}
      </div>
    </div>
  );
}
