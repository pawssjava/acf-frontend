import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
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
          <Link to="/login">Войти</Link>
          <Link to="/register">Регистрация</Link>
        </nav>
        <p className={styles.copy}>© {new Date().getFullYear()} ACF. Все права защищены.</p>
      </div>
    </footer>
  );
}
