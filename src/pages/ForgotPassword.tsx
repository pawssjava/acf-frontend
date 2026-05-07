import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordSendSms, forgotPasswordReset } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import styles from './Auth.module.css';

type Step = 'phone' | 'reset';

const STEPS: Step[] = ['phone', 'reset'];
const STEP_LABELS = ['Телефон', 'Новый пароль'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const stepIdx = STEPS.indexOf(step);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    let masked = digits.slice(0, 3);
    if (digits.length > 3) masked += ' ' + digits.slice(3, 6);
    if (digits.length > 6) masked += '-' + digits.slice(6, 8);
    if (digits.length > 8) masked += '-' + digits.slice(8, 10);
    setPhone(masked);
    setError('');
  };

  const handleSendSms = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Введите полный номер телефона (10 цифр)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await forgotPasswordSendSms(`7${digits}`);
      setStep('reset');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 404
        ? 'Аккаунт с таким номером не найден'
        : 'Не удалось отправить SMS. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!code) { setError('Введите SMS-код'); return; }
    if (!newPassword) { setError('Введите новый пароль'); return; }
    if (newPassword.length < 6) { setError('Пароль должен содержать минимум 6 символов'); return; }
    setLoading(true);
    setError('');
    try {
      await forgotPasswordReset(`7${phone.replace(/\D/g, '')}`, code, newPassword);
      navigate('/login', { state: { passwordReset: true } });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) setError('Неверный SMS-код');
      else if (status === 404) setError('Пользователь не найден');
      else setError('Ошибка сброса пароля. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageCenter}>
      <div className={styles.registerCard}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div className={styles.registerInner}>
          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <div key={s} className={[styles.stepDot, i <= stepIdx ? styles.stepActive : ''].join(' ')}>
                <div className={styles.dot}>{i < stepIdx ? '✓' : i + 1}</div>
                <span>{STEP_LABELS[i]}</span>
              </div>
            ))}
          </div>

          <h1 className={styles.titleDark}>Забыли пароль?</h1>

          {error && <div className={styles.errorBox}>{error}</div>}

          {step === 'phone' && (
            <div className={styles.fields}>
              <Input
                label="Номер телефона"
                prefix="+7"
                type="tel"
                placeholder="747 777-77-77"
                value={phone}
                onChange={handlePhoneChange}
                inputMode="numeric"
              />
              <Button fullWidth size="lg" onClick={handleSendSms} loading={loading}>
                Отправить код
              </Button>
              <Link to="/login" className={styles.switchLink}>Вернуться к входу</Link>
            </div>
          )}

          {step === 'reset' && (
            <div className={styles.fields}>
              <p className={styles.smsSent}>Код отправлен на +7 {phone}</p>
              <Input
                label="SMS-код"
                type="text"
                placeholder="Введите код"
                maxLength={4}
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                inputMode="numeric"
              />
              <Input
                label="Новый пароль"
                type="password"
                placeholder="Минимум 6 символов"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                autoComplete="new-password"
              />
              <Button fullWidth size="lg" onClick={handleReset} loading={loading}>
                Сохранить пароль
              </Button>
              <button className={styles.resendBtn} onClick={handleSendSms} disabled={loading}>
                Отправить код повторно
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
