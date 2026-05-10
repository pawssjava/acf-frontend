import { useRef, useState } from 'react';
import type { User } from '../../types';
import styles from './ProfileHeader.module.css';

interface Props {
  user: User;
  onPhotoUpload: (file: File) => Promise<void>;
}

export default function ProfileHeader({ user, onPhotoUpload }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { await onPhotoUpload(file); } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || user.username[0].toUpperCase();

  return (
    <div className={styles.card}>
      <div className={styles.banner} />

      <div className={styles.body}>
        <div className={styles.avatarWrap} onClick={() => !uploading && fileRef.current?.click()}>
          {user.photo
            ? <img src={user.photo} alt="" className={styles.avatar} />
            : <div className={styles.avatarPlaceholder}>{initials}</div>
          }
          <div className={styles.cameraBtn}>
            {uploading
              ? <span className={styles.spinner} />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" className={styles.hidden} onChange={handleFile} />
        </div>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <span className={styles.username}>{user.username}</span>
            {user.isVerified
              ? <span className={styles.badgeVerified}>Профиль подтвержден</span>
              : <span className={styles.badgeUnverified}>Профиль не подтвержден</span>
            }
          </div>
          <div className={styles.userId}>ID: {user.id}</div>
          {user.cityNameRu && (
            <div className={styles.city}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              г. {user.cityNameRu}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
