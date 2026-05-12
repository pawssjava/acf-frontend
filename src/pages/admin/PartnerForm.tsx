import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPartner, getPartnerById, updatePartner, uploadPartnerLogo } from '../../api/partners';
import type { Partner } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/apiError';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ImageUpload from '../../components/ui/ImageUpload';
import Toast from '../../components/ui/Toast';
import styles from './Admin.module.css';

export default function PartnerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isEdit = Boolean(id);

  const [partner, setPartner] = useState<Partner | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hyperlink, setHyperlink] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) { navigate('/'); return; }
    if (!isEdit || !id) return;
    getPartnerById(Number(id))
      .then(r => {
        setPartner(r.data);
        setName(r.data.name);
        setDescription(r.data.description);
        setHyperlink(r.data.hyperlink);
        setLogoUrl(r.data.logo);
      })
      .catch(() => navigate('/partners'));
  }, [id, isAuthenticated, isEdit, navigate, user]);

  const handleLogoUpload = async (file: File) => {
    if (isEdit && partner) {
      try {
        const { data } = await uploadPartnerLogo(partner.id, file);
        setPartner(data);
        setLogoUrl(data.logo);
      } catch (err: unknown) {
        setToast({ message: getApiError(err), type: 'error' });
        throw new Error('upload failed');
      }
    } else {
      setPendingFile(file);
      setLogoUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ message: 'Введите название партнёра', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      let saved: Partner;
      if (isEdit && id) {
        const { data } = await updatePartner(Number(id), { name, description, hyperlink });
        saved = data;
      } else {
        const { data } = await createPartner({ name, description, hyperlink });
        saved = data;
        if (pendingFile) {
          const { data: withLogo } = await uploadPartnerLogo(saved.id, pendingFile);
          saved = withLogo;
        }
      }
      setToast({ message: isEdit ? 'Партнёр сохранён' : 'Партнёр добавлен', type: 'success' });
      setTimeout(() => navigate(`/partners/${saved.id}`), 1000);
    } catch (err: unknown) {
      setToast({ message: getApiError(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={styles.container}>
        <h1 className={styles.pageTitle}>{isEdit ? 'Редактировать партнёра' : 'Новый партнёр'}</h1>

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
            <h2>Информация</h2>
            <div className={styles.fields}>
              <Input
                label="Название"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Название партнёра"
              />
              <Input
                label="Ссылка на сайт"
                value={hyperlink}
                onChange={e => setHyperlink(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
              <div className={styles.field}>
                <label className={styles.label}>Описание</label>
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Описание партнёра..."
                  rows={6}
                />
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
