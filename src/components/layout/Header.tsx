import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout().then(() => navigate('/'));
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/news" className={styles.logo}>ACF<span>.</span></Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.open : ''}`}>
          <NavLink to="/tournaments" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>Турниры</NavLink>
          <NavLink to="/news" className={({ isActive }) => isActive ? styles.active : ''} onClick={() => setMenuOpen(false)}>Блог</NavLink>
          <NavLink to="/#partners" onClick={() => setMenuOpen(false)}>Партнеры</NavLink>

          {/* Mobile-only auth links inside the burger menu */}
          <div className={styles.mobileAuth}>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className={styles.mobileAuthLink} onClick={() => setMenuOpen(false)}>
                  Профиль
                </Link>
                <button className={styles.mobileAuthLink} onClick={() => { handleLogout(); setMenuOpen(false); }}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.mobileLoginBtn} onClick={() => setMenuOpen(false)}>Войти</Link>
                <Link to="/register" className={styles.mobileAuthLink} onClick={() => setMenuOpen(false)}>Регистрация</Link>
              </>
            )}
          </div>
        </nav>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <>
              <Link to="/profile" className={styles.profileBtn}>
                {user?.photo
                  ? <img src={user.photo} alt="" className={styles.avatar} />
                  : <span className={styles.avatarPlaceholder}>{user?.firstName?.[0] ?? '?'}</span>
                }
                <span>{user?.firstName}</span>
              </Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>Выйти</button>
            </>
          ) : (
            <Link to="/login" className={styles.loginBtn}>Войти</Link>
          )}
        </div>

        <button className={styles.burger} onClick={() => setMenuOpen(o => !o)} aria-label="Меню">
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
