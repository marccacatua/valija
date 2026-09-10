import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import styles from './Intro.module.css';

const STEPS = [
  {
    bg: '#FFEDD9',
    title: 'Contanos el viaje',
    desc: 'Playa o montaña, laburo o placer, cuántos días.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="7" fill="#FF6A3D" />
      </svg>
    ),
  },
  {
    bg: '#DDF3F0',
    title: 'Recibí la checklist',
    desc: 'Agrupada por categoría, con cantidades ya calculadas.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="4" rx="2" fill="#12A594" />
        <rect x="3" y="10" width="12" height="4" rx="2" fill="#12A594" />
        <rect x="3" y="16" width="16" height="4" rx="2" fill="#12A594" />
      </svg>
    ),
  },
  {
    bg: '#FFF2CE',
    title: 'Tildá mientras empacás',
    desc: 'Barra de progreso en vivo y viajes guardados para repetir.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="#E5A400" strokeWidth="3" />
        <rect x="8" y="10" width="8" height="4" rx="2" fill="#E5A400" />
      </svg>
    ),
  },
];

export function Intro() {
  const navigate = useNavigate();
  return (
    <div className={styles.screen}>
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={`${styles.dot} ${styles.dotActive}`} />
      </div>
      <h2 className={styles.title}>Tres toques y tu valija está lista</h2>

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
      <Button onClick={() => navigate('/nuevo')}>Armar mi primer viaje</Button>
    </div>
  );
}
