import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { useTrips } from '../hooks/useTrips';
import styles from './Welcome.module.css';

export function Welcome() {
  const navigate = useNavigate();
  const { trips } = useTrips();
  const hasTrips = trips.length > 0;
  return (
    <div className={styles.screen}>
      <div className={styles.blobTop} />
      <div className={styles.blobBottom} />

      <Mascot size={150} animated />

      <h1 className={styles.title}>
        Nunca más te
        <br />
        olvides las ojotas
      </h1>
      <p className={styles.subtitle}>Armá la valija perfecta en 30 segundos. Vos elegís el viaje, nosotros la lista.</p>

      <div style={{ flex: 1 }} />

      <div className={styles.actions}>
        <Button variant="inverted" onClick={() => navigate(hasTrips ? '/nuevo' : '/intro')}>
          {hasTrips ? 'Armar un nuevo viaje' : 'Empecemos'}
        </Button>
        {hasTrips && (
          <Button variant="ghost" onClick={() => navigate('/viajes')}>
            Mis viajes anteriores
          </Button>
        )}
      </div>

      <div className={styles.version}>v{__APP_VERSION__}</div>
      <div className={styles.legalLinks}>
        <Link to="/privacidad">Privacidad</Link>
        <Link to="/soporte">Soporte</Link>
      </div>
    </div>
  );
}
