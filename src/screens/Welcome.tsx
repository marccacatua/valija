import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mascot } from '../components/Mascot';
import { armMascotMorph } from '../features/mascotMorph';
import { prefersReducedMotion } from '../features/motion';
import { useLastTripId } from '../hooks/useLastTripId';
import { useTrips } from '../hooks/useTrips';
import styles from './Welcome.module.css';

// Cuánto se queda la mascota en pantalla antes de pasar sola — usuario
// nuevo lee un mensaje corto, así que tiene más tiempo; el que vuelve no
// necesita leer nada, es solo el instante de "reconocer" la app.
const NEW_USER_HOLD_MS = 1800;
const RETURNING_HOLD_MS = 1100;

// El usuario nuevo recién está conociendo a Valu — que el morph hacia
// Intro sea más pausado (la mitad de velocidad que el default de
// useMascotMorphTarget). Al que vuelve no hace falta pisarle nada: ese
// caso ya se sentía bien con el default.
const NEW_USER_MORPH_MS = 840;

export function Welcome() {
  const navigate = useNavigate();
  const { trips } = useTrips();
  const [lastTripId] = useLastTripId();
  const hasTrips = trips.length > 0;

  // A dónde va el usuario que vuelve: prioriza el último viaje que miró si
  // sigue sin terminar (lo más probable es que sea justo el que está
  // armando en este momento); si no, cualquier otro viaje activo; si no
  // queda ninguno sin terminar, a "Mis viajes" en vez de a un viaje al azar.
  const destination = useMemo(() => {
    if (!hasTrips) return '/intro';
    const remembered = trips.find((t) => t.id === lastTripId && !t.finishedAt);
    if (remembered) return `/viaje/${remembered.id}`;
    const anyActive = trips.find((t) => !t.finishedAt);
    return anyActive ? `/viaje/${anyActive.id}` : '/viajes';
  }, [hasTrips, trips, lastTripId]);

  // Nunca hay que obligar a nadie a mirar una animación, sobre todo la
  // décima vez: tocar la pantalla saltea la espera y va directo.
  const navigatedRef = useRef(false);
  const mascotRef = useRef<HTMLDivElement>(null);
  const goNow = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (mascotRef.current) armMascotMorph(mascotRef.current, hasTrips ? undefined : NEW_USER_MORPH_MS);
    navigate(destination);
  };

  useEffect(() => {
    const holdMs = hasTrips ? RETURNING_HOLD_MS : NEW_USER_HOLD_MS;
    const delay = prefersReducedMotion() ? 0 : holdMs;
    const timer = setTimeout(goNow, delay);
    return () => clearTimeout(timer);
    // Solo debe programarse una vez, al montar — no hay que reprogramar el
    // timer si `destination` cambia mientras tanto (viaje de menos de 2s).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={styles.screen}
      onClick={goNow}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goNow()}
      role="button"
      tabIndex={0}
      aria-label="Continuar"
    >
      <div className={styles.blobTop} />
      <div className={styles.blobBottom} />
      <div style={{ flex: 1 }} />
      <div className={styles.mascotMorph} ref={mascotRef}>
        <Mascot size={150} animated />
      </div>
      {!hasTrips && (
        <>
          <h1 className={styles.title}>
            A partir de ahora
            <br />
            no te olvidás más nada
          </h1>
          <p className={styles.subtitle}>Armá la valija perfecta en 30 segundos. Vos elegís el viaje, nosotros la lista.</p>
        </>
      )}
      <div style={{ flex: 1 }} />
    </div>
  );
}
