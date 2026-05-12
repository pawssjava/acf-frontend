import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/apiError';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import {
  adminGetCities, adminCreateCity, adminUpdateCity, adminDeleteCity,
  adminGetClubs, adminCreateClub, adminUpdateClub, adminDeleteClub,
  adminGetStatuses, adminCreateStatus, adminUpdateStatus, adminDeleteStatus,
  adminGetTypes, adminCreateType, adminUpdateType, adminDeleteType,
} from '../../api/dictionary';
import type { CityRecord, ClubRecord, DictionaryItem, DictPage } from '../../types';
import styles from './DictionariesPage.module.css';

type TabKey = 'cities' | 'clubs' | 'statuses' | 'types';
type AnyRecord = CityRecord | ClubRecord | DictionaryItem;

interface ModalState {
  tab: TabKey;
  mode: 'create' | 'edit';
  item: AnyRecord | null;
}

interface ConfirmState {
  tab: TabKey;
  id: number;
  name: string;
}

function MultilingualForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: AnyRecord | null;
  onSave: (data: { nameRu: string; nameKk: string; nameEn: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const [nameRu, setNameRu] = useState(initial?.nameRu ?? '');
  const [nameKk, setNameKk] = useState(initial?.nameKk ?? '');
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameRu.trim()) { setError(t('dictionaries.required')); return; }
    onSave({ nameRu: nameRu.trim(), nameKk: nameKk.trim(), nameEn: nameEn.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.modalForm}>
      <div className={styles.field}>
        <label className={styles.label}>{t('dictionaries.nameRu')} *</label>
        <input
          className={[styles.input, error ? styles.inputError : ''].join(' ')}
          value={nameRu}
          onChange={e => { setNameRu(e.target.value); setError(''); }}
          autoFocus
        />
        {error && <span className={styles.fieldError}>{error}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label}>{t('dictionaries.nameKk')}</label>
        <input className={styles.input} value={nameKk} onChange={e => setNameKk(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>{t('dictionaries.nameEn')}</label>
        <input className={styles.input} value={nameEn} onChange={e => setNameEn(e.target.value)} />
      </div>
      <div className={styles.modalActions}>
        <Button variant="outline" type="button" size="sm" onClick={onCancel} disabled={saving}>
          {t('dictionaries.cancel')}
        </Button>
        <Button variant="primary" type="submit" size="sm" loading={saving}>
          {t('dictionaries.save')}
        </Button>
      </div>
    </form>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function DictionariesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) navigate('/');
  }, [isAuthenticated, user, navigate]);

  const [activeTab, setActiveTab] = useState<TabKey>('cities');
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [pageData, setPageData] = useState<DictPage<AnyRecord> | null>(null);

  const [tabLoading, setTabLoading] = useState(false);
  const [tabErrorCode, setTabErrorCode] = useState<'forbidden' | 'error' | null>(null);

  const [modal, setModal] = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) return;

    let cancelled = false;
    setTabLoading(true);
    setTabErrorCode(null);

    const fetchers: Record<TabKey, (p: number) => Promise<{ data: DictPage<AnyRecord> }>> = {
      cities: (p) => adminGetCities(p) as Promise<{ data: DictPage<AnyRecord> }>,
      clubs: (p) => adminGetClubs(p) as Promise<{ data: DictPage<AnyRecord> }>,
      statuses: (p) => adminGetStatuses(p) as Promise<{ data: DictPage<AnyRecord> }>,
      types: (p) => adminGetTypes(p) as Promise<{ data: DictPage<AnyRecord> }>,
    };

    fetchers[activeTab](page).then(({ data }) => {
      if (cancelled) return;
      setPageData(data);
    }).catch((err: unknown) => {
      if (cancelled) return;
      const status = (err as { response?: { status?: number } })?.response?.status;
      setTabErrorCode(status === 403 ? 'forbidden' : 'error');
    }).finally(() => {
      if (!cancelled) setTabLoading(false);
    });

    return () => { cancelled = true; };
  }, [activeTab, page, isAuthenticated, user?.isAdmin, refreshKey]);

  useEffect(() => {
    setModal(null);
    setConfirm(null);
    setPage(0);
    setPageData(null);
  }, [activeTab]);

  const handleSave = async (data: { nameRu: string; nameKk: string; nameEn: string }) => {
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.tab === 'cities') {
        if (modal.mode === 'create') await adminCreateCity(data);
        else await adminUpdateCity(modal.item!.id, data);
      } else if (modal.tab === 'clubs') {
        if (modal.mode === 'create') await adminCreateClub(data);
        else await adminUpdateClub(modal.item!.id, data);
      } else if (modal.tab === 'statuses') {
        if (modal.mode === 'create') await adminCreateStatus(data);
        else await adminUpdateStatus(modal.item!.id, data);
      } else {
        if (modal.mode === 'create') await adminCreateType(data);
        else await adminUpdateType(modal.item!.id, data);
      }
      setToast({
        message: modal.mode === 'create' ? t('dictionaries.createSuccess') : t('dictionaries.updateSuccess'),
        type: 'success',
      });
      setModal(null);
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) setToast({ message: t('dictionaries.forbidden'), type: 'error' });
      else if (status === 404) setToast({ message: t('dictionaries.notFound'), type: 'error' });
      else setToast({ message: getApiError(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.tab === 'cities') await adminDeleteCity(confirm.id);
      else if (confirm.tab === 'clubs') await adminDeleteClub(confirm.id);
      else if (confirm.tab === 'statuses') await adminDeleteStatus(confirm.id);
      else await adminDeleteType(confirm.id);
      setToast({ message: t('dictionaries.deleteSuccess'), type: 'success' });
      setConfirm(null);
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) setToast({ message: t('dictionaries.forbidden'), type: 'error' });
      else if (status === 404) setToast({ message: t('dictionaries.notFound'), type: 'error' });
      else setToast({ message: getApiError(err), type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'cities', label: t('dictionaries.tabCities') },
    { key: 'clubs', label: t('dictionaries.tabClubs') },
    { key: 'statuses', label: t('dictionaries.tabStatuses') },
    { key: 'types', label: t('dictionaries.tabTypes') },
  ];

  const renderTabContent = () => {
    if (tabLoading) {
      return (
        <div className={styles.skeleton}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      );
    }
    if (tabErrorCode) {
      return (
        <div className={styles.stateBox}>
          <p>{tabErrorCode === 'forbidden' ? t('dictionaries.forbidden') : t('dictionaries.loadError')}</p>
          {tabErrorCode !== 'forbidden' && (
            <button className={styles.retryBtn} onClick={() => setRefreshKey(k => k + 1)}>
              Retry
            </button>
          )}
        </div>
      );
    }

    const items = pageData?.content ?? [];
    const totalPages = pageData?.totalPages ?? 0;

    if (items.length === 0) return <div className={styles.empty}>{t('dictionaries.empty')}</div>;

    return (
      <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thId}>ID</th>
              <th>{t('dictionaries.colNameRu')}</th>
              <th className={styles.thHideMobile}>{t('dictionaries.colNameKk')}</th>
              <th className={styles.thHideMobile}>{t('dictionaries.colNameEn')}</th>
              <th>{t('dictionaries.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className={styles.tdId}>{item.id}</td>
                <td>{item.nameRu}</td>
                <td className={styles.thHideMobile}>{item.nameKk}</td>
                <td className={styles.thHideMobile}>{item.nameEn}</td>
                <td>
                  <div className={styles.rowActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setModal({ tab: activeTab, mode: 'edit', item })}
                      title="Edit"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className={[styles.actionBtn, styles.actionBtnDanger].join(' ')}
                      onClick={() => setConfirm({ tab: activeTab, id: item.id, name: item.nameRu })}
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            ← {t('dictionaries.prev')}
          </button>
          <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            {t('dictionaries.next')} →
          </button>
        </div>
      )}
      </>
    );
  };

  return (
    <div className={styles.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={styles.container}>
        <h1 className={styles.pageTitle}>{t('dictionaries.title')}</h1>

        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={[styles.tab, activeTab === tab.key ? styles.tabActive : ''].join(' ')}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.tabPanel}>
          <div className={styles.tabHeader}>
            <h2 className={styles.tabTitle}>{TABS.find(t => t.key === activeTab)?.label}</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModal({ tab: activeTab, mode: 'create', item: null })}
              disabled={tabLoading}
            >
              + {t('dictionaries.addBtn')}
            </Button>
          </div>
          {renderTabContent()}
        </div>
      </div>

      {modal && (
        <div
          className={styles.overlay}
          onClick={() => { if (!saving) setModal(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {modal.mode === 'create' ? t('dictionaries.addTitle') : t('dictionaries.editTitle')}
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => { if (!saving) setModal(null); }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <MultilingualForm
              initial={modal.item}
              onSave={handleSave}
              onCancel={() => setModal(null)}
              saving={saving}
            />
          </div>
        </div>
      )}

      {confirm && (
        <div
          className={styles.overlay}
          onClick={() => { if (!deleting) setConfirm(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.confirmDialog} onClick={e => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>{t('dictionaries.deleteConfirm')}</h3>
            <p className={styles.confirmName}>{confirm.name}</p>
            <p className={styles.confirmSub}>{t('dictionaries.deleteConfirmSub')}</p>
            <div className={styles.confirmActions}>
              <Button variant="outline" size="sm" onClick={() => setConfirm(null)} disabled={deleting}>
                {t('dictionaries.cancel')}
              </Button>
              <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteConfirm}>
                {t('dictionaries.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
