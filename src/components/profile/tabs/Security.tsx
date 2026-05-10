import { useState } from 'react';
import { changePassword } from '../../../api/users';
import type { User } from '../../../types';
import Button from '../../ui/Button';
import styles from './Security.module.css';

interface Props { user: User; }

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputWrap}>
        <input
          className={styles.input}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••••••"
        />
        <button type="button" className={styles.eyeBtn} onClick={() => setShow(s => !s)}>
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Security({ user }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSubmit = async () => {
    setMsg(null);
    if (next !== confirm) {
      setMsg({ text: 'Новый пароль и подтверждение не совпадают', ok: false });
      return;
    }
    if (next.length < 6) {
      setMsg({ text: 'Новый пароль должен быть не менее 6 символов', ok: false });
      return;
    }
    setSaving(true);
    try {
      await changePassword(user.id, { currentPassword: current, newPassword: next });
      setMsg({ text: 'Пароль успешно изменен', ok: true });
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const serverMsg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 401) {
        setMsg({ text: serverMsg || 'Текущий пароль неверен', ok: false });
      } else {
        setMsg({ text: 'Ошибка при изменении пароля', ok: false });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Изменить пароль</h2>

      <div className={styles.form}>
        <PasswordField label="Пароль" value={current} onChange={setCurrent} />
        <PasswordField label="Новый пароль" value={next} onChange={setNext} />
        <PasswordField label="Подтвердите новый пароль" value={confirm} onChange={setConfirm} />
      </div>

      {msg && <p className={msg.ok ? styles.ok : styles.err}>{msg.text}</p>}

      <Button fullWidth onClick={handleSubmit} loading={saving}>
        Изменить пароль
      </Button>
    </div>
  );
}
