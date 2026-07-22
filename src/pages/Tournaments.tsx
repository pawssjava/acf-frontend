import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTournaments } from '../api/tournaments';
import { getTournamentTypes, getTournamentStatuses, getDisciplines } from '../api/dictionary';
import type { Tournament, DictionaryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import TournamentCard from '../components/tournament/TournamentCard';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import styles from './ListPage.module.css';

export default function TournamentsPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [types, setTypes] = useState<DictionaryItem[]>([]);
  const [statuses, setStatuses] = useState<DictionaryItem[]>([]);
  const [disciplines, setDisciplines] = useState<DictionaryItem[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [appliedTypeId, setAppliedTypeId] = useState<number | null>(null);
  const [appliedStatusId, setAppliedStatusId] = useState<number | null>(null);
  const [appliedDisciplineIds, setAppliedDisciplineIds] = useState<number[]>([]);

  const [pendingTypeId, setPendingTypeId] = useState<number | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);
  const [pendingDisciplineIds, setPendingDisciplineIds] = useState<number[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTournamentTypes().then(r => setTypes(r.data.content)).catch(() => {});
    getTournamentStatuses().then(r => setStatuses(r.data.content)).catch(() => {});
    getDisciplines().then(r => setDisciplines(r.data.content)).catch(() => {});
  }, []);

  const appliedDisciplineIdsKey = appliedDisciplineIds.join(',');

  useEffect(() => {
    setLoading(true);
    getTournaments(appliedTypeId, appliedDisciplineIds)
      .then(r => setTournaments(r.data))
      .catch(() => setToast({ message: t('tournaments.loadError'), type: 'error' }))
      .finally(() => setLoading(false));
  }, [appliedTypeId, appliedDisciplineIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setAppliedStatusId(pendingStatusId);
    setAppliedDisciplineIds(pendingDisciplineIds);
    setFilterOpen(false);
  };

  const openFilter = () => {
    setPendingTypeId(appliedTypeId);
    setPendingStatusId(appliedStatusId);
    setPendingDisciplineIds(appliedDisciplineIds);
    setFilterOpen(true);
  };

  const toggleDiscipline = (id: number) => {
    setPendingDisciplineIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = appliedStatusId === null
    ? tournaments
    : tournaments.filter(tour => tour.tournamentStatusId === appliedStatusId);

  return (
    <div className={styles.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t('tournaments.title')}</h1>
          {user?.isAdmin && (
            <Link to="/admin/tournaments/new">
              <Button size="sm">{t('tournaments.newTournament')}</Button>
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
            {t('tournaments.filters')}
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
              <p className={styles.filterPanelTitle}>{t('tournaments.filters')}</p>

              <div className={styles.filterGroup}>
                <p className={styles.filterGroupLabel}>{t('tournaments.filterType')}</p>
                <label className={styles.radioItem}>
                  <span>{t('tournaments.all')}</span>
                  <input type="radio" name="type" checked={pendingTypeId === null} onChange={() => setPendingTypeId(null)} />
                </label>
                {types.map(tp => {
                  const tpName = i18n.language === 'kk' ? (tp.nameKk || tp.nameRu) : i18n.language === 'en' ? (tp.nameEn || tp.nameRu) : tp.nameRu;
                  return (
                    <label key={tp.id} className={styles.radioItem}>
                      <span>{tpName}</span>
                      <input type="radio" name="type" checked={pendingTypeId === tp.id} onChange={() => setPendingTypeId(tp.id)} />
                    </label>
                  );
                })}
              </div>

              <div className={styles.filterGroup}>
                <p className={styles.filterGroupLabel}>{t('tournaments.filterStatus')}</p>
                <label className={styles.radioItem}>
                  <span>{t('tournaments.all')}</span>
                  <input type="radio" name="status" checked={pendingStatusId === null} onChange={() => setPendingStatusId(null)} />
                </label>
                {statuses.map(st => {
                  const stName = i18n.language === 'kk' ? (st.nameKk || st.nameRu) : i18n.language === 'en' ? (st.nameEn || st.nameRu) : st.nameRu;
                  return (
                    <label key={st.id} className={styles.radioItem}>
                      <span>{stName}</span>
                      <input type="radio" name="status" checked={pendingStatusId === st.id} onChange={() => setPendingStatusId(st.id)} />
                    </label>
                  );
                })}
              </div>

              <div className={styles.filterGroup}>
                <p className={styles.filterGroupLabel}>{t('tournaments.filterDiscipline')}</p>
                <label className={styles.radioItem}>
                  <span>{t('tournaments.all')}</span>
                  <input type="checkbox" checked={pendingDisciplineIds.length === 0} onChange={() => setPendingDisciplineIds([])} />
                </label>
                {disciplines.map(d => {
                  const dName = i18n.language === 'kk' ? (d.nameKk || d.nameRu) : i18n.language === 'en' ? (d.nameEn || d.nameRu) : d.nameRu;
                  return (
                    <label key={d.id} className={styles.radioItem}>
                      <span>{dName}</span>
                      <input type="checkbox" checked={pendingDisciplineIds.includes(d.id)} onChange={() => toggleDiscipline(d.id)} />
                    </label>
                  );
                })}
              </div>

              <button className={styles.applyBtn} onClick={handleApply}>
                {t('tournaments.apply')}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>{t('tournaments.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>{t('tournaments.empty')}</div>
        ) : (
          <div className={styles.grid3}>
            {filtered.map(tour => <TournamentCard key={tour.id} tournament={tour} />)}
          </div>
        )}
      </div>
    </div>
  );
}
