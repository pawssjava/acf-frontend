import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPasswordSendSms, forgotPasswordVerifySms, forgotPasswordReset } from '../api/auth';
import { getApiError } from '../utils/apiError';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import OtpInput from '../components/ui/OtpInput';
import { getPasswordIssue } from '../utils/password';
import styles from './Auth.module.css';

type Step = 'phone' | 'code' | 'reset';
const STEPS: Step[] = ['phone', 'code', 'reset'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState(false);

  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const STEP_LABELS = [t('forgot.stepPhone'), t('forgot.stepCode'), t('forgot.stepPassword')];

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
      setError(t('forgot.errPhoneLength'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await forgotPasswordSendSms(fullPhone);
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
      await forgotPasswordVerifySms(fullPhone, code);
      setStep('reset');
    } catch (err: unknown) {
      setOtpError(true);
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!newPassword) { setError(t('forgot.errNewPassword')); return; }
    if (newPassword !== confirmPassword) { setError(t('forgot.errPasswordsMatch')); return; }
    const passwordIssue = getPasswordIssue(newPassword);
    if (passwordIssue) { setError(t(`validation.${passwordIssue}`)); return; }
    setLoading(true);
    setError('');
    try {
      await forgotPasswordReset(fullPhone, newPassword);
      navigate('/login', { state: { passwordReset: true } });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) setStep('phone');
      setError(getApiError(err));
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

          <h1 className={styles.titleDark}>{t('forgot.title')}</h1>

          {error && <div className={styles.errorBox}>{error}</div>}

          {step === 'phone' && (
            <div className={styles.fields}>
              <Input
                label={t('forgot.phone')}
                prefix="+7"
                type="tel"
                placeholder="747 777-77-77"
                value={phone}
                onChange={handlePhoneChange}
                inputMode="numeric"
              />
              <Button fullWidth size="lg" onClick={handleSendSms} loading={loading}>
                {t('forgot.sendCode')}
              </Button>
              <Link to="/login" className={styles.switchLink}>{t('forgot.backToLogin')}</Link>
            </div>
          )}

          {step === 'code' && (
            <div className={styles.fields}>
              <p className={styles.smsSent}>{t('forgot.smsSent', { phone })}</p>
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
                {t('forgot.resendCode')}
              </button>
            </div>
          )}

          {step === 'reset' && (
            <div className={styles.fields}>
              <PasswordInput
                label={t('forgot.newPassword')}
                placeholder={t('forgot.passwordPlaceholder')}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                autoComplete="new-password"
              />
              <PasswordInput
                label={t('forgot.confirmPassword')}
                placeholder={t('forgot.repeatPassword')}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                autoComplete="new-password"
              />
              <Button fullWidth size="lg" onClick={handleReset} loading={loading}>
                {t('forgot.savePassword')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
