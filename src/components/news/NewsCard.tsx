import { useNavigate } from 'react-router-dom';
import type { News } from '../../types';
import Card from '../ui/Card';
import styles from './NewsCard.module.css';

interface Props { news: News; }

export default function NewsCard({ news }: Props) {
  const navigate = useNavigate();
  return (
    <Card hoverable onClick={() => navigate(`/news/${news.id}`)}>
      <div className={styles.imgWrap}>
        {news.image
          ? <img src={news.image} alt={news.title} className={styles.img} />
          : <div className={styles.imgPlaceholder}><span>ACF</span></div>
        }
      </div>
      <div className={styles.body}>
        <p className={styles.date}>{new Date(news.createdDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <h3 className={styles.title}>{news.title}</h3>
        <p className={styles.excerpt}>{news.description.slice(0, 120)}{news.description.length > 120 ? '...' : ''}</p>
        <span className={styles.readMore}>Читать подробнее →</span>
      </div>
    </Card>
  );
}
