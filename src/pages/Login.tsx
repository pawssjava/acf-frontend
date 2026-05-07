import { Link } from 'react-router-dom';
import styles from './Auth.module.css';
import heroImg from '../assets/hero.png';

export default function Login() {
  const handleKeycloakLogin = () => {
    const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
    const realm = import.meta.env.VITE_KEYCLOAK_REALM;
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');

    if (!keycloakUrl || !realm || !clientId) {
      alert('Keycloak не настроен. Обратитесь к администратору.');
      return;
    }

    window.location.href =
      `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth` +
      `?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgImage}>
        <img src={heroImg} alt="" />
        <div className={styles.bgOverlay} />
        <div className={styles.bgTitle}>ACF.</div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>Добро пожаловать!</h1>
          <p className={styles.subtitle}>Войдите в свой аккаунт</p>

          <button onClick={handleKeycloakLogin} className={styles.mainBtn}>
            Войти через Keycloak
          </button>

          <div className={styles.divider}><span>или</span></div>

          <Link to="/register" className={styles.secondaryBtn}>
            Зарегистрироваться
          </Link>

          <p className={styles.legal}>
            Регистрируясь, я принимаю правила пользовательского соглашения
            и условия политики сбора и обработки персональных данных
          </p>
        </div>
      </div>
    </div>
  );
}
