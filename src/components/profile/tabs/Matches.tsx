import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserMatches } from '../../../api/users';
import type { User, MatchEntry, MatchesPage } from '../../../types';
import styles from './Matches.module.css';

interface Props { user: User; }

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

const Checkmark = () => (
  <svg className={styles.checkmark} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function MatchCard({ match, myUsername }: { match: MatchEntry; myUsername: string }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'ru-RU';

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return `${d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  }

  const resultLabel =
    match.result === 'WIN'  ? t('matches.win',  { my: match.myScore, opp: match.opponentScore }) :
    match.result === 'LOSS' ? t('matches.loss', { my: match.myScore, opp: match.opponentScore }) :
                              t('matches.draw', { my: match.myScore, opp: match.opponentScore });

  const resultCls = match.result === 'WIN' ? styles.win : match.result === 'LOSS' ? styles.loss : styles.draw;
  const cardCls = match.result === 'WIN' ? styles.cardWin : match.result === 'LOSS' ? styles.cardLoss : '';

  const iWon = match.result === 'WIN';
  const theyWon = match.result === 'LOSS';

  return (
    <div className={[styles.card, cardCls].join(' ')} onClick={() => navigate(`/tournaments/${match.tournamentId}`)}>
      <div className={styles.top}>
        <div className={styles.players}>
          <span className={[styles.playerName, iWon ? styles.playerWinner : ''].join(' ')}>
            {iWon && <Checkmark />}{myUsername}
          </span>
          <span className={styles.vs}>vs</span>
          <span className={[styles.playerName, theyWon ? styles.playerWinner : ''].join(' ')}>
            {theyWon && <Checkmark />}{match.opponentUsername ?? '—'}
          </span>
        </div>
        <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div className={styles.meta}>
        <div className={styles.row}><span className={styles.metaLabel}>{t('matches.labelResult')}</span><span className={[styles.result, resultCls].join(' ')}>{resultLabel}</span></div>
        <div className={styles.row}><span className={styles.metaLabel}>{t('matches.labelTournament')}</span><span className={styles.metaVal}>{match.tournamentName}</span></div>
        <div className={styles.row}><span className={styles.metaLabel}>{t('matches.labelStatus')}</span><span className={styles.metaVal}>{t('matches.completed', { date: fmtDate(match.updatedDate) })}</span></div>
      </div>
    </div>
  );
}

export default function Matches({ user }: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<MatchesPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    getUserMatches(user.id, page, 10)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id, page]);

  return (
    <div className={styles.wrap}>
      {loading ? (
        <div className={styles.loading}>{t('matches.loading')}</div>
      ) : !data || data.content.length === 0 ? (
        <div className={styles.empty}>{t('matches.empty')}</div>
      ) : (
        <>
          <div className={styles.list}>
            {data.content.map(m => (
              <MatchCard key={m.matchId} match={m} myUsername={user.username} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>{t('matches.prev')}</button>
              <div className={styles.pageNumbers}>
                {buildPages(page, data.totalPages).map((item, i) =>
                  item === '…'
                    ? <span key={`e${i}`} className={styles.ellipsis}>…</span>
                    : <button key={item} className={[styles.pageNum, item === page ? styles.pageNumActive : ''].join(' ')} onClick={() => setPage(item)}>{item + 1}</button>
                )}
              </div>
              <button className={styles.pageBtn} disabled={page === data.totalPages - 1} onClick={() => setPage(p => p + 1)}>{t('matches.next')}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
