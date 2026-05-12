import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { verifyUser } from '../../../api/users';
import type { User } from '../../../types';
import Button from '../../ui/Button';
import styles from './Verification.module.css';

interface Props {
  user: User;
  onUpdate: (u: User) => void;
}

export default function Verification({ user, onUpdate }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const { data } = await verifyUser(user.id, file);
      onUpdate(data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('verification.uploadError'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className={styles.wrap}>
      {user.isVerified ? (
        <div className={styles.bannerVerified}>
          <div className={styles.bannerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div className={styles.bannerTitle}>{t('verification.verifiedTitle')}</div>
            <div className={styles.bannerSub}>{t('verification.verifiedSub')}</div>
          </div>
        </div>
      ) : (
        <div className={styles.bannerUnverified}>
          <div className={styles.bannerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className={styles.bannerText}>
            <div className={styles.bannerTitle}>{t('verification.unverifiedTitle')}</div>
            <div className={styles.bannerSub}>{t('verification.unverifiedSub')}</div>
          </div>
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            {t('verification.verifyBtn')}
          </Button>
        </div>
      )}

      <div
        className={[styles.dropZone, dragOver ? styles.dragOver : '', user.isVerified ? styles.dropZoneVerified : ''].join(' ')}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !user.isVerified && !uploading && fileRef.current?.click()}
      >
        <div className={[styles.pdfIcon, user.isVerified ? styles.pdfIconVerified : ''].join(' ')}>
          <svg width="48" height="56" viewBox="0 0 48 56" fill="none"><rect width="48" height="56" rx="8" fill={user.isVerified ? '#2bc48a' : '#1e3052'}/><text x="24" y="34" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">PDF</text><path d="M24 40 L24 50" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M18 44 L24 50 L30 44" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p className={styles.hint}>{t('verification.dropHint')}</p>
        <p className={styles.dropText}>{t('verification.dropText')}</p>

        {user.isVerified ? (
          <Button disabled fullWidth>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {t('verification.verifiedBtn')}
          </Button>
        ) : (
          <Button fullWidth loading={uploading} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {t('verification.uploadBtn')}
          </Button>
        )}

        <p className={styles.fine}>{t('verification.fine')}</p>

        {error && <p className={styles.error}>{error}</p>}
      </div>

      <input ref={fileRef} type="file" accept=".pdf" className={styles.hidden} onChange={onFileChange} />
    </div>
  );
}
