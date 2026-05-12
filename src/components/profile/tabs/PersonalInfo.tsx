import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCities, getClubs } from '../../../api/dictionary';
import { updateUser } from '../../../api/users';
import { getApiError } from '../../../utils/apiError';
import type { User, City, Club } from '../../../types';
import Button from '../../ui/Button';
import styles from './PersonalInfo.module.css';

interface Props {
  user: User;
  onUpdate: (u: User) => void;
}

export default function PersonalInfo({ user, onUpdate }: Props) {
  const { t, i18n } = useTranslation();
  const localName = (ru: string, kk: string, en: string) =>
    i18n.language === 'kk' ? (kk || ru) : i18n.language === 'en' ? (en || ru) : ru;
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
    getCities().then(r => setCities(r.data.content)).catch(() => {});
    getClubs().then(r => setClubs(r.data.content)).catch(() => {});
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
      setMsg({ text: t('personalInfo.saved'), ok: true });
    } catch (err: unknown) {
      setMsg({ text: getApiError(err), ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{t('personalInfo.title')}</h2>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>{t('personalInfo.firstName')}</label>
          <input className={styles.input} value={form.firstName} onChange={set('firstName')} placeholder={t('personalInfo.firstName')} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('personalInfo.phone')}</label>
          <input className={styles.input} value={`+${user.phoneNumber}`} readOnly disabled />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('personalInfo.lastName')}</label>
          <input className={styles.input} value={form.lastName} onChange={set('lastName')} placeholder={t('personalInfo.lastName')} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('personalInfo.city')}</label>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={form.cityId ?? ''}
              onChange={e => setForm(f => ({ ...f, cityId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">{t('personalInfo.notSpecified')}</option>
              {cities.map(c => <option key={c.id} value={c.id}>{localName(c.nameRu, c.nameKk, c.nameEn)}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('personalInfo.username')}</label>
          <input className={styles.input} value={user.username} readOnly disabled />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('personalInfo.club')}</label>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={form.clubId ?? ''}
              onChange={e => setForm(f => ({ ...f, clubId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">{t('personalInfo.notSpecified')}</option>
              {clubs.map(c => <option key={c.id} value={c.id}>{localName(c.nameRu, c.nameKk, c.nameEn)}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {msg && <span className={msg.ok ? styles.ok : styles.err}>{msg.text}</span>}
        <Button variant="outline" onClick={handleCancel} disabled={saving}>{t('personalInfo.cancel')}</Button>
        <Button onClick={handleSave} loading={saving}>{t('personalInfo.save')}</Button>
      </div>
    </div>
  );
}
