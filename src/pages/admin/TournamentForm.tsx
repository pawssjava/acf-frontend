import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTournament, getTournamentById, updateTournament, uploadTournamentLogo } from '../../api/tournaments';
import { getTournamentTypes, getTournamentStatuses } from '../../api/dictionary';
import type { Tournament, DictionaryItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ImageUpload from '../../components/ui/ImageUpload';
import Toast from '../../components/ui/Toast';
import styles from './Admin.module.css';

interface FormState {
  name: string;
  startDate: string;
  capacity: string;
  prizeMoney: string;
  tournamentStatusId: string;
  tournamentTypeId: string;
}

export default function TournamentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isEdit = Boolean(id);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [types, setTypes] = useState<DictionaryItem[]>([]);
  const [statuses, setStatuses] = useState<DictionaryItem[]>([]);
  const [form, setForm] = useState<FormState>({
    name: '', startDate: '', capacity: '', prizeMoney: '', tournamentStatusId: '', tournamentTypeId: '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) { navigate('/'); return; }

    Promise.all([getTournamentTypes(), getTournamentStatuses()])
      .then(([t, s]) => {
        setTypes(t.data);
        setStatuses(s.data);
        if (!isEdit) {
          setForm(f => ({
            ...f,
            tournamentTypeId: String(t.data[0]?.id ?? ''),
            tournamentStatusId: String(s.data[0]?.id ?? ''),
          }));
        }
      })
      .catch(() => {});

    if (!isEdit || !id) return;
    getTournamentById(Number(id))
      .then(r => {
        const t = r.data;
        setTournament(t);
        setLogoUrl(t.logo);
        setForm({
          name: t.name,
          startDate: t.startDate,
          capacity: String(t.capacity),
          prizeMoney: String(t.prizeMoney),
          tournamentStatusId: String(t.tournamentStatusId),
          tournamentTypeId: String(t.tournamentTypeId),
        });
      })
      .catch(() => navigate('/tournaments'));
  }, [id, isAuthenticated, isEdit, navigate, user]);

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const handleLogoUpload = async (file: File) => {
    if (isEdit && tournament) {
      try {
        const { data } = await uploadTournamentLogo(tournament.id, file);
        setTournament(data);
        setLogoUrl(data.logo);
      } catch {
        setToast({ message: 'Не удалось загрузить логотип', type: 'error' });
        throw new Error('upload failed');
      }
    } else {
      setPendingFile(file);
      setLogoUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.capacity || !form.prizeMoney) {
      setToast({ message: 'Заполните все обязательные поля', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        startDate: form.startDate,
        capacity: Number(form.capacity),
        prizeMoney: Number(form.prizeMoney),
        tournamentStatusId: Number(form.tournamentStatusId),
        tournamentTypeId: Number(form.tournamentTypeId),
      };

      let saved: Tournament;
      if (isEdit && id) {
        const { data } = await updateTournament(Number(id), payload);
        saved = data;
      } else {
        const { data } = await createTournament(payload);
        saved = data;
        if (pendingFile) {
          const { data: withLogo } = await uploadTournamentLogo(saved.id, pendingFile);
          saved = withLogo;
        }
      }

      setToast({ message: isEdit ? 'Турнир сохранён' : 'Турнир создан', type: 'success' });
      setTimeout(() => navigate(`/tournaments/${saved.id}`), 1000);
    } catch {
      setToast({ message: 'Ошибка при сохранении', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={styles.container}>
        <h1 className={styles.pageTitle}>{isEdit ? 'Редактировать турнир' : 'Новый турнир'}</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.card}>
            <h2>Логотип</h2>
            <ImageUpload
              currentUrl={logoUrl}
              onUpload={handleLogoUpload}
              label="Загрузить логотип"
            />
          </div>

          <div className={styles.card}>
            <h2>Информация о турнире</h2>
            <div className={styles.fields}>
              <Input
                label="Название"
                value={form.name}
                onChange={set('name')}
                placeholder="Название турнира"
              />
              <div className={styles.row}>
                <Input
                  label="Дата начала"
                  type="date"
                  value={form.startDate}
                  onChange={set('startDate')}
                />
                <Input
                  label="Вместимость"
                  type="number"
                  min="2"
                  value={form.capacity}
                  onChange={set('capacity')}
                  placeholder="16"
                />
              </div>
              <Input
                label="Призовой фонд (₸)"
                type="number"
                min="0"
                value={form.prizeMoney}
                onChange={set('prizeMoney')}
                placeholder="100000"
              />
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Тип турнира</label>
                  <select
                    className={styles.select}
                    value={form.tournamentTypeId}
                    onChange={set('tournamentTypeId')}
                  >
                    {types.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Статус</label>
                  <select
                    className={styles.select}
                    value={form.tournamentStatusId}
                    onChange={set('tournamentStatusId')}
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Сохранить' : 'Создать турнир'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
