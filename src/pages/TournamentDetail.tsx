import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTournamentById, getParticipants, getResults, getRegistrationLog, registerParticipant, unregisterParticipant, startTournament } from '../api/tournaments';
import type { Tournament, Participant, TournamentResult, RegistrationLogPage } from '../types';
import { useAuth } from '../context/AuthContext';
import { isEditable } from '../utils/tournament';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import BracketView from '../components/tournament/BracketView';
import styles from './TournamentDetail.module.css';

function validatePsn(val: string): string | undefined {
  if (val.length < 3)  return 'Минимум 3 символа';
  if (val.length > 16) return 'Максимум 16 символов';
  if (!/^[a-zA-Z0-9_-]+$/.test(val)) return 'Только латинские буквы, цифры, _ и -';
  if (/^[_-]/.test(val)) return 'Не может начинаться с _ или -';
  if (/[_-]$/.test(val)) return 'Не может заканчиваться на _ или -';
  if (/[_-]{2}/.test(val)) return 'Нельзя использовать два спецсимвола подряд';
  return undefined;
}

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

type Tab = 'info' | 'participants' | 'results' | 'bracket' | 'activity';

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
  const [psnModalOpen, setPsnModalOpen] = useState(false);
  const [psn, setPsn] = useState('');
  const [psnError, setPsnError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);

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
  const isUpcoming = tournament !== null && isEditable(tournament);
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

  const openPsnModal = () => {
    if (user?.isVerified === false) {
      setVerificationRequired(true);
      return;
    }
    setVerificationRequired(false);
    setPsn('');
    setPsnError('');
    setPsnModalOpen(true);
  };

  const closePsnModal = () => {
    if (joining) return;
    setPsnModalOpen(false);
    setPsn('');
    setPsnError('');
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = psn.trim();
    if (!trimmed) {
      setPsnError('PSN обязателен');
      return;
    }
    const psnFormatErr = validatePsn(trimmed);
    if (psnFormatErr) {
      setPsnError(psnFormatErr);
      return;
    }
    if (!user || !tournament) return;
    setJoining(true);
    setJoinMsg('');
    setPsnError('');
    try {
      const p = await registerParticipant(numId, user.id, psn.trim());
      setParticipants(prev => [...prev, p.data]);
      setJoinMsg('Вы успешно зарегистрированы!');
      setPsnModalOpen(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (status === 400 && message.toLowerCase().includes('psn')) {
        setPsnError('PSN обязателен');
      } else if (status === 400) {
        setJoinMsg('Турнир заполнен');
        setPsnModalOpen(false);
      } else if (status === 403) {
        setVerificationRequired(true);
        setPsnModalOpen(false);
      } else {
        setJoinMsg('Ошибка при регистрации');
        setPsnModalOpen(false);
      }
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
    activity: 'Активность регистрации',
  };

  const visibleTabs: Tab[] = [
    'info',
    'participants',
    ...(tournament.phase !== null ? ['bracket' as Tab] : []),
    ...(tournament.phase === 'COMPLETED' ? ['results' as Tab] : []),
    ...(user?.isAdmin ? ['activity' as Tab] : []),
  ];

  // If the active tab was hidden (e.g. phase changed), fall back to info
  const activeTab = visibleTabs.includes(tab) ? tab : 'info';

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
                {`Раунд ${swissCurrentRound}${tournament.totalRounds ? ` / ${tournament.totalRounds}` : ''}`}
              </Badge>
            )}
            {user?.isAdmin && isEditable(tournament) && (
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
          {visibleTabs.map(t => (
            <button
              key={t}
              className={[styles.tab, activeTab === t ? styles.tabActive : ''].join(' ')}
              onClick={() => setTab(t)}
            >
              {TAB_LABELS[t]}
              {t === 'participants' && <span className={styles.tabCount}>{participants.length}</span>}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {activeTab === 'info' && (
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
                    {verificationRequired ? (
                      <div className={styles.verifBanner}>
                        <div className={styles.verifBannerIcon}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                        <div className={styles.verifBannerText}>
                          <span className={styles.verifBannerTitle}>Требуется верификация документа</span>
                          <span className={styles.verifBannerSub}>Загрузите удостоверение личности в профиле, чтобы участвовать в турнирах.</span>
                        </div>
                        <Link to="/profile?tab=verification" className={styles.verifBannerLink}>
                          Верифицировать →
                        </Link>
                      </div>
                    ) : (
                      <>
                        <Button onClick={openPsnModal} fullWidth size="lg" disabled={isFull}>
                          Зарегистрироваться
                        </Button>
                        {joinMsg && <p className={joinMsg.includes('успешно') ? styles.successMsg : styles.errorMsg}>{joinMsg}</p>}
                      </>
                    )}
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
        {activeTab === 'participants' && (
          <div className={styles.tableWrap}>
            {participants.length === 0 ? (
              <p className={styles.empty}>Пока нет участников</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr><th>#</th><th>Игрок</th><th>PSN</th><th>Дата регистрации</th><th /></tr>
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
                        <td>{p.psn}</td>
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
        {activeTab === 'results' && (
          <ResultsTab tournamentId={numId} />
        )}

        {/* Bracket tab — key on phase so mounting/unmounting re-fetches when tournament starts */}
        {activeTab === 'bracket' && (
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

        {/* Activity tab — admin only */}
        {activeTab === 'activity' && (
          <RegistrationActivityTab tournamentId={numId} />
        )}
      </div>

      {psnModalOpen && (
        <div className={styles.modalOverlay} onClick={closePsnModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Регистрация на турнир</h3>
            <form onSubmit={handleJoin}>
              <div className={styles.modalBody}>
                <Input
                  label="PSN"
                  placeholder="Введите ваш PSN"
                  value={psn}
                  onChange={e => {
                    const val = e.target.value;
                    setPsn(val);
                    setPsnError(val.length > 0 ? (validatePsn(val) ?? '') : '');
                  }}
                  maxLength={16}
                  error={psnError || undefined}
                  autoFocus
                />
              </div>
              <div className={styles.modalActions}>
                <Button type="button" variant="outline" onClick={closePsnModal} disabled={joining}>
                  Отмена
                </Button>
                <Button type="submit" loading={joining}>
                  Зарегистрироваться
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
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

function RegistrationActivityTab({ tournamentId }: { tournamentId: number }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<RegistrationLogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 300);
  };

  useEffect(() => {
    setLoading(true);
    getRegistrationLog(tournamentId, page, 20, debouncedSearch || undefined)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [tournamentId, page, debouncedSearch]);

  return (
    <div>
      <div className={styles.activitySearch}>
        <Input
          placeholder="Поиск по PSN, имени или нику..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {loading ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Дата и время</th><th>Игрок</th><th>Действие</th><th>PSN</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><div className={styles.skeletonCell} style={{ width: 120 }} /></td>
                  <td><div className={styles.skeletonCell} style={{ width: 160 }} /></td>
                  <td><div className={styles.skeletonCell} style={{ width: 80 }} /></td>
                  <td><div className={styles.skeletonCell} style={{ width: 100 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !data || data.totalElements === 0 ? (
        <p className={styles.empty}>
          {debouncedSearch ? 'Ничего не найдено' : 'Активности пока нет'}
        </p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Дата и время</th><th>Игрок</th><th>Действие</th><th>PSN</th></tr>
              </thead>
              <tbody>
                {data.content.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {new Date(entry.createdDate).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className={styles.playerName}>{entry.firstName} {entry.lastName}</span>
                      <span className={styles.username}>@{entry.username}</span>
                    </td>
                    <td>
                      <Badge variant={entry.action === 'REGISTER' ? 'teal' : 'red'}>
                        {entry.action === 'REGISTER' ? 'REGISTER' : 'UNREGISTER'}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{entry.psn}</td>
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
                      className={[styles.pageNum, item === page ? styles.pageNumActive : ''].join(' ')}
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
