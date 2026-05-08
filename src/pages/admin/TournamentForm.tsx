import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTournament, getTournamentById, updateTournament, uploadTournamentLogo } from '../../api/tournaments';
import { getTournamentTypes } from '../../api/dictionary';
import type { Tournament, DictionaryItem, TournamentFormat } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ImageUpload from '../../components/ui/ImageUpload';
import Toast from '../../components/ui/Toast';
import styles from './Admin.module.css';

interface FormState {
  name: string;
  startDate: string;
  endDate: string;
  format: TournamentFormat | '';
  totalRounds: string;
  capacity: string;
  prizeMoney: string;
  tournamentTypeId: string;
}

const EKPL_TYPE_ID = '5';

export default function TournamentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isEdit = Boolean(id);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [types, setTypes] = useState<DictionaryItem[]>([]);
  const [form, setForm] = useState<FormState>({
    name: '', startDate: '', endDate: '', format: '', totalRounds: '',
    capacity: '', prizeMoney: '', tournamentTypeId: '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) { navigate('/'); return; }

    getTournamentTypes()
      .then(t => {
        setTypes(t.data);
        if (!isEdit) {
          setForm(f => ({ ...f, tournamentTypeId: String(t.data[0]?.id ?? '') }));
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
          endDate: t.endDate,
          format: t.format,
          totalRounds: t.totalRounds != null ? String(t.totalRounds) : '',
          capacity: String(t.capacity),
          prizeMoney: String(t.prizeMoney),
          tournamentTypeId: String(t.tournamentTypeId),
        });
      })
      .catch(() => navigate('/tournaments'));
  }, [id, isAuthenticated, isEdit, navigate, user]);

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = e.target.value as TournamentFormat | '';
    setForm(f => {
      const updates: Partial<FormState> = { format: newFormat };
      if (newFormat === 'EKPL') {
        updates.tournamentTypeId = EKPL_TYPE_ID;
      } else if (f.tournamentTypeId === EKPL_TYPE_ID) {
        updates.tournamentTypeId = '';
      }
      if (newFormat !== 'SWISS') {
        updates.totalRounds = '';
      }
      return { ...f, ...updates };
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTypeId = e.target.value;
    setForm(f => {
      const updates: Partial<FormState> = { tournamentTypeId: newTypeId };
      if (newTypeId === EKPL_TYPE_ID) {
        updates.format = 'EKPL';
      } else if (f.format === 'EKPL') {
        updates.format = 'SINGLE_ELIMINATION';
      }
      return { ...f, ...updates };
    });
  };

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
    if (!form.name.trim() || !form.startDate || !form.endDate || !form.format || !form.capacity || !form.prizeMoney) {
      setToast({ message: 'Заполните все обязательные поля', type: 'error' });
      return;
    }
    if (form.endDate < form.startDate) {
      setToast({ message: 'Дата окончания не может быть раньше даты начала', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        format: form.format as TournamentFormat,
        ...(form.totalRounds ? { totalRounds: Number(form.totalRounds) } : {}),
        capacity: Number(form.capacity),
        prizeMoney: Number(form.prizeMoney),
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

  const formatLocked = isEdit && tournament?.phase !== null;

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
                  label="Дата окончания"
                  type="date"
                  value={form.endDate}
                  onChange={set('endDate')}
                  min={form.startDate || undefined}
                />
              </div>
              <div className={styles.row}>
                <Input
                  label="Вместимость"
                  type="number"
                  min="2"
                  value={form.capacity}
                  onChange={set('capacity')}
                  placeholder="16"
                />
                <Input
                  label="Призовой фонд (₸)"
                  type="number"
                  min="0"
                  value={form.prizeMoney}
                  onChange={set('prizeMoney')}
                  placeholder="100000"
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Формат {formatLocked && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(нельзя изменить)</span>}</label>
                  <select
                    className={styles.select}
                    value={form.format}
                    onChange={handleFormatChange}
                    disabled={formatLocked}
                  >
                    <option value="">Выберите формат</option>
                    <option value="SINGLE_ELIMINATION">Single Elimination</option>
                    <option value="SWISS">Swiss System</option>
                    <option value="EKPL">eKPL (Electronic Kazakhstan Premier League)</option>
                  </select>
                </div>
                {form.format === 'SWISS' ? (
                  <Input
                    label="Количество раундов"
                    type="number"
                    min="1"
                    value={form.totalRounds}
                    onChange={set('totalRounds')}
                    placeholder="авто"
                  />
                ) : <div />}
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Тип турнира</label>
                  <select
                    className={styles.select}
                    value={form.tournamentTypeId}
                    onChange={handleTypeChange}
                  >
                    {types.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                {isEdit && tournament && (
                  <div className={styles.field}>
                    <label className={styles.label}>Статус</label>
                    <div style={{ padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {tournament.tournamentStatusName}
                    </div>
                  </div>
                )}
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
