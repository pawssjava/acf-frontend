import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPartnerById, deletePartner, uploadPartnerLogo } from '../api/partners';
import type { Partner } from '../types';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/ui/Toast';
import styles from './PartnerDetail.module.css';

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!id) return;
    getPartnerById(Number(id))
      .then(r => setPartner(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !partner) return;
    try {
      const { data } = await uploadPartnerLogo(partner.id, file);
      setPartner(data);
      setToast({ message: t('partners.logoUpdated'), type: 'success' });
    } catch {
      setToast({ message: t('partners.logoError'), type: 'error' });
    }
    e.target.value = '';
  };

  const handleDelete = async () => {
    if (!partner) return;
    if (!window.confirm(t('partners.deleteConfirm', { name: partner.name }))) return;
    try {
      await deletePartner(partner.id);
      navigate('/partners');
    } catch {
      setToast({ message: t('partners.deleteError'), type: 'error' });
    }
  };

  if (loading) return <div className={styles.loading}>{t('partners.loading')}</div>;
  if (!partner) return <div className={styles.notFound}>{t('partners.notFound')}</div>;

  return (
    <div className={styles.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className={styles.container}>
        <div className={styles.topBar}>
          <Link to="/partners" className={styles.back}>{t('partners.backToPartners')}</Link>
          {user?.isAdmin && (
            <div className={styles.adminActions}>
              <Link to={`/admin/partners/${id}/edit`} className={styles.back}>
                {t('partners.edit')}
              </Link>
              <button className={styles.back} onClick={() => fileRef.current?.click()}>
                {t('partners.uploadLogo')}
              </button>
              <button className={[styles.back, styles.danger].join(' ')} onClick={handleDelete}>
                {t('partners.delete')}
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
        </div>

        <div className={styles.heroCard}>
          <div className={styles.logoArea}>
            {partner.logo
              ? <img src={partner.logo} alt={partner.name} className={styles.logo} />
              : <div className={styles.logoPlaceholder}><span>ACF</span></div>
            }
          </div>
          <div className={styles.info}>
            <h1 className={styles.name}>{partner.name}</h1>
            <div className={styles.description}>
              {partner.description.split('\n').map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <a
              href={partner.hyperlink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.visitBtn}
            >
              {t('partners.visitSite')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
