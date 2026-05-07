import { useRef, useState } from 'react';
import styles from './ImageUpload.module.css';

interface Props {
  currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  shape?: 'circle' | 'rect';
  initials?: string;
  label?: string;
  accept?: string;
}

export default function ImageUpload({
  currentUrl,
  onUpload,
  shape = 'rect',
  initials = '',
  label = 'Загрузить изображение',
  accept = 'image/*',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const trigger = () => !uploading && inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      className={[styles.wrap, styles[shape]].join(' ')}
      onClick={trigger}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && trigger()}
      aria-label={label}
    >
      {currentUrl ? (
        <img src={currentUrl} alt="" className={styles.img} />
      ) : shape === 'circle' ? (
        <div className={styles.initialsPlaceholder}>{initials}</div>
      ) : (
        <div className={styles.rectPlaceholder}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 16l5-5 4 4 3-3 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          </svg>
          <span>{label}</span>
        </div>
      )}

      <div className={[styles.overlay, uploading ? styles.overlayActive : ''].join(' ')}>
        {uploading ? (
          <span className={styles.spinner} />
        ) : (
          <span className={styles.overlayLabel}>
            {currentUrl ? 'Изменить' : label}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className={styles.hidden}
        onChange={handleChange}
      />
    </div>
  );
}
