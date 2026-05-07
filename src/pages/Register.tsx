import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendSms, register } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import styles from './Auth.module.css';

type Step = 'phone' | 'code' | 'details';

interface FormData {
  phone: string;
  code: string;
  username: string;
  firstName: string;
  lastName: string;
  birthDate: string;
}

const STEPS: Step[] = ['phone', 'code', 'details'];
const STEP_LABELS = ['Телефон', 'Код', 'Данные'];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    phone: '', code: '', username: '', firstName: '', lastName: '', birthDate: '',
  });

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setError('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    let masked = digits.slice(0, 3);
    if (digits.length > 3) masked += ' ' + digits.slice(3, 6);
    if (digits.length > 6) masked += '-' + digits.slice(6, 8);
    if (digits.length > 8) masked += '-' + digits.slice(8, 10);
    setForm(f => ({ ...f, phone: masked }));
    setError('');
  };

  const handleSendSms = async () => {
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Введите полный номер телефона (10 цифр)'); return; }
    setLoading(true);
    try {
      await sendSms(`7${form.phone.replace(/\D/g, '')}`);
      setStep('code');
    } catch {
      setError('Не удалось отправить SMS. Проверьте номер телефона.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const { code, username, firstName, lastName, birthDate } = form;
    if (!code || !username || !firstName || !lastName || !birthDate) {
      setError('Заполните все поля');
      return;
    }
    setLoading(true);
    try {
      await register({
        phone: `7${form.phone.replace(/\D/g, '')}`,
        code,
        username,
        firstName,
        lastName,
        birthDate,
      });
      navigate('/login');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 400 ? 'Неверный SMS-код' : 'Ошибка регистрации. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = STEPS.indexOf(step);

  return (
    <div className={styles.pageCenter}>
      <div className={styles.registerCard}>
        {/* Progress bar */}
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
                value={form.phone}
                onChange={handlePhoneChange}
                inputMode="numeric"
              />
              <Button fullWidth size="lg" onClick={handleSendSms} loading={loading}>
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
              <p className={styles.smsSent}>
                Код отправлен на +7 {form.phone}
              </p>
              <Input
                label="SMS-код"
                type="text"
                placeholder="Введите 4-значный код"
                maxLength={4}
                value={form.code}
                onChange={set('code')}
              />
              <Button fullWidth size="lg" onClick={() => setStep('details')} loading={loading}>
                Подтвердить
              </Button>
              <button className={styles.resendBtn} onClick={handleSendSms}>
                Отправить код повторно
              </button>
            </div>
          )}

          {step === 'details' && (
            <div className={styles.fields}>
              <Input label="Имя пользователя" type="text" placeholder="john_doe" value={form.username} onChange={set('username')} />
              <Input label="Имя" type="text" placeholder="Иван" value={form.firstName} onChange={set('firstName')} />
              <Input label="Фамилия" type="text" placeholder="Иванов" value={form.lastName} onChange={set('lastName')} />
              <Input label="Дата рождения" type="date" value={form.birthDate} onChange={set('birthDate')} />
              <Button fullWidth size="lg" onClick={handleRegister} loading={loading}>
                Завершить регистрацию
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
