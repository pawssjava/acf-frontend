import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Footer.module.css';

export default function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>ACF<span>.</span></span>
          <p>Академия Кибер Футбола</p>
        </div>
        <nav className={styles.links}>
          <Link to="/tournaments">Турниры</Link>
          <Link to="/news">Блог</Link>
          {isAuthenticated
            ? <Link to="/profile">Профиль</Link>
            : <>
                <Link to="/login">Войти</Link>
                <Link to="/register">Регистрация</Link>
              </>
          }
        </nav>
        <p className={styles.copy}>© {new Date().getFullYear()} ACF. Все права защищены.</p>
      </div>
    </footer>
  );
}
