import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'inverted' | 'teal' | 'ghost';
  children: ReactNode;
}

export function Button({ variant = 'primary', className, disabled, children, ...rest }: ButtonProps) {
  const classes = [styles.btn, styles[variant], disabled ? styles.disabled : '', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
