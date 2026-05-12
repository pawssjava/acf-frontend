import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import flagKz from '../../assets/flags/kz.svg';
import flagRu from '../../assets/flags/ru.svg';
import flagGb from '../../assets/flags/gb.svg';
import styles from './Header.module.css';

const LANGS = [
  { code: 'kk', label: 'KZ', flag: flagKz },
  { code: 'ru', label: 'RU', flag: flagRu },
  { code: 'en', label: 'EN', flag: flagGb },
];

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setAdminOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout().then(() => navigate('/'));
  };

  const closeAll = () => {
    setMenuOpen(false);
    setAdminOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/news" className={styles.logo} onClick={closeAll}>ACF<span>.</span></Link>

        <nav className={[styles.nav, menuOpen ? styles.open : ''].join(' ')}>
          <NavLink to="/tournaments" className={({ isActive }) => isActive ? styles.active : ''} onClick={closeAll}>{t('nav.tournaments')}</NavLink>
          <NavLink to="/news" className={({ isActive }) => isActive ? styles.active : ''} onClick={closeAll}>{t('nav.blog')}</NavLink>
          <NavLink to="/education" className={({ isActive }) => isActive ? styles.active : ''} onClick={closeAll}>{t('nav.education')}</NavLink>
          <NavLink to="/partners" className={({ isActive }) => isActive ? styles.active : ''} onClick={closeAll}>{t('nav.partners')}</NavLink>

          {user?.isAdmin && (
            <div className={styles.adminNavItem} ref={adminRef}>
              <button
                className={[styles.adminNavBtn, adminOpen ? styles.adminNavBtnOpen : ''].join(' ')}
                onClick={() => setAdminOpen(o => !o)}
                aria-expanded={adminOpen}
              >
                {t('nav.adminPanel')}
                <svg
                  className={[styles.adminChevron, adminOpen ? styles.adminChevronOpen : ''].join(' ')}
                  width="11" height="11" viewBox="0 0 11 11" fill="none"
                  aria-hidden="true"
                >
                  <path d="M1.5 3.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {adminOpen && (
                <div className={styles.adminDropdown}>
                  <Link
                    to="/admin/sms-log"
                    className={styles.adminDropdownItem}
                    onClick={closeAll}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {t('nav.smsLog')}
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className={styles.actions}>
          <button
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          <div className={styles.langSwitcher} ref={langRef}>
            <button
              className={styles.langToggle}
              onClick={() => setLangOpen(o => !o)}
              aria-expanded={langOpen}
            >
              <img className={styles.langFlag} src={LANGS.find(l => l.code === i18n.language)?.flag} alt="" />
              <span className={styles.langCode}>{LANGS.find(l => l.code === i18n.language)?.label}</span>
              <svg className={[styles.langChevron, langOpen ? styles.langChevronOpen : ''].join(' ')} width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1.5 3.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {langOpen && (
              <div className={styles.langDropdown}>
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    className={[styles.langOption, i18n.language === l.code ? styles.langOptionActive : ''].join(' ')}
                    onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }}
                  >
                    <img className={styles.langFlag} src={l.flag} alt={l.label} />
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button
                className={styles.avatarBtn}
                onClick={() => { setMenuOpen(false); setDropdownOpen(o => !o); }}
                aria-label={t('nav.profile')}
                aria-expanded={dropdownOpen}
              >
                {user?.photo
                  ? <img src={user.photo} alt="" className={styles.avatar} />
                  : <span className={styles.avatarPlaceholder}>{user?.firstName?.[0] ?? '?'}</span>
                }
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownUser}>
                    {user?.photo
                      ? <img src={user.photo} alt="" className={styles.dropdownAvatar} />
                      : <span className={[styles.avatarPlaceholder, styles.dropdownAvatar].join(' ')}>{user?.firstName?.[0] ?? '?'}</span>
                    }
                    <div className={styles.dropdownUserInfo}>
                      <span className={styles.dropdownName}>{user?.firstName} {user?.lastName}</span>
                      <span className={styles.dropdownUsername}>@{user?.username}</span>
                    </div>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link
                    to="/profile"
                    className={styles.dropdownItem}
                    onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    {t('nav.profile')}
                  </Link>
                  <button className={[styles.dropdownItem, styles.dropdownLogout].join(' ')} onClick={handleLogout}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.loginBtn}>{t('nav.login')}</Link>
          )}
        </div>

        <button
          className={styles.burger}
          onClick={() => setMenuOpen(o => !o)}
          aria-label={t('nav.menu')}
          aria-expanded={menuOpen}
        >
          <span className={menuOpen ? styles.burgerOpen : ''} />
          <span className={menuOpen ? styles.burgerOpen : ''} />
          <span className={menuOpen ? styles.burgerOpen : ''} />
        </button>
      </div>
    </header>
  );
}
