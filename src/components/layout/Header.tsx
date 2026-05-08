import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout().then(() => navigate('/'));
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/news" className={styles.logo}>ACF<span>.</span></Link>

        <nav className={[styles.nav, menuOpen ? styles.open : ''].join(' ')}>
          <NavLink to="/tournaments" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>Турниры</NavLink>
          <NavLink to="/news" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>Блог</NavLink>
          <NavLink to="/#partners" onClick={() => setMenuOpen(false)}>Партнеры</NavLink>
        </nav>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button
                className={styles.avatarBtn}
                onClick={() => setDropdownOpen(o => !o)}
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
                    onClick={() => setDropdownOpen(false)}
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
