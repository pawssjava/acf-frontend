import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createNews, getNewsById, updateNews, uploadNewsImage } from '../../api/news';
import type { News } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/apiError';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ImageUpload from '../../components/ui/ImageUpload';
import Toast from '../../components/ui/Toast';
import styles from './Admin.module.css';

export default function NewsForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isEdit = Boolean(id);

  const [news, setNews] = useState<News | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) { navigate('/'); return; }
    if (!isEdit || !id) return;
    getNewsById(Number(id))
      .then(r => {
        setNews(r.data);
        setTitle(r.data.title);
        setDescription(r.data.description);
        setImageUrl(r.data.image);
      })
      .catch(() => navigate('/news'));
  }, [id, isAuthenticated, isEdit, navigate, user]);

  const handleImageUpload = async (file: File) => {
    if (isEdit && news) {
      try {
        const { data } = await uploadNewsImage(news.id, file);
        setNews(data);
        setImageUrl(data.image);
      } catch (err: unknown) {
        setToast({ message: getApiError(err), type: 'error' });
        throw new Error('upload failed');
      }
    } else {
      // Create mode: store file + show local preview (no re-upload on every pick)
      setPendingFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setToast({ message: 'Введите заголовок статьи', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      let saved: News;
      if (isEdit && id) {
        const { data } = await updateNews(Number(id), { title, description });
        saved = data;
      } else {
        const { data } = await createNews({ title, description });
        saved = data;
        if (pendingFile) {
          const { data: withImg } = await uploadNewsImage(saved.id, pendingFile);
          saved = withImg;
        }
      }
      setToast({ message: isEdit ? 'Статья сохранена' : 'Статья опубликована', type: 'success' });
      setTimeout(() => navigate(`/news/${saved.id}`), 1000);
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
        <h1 className={styles.pageTitle}>{isEdit ? 'Редактировать статью' : 'Новая статья'}</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.card}>
            <h2>Изображение</h2>
            <ImageUpload
              currentUrl={imageUrl}
              onUpload={handleImageUpload}
              label="Загрузить изображение"
            />
          </div>

          <div className={styles.card}>
            <h2>Содержание</h2>
            <div className={styles.fields}>
              <Input
                label="Заголовок"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Название статьи"
              />
              <div className={styles.field}>
                <label className={styles.label}>Текст статьи</label>
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Введите текст статьи..."
                  rows={12}
                />
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Сохранить' : 'Опубликовать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
