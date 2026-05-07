import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({ children, className, onClick, hoverable }: Props) {
  return (
    <div
      className={[styles.card, hoverable ? styles.hoverable : '', className ?? ''].join(' ')}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </div>
  );
}
