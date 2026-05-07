import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import styles from './Auth.module.css';
import heroImg from '../assets/hero.png';
import type { User } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const passwordResetSuccess = (location.state as { passwordReset?: boolean } | null)?.passwordReset;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Введите имя пользователя и пароль');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await loginUser(username.trim(), password);

      // Decode JWT to extract username for user lookup
      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      const jwtUsername: string = payload.preferred_username ?? payload.sub ?? username.trim();

      // Fetch user record matching the authenticated username
      localStorage.setItem('access_token', data.access_token);
      const usersRes = await apiClient.get<User[]>('/api/users');
      const match = usersRes.data.find((u) => u.username === jwtUsername);

      if (!match) throw new Error('User not found');

      login(data.access_token, data.refresh_token, {
        id: match.id,
        username: match.username,
        firstName: match.firstName,
        lastName: match.lastName,
        isAdmin: match.isAdmin,
        photo: match.photo,
      });

      navigate('/');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError('Неверное имя пользователя или пароль');
      } else {
        setError('Ошибка входа. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgImage}>
        <img src={heroImg} alt="" />
        <div className={styles.bgOverlay} />
        <div className={styles.bgTitle}>ACF.</div>
      </div>

      <div className={styles.formSide}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Добро пожаловать!</h1>
          <p className={styles.subtitle}>Войдите в свой аккаунт</p>

          {passwordResetSuccess && (
            <div style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', color: '#27ae60', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
              Пароль успешно изменён. Войдите с новым паролем.
            </div>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <Input
              label="Имя пользователя"
              type="text"
              placeholder="john_doe"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              autoComplete="username"
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: '-4px' }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--accent-blue)' }}>
              Забыли пароль?
            </Link>
          </div>

          <Button fullWidth size="lg" loading={loading} type="submit">
            Войти
          </Button>

          <div className={styles.divider}><span>или</span></div>

          <Link to="/register" className={styles.secondaryBtn}>
            Зарегистрироваться
          </Link>

          <p className={styles.legal}>
            Регистрируясь, я принимаю правила пользовательского соглашения
            и условия политики сбора и обработки персональных данных
          </p>
        </form>
      </div>
    </div>
  );
}
