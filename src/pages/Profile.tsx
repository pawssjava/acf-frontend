import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserById, updateUser, uploadUserPhoto } from '../api/users';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ImageUpload from '../components/ui/ImageUpload';
import Toast from '../components/ui/Toast';
import styles from './Profile.module.css';

export default function Profile() {
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', birthDate: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!authUser) return;
    getUserById(authUser.id)
      .then(r => {
        setUser(r.data);
        setForm({ firstName: r.data.firstName, lastName: r.data.lastName, birthDate: r.data.birthDate });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authUser, isAuthenticated, navigate]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handlePhotoUpload = async (file: File) => {
    if (!authUser) return;
    try {
      const { data } = await uploadUserPhoto(authUser.id, file);
      setUser(data);
    } catch {
      setToast({ message: 'Не удалось загрузить фото. Попробуйте снова.', type: 'error' });
    }
  };

  const handleSave = async () => {
    if (!authUser) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const updated = await updateUser(authUser.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        birthDate: form.birthDate,
      });
      setUser(updated.data);
      setSaveMsg('Данные сохранены');
      setEditing(false);
    } catch {
      setSaveMsg('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Загружаем...</div>;
  if (!user) return <div className={styles.loading}>Профиль не найден</div>;

  return (
    <div className={styles.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrap}>
            <ImageUpload
              currentUrl={user.photo}
              onUpload={handlePhotoUpload}
              shape="circle"
              initials={`${user.firstName[0]}${user.lastName[0]}`}
            />
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{user.firstName} {user.lastName}</h1>
            <p className={styles.username}>@{user.username}</p>
            {user.isAdmin && <span className={styles.adminBadge}>Администратор</span>}
          </div>
          <div className={styles.profileActions}>
            <Button variant="outline" onClick={() => setEditing(e => !e)}>
              {editing ? 'Отмена' : 'Редактировать'}
            </Button>
            <Button variant="danger" onClick={() => logout().then(() => navigate('/'))}>
              Выйти
            </Button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.card}>
            <h2>Личные данные</h2>

            {editing ? (
              <div className={styles.editForm}>
                <div className={styles.row}>
                  <Input label="Имя" value={form.firstName} onChange={set('firstName')} />
                  <Input label="Фамилия" value={form.lastName} onChange={set('lastName')} />
                </div>
                <Input label="Дата рождения" type="date" value={form.birthDate} onChange={set('birthDate')} />
                <div className={styles.editActions}>
                  <Button onClick={handleSave} loading={saving}>Сохранить</Button>
                  {saveMsg && (
                    <span className={saveMsg.includes('Ошибка') ? styles.errorMsg : styles.successMsg}>
                      {saveMsg}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.infoList}>
                <InfoItem label="Имя" value={`${user.firstName} ${user.lastName}`} />
                <InfoItem label="Имя пользователя" value={`@${user.username}`} />
                <InfoItem label="Телефон" value={`+${user.phoneNumber}`} />
                <InfoItem label="Дата рождения" value={new Date(user.birthDate + 'T00:00:00').toLocaleDateString('ru-RU')} />
                <InfoItem label="Дата регистрации" value={new Date(user.createdDate).toLocaleDateString('ru-RU')} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}
