import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments } from '../api/tournaments';
import { getTournamentTypes } from '../api/dictionary';
import type { Tournament, DictionaryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import TournamentCard from '../components/tournament/TournamentCard';
import Button from '../components/ui/Button';
import styles from './ListPage.module.css';

const STATUS_OPTIONS = ['Все', 'Активные', 'Будущие', 'Завершенные'];

export default function TournamentsPage() {
  const { user } = useAuth();
  const [types, setTypes] = useState<DictionaryItem[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [appliedTypeId, setAppliedTypeId] = useState<number | null>(null);
  const [appliedStatus, setAppliedStatus] = useState('Все');

  const [pendingTypeId, setPendingTypeId] = useState<number | null>(null);
  const [pendingStatus, setPendingStatus] = useState('Все');

  const [filterOpen, setFilterOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTournamentTypes()
      .then(r => setTypes(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getTournaments(appliedTypeId)
      .then(r => setTournaments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appliedTypeId]);

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  const handleApply = () => {
    setAppliedTypeId(pendingTypeId);
    setAppliedStatus(pendingStatus);
    setFilterOpen(false);
  };

  const openFilter = () => {
    setPendingTypeId(appliedTypeId);
    setPendingStatus(appliedStatus);
    setFilterOpen(true);
  };

  const filtered = appliedStatus === 'Все'
    ? tournaments
    : tournaments.filter(t => t.tournamentStatusName === appliedStatus);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Турниры</h1>
          {user?.isAdmin && (
            <Link to="/admin/tournaments/new">
              <Button size="sm">+ Новый турнир</Button>
            </Link>
          )}
        </div>

        <div className={styles.filterRow} ref={panelRef}>
          <button
            className={[styles.filterToggle, filterOpen ? styles.filterToggleOpen : ''].join(' ')}
            onClick={filterOpen ? () => setFilterOpen(false) : openFilter}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Фильтры
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {filterOpen && (
            <div className={styles.filterPanel}>
              <p className={styles.filterPanelTitle}>Фильтры</p>

              <div className={styles.filterGroup}>
                <p className={styles.filterGroupLabel}>Тип турнира</p>
                <label className={styles.radioItem}>
                  <span>Все</span>
                  <input type="radio" name="type" checked={pendingTypeId === null} onChange={() => setPendingTypeId(null)} />
                </label>
                {types.map(t => (
                  <label key={t.id} className={styles.radioItem}>
                    <span>{t.name}</span>
                    <input type="radio" name="type" checked={pendingTypeId === t.id} onChange={() => setPendingTypeId(t.id)} />
                  </label>
                ))}
              </div>

              <div className={styles.filterGroup}>
                <p className={styles.filterGroupLabel}>Статус</p>
                {STATUS_OPTIONS.map(s => (
                  <label key={s} className={styles.radioItem}>
                    <span>{s}</span>
                    <input type="radio" name="status" checked={pendingStatus === s} onChange={() => setPendingStatus(s)} />
                  </label>
                ))}
              </div>

              <button className={styles.applyBtn} onClick={handleApply}>
                Применить
              </button>
            </div>
          )}
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
