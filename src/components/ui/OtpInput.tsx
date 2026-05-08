import { useRef, useState } from 'react';
import styles from './OtpInput.module.css';

interface Props {
  onComplete: (code: string) => void;
  error?: boolean;
  onErrorReset?: () => void;
  disabled?: boolean;
}

export default function OtpInput({ onComplete, error, onErrorReset, disabled }: Props) {
  const [cells, setCells] = useState(['', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const submit = (digits: string[]) => {
    const code = digits.join('');
    if (code.length === 4) onComplete(code);
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      const next = [...cells];
      next[i] = '';
      setCells(next);
      return;
    }
    const digit = raw.slice(-1);
    const next = [...cells];
    next[i] = digit;
    setCells(next);
    if (i < 3) {
      refs.current[i + 1]?.focus();
    } else {
      refs.current[i]?.blur();
      submit(next);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !cells[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!digits) return;
    const next = ['', '', '', ''].map((_, i) => digits[i] ?? '');
    setCells(next);
    if (digits.length >= 4) {
      refs.current[3]?.blur();
      submit(next);
    } else {
      refs.current[digits.length]?.focus();
    }
  };

  const handleAnimationEnd = () => {
    if (error) {
      setCells(['', '', '', '']);
      refs.current[0]?.focus();
      onErrorReset?.();
    }
  };

  return (
    <div
      className={[styles.cells, error ? styles.shake : ''].join(' ')}
      onAnimationEnd={handleAnimationEnd}
    >
      {cells.map((val, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={val}
          className={[styles.cell, val ? styles.filled : ''].join(' ')}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          disabled={disabled}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
