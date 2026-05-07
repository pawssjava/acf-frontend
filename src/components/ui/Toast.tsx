import { useEffect } from 'react';
import styles from './Toast.module.css';

interface Props {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: Props) {
  useEffect(() => {
    const id = setTimeout(onClose, 3500);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div className={[styles.toast, styles[type]].join(' ')} role="alert">
      <span className={styles.msg}>{message}</span>
      <button className={styles.close} onClick={onClose} aria-label="Закрыть">×</button>
    </div>
  );
}
