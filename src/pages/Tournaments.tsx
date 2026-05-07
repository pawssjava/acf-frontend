import { useEffect, useState } from 'react';
import { getTournaments } from '../api/tournaments';
import type { Tournament } from '../types';
import TournamentCard from '../components/tournament/TournamentCard';
import styles from './ListPage.module.css';

const STATUS_FILTERS = ['Все', 'Активные', 'Будущие', 'Завершенные'];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Все');

  useEffect(() => {
    getTournaments()
      .then(r => setTournaments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'Все'
    ? tournaments
    : tournaments.filter(t => t.tournamentStatusName === filter);

  return (
    <div className={styles.page}>
      <div className={styles.heroBanner}>
        <div className={styles.heroBannerOverlay} />
        <div className={styles.heroBannerContent}>
          <h1>Турниры</h1>
          <p>Участвуй в соревнованиях и побеждай</p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.filterBar}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className={[styles.filterBtn, filter === f ? styles.filterActive : ''].join(' ')}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>Загружаем...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>Турниров не найдено</div>
        ) : (
          <div className={styles.grid3}>
            {filtered.map(t => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
