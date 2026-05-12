import { useTranslation } from 'react-i18next';
import type { User } from '../../types';
import styles from './ProfileSidebar.module.css';

export type ProfileTab = 'info' | 'verification' | 'security' | 'matches' | 'tournaments' | 'support';

interface NavItem { tab: ProfileTab; labelKey: string; icon: React.ReactNode; }

const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ShieldIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const LockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const GameIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4"/><circle cx="17" cy="11" r="1" fill="currentColor"/><circle cx="17" cy="14" r="1" fill="currentColor" /><circle cx="15" cy="12.5" r="1" fill="currentColor"/><circle cx="19" cy="12.5" r="1" fill="currentColor"/></svg>;
const TrophyIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 17 16 21"/><path d="M5 3H3a2 2 0 0 0-2 2v2a6 6 0 0 0 6 6h6a6 6 0 0 0 6-6V5a2 2 0 0 0-2-2h-2"/><rect x="5" y="3" width="14" height="8" rx="1"/></svg>;
const HelpIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const ChevronIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

const NAV: NavItem[] = [
  { tab: 'info',         labelKey: 'sidebar.profile',      icon: <UserIcon /> },
  { tab: 'verification', labelKey: 'sidebar.verification', icon: <ShieldIcon /> },
  { tab: 'security',     labelKey: 'sidebar.security',     icon: <LockIcon /> },
  { tab: 'matches',      labelKey: 'sidebar.matches',      icon: <GameIcon /> },
  { tab: 'tournaments',  labelKey: 'sidebar.tournaments',  icon: <TrophyIcon /> },
  { tab: 'support',      labelKey: 'sidebar.support',      icon: <HelpIcon /> },
];

interface Props {
  user: User;
  activeTab: ProfileTab | null;
  onTabChange: (tab: ProfileTab) => void;
  mobile?: boolean;
}

export default function ProfileSidebar({ user, activeTab, onTabChange, mobile }: Props) {
  const { t } = useTranslation();
  const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || user.username[0].toUpperCase();

  return (
    <aside className={mobile ? styles.mobile : styles.sidebar}>
      <div className={styles.userBlock}>
        <div className={styles.userAvatar}>
          {user.photo
            ? <img src={user.photo} alt="" className={styles.userAvatarImg} />
            : <div className={styles.userAvatarPlaceholder}>{initials}</div>
          }
        </div>
        <div>
          <div className={styles.sidebarUsername}>{user.username}</div>
          <div className={styles.sidebarId}>ID: {user.id}</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV.map(item => (
          <button
            key={item.tab}
            className={[styles.navItem, activeTab === item.tab ? styles.navItemActive : ''].join(' ')}
            onClick={() => onTabChange(item.tab)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{t(item.labelKey)}</span>
            {mobile && <span className={styles.chevron}><ChevronIcon /></span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
