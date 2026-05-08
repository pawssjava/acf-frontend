import { useNavigate } from 'react-router-dom';
import type { Tournament } from '../../types';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import styles from './TournamentCard.module.css';

interface Props { tournament: Tournament; }

function statusVariant(name: string): 'teal' | 'blue' | 'gray' {
  if (name === 'Активные') return 'teal';
  if (name === 'Будущие') return 'blue';
  return 'gray';
}

export default function TournamentCard({ tournament }: Props) {
  const navigate = useNavigate();
  return (
    <Card hoverable onClick={() => navigate(`/tournaments/${tournament.id}`)}>
      <div className={styles.imgWrap}>
        {tournament.logo
          ? <img src={tournament.logo} alt={tournament.name} className={styles.img} />
          : <div className={styles.imgPlaceholder}><span>ACF</span></div>
        }
        <div className={styles.statusBadge}>
          <Badge variant={statusVariant(tournament.tournamentStatusName)}>
            {tournament.tournamentStatusName}
          </Badge>
        </div>
      </div>
      <div className={styles.body}>
        <p className={styles.type}>{tournament.tournamentTypeName}</p>
        <h3 className={styles.name}>{tournament.name}</h3>
        <div className={styles.meta}>
          <span>
            {new Date(tournament.startDate).toLocaleDateString('ru-RU')}
            {tournament.endDate && ` – ${new Date(tournament.endDate).toLocaleDateString('ru-RU')}`}
          </span>
          <span>{tournament.capacity} игроков</span>
        </div>
        <div className={styles.prize}>
          <span className={styles.prizeLabel}>Призовой фонд</span>
          <span className={styles.prizeValue}>{tournament.prizeMoney.toLocaleString('ru-RU')} ₸</span>
        </div>
      </div>
    </Card>
  );
}
