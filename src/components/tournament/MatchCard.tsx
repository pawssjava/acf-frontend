import { useState } from 'react';
import type { TournamentMatch, TournamentFormat } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { setMatchScore, completeMatch } from '../../api/tournaments';
import styles from './MatchCard.module.css';

function statusBadge(status: string) {
  if (status === 'COMPLETED') return <Badge variant="teal">Завершён</Badge>;
  if (status === 'IN_PROGRESS') return <Badge variant="blue">Идёт</Badge>;
  if (status === 'BYE') return <Badge variant="gray">BYE</Badge>;
  return <Badge variant="gray">Ожидание</Badge>;
}

function displayName(firstName: string | null, lastName: string | null, username: string | null): string {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return username ?? 'TBD';
}

interface Props {
  match: TournamentMatch;
  tournamentId: number;
  isAdmin: boolean;
  onUpdate: (updated: TournamentMatch) => void;
  format?: TournamentFormat;
}

export default function MatchCard({ match, tournamentId, isAdmin, onUpdate }: Props) {
  const [s1, setS1] = useState(match.score1 != null ? String(match.score1) : '');
  const [s2, setS2] = useState(match.score2 != null ? String(match.score2) : '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const isDone = match.status === 'COMPLETED' || match.status === 'BYE';
  const canAdmin = isAdmin && !isDone && !!(match.participant1Id && match.participant2Id);

  const p1Name = match.participant1Id
    ? displayName(match.participant1FirstName, match.participant1LastName, match.participant1Username)
    : 'TBD';
  const p2Name = match.status === 'BYE'
    ? 'BYE'
    : (match.participant2Id
        ? displayName(match.participant2FirstName, match.participant2LastName, match.participant2Username)
        : 'TBD');

  const isP1Winner = match.winnerId !== null && match.winnerId === match.participant1Id;
  const isP2Winner = match.winnerId !== null && match.winnerId === match.participant2Id;

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await setMatchScore(tournamentId, match.id, Number(s1), Number(s2));
      const { data } = await completeMatch(tournamentId, match.id);
      onUpdate(data);
    } catch (err: unknown) {
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      const isTied = apiMsg.toLowerCase().includes('tied') || apiMsg.toLowerCase().includes('ничья');
      setMsg(isTied ? 'Ничья — введите другой счёт' : (apiMsg || 'Ошибка'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={[styles.card, match.status === 'BYE' ? styles.byeCard : ''].join(' ')}>
      <div className={styles.header}>
        <span className={styles.matchNum}>Матч {match.matchNumber}</span>
        {statusBadge(match.status)}
      </div>

      <div className={styles.players}>
        <div className={[styles.player, isP1Winner ? styles.winner : '', isP2Winner ? styles.loser : ''].join(' ')}>
          <span className={styles.dot}>{isP1Winner ? '●' : '○'}</span>
          <span className={styles.playerName}>{p1Name}</span>
          <span className={styles.playerScore}>{match.score1 ?? '—'}</span>
        </div>
        <div className={[styles.player, isP2Winner ? styles.winner : '', isP1Winner ? styles.loser : ''].join(' ')}>
          <span className={styles.dot}>{isP2Winner ? '●' : '○'}</span>
          <span className={styles.playerName}>{p2Name}</span>
          <span className={styles.playerScore}>{match.score2 ?? '—'}</span>
        </div>
      </div>

      {canAdmin && (
        <div className={styles.adminArea}>
          <div className={styles.scoreRow}>
            <input
              type="number" min="0"
              value={s1} onChange={e => setS1(e.target.value)}
              className={styles.scoreInput} placeholder="0"
            />
            <span className={styles.colon}>:</span>
            <input
              type="number" min="0"
              value={s2} onChange={e => setS2(e.target.value)}
              className={styles.scoreInput} placeholder="0"
            />
            <Button size="sm" onClick={handleSave} loading={saving} disabled={saving}>
              Сохранить
            </Button>
          </div>
          {msg && <p className={styles.msg}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
