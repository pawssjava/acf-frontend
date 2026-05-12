import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  getEducationList,
  createEducation,
  updateEducation,
  deleteEducation,
  uploadEducationVideo,
  uploadEducationThumbnail,
  uploadEducationPresentation,
} from '../api/education';
import type { EducationMaterialDto, EducationPage } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast from '../components/ui/Toast';
import styles from './Education.module.css';

const PAGE_SIZE = 12;

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const set = new Set([
    0, total - 1,
    current - 2, current - 1, current, current + 1, current + 2,
  ]);
  const sorted = [...set].filter(n => n >= 0 && n < total).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && (sorted[i] as number) - (sorted[i - 1] as number) > 1) result.push('…');
    result.push(sorted[i]);
  }
  return result;
}

function downloadPresentation(url: string) {
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      a.download = url.split('/').pop()?.split('?')[0] ?? 'presentation';
      a.click();
      URL.revokeObjectURL(blobUrl);
    })
    .catch(() => {
      // CORS not available — fall back to navigation which will let the browser handle it
      window.open(url, '_blank', 'noopener,noreferrer');
    });
}

interface FormState {
  title: string;
  description: string;
  category: string;
  ordering: string;
}

export default function EducationPage() {
  const { user, token } = useAuth();
  const { t } = useTranslation();

  const [data, setData] = useState<EducationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [videoModal, setVideoModal] = useState<EducationMaterialDto | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<EducationMaterialDto | null>(null);
  const [savedMaterial, setSavedMaterial] = useState<EducationMaterialDto | null>(null);
  const [form, setForm] = useState<FormState>({ title: '', description: '', category: '', ordering: '0' });
  const [saving, setSaving] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [uploadingField, setUploadingField] = useState<'video' | 'thumbnail' | 'presentation' | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchData = (p: number, cat: string | null) => {
    setLoading(true);
    const params: { page: number; size: number; category?: string } = { page: p, size: PAGE_SIZE };
    if (cat) params.category = cat;
    getEducationList(params)
      .then(r => {
        setData(r.data);
        if (!cat) {
          setAllCategories(prev => {
            const cats = r.data.content
              .map(m => m.category)
              .filter((c): c is string => !!c);
            return [...new Set([...prev, ...cats])];
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(page, selectedCategory);
  }, [page, selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterSelect = (cat: string | null) => {
    setSelectedCategory(cat);
    setPage(0);
    setFilterOpen(false);
  };

  const closeVideo = () => {
    videoRef.current?.pause();
    setVideoModal(null);
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteEducation(deleteId);
      setDeleteId(null);
      setToast({ msg: t('education.deleteSuccess'), ok: true });
      fetchData(page, selectedCategory);
    } catch {
      setToast({ msg: t('education.deleteError'), ok: false });
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditMaterial(null);
    setSavedMaterial(null);
    setForm({ title: '', description: '', category: '', ordering: '0' });
    setAdminError(null);
    setVideoProgress(null);
    setUploadingField(null);
    setAdminOpen(true);
  };

  const openEdit = (m: EducationMaterialDto) => {
    setEditMaterial(m);
    setSavedMaterial(m);
    setForm({ title: m.title, description: m.description, category: m.category ?? '', ordering: String(m.ordering) });
    setAdminError(null);
    setVideoProgress(null);
    setUploadingField(null);
    setAdminOpen(true);
  };

  const closeAdmin = () => {
    setAdminOpen(false);
    setEditMaterial(null);
    setSavedMaterial(null);
    setAdminError(null);
    setVideoProgress(null);
    setUploadingField(null);
    fetchData(page, selectedCategory);
  };

  const handleAdminSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAdminError(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || null,
      ordering: parseInt(form.ordering, 10) || 0,
    };
    try {
      if (editMaterial) {
        const { data: updated } = await updateEducation(editMaterial.id, payload);
        setSavedMaterial(updated);
        setEditMaterial(updated);
      } else {
        const { data: created } = await createEducation(payload);
        setSavedMaterial(created);
      }
    } catch {
      setAdminError(t('education.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!savedMaterial || !token) return;
    setUploadingField('video');
    setVideoProgress(0);
    try {
      const updated = await uploadEducationVideo(savedMaterial.id, file, token, setVideoProgress);
      setSavedMaterial(updated);
      if (editMaterial) setEditMaterial(updated);
    } catch {
      setAdminError(t('education.uploadError'));
    } finally {
      setUploadingField(null);
      setVideoProgress(null);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    if (!savedMaterial) return;
    setUploadingField('thumbnail');
    try {
      const { data: updated } = await uploadEducationThumbnail(savedMaterial.id, file);
      setSavedMaterial(updated);
      if (editMaterial) setEditMaterial(updated);
    } catch {
      setAdminError(t('education.uploadError'));
    } finally {
      setUploadingField(null);
    }
  };

  const handlePresentationUpload = async (file: File) => {
    if (!savedMaterial) return;
    setUploadingField('presentation');
    try {
      const { data: updated } = await uploadEducationPresentation(savedMaterial.id, file);
      setSavedMaterial(updated);
      if (editMaterial) setEditMaterial(updated);
    } catch {
      setAdminError(t('education.uploadError'));
    } finally {
      setUploadingField(null);
    }
  };

  const content = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const isAdmin = !!user?.isAdmin;

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t('education.title')}</h1>
          {isAdmin && (
            <Button size="sm" onClick={openCreate}>{t('education.addMaterial')}</Button>
          )}
        </div>

        {/* Filter */}
        <div className={styles.filterRow} ref={filterRef}>
          <button
            className={[styles.filterToggle, filterOpen ? styles.filterToggleOpen : ''].join(' ')}
            onClick={() => setFilterOpen(o => !o)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {t('education.filters')}
            {selectedCategory && <span className={styles.filterBadge}>1</span>}
          </button>

          {filterOpen && (
            <div className={styles.filterPanel}>
              <div className={styles.filterPanelTitle}>{t('education.filters')}</div>
              <div className={styles.filterGroup}>
                <label className={styles.radioItem}>
                  <span>{t('education.allCategories')}</span>
                  <input
                    type="radio"
                    checked={!selectedCategory}
                    onChange={() => handleFilterSelect(null)}
                    readOnly={false}
                  />
                </label>
                {allCategories.map(cat => (
                  <label key={cat} className={styles.radioItem}>
                    <span>{cat}</span>
                    <input
                      type="radio"
                      checked={selectedCategory === cat}
                      onChange={() => handleFilterSelect(cat)}
                      readOnly={false}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main layout */}
        <div className={styles.layout}>

          {/* Main grid */}
          <main className={styles.mainArea}>
            {loading ? (
              <div className={styles.loading}>{t('education.loading')}</div>
            ) : content.length === 0 ? (
              <div className={styles.empty}>{t('education.empty')}</div>
            ) : (
              <div className={styles.grid2}>
                {content.map(m => (
                  <div key={m.id} className={styles.card}>
                    <div
                      className={styles.thumbnail}
                      onClick={() => m.videoUrl ? setVideoModal(m) : undefined}
                      style={{ cursor: m.videoUrl ? 'pointer' : 'default' }}
                    >
                      {m.thumbnailUrl ? (
                        <img src={m.thumbnailUrl} alt={m.title} className={styles.thumbImg} />
                      ) : (
                        <div className={styles.thumbPlaceholder} />
                      )}
                      {m.videoUrl && (
                        <div className={styles.playBtn} aria-label={t('education.playVideo')}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{m.title}</h3>
                      <p className={styles.cardDesc}>{m.description}</p>
                      {m.presentationUrl && (
                        <button
                          className={styles.cardLink}
                          onClick={() => downloadPresentation(m.presentationUrl!)}
                        >
                          {t('education.downloadPresentation')} ›
                        </button>
                      )}
                      {isAdmin && (
                        <div className={styles.adminActions}>
                          <button className={styles.editBtn} onClick={() => openEdit(m)}>
                            {t('education.edit')}
                          </button>
                          <button className={styles.deleteBtn} onClick={() => setDeleteId(m.id)}>
                            {t('education.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {!loading && content.length > 0 && (
              <div className={styles.sideList}>
                {content.map(m => (
                  <div key={m.id} className={styles.sideCard}>
                    <div
                      className={styles.sideThumb}
                      onClick={() => m.videoUrl ? setVideoModal(m) : undefined}
                      style={{ cursor: m.videoUrl ? 'pointer' : 'default' }}
                    >
                      {m.thumbnailUrl ? (
                        <img src={m.thumbnailUrl} alt={m.title} className={styles.sideThumbImg} />
                      ) : (
                        <div className={styles.sideThumbPlaceholder} />
                      )}
                      {m.videoUrl && (
                        <div className={styles.sidePlayBtn} aria-label={t('education.playVideo')}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={styles.sideBody}>
                      <h4 className={styles.sideTitle}>{m.title}</h4>
                      <p className={styles.sideDesc}>{m.description}</p>
                      {m.presentationUrl && (
                        <button
                          className={styles.sideLink}
                          onClick={() => downloadPresentation(m.presentationUrl!)}
                        >
                          {t('education.downloadPresentation')} ›
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className={styles.pagination}>
                {buildPages(page, totalPages).map((item, i) =>
                  item === '…' ? (
                    <span key={`el-${i}`} className={styles.ellipsis}>…</span>
                  ) : (
                    <button
                      key={item}
                      className={[styles.pageBtn, page === item ? styles.pageBtnActive : ''].join(' ')}
                      onClick={() => setPage(item as number)}
                    >
                      {(item as number) + 1}
                    </button>
                  )
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Video player modal */}
      {videoModal && (
        <div className={styles.modalOverlay} onClick={closeVideo}>
          <div className={styles.videoModal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeVideo} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <video
              ref={videoRef}
              src={videoModal.videoUrl!}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={e => e.preventDefault()}
              preload="metadata"
              autoPlay
              className={styles.videoPlayer}
            />
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId != null && (
        <div className={styles.modalOverlay} onClick={() => { if (!deleting) setDeleteId(null); }}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <p className={styles.confirmText}>
              {t('education.deleteConfirm', {
                title: content.find(m => m.id === deleteId)?.title ?? '',
              })}
            </p>
            <div className={styles.confirmActions}>
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                {t('education.cancel')}
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>
                {t('education.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin create/edit modal */}
      {adminOpen && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget && !saving && !uploadingField) closeAdmin(); }}>
          <div className={styles.adminModal}>
            <div className={styles.adminModalHeader}>
              <h2 className={styles.adminModalTitle}>
                {editMaterial ? t('education.editMaterial') : t('education.newMaterial')}
              </h2>
              <button
                className={styles.modalClose}
                onClick={closeAdmin}
                disabled={saving || !!uploadingField}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Metadata form */}
            <form onSubmit={handleAdminSave} className={styles.adminForm}>
              <Input
                label={t('education.titleLabel')}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>{t('education.descriptionLabel')}</label>
                <textarea
                  className={styles.textarea}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                />
              </div>
              <Input
                label={t('education.categoryLabel')}
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder={t('education.categoryPlaceholder')}
              />
              <Input
                label={t('education.orderingLabel')}
                type="number"
                value={form.ordering}
                onChange={e => setForm(f => ({ ...f, ordering: e.target.value }))}
              />
              {adminError && <p className={styles.adminError}>{adminError}</p>}
              <div className={styles.formActions}>
                <Button type="button" variant="outline" onClick={closeAdmin} disabled={saving || !!uploadingField}>
                  {t('education.cancel')}
                </Button>
                <Button type="submit" loading={saving} disabled={!!uploadingField}>
                  {editMaterial && savedMaterial ? t('education.save') : t('education.create')}
                </Button>
              </div>
            </form>

            {/* File uploads — shown after metadata is saved */}
            {savedMaterial && (
              <div className={styles.uploadSection}>
                <div className={styles.uploadDivider} />

                {/* Video */}
                <div className={styles.uploadRow}>
                  <div className={styles.uploadRowTop}>
                    <span className={styles.uploadLabel}>{t('education.uploadVideo')}</span>
                    {savedMaterial.videoUrl && <span className={styles.uploadCheck}>✓</span>}
                  </div>
                  <input
                    type="file"
                    accept="video/mp4"
                    id={`edu-video-${savedMaterial.id}`}
                    className={styles.fileInputHidden}
                    disabled={!!uploadingField}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleVideoUpload(f);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor={`edu-video-${savedMaterial.id}`}
                    className={[styles.uploadBtn, uploadingField === 'video' ? styles.uploadBtnDisabled : ''].join(' ')}
                  >
                    {uploadingField === 'video' ? t('education.uploading') : t('education.chooseFile')}
                  </label>
                  {videoProgress !== null && (
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${videoProgress}%` }} />
                      <span className={styles.progressText}>{videoProgress}%</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail */}
                <div className={styles.uploadRow}>
                  <div className={styles.uploadRowTop}>
                    <span className={styles.uploadLabel}>{t('education.uploadThumbnail')}</span>
                    {savedMaterial.thumbnailUrl && <span className={styles.uploadCheck}>✓</span>}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    id={`edu-thumb-${savedMaterial.id}`}
                    className={styles.fileInputHidden}
                    disabled={!!uploadingField}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleThumbnailUpload(f);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor={`edu-thumb-${savedMaterial.id}`}
                    className={[styles.uploadBtn, uploadingField === 'thumbnail' ? styles.uploadBtnDisabled : ''].join(' ')}
                  >
                    {uploadingField === 'thumbnail' ? t('education.uploading') : t('education.chooseFile')}
                  </label>
                </div>

                {/* Presentation */}
                <div className={styles.uploadRow}>
                  <div className={styles.uploadRowTop}>
                    <span className={styles.uploadLabel}>{t('education.uploadPresentation')}</span>
                    {savedMaterial.presentationUrl && <span className={styles.uploadCheck}>✓</span>}
                  </div>
                  <input
                    type="file"
                    accept=".pptx,.pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf"
                    id={`edu-pres-${savedMaterial.id}`}
                    className={styles.fileInputHidden}
                    disabled={!!uploadingField}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handlePresentationUpload(f);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor={`edu-pres-${savedMaterial.id}`}
                    className={[styles.uploadBtn, uploadingField === 'presentation' ? styles.uploadBtnDisabled : ''].join(' ')}
                  >
                    {uploadingField === 'presentation' ? t('education.uploading') : t('education.chooseFile')}
                  </label>
                </div>

                <div className={styles.formActions} style={{ marginTop: '8px' }}>
                  <Button onClick={closeAdmin} disabled={!!uploadingField}>
                    {t('education.done')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.ok ? 'success' : 'error'}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
