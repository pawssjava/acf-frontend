import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNewsList } from '../api/news';
import type { News } from '../types';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/news/NewsCard';
import Button from '../components/ui/Button';
import styles from './ListPage.module.css';

export default function NewsPage() {
  const { user } = useAuth();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNewsList()
      .then(r => setNews(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>Блог</h1>
          {user?.isAdmin && (
            <Link to="/admin/news/new">
              <Button size="sm">+ Новая статья</Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>Загружаем...</div>
        ) : news.length === 0 ? (
          <div className={styles.empty}>Новостей пока нет</div>
        ) : (
          <div className={styles.grid3}>
            {news.map(n => <NewsCard key={n.id} news={n} />)}
          </div>
        )}
      </div>
    </div>
  );
}
