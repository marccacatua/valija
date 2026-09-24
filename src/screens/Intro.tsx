import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { useMascotMorphTarget } from '../hooks/useMascotMorphTarget';
import { t } from '../i18n';
import styles from './Intro.module.css';

const STEPS = [
  {
    bg: 'var(--selected-bg)',
    title: t('Contanos el viaje'),
    desc: t('Playa o montaña, laburo o placer, cuántos días.'),
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="7" fill="var(--coral)" />
      </svg>
    ),
  },
  {
    bg: 'var(--tint-teal)',
    title: t('Recibí la checklist'),
    desc: t('Agrupada por categoría, con cantidades ya calculadas.'),
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="4" rx="2" fill="var(--teal)" />
        <rect x="3" y="10" width="12" height="4" rx="2" fill="var(--teal)" />
        <rect x="3" y="16" width="16" height="4" rx="2" fill="var(--teal)" />
      </svg>
    ),
  },
  {
    bg: 'var(--tint-mustard)',
    title: t('Tildá mientras empacás'),
    desc: t('Barra de progreso en vivo y viajes guardados para repetir.'),
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="var(--mustard-dark)" strokeWidth="3" />
        <rect x="8" y="10" width="8" height="4" rx="2" fill="var(--mustard-dark)" />
      </svg>
    ),
  },
];

export function Intro() {
  const navigate = useNavigate();
  const mascotMorphRef = useMascotMorphTarget<HTMLDivElement>();
  return (
    <div className={styles.screen}>
      <div className={styles.headerRow}>
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={`${styles.dot} ${styles.dotActive}`} />
        </div>
        {/* Si se llega acá desde la bienvenida (usuario nuevo), esta mascota
            chica es el destino del morph armado en Welcome.tsx (ver
            hooks/useMascotMorphTarget). */}
        <div className={styles.mascotMorph} ref={mascotMorphRef}>
          <Mascot size={44} />
        </div>
      </div>
      <h2 className={styles.title}>{t('Tres toques y tu valija está lista')}</h2>

      <div className={styles.steps}>
        {STEPS.map((step) => (
          <div className={styles.step} key={step.title}>
            <div className={styles.iconWrap} style={{ background: step.bg }}>
              {step.icon}
            </div>
            <div>
              <div className={styles.stepTitle}>{step.title}</div>
              <div className={styles.stepDesc}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <Button onClick={() => navigate('/nuevo')}>{t('Armar mi primer viaje')}</Button>
    </div>
  );
}
