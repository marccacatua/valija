import type { ReactNode } from 'react';
import styles from './OptionCard.module.css';

interface OptionCardProps {
  label: string;
  icon: ReactNode;
  selected: boolean;
  locked?: boolean;
  compact?: boolean;
  onSelect: () => void;
}

export function OptionCard({ label, icon, selected, locked, compact, onSelect }: OptionCardProps) {
  const classes = [styles.card, selected ? styles.selected : '', compact ? styles.compact : '', locked ? styles.locked : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} onClick={onSelect} aria-pressed={selected}>
      {icon}
      {label}
      {locked ? ' 🔒' : ''}
    </button>
  );
}
