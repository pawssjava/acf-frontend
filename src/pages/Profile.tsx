import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMe } from '../api/users';
import { uploadUserPhoto } from '../api/users';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/ui/Toast';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileSidebar, { type ProfileTab } from '../components/profile/ProfileSidebar';
import PersonalInfo from '../components/profile/tabs/PersonalInfo';
import Verification from '../components/profile/tabs/Verification';
import Security from '../components/profile/tabs/Security';
import Matches from '../components/profile/tabs/Matches';
import UserTournaments from '../components/profile/tabs/UserTournaments';
import styles from './Profile.module.css';

function VerifAlert({ onGoToVerification }: { onGoToVerification: () => void }) {
  const { t } = useTranslation();
  return (
    <div className={styles.verifAlert}>
      <div className={styles.verifAlertIcon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div className={styles.verifAlertText}>
        <span className={styles.verifAlertTitle}>{t('profile.notVerifiedTitle')}</span>
        <span className={styles.verifAlertSub}>{t('profile.notVerifiedSub')}</span>
      </div>
      <button className={styles.verifAlertBtn} onClick={onGoToVerification}>
        {t('profile.verifyBtn')}
      </button>
    </div>
  );
}

const DESKTOP_DEFAULT: ProfileTab = 'info';

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export default function Profile() {
  const { isAuthenticated, updateUser: updateAuthUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const rawTab = searchParams.get('tab') as ProfileTab | null;
  const activeTab: ProfileTab | null = rawTab ?? (isMobile ? null : DESKTOP_DEFAULT);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    getMe()
      .then(r => {
        setUser(r.data);
        updateAuthUser({ photo: r.data.photo, isVerified: r.data.isVerified });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const setTab = (tab: ProfileTab) => setSearchParams({ tab }, { replace: false });

  const handleUserUpdate = (updated: User) => {
    setUser(updated);
    updateAuthUser({ isVerified: updated.isVerified, photo: updated.photo });
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;
    try {
      const { data } = await uploadUserPhoto(user.id, file);
      handleUserUpdate(data);
    } catch {
      setToast({ message: t('profile.photoError'), type: 'error' });
    }
  };

  if (loading) return <div className={styles.loading}>{t('profile.loading')}</div>;
  if (!user) return <div className={styles.loading}>{t('profile.notFound')}</div>;

  if (isMobile && activeTab === null) {
    return (
      <div className={styles.mobilePage}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <ProfileHeader user={user} onPhotoUpload={handlePhotoUpload} />
        <ProfileSidebar
          user={user}
          activeTab={null}
          onTabChange={setTab}
          mobile
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'info':         return <PersonalInfo user={user} onUpdate={handleUserUpdate} />;
      case 'verification': return <Verification user={user} onUpdate={handleUserUpdate} />;
      case 'security':     return <Security user={user} />;
      case 'matches':      return <Matches user={user} />;
      case 'tournaments':  return <UserTournaments user={user} />;
      case 'support':      return <SupportPlaceholder />;
      default:             return <PersonalInfo user={user} onUpdate={setUser} />;
    }
  };

  return (
    <div className={styles.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className={styles.container}>
        {isMobile ? (
          <div className={styles.mobileContent}>
            <button className={styles.backBtn} onClick={() => setSearchParams({}, { replace: false })}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              {t('profile.back')}
            </button>
            <ProfileHeader user={user} onPhotoUpload={handlePhotoUpload} />
            {!user.isVerified && activeTab !== 'verification' && (
              <VerifAlert onGoToVerification={() => setTab('verification')} />
            )}
            {renderContent()}
          </div>
        ) : (
          <div className={styles.layout}>
            <ProfileSidebar user={user} activeTab={activeTab} onTabChange={setTab} />
            <div className={styles.content}>
              <ProfileHeader user={user} onPhotoUpload={handlePhotoUpload} />
              {!user.isVerified && activeTab !== 'verification' && (
                <VerifAlert onGoToVerification={() => setTab('verification')} />
              )}
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SupportPlaceholder() {
  const { t } = useTranslation();
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '48px 28px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      {t('profile.supportWip')}
    </div>
  );
}
