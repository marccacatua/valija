import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackArrowIcon } from './icons';
import styles from './LegalPage.module.css';

interface LegalPageProps {
  title: string;
  children: ReactNode;
}

/** Layout compartido por las páginas de contenido fijo (privacidad, soporte)
 * que Apple exige tener accesibles por URL propia — a diferencia del resto
 * de las pantallas, alguien puede llegar acá directo (sin pasar por la app),
 * así que "volver" va siempre a "/" en vez de al historial del navegador. */
export function LegalPage({ title, children }: LegalPageProps) {
  const navigate = useNavigate();
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/')} aria-label="Volver a Valija">
          {BackArrowIcon}
        </button>
        <div className={styles.headerTitle}>{title}</div>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
