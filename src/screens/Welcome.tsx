import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mascot } from '../components/Mascot';
import { armMascotMorph } from '../features/mascotMorph';
import { prefersReducedMotion } from '../features/motion';
import { useLastTripId } from '../hooks/useLastTripId';
import { useTrips } from '../hooks/useTrips';
import { t } from '../i18n';
import styles from './Welcome.module.css';

// Cuánto se queda la mascota en pantalla antes de pasar sola — usuario
// nuevo lee un mensaje corto, así que tiene más tiempo; el que vuelve no
// necesita leer nada, es solo el instante de "reconocer" la app.
const NEW_USER_HOLD_MS = 3600;
const RETURNING_HOLD_MS = 1100;

// El usuario nuevo recién está conociendo a Valu — que el morph hacia
// Intro sea más pausado que el default de useMascotMorphTarget. Al que
// vuelve no hace falta pisarle nada: ese caso ya se sentía bien con los
// defaults.
const NEW_USER_TRAVEL_MS = 1680;
// El fade dura más que el viaje de la mascota, a pedido del usuario
// para probar cómo se siente — en los dos casos. Primero 50% más,
// después otro 25% más sobre eso (1.5 * 1.25 = 1.875).
const NEW_USER_FADE_MS = NEW_USER_TRAVEL_MS * 1.875;

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
  const bgRef = useRef<HTMLDivElement>(null);
  const goNow = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    // Se navega ya mismo — el fade del fondo y el viaje de la mascota no
    // pasan acá, sino como copias en la pantalla de destino (ver
    // hooks/useMascotMorphTarget.ts), así arrancan los dos juntos en vez
    // de que el fade termine antes de que la mascota se empiece a mover.
    if (mascotRef.current && bgRef.current) {
      armMascotMorph(
        mascotRef.current,
        bgRef.current,
        hasTrips ? undefined : { travelMs: NEW_USER_TRAVEL_MS, fadeMs: NEW_USER_FADE_MS },
      );
    }
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
      aria-label={t('Continuar')}
    >
      {/* Referenciado por ref: armMascotMorph clona este fondo tal cual
          para desvanecerlo en la pantalla de destino (ver goNow arriba). */}
      <div className={styles.bg} ref={bgRef}>
        <div className={styles.blobTop} />
        <div className={styles.blobBottom} />
      </div>
      <div style={{ flex: 1 }} />
      <div className={styles.mascotMorph} ref={mascotRef}>
        <Mascot size={150} animated />
      </div>
      {!hasTrips && (
        <div className={styles.content}>
          <h1 className={styles.title}>
            {t('A partir de ahora')}
            <br />
            {t('no te olvidás más nada')}
          </h1>
          <p className={styles.subtitle}>{t('Armá la valija perfecta en 30 segundos. Vos elegís el viaje, nosotros la lista.')}</p>
        </div>
      )}
      <div style={{ flex: 1 }} />
    </div>
  );
}
