import Button from './Button';
import styles from './ConfirmDialog.module.css';

interface Props {
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, confirmLabel, cancelLabel, loading, onConfirm, onCancel }: Props) {
  return (
    <div
      className={styles.overlay}
      onClick={() => { if (!loading) onCancel(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <p className={styles.title}>{title}</p>
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" size="sm" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
