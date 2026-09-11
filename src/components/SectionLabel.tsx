import type { ReactNode } from 'react';

export function SectionLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div
      style={{
        font: '900 13px/1 Nunito, sans-serif',
        color: 'var(--muted)',
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        marginBottom: 10,
      }}
    >
      {children}
      {hint ? <span style={{ color: 'var(--muted-4)', letterSpacing: 0, textTransform: 'none' }}> {hint}</span> : null}
    </div>
  );
}
