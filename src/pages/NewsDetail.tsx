import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNewsById } from '../api/news';
import type { News } from '../types';
import styles from './DetailPage.module.css';

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getNewsById(Number(id))
      .then(r => setNews(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className={styles.loading}>Загружаем...</div>;
  if (!news) return <div className={styles.notFound}>Статья не найдена</div>;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/news" className={styles.back}>← Назад к блогу</Link>

        {news.image && (
          <div className={styles.cover}>
            <img src={news.image} alt={news.title} />
          </div>
        )}

        <div className={styles.content}>
          <p className={styles.date}>
            {new Date(news.createdDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
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
