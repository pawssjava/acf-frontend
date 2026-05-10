import { useEffect, useState } from 'react';
import { getCities, getClubs } from '../../../api/dictionary';
import { updateUser } from '../../../api/users';
import type { User, City, Club } from '../../../types';
import Button from '../../ui/Button';
import styles from './PersonalInfo.module.css';

interface Props {
  user: User;
  onUpdate: (u: User) => void;
}

export default function PersonalInfo({ user, onUpdate }: Props) {
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    cityId: user.cityId as number | null,
    clubId: user.clubId as number | null,
  });
  const [cities, setCities] = useState<City[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    getCities().then(r => setCities(r.data)).catch(() => {});
    getClubs().then(r => setClubs(r.data)).catch(() => {});
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleCancel = () => {
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      cityId: user.cityId,
      clubId: user.clubId,
    });
    setMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const { data } = await updateUser(user.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        birthDate: user.birthDate ?? '',
        cityId: form.cityId,
        clubId: form.clubId,
      });
      onUpdate(data);
      setMsg({ text: 'Изменения сохранены', ok: true });
    } catch {
      setMsg({ text: 'Ошибка при сохранении', ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Личная информация</h2>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>Имя</label>
          <input className={styles.input} value={form.firstName} onChange={set('firstName')} placeholder="Имя" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Номер телефона</label>
          <input className={styles.input} value={`+${user.phoneNumber}`} readOnly disabled />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Фамилия</label>
          <input className={styles.input} value={form.lastName} onChange={set('lastName')} placeholder="Фамилия" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Город</label>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={form.cityId ?? ''}
              onChange={e => setForm(f => ({ ...f, cityId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">— Не указан —</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.nameRu}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Никнейм</label>
          <input className={styles.input} value={user.username} readOnly disabled />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Клуб</label>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={form.clubId ?? ''}
              onChange={e => setForm(f => ({ ...f, clubId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">— Не указан —</option>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.nameRu}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {msg && <span className={msg.ok ? styles.ok : styles.err}>{msg.text}</span>}
        <Button variant="outline" onClick={handleCancel} disabled={saving}>Отменить</Button>
        <Button onClick={handleSave} loading={saving}>Сохранить изменения</Button>
      </div>
    </div>
  );
}
