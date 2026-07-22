import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Tournament } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import styles from './TournamentCard.module.css';

interface Props {
  tournament: Tournament;
  onArchive?: (tournament: Tournament) => void;
  onRestore?: (tournament: Tournament) => void;
  onDeleteRequest?: (tournament: Tournament) => void;
}

function statusVariant(statusId: number): 'teal' | 'blue' | 'gray' {
  if (statusId === 1) return 'teal';
  if (statusId === 2) return 'blue';
  return 'gray';
}

function localName(ru: string, kk: string, en: string, lang: string): string {
  if (lang === 'kk') return kk || ru;
  if (lang === 'en') return en || ru;
  return ru;
}

export default function TournamentCard({ tournament, onArchive, onRestore, onDeleteRequest }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'ru-RU';
  const lang = i18n.language;
  const statusName = localName(tournament.tournamentStatusNameRu, tournament.tournamentStatusNameKk, tournament.tournamentStatusNameEn, lang);
  const typeName = localName(tournament.tournamentTypeNameRu, tournament.tournamentTypeNameKk, tournament.tournamentTypeNameEn, lang);
  const disciplineName = localName(tournament.disciplineNameRu, tournament.disciplineNameKk, tournament.disciplineNameEn, lang);
  return (
    <Card hoverable onClick={() => navigate(`/tournaments/${tournament.id}`)}>
      <div className={styles.imgWrap}>
        {tournament.logo
          ? <img src={tournament.logo} alt={tournament.name} className={styles.img} />
          : <div className={styles.imgPlaceholder}><span>ACF</span></div>
        }
        <div className={styles.statusBadge}>
          <Badge variant={statusVariant(tournament.tournamentStatusId)}>
            {statusName}
          </Badge>
        </div>
        <div className={styles.disciplineBadge}>
          <Badge variant="yellow">{disciplineName}</Badge>
        </div>
      </div>
      <div className={styles.body}>
        <p className={styles.type}>{typeName}</p>
        <h3 className={styles.name}>{tournament.name}</h3>
        <div className={styles.meta}>
          <span>
            {new Date(tournament.startDate).toLocaleDateString(locale)}
            {tournament.endDate && ` – ${new Date(tournament.endDate).toLocaleDateString(locale)}`}
          </span>
          <span>{t('tournaments.players', { count: tournament.capacity })}</span>
        </div>
        <div className={styles.prize}>
          <span className={styles.prizeLabel}>{t('tournaments.prizePool')}</span>
          <span className={styles.prizeValue}>{tournament.prizeMoney.toLocaleString(locale)} ₸</span>
        </div>
      </div>
      {user?.isAdmin && (onArchive || onRestore || onDeleteRequest) && (
        <div className={styles.adminBar} onClick={e => e.stopPropagation()}>
          <Link to={`/admin/tournaments/${tournament.id}/edit`} className={styles.adminBtn}>
            {t('adminActions.edit')}
          </Link>
          {tournament.archived ? (
            <button className={styles.adminBtn} onClick={() => onRestore?.(tournament)}>
              {t('adminActions.restore')}
            </button>
          ) : (
            <button className={styles.adminBtn} onClick={() => onArchive?.(tournament)}>
              {t('adminActions.archive')}
            </button>
          )}
          <button className={[styles.adminBtn, styles.dangerBtn].join(' ')} onClick={() => onDeleteRequest?.(tournament)}>
            {t('adminActions.delete')}
          </button>
        </div>
      )}
    </Card>
  );
}
