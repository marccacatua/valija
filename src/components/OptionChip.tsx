import styles from './OptionChip.module.css';

interface OptionChipProps {
  label: string;
  selected: boolean;
  locked?: boolean;
  onSelect: () => void;
}

export function OptionChip({ label, selected, locked, onSelect }: OptionChipProps) {
  const classes = [styles.chip, selected ? styles.selected : '', locked ? styles.locked : ''].filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} onClick={onSelect} aria-pressed={selected}>
      {label}
      {locked ? ' 🔒' : ''}
    </button>
  );
}
