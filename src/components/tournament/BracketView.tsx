import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { BracketDto, GroupStanding, TournamentFormat, TournamentMatch, PlayoffRoundDto } from '../../types';
import {
  getBracket,
  getStandings,
  nextRound as apiNextRound,
  advanceRegularSeason,
} from '../../api/tournaments';
import MatchCard from './MatchCard';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import styles from './BracketView.module.css';

interface Props {
  tournamentId: number;
  format: TournamentFormat;
  phase: string | null;
  totalRounds: number | null;
  isAdmin: boolean;
  onTournamentUpdate: () => void;
  onSwissRoundChange?: (round: number | null) => void;
}

export default function BracketView({
  tournamentId, format, phase, totalRounds, isAdmin, onTournamentUpdate, onSwissRoundChange,
}: Props) {
  const [bracket, setBracket] = useState<BracketDto | null>(null);
  const [standings, setStandings] = useState<GroupStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRound, setActiveRound] = useState<number>(1);
  const [activeSection, setActiveSection] = useState<'regular' | 'playoff'>('regular');
  const [advancers, setAdvancers] = useState('8');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [bRes, sRes] = await Promise.allSettled([
        getBracket(tournamentId),
        getStandings(tournamentId),
      ]);
      if (bRes.status === 'fulfilled') {
        const b = bRes.value.data;
        b.groups = b.groups ?? [];
        setBracket(b);
        if (b.playoffRounds.length > 0) {
          const cur = b.playoffRounds.find(r =>
            r.matches.some(m => m.status !== 'COMPLETED' && m.status !== 'BYE')
          );
          const curRound = cur?.roundNumber ?? b.playoffRounds[b.playoffRounds.length - 1].roundNumber;
          setActiveRound(r => r === 1 ? curRound : r);
          if (format === 'SWISS') onSwissRoundChange?.(curRound);
        }
      }
      if (sRes.status === 'fulfilled') setStandings(sRes.value.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [tournamentId, format, onSwissRoundChange]);

  useEffect(() => { load(); }, [load]);

  const updateMatch = useCallback((updated: TournamentMatch) => {
    setBracket(prev => {
      if (!prev) return prev;
      const patch = (list: TournamentMatch[]) => list.map(m => m.id === updated.id ? updated : m);
      return {
        ...prev,
        groups: (prev.groups ?? []).map(g => ({ ...g, matches: patch(g.matches) })),
        playoffRounds: prev.playoffRounds.map(r => ({ ...r, matches: patch(r.matches) })),
      };
    });
  }, []);

  // After any match action: patch local state immediately, then silently reload
  // so winner names propagate to the next round's TBD slots.
  const handleMatchUpdate = useCallback((updated: TournamentMatch) => {
    updateMatch(updated);
    load().catch(() => {});
  }, [updateMatch, load]);

  const action = async (fn: () => Promise<unknown>) => {
    setActionLoading(true); setActionMsg('');
    try {
      await fn();
      setLoading(true);
      await load();
      onTournamentUpdate();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка';
      setActionMsg(msg);
    }
    finally { setActionLoading(false); }
  };

  // SWISS: find current active round
  const swissCurrentRound = bracket?.playoffRounds.find(r =>
    r.matches.some(m => m.status !== 'COMPLETED' && m.status !== 'BYE')
  )?.roundNumber ?? bracket?.playoffRounds[bracket.playoffRounds.length - 1]?.roundNumber ?? null;

  const canNextRound = format === 'SWISS' && phase === 'SWISS' && (() => {
    if (!bracket || swissCurrentRound === null) return false;
    const cur = bracket.playoffRounds.find(r => r.roundNumber === swissCurrentRound);
    return cur?.matches.every(m => m.status === 'COMPLETED' || m.status === 'BYE') ?? false;
  })();

  // EKPL: all regular season matches done
  const groups = bracket?.groups ?? [];
  const allEkplMatchesDone = format === 'EKPL' && !!bracket && groups.length > 0 &&
    groups.every(g => g.matches.every(m => m.status === 'COMPLETED' || m.status === 'BYE'));

  if (loading) return <div className={styles.loading}>Загружаем...</div>;

  const hasData = bracket && ((bracket.groups ?? []).length > 0 || bracket.playoffRounds.length > 0);

  return (
    <div className={styles.wrap}>
      {/* Admin panel */}
      {isAdmin && phase !== null && (
        <div className={styles.adminPanel}>
          {format === 'SWISS' && phase === 'SWISS' && (
            <div className={styles.adminRow}>
              <span className={styles.adminLabel}>Следующий раунд</span>
              <Button
                onClick={() => action(() => apiNextRound(tournamentId))}
                loading={actionLoading}
                disabled={!canNextRound}
              >
                Следующий раунд
              </Button>
              {!canNextRound && <span className={styles.adminHint}>Завершите все матчи раунда</span>}
            </div>
          )}
          {format === 'EKPL' && phase === 'REGULAR_SEASON' && (
            <div className={styles.adminRow}>
              <span className={styles.adminLabel}>Выйти в плей-офф</span>
              <label className={styles.adminField}>
                <span>Участников:</span>
                <input
                  type="number" min="2"
                  value={advancers}
                  onChange={e => setAdvancers(e.target.value)}
                  className={styles.numInput}
                />
              </label>
              <Button
                onClick={() => action(() => advanceRegularSeason(tournamentId, Number(advancers)))}
                loading={actionLoading}
                disabled={!allEkplMatchesDone}
              >
                Выйти в плей-офф
              </Button>
              {!allEkplMatchesDone && <span className={styles.adminHint}>Завершите все матчи</span>}
            </div>
          )}
          {phase === 'COMPLETED' && (
            <div className={styles.adminRow}>
              <Badge variant="teal">Турнир завершён</Badge>
            </div>
          )}
          {actionMsg && <p className={styles.actionMsg}>{actionMsg}</p>}
        </div>
      )}

      {!hasData && (
        <p className={styles.empty}>
          {phase === null
            ? isAdmin
              ? 'Турнир ещё не начат. Нажмите «Начать турнир» на вкладке Информация.'
              : 'Турнир ещё не начат.'
            : 'Нет данных о сетке.'
          }
        </p>
      )}

      {/* SINGLE_ELIMINATION — connected bracket */}
      {format === 'SINGLE_ELIMINATION' && bracket && bracket.playoffRounds.length > 0 && (
        <BracketColumns
          rounds={bracket.playoffRounds}
          tournamentId={tournamentId}
          isAdmin={isAdmin}
          onUpdate={handleMatchUpdate}
          format={format}
        />
      )}

      {/* SWISS — round tabs + standings */}
      {format === 'SWISS' && bracket && bracket.playoffRounds.length > 0 && (
        <>
          {swissCurrentRound !== null && totalRounds && (
            <p className={styles.roundProgress}>Раунд {swissCurrentRound} / {totalRounds}</p>
          )}
          <RoundTabs
            rounds={bracket.playoffRounds.map(r => ({ number: r.roundNumber, label: `Раунд ${r.roundNumber}` }))}
            active={activeRound}
            onSelect={setActiveRound}
          />
          <MatchList
            matches={bracket.playoffRounds.find(r => r.roundNumber === activeRound)?.matches ?? []}
            tournamentId={tournamentId}
            isAdmin={isAdmin}
            onUpdate={handleMatchUpdate}
            format={format}
          />
          {standings.length > 0 && (
            <>
              <SectionHeader>Итоговая таблица</SectionHeader>
              <StandingsTable standings={standings} format={format} />
            </>
          )}
        </>
      )}

      {/* EKPL — Regular Season / Playoff tabs */}
      {format === 'EKPL' && bracket && hasData && (
        <>
          <div className={styles.sectionTabs}>
            <button
              className={[styles.sectionTab, activeSection === 'regular' ? styles.sectionTabActive : ''].join(' ')}
              onClick={() => setActiveSection('regular')}
            >
              Регулярный сезон
            </button>
            {bracket.playoffRounds.length > 0 && (
              <button
                className={[styles.sectionTab, activeSection === 'playoff' ? styles.sectionTabActive : ''].join(' ')}
                onClick={() => setActiveSection('playoff')}
              >
                Плей-офф
              </button>
            )}
          </div>

          {activeSection === 'regular' && (
            <>
              {(bracket.groups ?? []).map(g => (
                <MatchList
                  key={g.groupName}
                  matches={g.matches}
                  tournamentId={tournamentId}
                  isAdmin={isAdmin}
                  onUpdate={handleMatchUpdate}
                  format={format}
                />
              ))}
              {standings.length > 0 && <StandingsTable standings={standings} format={format} />}
            </>
          )}

          {activeSection === 'playoff' && bracket.playoffRounds.length > 0 && (
            <BracketColumns
              rounds={bracket.playoffRounds}
              tournamentId={tournamentId}
              isAdmin={isAdmin}
              onUpdate={handleMatchUpdate}
              format={format}
            />
          )}
        </>
      )}
    </div>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return <div className={styles.sectionHeader}>{children}</div>;
}

function RoundTabs({ rounds, active, onSelect }: {
  rounds: { number: number; label: string }[];
  active: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div className={styles.roundTabs}>
      {rounds.map(r => (
        <button
          key={r.number}
          className={[styles.roundTab, active === r.number ? styles.roundTabActive : ''].join(' ')}
          onClick={() => onSelect(r.number)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function MatchList({ matches, tournamentId, isAdmin, onUpdate, format }: {
  matches: TournamentMatch[];
  tournamentId: number;
  isAdmin: boolean;
  onUpdate: (m: TournamentMatch) => void;
  format: TournamentFormat;
}) {
  if (matches.length === 0) return <p className={styles.empty}>Нет матчей</p>;
  return (
    <div className={styles.matchGrid}>
      {matches.map(m => (
        <MatchCard
          key={m.id}
          match={m}
          tournamentId={tournamentId}
          isAdmin={isAdmin}
          onUpdate={onUpdate}
          format={format}
        />
      ))}
    </div>
  );
}

function BracketColumns({ rounds, tournamentId, isAdmin, onUpdate, format }: {
  rounds: PlayoffRoundDto[];
  tournamentId: number;
  isAdmin: boolean;
  onUpdate: (m: TournamentMatch) => void;
  format: TournamentFormat;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<number, HTMLDivElement>());
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const [svgW, setSvgW] = useState(0);
  const [svgH, setSvgH] = useState(0);

  const recompute = useCallback(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const cR = outer.getBoundingClientRect();
    const sx = (vx: number) => vx - cR.left + outer.scrollLeft;
    const sy = (vy: number) => vy - cR.top + outer.scrollTop;
    const newPaths: string[] = [];

    for (let ri = 0; ri < rounds.length - 1; ri++) {
      const srcMatches = rounds[ri].matches;
      const tgtMatches = rounds[ri + 1].matches;
      for (let ti = 0; ti < tgtMatches.length; ti++) {
        const s1 = srcMatches[ti * 2];
        const s2 = srcMatches[ti * 2 + 1];
        const tg = tgtMatches[ti];
        if (!s1 || !s2 || !tg) continue;
        const e1 = cardRefs.current.get(s1.id);
        const e2 = cardRefs.current.get(s2.id);
        const eT = cardRefs.current.get(tg.id);
        if (!e1 || !e2 || !eT) continue;
        const r1 = e1.getBoundingClientRect();
        const r2 = e2.getBoundingClientRect();
        const rT = eT.getBoundingClientRect();
        const x1 = sx(r1.right), y1 = sy(r1.top + r1.height / 2);
        const x2 = sx(r2.right), y2 = sy(r2.top + r2.height / 2);
        const xT = sx(rT.left),  yT = sy(rT.top + rT.height / 2);
        const midX = (Math.max(x1, x2) + xT) / 2;
        const midY = (y1 + y2) / 2;
        // source 1 → midX
        newPaths.push(`M${x1},${y1}H${midX}`);
        // source 2 → midX
        newPaths.push(`M${x2},${y2}H${midX}`);
        // vertical spine at midX
        newPaths.push(`M${midX},${y1}V${y2}`);
        // midpoint → target (allows for vertical offset with variable card heights)
        newPaths.push(`M${midX},${midY}V${yT}H${xT}`);
      }
    }

    setSvgPaths(newPaths);
    setSvgW(outer.scrollWidth);
    setSvgH(outer.scrollHeight);
  }, [rounds]);

  useLayoutEffect(() => {
    recompute();
    const ro = new ResizeObserver(recompute);
    const outer = outerRef.current;
    if (outer) {
      ro.observe(outer);
      cardRefs.current.forEach(el => ro.observe(el));
    }
    return () => ro.disconnect();
  }, [recompute]);

  return (
    <div ref={outerRef} className={styles.bracketOuter}>
      {svgW > 0 && (
        <svg className={styles.bracketSvg} width={svgW} height={svgH}>
          {svgPaths.map((d, i) => (
            <path key={i} d={d} className={styles.connectorPath} />
          ))}
        </svg>
      )}
      <div className={styles.bracketColumns}>
        {rounds.map(r => (
          <div key={r.roundNumber} className={styles.bracketColumn}>
            <div className={styles.bracketColumnHeader}>{r.roundName}</div>
            <div className={styles.bracketColumnMatches}>
              {r.matches.map(m => (
                <div
                  key={m.id}
                  ref={el => {
                    if (el) cardRefs.current.set(m.id, el);
                    else cardRefs.current.delete(m.id);
                  }}
                >
                  <MatchCard
                    match={m}
                    tournamentId={tournamentId}
                    isAdmin={isAdmin}
                    onUpdate={onUpdate}
                    format={format}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StandingsTable({ standings, format }: { standings: GroupStanding[]; format: TournamentFormat }) {
  const isSwiss = format === 'SWISS';
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Игрок</th>
            <th>И</th>
            <th>В</th>
            <th>Н</th>
            <th>П</th>
            {isSwiss
              ? <><th>Очки S</th><th>Buchholz</th></>
              : <><th>Очки</th><th>Разность</th></>
            }
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr key={s.userId}>
              <td>{i + 1}</td>
              <td>
                <span className={styles.pName}>{s.firstName} {s.lastName}</span>
                <span className={styles.pUser}>@{s.username}</span>
              </td>
              <td>{s.played}</td>
              <td>{s.wins}</td>
              <td>{s.draws}</td>
              <td>{s.losses}</td>
              {isSwiss
                ? <><td className={styles.pts}>{s.swissPoints}</td><td>{s.buchholz.toFixed(1)}</td></>
                : <><td className={styles.pts}>{s.points}</td><td>{s.scoreDiff > 0 ? `+${s.scoreDiff}` : s.scoreDiff}</td></>
              }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
