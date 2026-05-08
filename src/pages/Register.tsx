import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendSms, verifySms, register, checkPhone, checkUsername } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import OtpInput from '../components/ui/OtpInput';
import styles from './Auth.module.css';

type Step = 'phone' | 'code' | 'details';
type FieldStatus = 'idle' | 'checking' | 'valid' | 'taken';

const STEPS: Step[] = ['phone', 'code', 'details'];
const STEP_LABELS = ['Телефон', 'Код', 'Данные'];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState(false);

  const [phone, setPhone] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<FieldStatus>('idle');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<FieldStatus>('idle');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const phoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (phoneTimer.current) clearTimeout(phoneTimer.current);
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
  }, []);

  const fullPhone = `7${phone.replace(/\D/g, '')}`;
  const stepIdx = STEPS.indexOf(step);

  const runCheckPhone = async (fp: string) => {
    setPhoneStatus('checking');
    try {
      await checkPhone(fp);
      setPhoneStatus('valid');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setPhoneStatus(status === 409 ? 'taken' : 'idle');
    }
  };

  const runCheckUsername = async (uname: string) => {
    setUsernameStatus('checking');
    try {
      await checkUsername(uname);
      setUsernameStatus('valid');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setUsernameStatus(status === 409 ? 'taken' : 'idle');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    let masked = digits.slice(0, 3);
    if (digits.length > 3) masked += ' ' + digits.slice(3, 6);
    if (digits.length > 6) masked += '-' + digits.slice(6, 8);
    if (digits.length > 8) masked += '-' + digits.slice(8, 10);
    setPhone(masked);
    setError('');
    setPhoneStatus('idle');

    if (phoneTimer.current) clearTimeout(phoneTimer.current);
    if (digits.length === 10) {
      phoneTimer.current = setTimeout(() => runCheckPhone(`7${digits}`), 500);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    setError('');
    setUsernameStatus('idle');

    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (val.length >= 3) {
      usernameTimer.current = setTimeout(() => runCheckUsername(val), 500);
    }
  };

  const handleSendSms = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Введите полный номер телефона (10 цифр)');
      return;
    }
    if (phoneStatus === 'taken') {
      setError('Этот номер телефона уже зарегистрирован');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Re-check if not yet validated (covers the case where user submits before debounce fires)
      if (phoneStatus !== 'valid') {
        setPhoneStatus('checking');
        try {
          await checkPhone(fullPhone);
          setPhoneStatus('valid');
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 409) {
            setPhoneStatus('taken');
            setError('Этот номер телефона уже зарегистрирован');
            setLoading(false);
            return;
          }
          // Network error — proceed; backend will reject if needed
        }
      }
      await sendSms(fullPhone);
      setStep('code');
    } catch {
      setError('Не удалось отправить SMS. Проверьте номер телефона.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      await verifySms(fullPhone, code);
      setStep('details');
    } catch {
      setOtpError(true);
      setError('Неверный код. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username || !password || !firstName || !lastName || !birthDate) {
      setError('Заполните все поля');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('Имя пользователя уже занято');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Re-check username if not confirmed yet
      if (usernameStatus !== 'valid') {
        setUsernameStatus('checking');
        try {
          await checkUsername(username);
          setUsernameStatus('valid');
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 409) {
            setUsernameStatus('taken');
            setError('Имя пользователя уже занято');
            setLoading(false);
            return;
          }
        }
      }
      await register({ phone: fullPhone, username, password, firstName, lastName, birthDate });
      navigate('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('не верифицир')) {
        setStep('phone');
        setError('Сессия верификации истекла. Начните сначала.');
      } else {
        setError('Ошибка регистрации. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  const phoneError = phoneStatus === 'taken' ? 'Этот номер телефона уже зарегистрирован' : undefined;
  const usernameError = usernameStatus === 'taken' ? 'Имя пользователя уже занято' : undefined;

  const phoneSuffix =
    phoneStatus === 'checking' ? <span className={styles.inlineSpinner} /> :
    phoneStatus === 'valid' ? <span className={styles.inlineCheck}>✓</span> :
    null;

  const usernameSuffix =
    usernameStatus === 'checking' ? <span className={styles.inlineSpinner} /> :
    usernameStatus === 'valid' ? <span className={styles.inlineCheck}>✓</span> :
    null;

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

          <h1 className={styles.titleDark}>Регистрация!</h1>

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
                suffix={phoneSuffix}
                error={phoneError}
              />
              <Button
                fullWidth size="lg"
                onClick={handleSendSms}
                loading={loading}
                disabled={phoneStatus === 'taken' || loading}
              >
                Отправить код
              </Button>
              <Link to="/login" className={styles.switchLink}>У меня уже есть учетная запись</Link>
              <p className={styles.legalDark}>
                Регистрируясь, я принимаю правила пользовательского соглашения
                и условия политики сбора и обработки персональных данных
              </p>
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

          {step === 'details' && (
            <div className={styles.fields}>
              <Input
                label="Имя пользователя"
                type="text"
                placeholder="john_doe"
                value={username}
                onChange={handleUsernameChange}
                autoComplete="username"
                suffix={usernameSuffix}
                error={usernameError}
              />
              <Input
                label="Пароль"
                type="password"
                placeholder="Минимум 6 символов"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="new-password"
              />
              <Input
                label="Имя"
                type="text"
                placeholder="Иван"
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setError(''); }}
              />
              <Input
                label="Фамилия"
                type="text"
                placeholder="Иванов"
                value={lastName}
                onChange={e => { setLastName(e.target.value); setError(''); }}
              />
              <Input
                label="Дата рождения"
                type="date"
                value={birthDate}
                onChange={e => { setBirthDate(e.target.value); setError(''); }}
              />
              <Button
                fullWidth size="lg"
                onClick={handleRegister}
                loading={loading}
                disabled={usernameStatus === 'taken' || loading}
              >
                Завершить регистрацию
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
