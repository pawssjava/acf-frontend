import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserTournaments } from '../../../api/users';
import type { User, UserTournamentEntry, UserTournamentsPage } from '../../../types';
import { fmtDate } from '../../../utils/fmtDate';
import Button from '../../ui/Button';
import styles from './UserTournaments.module.css';

interface Props { user: User; }

const FORMAT_LABELS: Record<string, string> = {
  SINGLE_ELIMINATION: 'eFootball · 1v1',
  SWISS: 'Swiss',
  EKPL: 'eFootball · 1v1',
};

function buildPages(cur: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const set = new Set([0, total - 1, cur, cur - 1, cur + 1]);
  const sorted = [...set].filter(n => n >= 0 && n < total).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
    result.push(sorted[i]);
  }
  return result;
}

function TournamentCard({ t: entry }: { t: UserTournamentEntry }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  function fmtDateRange(start: string, end: string) {
    const s = fmtDate(start + 'T00:00:00', i18n.language);
    const e = fmtDate(end + 'T00:00:00', i18n.language);
    if (start.slice(0, 7) === end.slice(0, 7)) {
      const sd = new Date(start + 'T00:00:00').getDate();
      return `${sd}–${e}`;
    }
    return `${s} – ${e}`;
  }

  return (
    <div className={styles.card}>
      <div className={styles.banner}>
        {entry.logo
          ? <img src={entry.logo} alt="" className={styles.bannerImg} />
          : <div className={styles.bannerPlaceholder} />
        }
      </div>
      <div className={styles.body}>
        <div className={styles.tName}>{entry.tournamentName}</div>
        <div className={styles.tDates}>{fmtDateRange(entry.startDate, entry.endDate)}</div>
        {entry.place != null && (
          <div className={styles.place}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 17 16 21"/><path d="M5 3H3a2 2 0 0 0-2 2v2a6 6 0 0 0 6 6h6a6 6 0 0 0 6-6V5a2 2 0 0 0-2-2h-2"/><rect x="5" y="3" width="14" height="8" rx="1"/></svg>
            {t('userTournaments.top', { place: entry.place })}
          </div>
        )}
        <div className={styles.statsRow}>
          <div className={styles.stat}><span className={styles.statLabel}>{t('userTournaments.labelTeam')}</span><span className={styles.statVal}>—</span></div>
          <div className={styles.stat}><span className={styles.statLabel}>{t('userTournaments.labelFormat')}</span><span className={styles.statVal}>{FORMAT_LABELS[entry.format] ?? entry.format}</span></div>
          <div className={styles.stat}><span className={styles.statLabel}>{t('userTournaments.labelPrize')}</span><span className={styles.statVal}>{entry.score ?? '—'}</span></div>
        </div>
        <Button fullWidth size="sm" onClick={() => navigate(`/tournaments/${entry.tournamentId}`)}>{t('userTournaments.details')}</Button>
      </div>
    </div>
  );
}

export default function UserTournaments({ user }: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<UserTournamentsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    getUserTournaments(user.id, page, 10)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id, page]);

  return (
    <div className={styles.wrap}>
      {loading ? (
        <div className={styles.loading}>{t('userTournaments.loading')}</div>
      ) : !data || data.totalElements === 0 ? (
        <div className={styles.empty}>{t('userTournaments.empty')}</div>
      ) : (
        <>
          <div className={styles.grid}>
            {data.content.map(entry => <TournamentCard key={entry.tournamentId} t={entry} />)}
          </div>

          {data.totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>{t('userTournaments.prev')}</button>
              <div className={styles.pageNumbers}>
                {buildPages(page, data.totalPages).map((item, i) =>
                  item === '…'
                    ? <span key={`e${i}`} className={styles.ellipsis}>…</span>
                    : <button key={item} className={[styles.pageNum, item === page ? styles.pageNumActive : ''].join(' ')} onClick={() => setPage(item)}>{item + 1}</button>
                )}
              </div>
              <button className={styles.pageBtn} disabled={page === data.totalPages - 1} onClick={() => setPage(p => p + 1)}>{t('userTournaments.next')}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
