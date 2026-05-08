import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTournamentById, getParticipants, getResults, registerParticipant, unregisterParticipant, startTournament } from '../api/tournaments';
import type { Tournament, Participant, TournamentResult } from '../types';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import BracketView from '../components/tournament/BracketView';
import styles from './TournamentDetail.module.css';

const TOURNAMENT_STATUS = { ACTIVE: 1, UPCOMING: 2, FINISHED: 3 } as const;

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: 'Single Elimination',
  SWISS: 'Swiss System',
  EKPL: 'eKPL',
};

const PHASE_LABEL: Record<string, string> = {
  PLAYOFF: 'Плей-офф',
  SWISS: 'Швейцарская система',
  REGULAR_SEASON: 'Регулярный сезон',
  COMPLETED: 'Завершён',
};

type Tab = 'info' | 'participants' | 'results' | 'bracket';

function statusVariant(name: string): 'teal' | 'blue' | 'gray' {
  if (name === 'Активные') return 'teal';
  if (name === 'Будущие') return 'blue';
  return 'gray';
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState<Tab>('info');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');
  const [unregistering, setUnregistering] = useState(false);
  const [unregisterMsg, setUnregisterMsg] = useState('');
  const [swissCurrentRound, setSwissCurrentRound] = useState<number | null>(null);
  const [startLoading, setStartLoading] = useState(false);

  const numId = Number(id);

  useEffect(() => {
    if (!numId) return;
    Promise.all([
      getTournamentById(numId),
      getParticipants(numId),
    ]).then(([t, p]) => {
      setTournament(t.data);
      setParticipants(p.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [numId]);

  const reloadTournament = useCallback(async () => {
    if (!numId) return;
    try {
      const { data } = await getTournamentById(numId);
      setTournament(data);
    } catch { /* ignore */ }
  }, [numId]);


  const handleStart = async () => {
    setStartLoading(true);
    try {
      await startTournament(numId);
      await reloadTournament();
      setTab('bracket');
    } catch { /* ignore */ }
    finally { setStartLoading(false); }
  };

  const isParticipant = user ? participants.some(p => p.userId === user.id) : false;
  const isUpcoming = tournament?.tournamentStatusId === TOURNAMENT_STATUS.UPCOMING;
  const isFull = tournament ? participants.length >= tournament.capacity : false;
  const today = new Date().toISOString().slice(0, 10);
  const isRegistrationOpen = tournament ? today <= tournament.endDate : true;

  const handleUnregister = async () => {
    if (!user) return;
    setUnregistering(true);
    setUnregisterMsg('');
    try {
      await unregisterParticipant(numId, user.id);
      setParticipants(prev => prev.filter(p => p.userId !== user.id));
      setJoinMsg('');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setUnregisterMsg(status === 404 ? 'Регистрация не найдена' : 'Ошибка при отмене регистрации');
    } finally {
      setUnregistering(false);
    }
  };

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

  const TAB_LABELS: Record<Tab, string> = {
    info: 'Информация',
    participants: 'Участники',
    results: 'Результаты',
    bracket: 'Сетка',
  };

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
            {tournament.format && (
              <Badge variant="blue">{FORMAT_LABEL[tournament.format] ?? tournament.format}</Badge>
            )}
            {tournament.phase
              ? (
                <Badge variant={tournament.phase === 'COMPLETED' ? 'teal' : 'yellow'}>
                  {PHASE_LABEL[tournament.phase] ?? tournament.phase}
                </Badge>
              )
              : <Badge variant="gray">Не начат</Badge>
            }
            {tournament.format === 'SWISS' && tournament.phase === 'SWISS' && swissCurrentRound !== null && (
              <Badge variant="gray">
                Раунд {swissCurrentRound}{tournament.totalRounds ? ` / ${tournament.totalRounds}` : ''}
              </Badge>
            )}
            {user?.isAdmin && (
              <button
                onClick={() => navigate(`/admin/tournaments/${id}/edit`)}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer' }}
              >
                Редактировать
              </button>
            )}
            {user?.isAdmin && tournament.phase === null && tournament.tournamentStatusId === 2 && (
              <button
                onClick={handleStart}
                disabled={startLoading}
                style={{ background: 'rgba(26,159,216,0.35)', border: '1px solid rgba(26,159,216,0.7)', color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', cursor: startLoading ? 'not-allowed' : 'pointer', opacity: startLoading ? 0.7 : 1, fontWeight: 600 }}
              >
                {startLoading ? 'Запуск...' : 'Начать турнир'}
              </button>
            )}
          </div>
          <h1 className={styles.heroTitle}>{tournament.name}</h1>
        </div>
      </div>

      <div className={styles.container}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {(['info', 'participants', 'results', 'bracket'] as Tab[]).map(t => (
            <button
              key={t}
              className={[styles.tab, tab === t ? styles.tabActive : ''].join(' ')}
              onClick={() => setTab(t)}
            >
              {TAB_LABELS[t]}
              {t === 'participants' && <span className={styles.tabCount}>{participants.length}</span>}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {tab === 'info' && (
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <InfoRow label="Дата начала" value={new Date(tournament.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <InfoRow label="Дата окончания" value={new Date(tournament.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <InfoRow label="Формат" value={FORMAT_LABEL[tournament.format] ?? tournament.format} />
              <InfoRow label="Фаза" value={tournament.phase ? (PHASE_LABEL[tournament.phase] ?? tournament.phase) : 'Не начат'} />
              {tournament.format === 'SWISS' && tournament.totalRounds && (
                <InfoRow label="Раундов" value={String(tournament.totalRounds)} />
              )}
              <InfoRow label="Вместимость" value={`${participants.length} / ${tournament.capacity} игроков`} />
              <InfoRow label="Призовой фонд" value={`${tournament.prizeMoney.toLocaleString('ru-RU')} ₸`} />
              <InfoRow label="Тип" value={tournament.tournamentTypeName} />
              <InfoRow label="Статус" value={tournament.tournamentStatusName} />
            </div>

            {isAuthenticated ? (
              <div className={styles.joinCard}>
                {isUpcoming && isParticipant && (
                  <>
                    <p className={styles.alreadyJoined}>Вы уже участвуете в этом турнире</p>
                    <Button variant="danger" onClick={handleUnregister} loading={unregistering} fullWidth>
                      Отменить регистрацию
                    </Button>
                    {unregisterMsg && <p className={styles.errorMsg}>{unregisterMsg}</p>}
                  </>
                )}
                {isUpcoming && !isParticipant && isRegistrationOpen && (
                  <>
                    <h3>Участвовать</h3>
                    <p>{isFull ? 'Турнир заполнен' : 'Зарегистрируйтесь для участия в турнире'}</p>
                    <Button onClick={handleJoin} loading={joining} fullWidth size="lg" disabled={isFull}>
                      Зарегистрироваться
                    </Button>
                    {joinMsg && <p className={joinMsg.includes('успешно') ? styles.successMsg : styles.errorMsg}>{joinMsg}</p>}
                  </>
                )}
                {isUpcoming && !isParticipant && !isRegistrationOpen && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Регистрация закрыта</p>
                )}
                {!isUpcoming && isParticipant && (
                  <p className={styles.alreadyJoined}>Вы участвуете в этом турнире</p>
                )}
                {!isUpcoming && !isParticipant && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Регистрация завершена</p>
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
                  <tr><th>#</th><th>Игрок</th><th>Дата регистрации</th><th /></tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => {
                    const isOwn = user?.id === p.userId;
                    const canRemove = isUpcoming && (isOwn || user?.isAdmin);
                    return (
                      <tr key={p.id}>
                        <td>{i + 1}</td>
                        <td>
                          <span className={styles.playerName}>{p.firstName} {p.lastName}</span>
                          <span className={styles.username}>@{p.username}</span>
                        </td>
                        <td>{new Date(p.registeredDate).toLocaleDateString('ru-RU')}</td>
                        <td>
                          {canRemove && (
                            <UnregisterBtn
                              disabled={isOwn && unregistering}
                              onClick={async () => {
                                if (isOwn) {
                                  await handleUnregister();
                                } else {
                                  try {
                                    await unregisterParticipant(numId, p.userId);
                                    setParticipants(prev => prev.filter(x => x.userId !== p.userId));
                                  } catch {
                                    setUnregisterMsg('Ошибка при отмене регистрации');
                                  }
                                }
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Results tab — self-contained, re-fetches on every mount */}
        {tab === 'results' && (
          <ResultsTab tournamentId={numId} />
        )}

        {/* Bracket tab — key on phase so mounting/unmounting re-fetches when tournament starts */}
        {tab === 'bracket' && (
          <BracketView
            key={tournament.phase ?? 'null'}
            tournamentId={numId}
            format={tournament.format}
            phase={tournament.phase}
            totalRounds={tournament.totalRounds}
            isAdmin={!!user?.isAdmin}
            onTournamentUpdate={reloadTournament}
            onSwissRoundChange={setSwissCurrentRound}
          />
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

function ResultsTab({ tournamentId }: { tournamentId: number }) {
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [fetching, setFetching] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await getResults(tournamentId);
      setResults(Array.isArray(data) ? data : []);
    } catch { setResults([]); }
    finally { setFetching(false); }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 600,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border)',
  };

  if (fetching) return <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>Загружаем...</p>;

  return (
    <div style={{ overflowX: 'auto' }}>
      {results.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Результаты ещё не опубликованы
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Место</th>
              <th style={thStyle}>Игрок</th>
              <th style={thStyle}>Очки</th>
            </tr>
          </thead>
          <tbody>
            {[...results].sort((a, b) => a.place - b.place).map(r => (
              <tr key={r.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {r.place === 1 ? '🥇' : r.place === 2 ? '🥈' : r.place === 3 ? '🥉' : r.place}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ display: 'block', fontWeight: 500, color: 'var(--text-primary)' }}>{r.firstName} {r.lastName}</span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>@{r.username}</span>
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--accent-teal)' }}>
                  {(r.score ?? 0).toLocaleString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function UnregisterBtn({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent',
        border: '1px solid rgba(231,76,60,0.4)',
        color: 'var(--danger)',
        fontSize: '12px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        transition: 'background 0.15s',
      }}
      onMouseOver={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(231,76,60,0.1)'; }}
      onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      Отменить
    </button>
  );
}
