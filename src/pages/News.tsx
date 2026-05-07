import { useEffect, useState } from 'react';
import { getNewsList } from '../api/news';
import type { News } from '../types';
import NewsCard from '../components/news/NewsCard';
import styles from './ListPage.module.css';

export default function NewsPage() {
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
        <h1 className={styles.pageTitle}>Блог</h1>

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
