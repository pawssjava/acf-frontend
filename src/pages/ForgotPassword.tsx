import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordSendSms, forgotPasswordVerifySms, forgotPasswordReset } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import OtpInput from '../components/ui/OtpInput';
import styles from './Auth.module.css';

type Step = 'phone' | 'code' | 'reset';
const STEPS: Step[] = ['phone', 'code', 'reset'];
const STEP_LABELS = ['Телефон', 'Код', 'Пароль'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState(false);

  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fullPhone = `7${phone.replace(/\D/g, '')}`;
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
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Введите полный номер телефона (10 цифр)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await forgotPasswordSendSms(fullPhone);
      setStep('code');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 404
        ? 'Аккаунт с таким номером не найден'
        : 'Не удалось отправить SMS. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      await forgotPasswordVerifySms(fullPhone, code);
      setStep('reset');
    } catch {
      setOtpError(true);
      setError('Неверный код. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!newPassword) { setError('Введите новый пароль'); return; }
    if (newPassword.length < 6) { setError('Пароль должен содержать минимум 6 символов'); return; }
    if (newPassword !== confirmPassword) { setError('Пароли не совпадают'); return; }
    setLoading(true);
    setError('');
    try {
      await forgotPasswordReset(fullPhone, newPassword);
      navigate('/login', { state: { passwordReset: true } });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        setStep('phone');
        setError('Сессия верификации истекла. Начните сначала.');
      } else if (status === 404) {
        setError('Пользователь не найден');
      } else {
        setError('Ошибка сброса пароля. Попробуйте снова.');
      }
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

          {step === 'code' && (
            <div className={styles.fields}>
              <p className={styles.smsSent}>Код отправлен на +7 {phone}</p>
              <OtpInput
                onComplete={handleVerifyOtp}
                error={otpError}
                onErrorReset={() => { setOtpError(false); setError(''); }}
                disabled={loading}
              />
              <button
                className={styles.resendBtn}
                onClick={handleSendSms}
                disabled={loading}
              >
                Отправить код повторно
              </button>
            </div>
          )}

          {step === 'reset' && (
            <div className={styles.fields}>
              <Input
                label="Новый пароль"
                type="password"
                placeholder="Минимум 6 символов"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                autoComplete="new-password"
              />
              <Input
                label="Подтвердите пароль"
                type="password"
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                autoComplete="new-password"
              />
              <Button fullWidth size="lg" onClick={handleReset} loading={loading}>
                Сохранить пароль
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
