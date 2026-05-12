import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sendSms, verifySms, register, checkPhone, checkUsername } from '../api/auth';
import { getApiError } from '../utils/apiError';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import OtpInput from '../components/ui/OtpInput';
import styles from './Auth.module.css';

type Step = 'phone' | 'code' | 'details';
type FieldStatus = 'idle' | 'checking' | 'valid' | 'taken';

const STEPS: Step[] = ['phone', 'code', 'details'];

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  function validateUsername(val: string): string | undefined {
    if (val.length < 3)  return t('register.usernameMin');
    if (val.length > 20) return t('register.usernameMax');
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return t('register.usernameChars');
    if (val.startsWith('_') || val.endsWith('_')) return t('register.usernameNoEdge');
    if (val.includes('__')) return t('register.usernameNoDouble');
    return undefined;
  }

  const STEP_LABELS = [t('register.stepPhone'), t('register.stepCode'), t('register.stepDetails')];

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
    if (!validateUsername(val)) {
      usernameTimer.current = setTimeout(() => runCheckUsername(val), 500);
    }
  };

  const handleSendSms = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      setError(t('register.errPhoneLength'));
      return;
    }
    if (phoneStatus === 'taken') {
      setError(t('register.errPhoneTaken'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (phoneStatus !== 'valid') {
        setPhoneStatus('checking');
        try {
          await checkPhone(fullPhone);
          setPhoneStatus('valid');
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 409) {
            setPhoneStatus('taken');
            setError(t('register.errPhoneTaken'));
            setLoading(false);
            return;
          }
        }
      }
      await sendSms(fullPhone);
      setStep('code');
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      await verifySms(fullPhone, code);
      setStep('details');
    } catch (err: unknown) {
      setOtpError(true);
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username || !password || !firstName || !lastName || !birthDate) {
      setError(t('register.errRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('register.errPasswordLength'));
      return;
    }
    if (birthDate > new Date().toISOString().slice(0, 10)) {
      setError(t('register.errBirthFuture'));
      return;
    }
    const usernameFormatErr = validateUsername(username);
    if (usernameFormatErr) {
      setError(usernameFormatErr);
      return;
    }
    if (usernameStatus === 'taken') {
      setError(t('register.errUsernameTaken'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (usernameStatus !== 'valid') {
        setUsernameStatus('checking');
        try {
          await checkUsername(username);
          setUsernameStatus('valid');
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 409) {
            setUsernameStatus('taken');
            setError(t('register.errUsernameTaken'));
            setLoading(false);
            return;
          }
        }
      }
      await register({ phone: fullPhone, username, password, firstName, lastName, birthDate });
      navigate('/login');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) setStep('phone');
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const phoneError = phoneStatus === 'taken' ? t('register.errPhoneTaken') : undefined;

  const usernameFormatError = username.length > 0 ? validateUsername(username) : undefined;
  const usernameError = usernameFormatError ?? (usernameStatus === 'taken' ? t('register.errUsernameTaken') : undefined);

  const phoneSuffix =
    phoneStatus === 'checking' ? <span className={styles.inlineSpinner} /> :
    phoneStatus === 'valid' ? <span className={styles.inlineCheck}>✓</span> :
    null;

  const usernameSuffix = usernameFormatError ? null :
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

          <h1 className={styles.titleDark}>{t('register.title')}</h1>

          {error && <div className={styles.errorBox}>{error}</div>}

          {step === 'phone' && (
            <div className={styles.fields}>
              <Input
                label={t('register.phone')}
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
                {t('register.sendCode')}
              </Button>
              <Link to="/login" className={styles.switchLink}>{t('register.alreadyHaveAccount')}</Link>
              <p className={styles.legalDark}>{t('register.legal')}</p>
            </div>
          )}

          {step === 'code' && (
            <div className={styles.fields}>
              <p className={styles.smsSent}>{t('register.smsSent', { phone })}</p>
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
                {t('register.resendCode')}
              </button>
            </div>
          )}

          {step === 'details' && (
            <div className={styles.fields}>
              <Input
                label={t('auth.username')}
                type="text"
                placeholder={t('register.usernamePlaceholder')}
                value={username}
                onChange={handleUsernameChange}
                autoComplete="username"
                maxLength={20}
                suffix={usernameSuffix}
                error={usernameError}
              />
              <Input
                label={t('auth.password')}
                type="password"
                placeholder={t('register.passwordPlaceholder')}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="new-password"
              />
              <Input
                label={t('personalInfo.firstName')}
                type="text"
                placeholder={t('register.firstNamePlaceholder')}
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setError(''); }}
              />
              <Input
                label={t('personalInfo.lastName')}
                type="text"
                placeholder={t('register.lastNamePlaceholder')}
                value={lastName}
                onChange={e => { setLastName(e.target.value); setError(''); }}
              />
              <Input
                label={t('register.birthDate')}
                type="date"
                value={birthDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => { setBirthDate(e.target.value); setError(''); }}
              />
              <Button
                fullWidth size="lg"
                onClick={handleRegister}
                loading={loading}
                disabled={usernameStatus === 'taken' || loading}
              >
                {t('register.complete')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
