import { useEffect, useState } from 'react';
import { getUserTournaments } from '../../api/users';
import type { UserTournamentsPage } from '../../types';
import styles from './TournamentHistory.module.css';

const FORMAT_LABELS: Record<string, string> = {
  SINGLE_ELIMINATION: 'Single Elimination',
  SWISS: 'Swiss',
  EKPL: 'EKPL',
};

function fmtDate(d: string) {
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
      <h2>История турниров</h2>

      {loading ? (
        <div className={styles.loading}>Загружаем...</div>
      ) : !data || data.totalElements === 0 ? (
        <div className={styles.empty}>Завершённых турниров нет</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Турнир</th>
                  <th>Формат</th>
                  <th>Даты</th>
                  <th>Место</th>
                  <th>Очки</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map(t => (
                  <tr key={t.tournamentId}>
                    <td>
                      <div className={styles.nameCell}>
                        {t.logo ? (
                          <img src={t.logo} alt="" className={styles.logo} />
                        ) : (
                          <div className={styles.logoPlaceholder} />
                        )}
                        <span className={styles.tournamentName}>{t.tournamentName}</span>
                      </div>
                    </td>
                    <td className={styles.secondary}>{FORMAT_LABELS[t.format] ?? t.format}</td>
                    <td className={styles.dates}>
                      {fmtDate(t.startDate)} → {fmtDate(t.endDate)}
                    </td>
                    <td><PlaceCell place={t.place} /></td>
                    <td className={styles.secondary}>{t.score ?? '—'}</td>
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
                ← Назад
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
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
