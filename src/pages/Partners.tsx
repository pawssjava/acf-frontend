import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPartnersList } from '../api/partners';
import type { Partner } from '../types';
import { useAuth } from '../context/AuthContext';
import PartnerCard from '../components/partners/PartnerCard';
import Button from '../components/ui/Button';
import styles from './ListPage.module.css';

export default function PartnersPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPartnersList()
      .then(r => setPartners(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (updated: Partner) =>
    setPartners(ps => ps.map(p => p.id === updated.id ? updated : p));

  const handleDelete = (id: number) =>
    setPartners(ps => ps.filter(p => p.id !== id));

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>Партнеры</h1>
          {user?.isAdmin && (
            <Link to="/admin/partners/new">
              <Button size="sm">+ Добавить партнера</Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>Загружаем...</div>
        ) : partners.length === 0 ? (
          <div className={styles.empty}>Партнеров пока нет</div>
        ) : (
          <div className={styles.grid3}>
            {partners.map(p => (
              <PartnerCard
                key={p.id}
                partner={p}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
