import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { News } from '../../types';
import { fmtDate } from '../../utils/fmtDate';
import Card from '../ui/Card';
import styles from './NewsCard.module.css';

interface Props { news: News; }

export default function NewsCard({ news }: Props) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  return (
    <Card hoverable onClick={() => navigate(`/news/${news.id}`)}>
      <div className={styles.imgWrap}>
        {news.image
          ? <img src={news.image} alt={news.title} className={styles.img} />
          : <div className={styles.imgPlaceholder}><span>ACF</span></div>
        }
      </div>
      <div className={styles.body}>
        <p className={styles.date}>{fmtDate(news.createdDate, i18n.language)}</p>
        <h3 className={styles.title}>{news.title}</h3>
        <p className={styles.excerpt}>{news.description.slice(0, 120)}{news.description.length > 120 ? '...' : ''}</p>
        <span className={styles.readMore}>{t('news.readMore')}</span>
      </div>
    </Card>
  );
}
