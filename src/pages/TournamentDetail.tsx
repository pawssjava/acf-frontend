import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTournamentById, getParticipants, getResults, registerParticipant } from '../api/tournaments';
import type { Tournament, Participant, TournamentResult } from '../types';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import styles from './TournamentDetail.module.css';

type Tab = 'info' | 'participants' | 'results';

function statusVariant(name: string): 'teal' | 'blue' | 'gray' {
  if (name === 'Активные') return 'teal';
  if (name === 'Будущие') return 'blue';
  return 'gray';
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState<Tab>('info');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');

  const numId = Number(id);

  useEffect(() => {
    if (!numId) return;
    Promise.all([
      getTournamentById(numId),
      getParticipants(numId),
      getResults(numId),
    ]).then(([t, p, r]) => {
      setTournament(t.data);
      setParticipants(p.data);
      setResults(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [numId]);

  const isParticipant = user ? participants.some(p => p.userId === user.id) : false;

  const handleJoin = async () => {
    if (!user || !tournament) return;
    setJoining(true);
    setJoinMsg('');
    try {
      const p = await registerParticipant(numId, user.id);
      setParticipants(prev => [...prev, p.data]);
      setJoinMsg('Вы успешно зарегистрированы!');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setJoinMsg(status === 400 ? 'Турнир заполнен' : 'Ошибка при регистрации');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className={styles.loading}>Загружаем...</div>;
  if (!tournament) return <div className={styles.loading}>Турнир не найден</div>;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        {tournament.logo
          ? <img src={tournament.logo} alt={tournament.name} className={styles.heroImg} />
          : <div className={styles.heroPlaceholder} />
        }
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroMeta}>
            <Badge variant={statusVariant(tournament.tournamentStatusName)}>
              {tournament.tournamentStatusName}
            </Badge>
            <Badge variant="gray">{tournament.tournamentTypeName}</Badge>
          </div>
          <h1 className={styles.heroTitle}>{tournament.name}</h1>
        </div>
      </div>

      <div className={styles.container}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {(['info', 'participants', 'results'] as Tab[]).map(t => (
            <button
              key={t}
              className={[styles.tab, tab === t ? styles.tabActive : ''].join(' ')}
              onClick={() => setTab(t)}
            >
              {{ info: 'Информация', participants: 'Участники', results: 'Результаты' }[t]}
              {t === 'participants' && <span className={styles.tabCount}>{participants.length}</span>}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {tab === 'info' && (
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <InfoRow label="Дата начала" value={new Date(tournament.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <InfoRow label="Вместимость" value={`${participants.length} / ${tournament.capacity} игроков`} />
              <InfoRow label="Призовой фонд" value={`${tournament.prizeMoney.toLocaleString('ru-RU')} ₸`} />
              <InfoRow label="Тип" value={tournament.tournamentTypeName} />
              <InfoRow label="Статус" value={tournament.tournamentStatusName} />
            </div>

            {isAuthenticated ? (
              <div className={styles.joinCard}>
                {isParticipant ? (
                  <p className={styles.alreadyJoined}>Вы уже участвуете в этом турнире</p>
                ) : (
                  <>
                    <h3>Участвовать</h3>
                    <p>Зарегистрируйтесь для участия в турнире</p>
                    <Button onClick={handleJoin} loading={joining} fullWidth size="lg">
                      Зарегистрироваться
                    </Button>
                    {joinMsg && <p className={joinMsg.includes('успешно') ? styles.successMsg : styles.errorMsg}>{joinMsg}</p>}
                  </>
                )}
              </div>
            ) : (
              <div className={styles.joinCard}>
                <h3>Хотите участвовать?</h3>
                <p>Войдите или зарегистрируйтесь для участия в турнирах</p>
                <Link to="/login"><Button fullWidth size="lg">Войти</Button></Link>
              </div>
            )}
          </div>
        )}

        {/* Participants tab */}
        {tab === 'participants' && (
          <div className={styles.tableWrap}>
            {participants.length === 0 ? (
              <p className={styles.empty}>Пока нет участников</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr><th>#</th><th>Игрок</th><th>Дата регистрации</th></tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td>
                      <td>
                        <span className={styles.playerName}>{p.firstName} {p.lastName}</span>
                        <span className={styles.username}>@{p.username}</span>
                      </td>
                      <td>{new Date(p.registeredDate).toLocaleDateString('ru-RU')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Results tab */}
        {tab === 'results' && (
          <div className={styles.tableWrap}>
            {results.length === 0 ? (
              <p className={styles.empty}>Результаты ещё не опубликованы</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr><th>Место</th><th>Игрок</th><th>Очки</th></tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.id} className={r.place <= 3 ? styles[`place${r.place}` as keyof typeof styles] : ''}>
                      <td>
                        <span className={[styles.place, r.place <= 3 ? styles.podium : ''].join(' ')}>
                          {r.place === 1 ? '🥇' : r.place === 2 ? '🥈' : r.place === 3 ? '🥉' : r.place}
                        </span>
                      </td>
                      <td>
                        <span className={styles.playerName}>{r.firstName} {r.lastName}</span>
                        <span className={styles.username}>@{r.username}</span>
                      </td>
                      <td className={styles.score}>{r.score.toLocaleString('ru-RU')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}
