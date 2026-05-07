import styles from './Badge.module.css';

interface Props {
  children: string;
  variant?: 'blue' | 'teal' | 'yellow' | 'red' | 'gray';
}

export default function Badge({ children, variant = 'blue' }: Props) {
  return <span className={[styles.badge, styles[variant]].join(' ')}>{children}</span>;
}
