import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserTournaments } from '../../api/users';
import type { UserTournamentsPage } from '../../types';
import styles from './TournamentHistory.module.css';

const FORMAT_LABELS: Record<string, string> = {
  SINGLE_ELIMINATION: 'Single Elimination',
  SWISS: 'Swiss',
  EKPL: 'EKPL',
};

function fmtDateNumeric(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function PlaceCell({ place }: { place: number | null }) {
  if (place === null) return <span className={styles.dash}>—</span>;
  const medalCls = place === 1 ? styles.gold : place === 2 ? styles.silver : place === 3 ? styles.bronze : '';
  return <span className={`${styles.place} ${medalCls}`}>{place}</span>;
}

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const set = new Set([0, total - 1, current, current - 1, current + 1]);
  const sorted = [...set].filter(n => n >= 0 && n < total).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
    result.push(sorted[i]);
  }
  return result;
}

interface Props {
  userId: number;
}

export default function TournamentHistory({ userId }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<UserTournamentsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    getUserTournaments(userId, page, 10)
      .then(r => setData(r.data))
      .catch((err: { response?: { status?: number } }) => {
        if (err?.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [userId, page]);

  if (notFound) return null;

  return (
    <div className={styles.card}>
      <h2>{t('tournamentHistory.title')}</h2>

      {loading ? (
        <div className={styles.loading}>{t('tournamentHistory.loading')}</div>
      ) : !data || data.totalElements === 0 ? (
        <div className={styles.empty}>{t('tournamentHistory.empty')}</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('tournamentHistory.colTournament')}</th>
                  <th>{t('tournamentHistory.colFormat')}</th>
                  <th>{t('tournamentHistory.colDates')}</th>
                  <th>{t('tournamentHistory.colPlace')}</th>
                  <th>{t('tournamentHistory.colPoints')}</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map(tour => (
                  <tr
                    key={tour.tournamentId}
                    className={styles.clickableRow}
                    onClick={() => navigate(`/tournaments/${tour.tournamentId}`)}
                  >
                    <td>
                      <div className={styles.nameCell}>
                        {tour.logo ? (
                          <img src={tour.logo} alt="" className={styles.logo} />
                        ) : (
                          <div className={styles.logoPlaceholder} />
                        )}
                        <span className={styles.tournamentName}>{tour.tournamentName}</span>
                      </div>
                    </td>
                    <td className={styles.secondary}>{FORMAT_LABELS[tour.format] ?? tour.format}</td>
                    <td className={styles.dates}>
                      {fmtDateNumeric(tour.startDate)} → {fmtDateNumeric(tour.endDate)}
                    </td>
                    <td><PlaceCell place={tour.place} /></td>
                    <td className={styles.secondary}>{tour.score ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                {t('tournamentHistory.prev')}
              </button>
              <div className={styles.pageNumbers}>
                {buildPages(page, data.totalPages).map((item, i) =>
                  item === '…' ? (
                    <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
                  ) : (
                    <button
                      key={item}
                      className={`${styles.pageNum} ${item === page ? styles.pageNumActive : ''}`}
                      onClick={() => setPage(item)}
                    >
                      {item + 1}
                    </button>
                  )
                )}
              </div>
              <button
                className={styles.pageBtn}
                disabled={page === data.totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                {t('tournamentHistory.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
