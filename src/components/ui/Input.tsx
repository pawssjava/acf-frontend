import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

export default function Input({ label, error, prefix, className, id, ...rest }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={styles.field}>
      {label && <label className={styles.label} htmlFor={inputId}>{label}</label>}
      <div className={[styles.inputWrap, error ? styles.hasError : ''].join(' ')}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <input id={inputId} className={[styles.input, className ?? ''].join(' ')} {...rest} />
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
