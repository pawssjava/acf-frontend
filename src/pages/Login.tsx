import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginUser } from '../api/auth';
import { getMe } from '../api/users';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import styles from './Auth.module.css';
import heroImg from '../assets/hero.png';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useTranslation();
  const passwordResetSuccess = (location.state as { passwordReset?: boolean } | null)?.passwordReset;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t('auth.errRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await loginUser(username.trim(), password);
      localStorage.setItem('access_token', data.access_token);

      const { data: me } = await getMe();

      login(data.access_token, data.refresh_token, {
        id: me.id,
        username: me.username,
        firstName: me.firstName ?? '',
        lastName: me.lastName ?? '',
        isAdmin: me.isAdmin,
        isVerified: me.isVerified,
        photo: me.photo,
      });

      navigate('/');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError(t('auth.errCredentials'));
      } else {
        setError(t('auth.errGeneral'));
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
          <h1 className={styles.title}>{t('auth.welcome')}</h1>
          <p className={styles.subtitle}>{t('auth.loginSubtitle')}</p>

          {passwordResetSuccess && (
            <div style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', color: '#27ae60', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
              {t('auth.passwordResetSuccess')}
            </div>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <Input
              label={t('auth.username')}
              type="text"
              placeholder="john_doe"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              autoComplete="username"
            />
            <Input
              label={t('auth.password')}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: '-4px' }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--accent-blue)' }}>
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <Button fullWidth size="lg" loading={loading} type="submit">
            {t('auth.loginBtn')}
          </Button>

          <div className={styles.divider}><span>{t('auth.or')}</span></div>

          <Link to="/register" className={styles.secondaryBtn}>
            {t('auth.registerBtn')}
          </Link>

          <p className={styles.legal}>{t('auth.legal')}</p>
        </form>
      </div>
    </div>
  );
}
