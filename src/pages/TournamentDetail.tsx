import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTournamentById, getParticipants, getResults, getRegistrationLog, registerParticipant, unregisterParticipant, startTournament } from '../api/tournaments';
import { getApiError } from '../utils/apiError';
import type { Tournament, Participant, TournamentResult, RegistrationLogPage } from '../types';
import { useAuth } from '../context/AuthContext';
import { isEditable } from '../utils/tournament';
import { fmtDate } from '../utils/fmtDate';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast from '../components/ui/Toast';
import BracketView from '../components/tournament/BracketView';
import styles from './TournamentDetail.module.css';

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: 'Single Elimination',
  SWISS: 'Swiss System',
  EKPL: 'eKPL',
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
  const { t, i18n } = useTranslation();
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [psnModalOpen, setPsnModalOpen] = useState(false);
  const [psn, setPsn] = useState('');
  const [psnError, setPsnError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);

  const locale = i18n.language === 'en' ? 'en-US' : 'ru-RU';

  function validatePsn(val: string): string | undefined {
    if (val.length < 3)  return t('tournamentDetail.psnMin');
    if (val.length > 16) return t('tournamentDetail.psnMax');
    if (!/^[a-zA-Z0-9_-]+$/.test(val)) return t('tournamentDetail.psnChars');
    if (/^[_-]/.test(val)) return t('tournamentDetail.psnNoStart');
    if (/[_-]$/.test(val)) return t('tournamentDetail.psnNoEnd');
    if (/[_-]{2}/.test(val)) return t('tournamentDetail.psnNoDouble');
    return undefined;
  }

  const PHASE_LABEL: Record<string, string> = {
    PLAYOFF: t('tournamentDetail.phasePlayoff'),
    SWISS: t('tournamentDetail.phaseSwiss'),
    REGULAR_SEASON: t('tournamentDetail.phaseRegular'),
    COMPLETED: t('tournamentDetail.phaseCompleted'),
  };

  const numId = Number(id);

  useEffect(() => {
    if (!numId) return;
    Promise.all([
      getTournamentById(numId),
      getParticipants(numId),
    ]).then(([tp, p]) => {
      setTournament(tp.data);
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
    } catch (err: unknown) {
      setToast({ message: getApiError(err), type: 'error' });
    } finally { setStartLoading(false); }
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
      setUnregisterMsg(getApiError(err));
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
      setPsnError(t('tournamentDetail.psnRequired'));
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
      setJoinMsg(t('tournamentDetail.joinSuccess'));
      setPsnModalOpen(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (status === 403) {
        setVerificationRequired(true);
        setPsnModalOpen(false);
      } else if (status === 400 && message.toLowerCase().includes('psn')) {
        setPsnError(getApiError(err));
      } else {
        setJoinMsg(getApiError(err));
        setPsnModalOpen(false);
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className={styles.loading}>{t('tournamentDetail.loading')}</div>;
  if (!tournament) return <div className={styles.loading}>{t('tournamentDetail.notFound')}</div>;

  const TAB_LABELS: Record<Tab, string> = {
    info: t('tournamentDetail.tabInfo'),
    participants: t('tournamentDetail.tabParticipants'),
    results: t('tournamentDetail.tabResults'),
    bracket: t('tournamentDetail.tabBracket'),
    activity: t('tournamentDetail.tabActivity'),
  };

  const visibleTabs: Tab[] = [
    'info',
    'participants',
    ...(tournament.phase !== null ? ['bracket' as Tab] : []),
    ...(tournament.phase === 'COMPLETED' ? ['results' as Tab] : []),
    ...(user?.isAdmin ? ['activity' as Tab] : []),
  ];

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
              : <Badge variant="gray">{t('tournamentDetail.notStarted')}</Badge>
            }
            {tournament.format === 'SWISS' && tournament.phase === 'SWISS' && swissCurrentRound !== null && (
              <Badge variant="gray">
                {`${t('tournamentDetail.round', { current: swissCurrentRound })}${tournament.totalRounds ? ` / ${tournament.totalRounds}` : ''}`}
              </Badge>
            )}
            {user?.isAdmin && isEditable(tournament) && (
              <button
                onClick={() => navigate(`/admin/tournaments/${id}/edit`)}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer' }}
              >
                {t('tournamentDetail.edit')}
              </button>
            )}
            {user?.isAdmin && tournament.phase === null && tournament.tournamentStatusId === 2 && (
              <button
                onClick={handleStart}
                disabled={startLoading}
                style={{ background: 'rgba(26,159,216,0.35)', border: '1px solid rgba(26,159,216,0.7)', color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', cursor: startLoading ? 'not-allowed' : 'pointer', opacity: startLoading ? 0.7 : 1, fontWeight: 600 }}
              >
                {startLoading ? t('tournamentDetail.starting') : t('tournamentDetail.start')}
              </button>
            )}
          </div>
          <h1 className={styles.heroTitle}>{tournament.name}</h1>
        </div>
      </div>

      <div className={styles.container}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {visibleTabs.map(tp => (
            <button
              key={tp}
              className={[styles.tab, activeTab === tp ? styles.tabActive : ''].join(' ')}
              onClick={() => setTab(tp)}
            >
              {TAB_LABELS[tp]}
              {tp === 'participants' && <span className={styles.tabCount}>{participants.length}</span>}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {activeTab === 'info' && (
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <InfoRow label={t('tournamentDetail.labelStartDate')} value={fmtDate(tournament.startDate, i18n.language)} />
              <InfoRow label={t('tournamentDetail.labelEndDate')} value={fmtDate(tournament.endDate, i18n.language)} />
              <InfoRow label={t('tournamentDetail.labelFormat')} value={FORMAT_LABEL[tournament.format] ?? tournament.format} />
              <InfoRow label={t('tournamentDetail.labelPhase')} value={tournament.phase ? (PHASE_LABEL[tournament.phase] ?? tournament.phase) : t('tournamentDetail.notStarted')} />
              {tournament.format === 'SWISS' && tournament.totalRounds && (
                <InfoRow label={t('tournamentDetail.labelRounds')} value={String(tournament.totalRounds)} />
              )}
              <InfoRow label={t('tournamentDetail.labelCapacity')} value={t('tournamentDetail.labelCapacityValue', { current: participants.length, total: tournament.capacity })} />
              <InfoRow label={t('tournamentDetail.labelPrize')} value={`${tournament.prizeMoney.toLocaleString(locale)} ₸`} />
              <InfoRow label={t('tournamentDetail.labelType')} value={tournament.tournamentTypeName} />
              <InfoRow label={t('tournamentDetail.labelStatus')} value={tournament.tournamentStatusName} />
            </div>

            {isAuthenticated ? (
              <div className={styles.joinCard}>
                {isUpcoming && isParticipant && (
                  <>
                    <p className={styles.alreadyJoined}>{t('tournamentDetail.alreadyParticipant')}</p>
                    <Button variant="danger" onClick={handleUnregister} loading={unregistering} fullWidth>
                      {t('tournamentDetail.cancelRegistration')}
                    </Button>
                    {unregisterMsg && <p className={styles.errorMsg}>{unregisterMsg}</p>}
                  </>
                )}
                {isUpcoming && !isParticipant && isRegistrationOpen && (
                  <>
                    <h3>{t('tournamentDetail.joinTitle')}</h3>
                    <p>{isFull ? t('tournamentDetail.full') : t('tournamentDetail.registerPrompt')}</p>
                    {verificationRequired ? (
                      <div className={styles.verifBanner}>
                        <div className={styles.verifBannerIcon}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                        <div className={styles.verifBannerText}>
                          <span className={styles.verifBannerTitle}>{t('tournamentDetail.verificationRequiredTitle')}</span>
                          <span className={styles.verifBannerSub}>{t('tournamentDetail.verificationRequiredSub')}</span>
                        </div>
                        <Link to="/profile?tab=verification" className={styles.verifBannerLink}>
                          {t('tournamentDetail.verifyLink')}
                        </Link>
                      </div>
                    ) : (
                      <>
                        <Button onClick={openPsnModal} fullWidth size="lg" disabled={isFull}>
                          {t('tournamentDetail.registerBtn')}
                        </Button>
                        {joinMsg && <p className={joinMsg === t('tournamentDetail.joinSuccess') ? styles.successMsg : styles.errorMsg}>{joinMsg}</p>}
                      </>
                    )}
                  </>
                )}
                {isUpcoming && !isParticipant && !isRegistrationOpen && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t('tournamentDetail.registrationClosed')}</p>
                )}
                {!isUpcoming && isParticipant && (
                  <p className={styles.alreadyJoined}>{t('tournamentDetail.participating')}</p>
                )}
                {!isUpcoming && !isParticipant && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t('tournamentDetail.registrationEnded')}</p>
                )}
              </div>
            ) : (
              <div className={styles.joinCard}>
                <h3>{t('tournamentDetail.wantToJoin')}</h3>
                <p>{t('tournamentDetail.loginToJoin')}</p>
                <Link to="/login"><Button fullWidth size="lg">{t('nav.login')}</Button></Link>
              </div>
            )}
          </div>
        )}

        {/* Participants tab */}
        {activeTab === 'participants' && (
          <div className={styles.tableWrap}>
            {participants.length === 0 ? (
              <p className={styles.empty}>{t('tournamentDetail.noParticipants')}</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr><th>#</th><th>{t('tournamentDetail.colPlayer')}</th><th>{t('tournamentDetail.colPsn')}</th><th>{t('tournamentDetail.colRegDate')}</th><th /></tr>
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
                        <td>{new Date(p.registeredDate).toLocaleDateString(locale)}</td>
                        <td>
                          {canRemove && (
                            <UnregisterBtn
                              label={t('tournamentDetail.cancelRegistration')}
                              disabled={isOwn && unregistering}
                              onClick={async () => {
                                if (isOwn) {
                                  await handleUnregister();
                                } else {
                                  try {
                                    await unregisterParticipant(numId, p.userId);
                                    setParticipants(prev => prev.filter(x => x.userId !== p.userId));
                                  } catch (err: unknown) {
                                    setUnregisterMsg(getApiError(err));
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

        {activeTab === 'results' && (
          <ResultsTab tournamentId={numId} />
        )}

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

        {activeTab === 'activity' && (
          <RegistrationActivityTab tournamentId={numId} />
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {psnModalOpen && (
        <div className={styles.modalOverlay} onClick={closePsnModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t('tournamentDetail.registrationModalTitle')}</h3>
            <form onSubmit={handleJoin}>
              <div className={styles.modalBody}>
                <Input
                  label="PSN"
                  placeholder={t('tournamentDetail.psnPlaceholder')}
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
                  {t('tournamentDetail.cancel')}
                </Button>
                <Button type="submit" loading={joining}>
                  {t('tournamentDetail.registerBtn')}
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
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'ru-RU';
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

  if (fetching) return <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>{t('tournamentDetail.resultLoading')}</p>;

  return (
    <div style={{ overflowX: 'auto' }}>
      {results.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          {t('tournamentDetail.resultsEmpty')}
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>{t('tournamentDetail.colPlace')}</th>
              <th style={thStyle}>{t('tournamentDetail.colPlayer')}</th>
              <th style={thStyle}>{t('tournamentDetail.colPoints')}</th>
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
                  {(r.score ?? 0).toLocaleString(locale)}
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
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'ru-RU';
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
          placeholder={t('tournamentDetail.searchActivity')}
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {loading ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>{t('tournamentDetail.colDatetime')}</th><th>{t('tournamentDetail.colPlayer')}</th><th>{t('tournamentDetail.colAction')}</th><th>{t('tournamentDetail.colPsn')}</th></tr>
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
          {debouncedSearch ? t('tournamentDetail.activityNoResults') : t('tournamentDetail.activityEmpty')}
        </p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>{t('tournamentDetail.colDatetime')}</th><th>{t('tournamentDetail.colPlayer')}</th><th>{t('tournamentDetail.colAction')}</th><th>{t('tournamentDetail.colPsn')}</th></tr>
              </thead>
              <tbody>
                {data.content.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {new Date(entry.createdDate).toLocaleString(locale, {
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
                {t('matches.prev')}
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
                {t('matches.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UnregisterBtn({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
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
      {label}
    </button>
  );
}
