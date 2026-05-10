import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Partner } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { uploadPartnerLogo, deletePartner } from '../../api/partners';
import Card from '../ui/Card';
import styles from './PartnerCard.module.css';

interface Props {
  partner: Partner;
  onUpdate: (updated: Partner) => void;
  onDelete: (id: number) => void;
}

export default function PartnerCard({ partner, onUpdate, onDelete }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await uploadPartnerLogo(partner.id, file);
      onUpdate(data);
    } catch {
      // toast shown on detail page; card silently ignores
    }
    e.target.value = '';
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Удалить партнёра "${partner.name}"?`)) return;
    try {
      await deletePartner(partner.id);
      onDelete(partner.id);
    } catch {
      // silent fail
    }
  };

  return (
    <Card hoverable onClick={() => navigate(`/partners/${partner.id}`)}>
      <div className={styles.logoWrap}>
        {partner.logo
          ? <img src={partner.logo} alt={partner.name} className={styles.logo} />
          : <div className={styles.logoPlaceholder}><span>ACF</span></div>
        }
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{partner.name}</h3>
        <p className={styles.excerpt}>
          {partner.description.slice(0, 100)}{partner.description.length > 100 ? '...' : ''}
        </p>
      </div>
      {user?.isAdmin && (
        <div className={styles.adminBar} onClick={e => e.stopPropagation()}>
          <Link to={`/admin/partners/${partner.id}/edit`} className={styles.adminBtn}>
            Редактировать
          </Link>
          <button className={styles.adminBtn} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
            Логотип
          </button>
          <button className={[styles.adminBtn, styles.dangerBtn].join(' ')} onClick={handleDelete}>
            Удалить
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleLogoChange}
          />
        </div>
      )}
    </Card>
  );
}
