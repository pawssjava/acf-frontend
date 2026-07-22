import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNewsList, archiveNews, restoreNews, deleteNews } from '../api/news';
import type { News } from '../types';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../utils/apiError';
import NewsCard from '../components/news/NewsCard';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import styles from './ListPage.module.css';

export default function NewsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [archivedView, setArchivedView] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<News | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) setArchivedView(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    getNewsList(archivedView)
      .then(r => setNews(r.data))
      .catch(() => setToast({ message: t('news.loadError'), type: 'error' }))
      .finally(() => setLoading(false));
  }, [archivedView]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleArchive = async (item: News) => {
    try {
      await archiveNews(item.id);
      setNews(prev => prev.filter(x => x.id !== item.id));
      setToast({ message: t('adminActions.archiveSuccess'), type: 'success' });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setToast({ message: status === 403 ? t('adminActions.forbidden') : getApiError(err), type: 'error' });
    }
  };

  const handleRestore = async (item: News) => {
    try {
      await restoreNews(item.id);
      setNews(prev => prev.filter(x => x.id !== item.id));
      setToast({ message: t('adminActions.restoreSuccess'), type: 'success' });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setToast({ message: status === 403 ? t('adminActions.forbidden') : getApiError(err), type: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteNews(confirmDelete.id);
      setNews(prev => prev.filter(x => x.id !== confirmDelete.id));
      setToast({ message: t('adminActions.deleteSuccess'), type: 'success' });
      setConfirmDelete(null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setToast({ message: status === 403 ? t('adminActions.forbidden') : getApiError(err), type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>{t('news.title')}</h1>
          {user?.isAdmin && (
            <Link to="/admin/news/new">
              <Button size="sm">{t('news.newArticle')}</Button>
            </Link>
          )}
        </div>

        {user?.isAdmin && (
          <div className={styles.viewTabs}>
            <button
              className={[styles.viewTab, !archivedView ? styles.viewTabActive : ''].join(' ')}
              onClick={() => setArchivedView(false)}
            >
              {t('adminActions.tabActive')}
            </button>
            <button
              className={[styles.viewTab, archivedView ? styles.viewTabActive : ''].join(' ')}
              onClick={() => setArchivedView(true)}
            >
              {t('adminActions.tabArchive')}
            </button>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>{t('news.loading')}</div>
        ) : news.length === 0 ? (
          <div className={styles.empty}>{t('news.empty')}</div>
        ) : (
          <div className={styles.grid3}>
            {news.map(n => (
              <NewsCard
                key={n.id}
                news={n}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onDeleteRequest={setConfirmDelete}
              />
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={t('adminActions.deleteConfirmTitle')}
          confirmLabel={t('adminActions.delete')}
          cancelLabel={t('adminActions.cancel')}
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
