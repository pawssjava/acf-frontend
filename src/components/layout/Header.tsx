import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
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
          <NavLink to="/tournaments" className={({ isActive }) => isActive ? styles.active : ''} onClick={closeAll}>Турниры</NavLink>
          <NavLink to="/news" className={({ isActive }) => isActive ? styles.active : ''} onClick={closeAll}>Блог</NavLink>
          <NavLink to="/partners" className={({ isActive }) => isActive ? styles.active : ''} onClick={closeAll}>Партнеры</NavLink>

          {user?.isAdmin && (
            <div className={styles.adminNavItem} ref={adminRef}>
              <button
                className={[styles.adminNavBtn, adminOpen ? styles.adminNavBtnOpen : ''].join(' ')}
                onClick={() => setAdminOpen(o => !o)}
                aria-expanded={adminOpen}
              >
                Админ панель
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
                    SMS Log
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button
                className={styles.avatarBtn}
                onClick={() => { setMenuOpen(false); setDropdownOpen(o => !o); }}
                aria-label="Профиль"
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
                    Профиль
                  </Link>
                  <button className={[styles.dropdownItem, styles.dropdownLogout].join(' ')} onClick={handleLogout}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.loginBtn}>Войти</Link>
          )}
        </div>

        <button
          className={styles.burger}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Меню"
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
