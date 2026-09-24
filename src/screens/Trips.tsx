import { Capacitor } from '@capacitor/core';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BackupSheet } from '../components/BackupSheet';
import { Button } from '../components/Button';
import { BottomNav } from '../components/BottomNav';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Mascot } from '../components/Mascot';
import { ProgressRing } from '../components/ProgressRing';
import { progressPct, tripListMeta, tripTitle } from '../data/trip';
import { prefersReducedMotion } from '../features/motion';
import { useFlipReorder } from '../hooks/useFlipReorder';
import { useLastTripId } from '../hooks/useLastTripId';
import { useTrips } from '../hooks/useTrips';
import { lang, switchLang, t, tn } from '../i18n';
import styles from './Trips.module.css';

// Antes de sacarlo de verdad, un fade + deslizamiento corto — sin esto,
// la tarjeta desaparece en seco y el resto salta a ocupar el hueco sin
// transición (el FLIP de reorder ya se encarga del resto de la lista).
const DELETE_EXIT_MS = 220;

// Id sintético para registrar TODO lo que va después de las tarjetas
// (tip, backup, borrar todos, footer) como un solo bloque en el mismo
// FLIP que las tarjetas de viaje (ver comentario donde se usa) — tienen
// que moverse juntos como una unidad rígida, no cada uno por separado:
// si solo el tip se sincroniza, el problema simplemente se corre un
// escalón más abajo (el tip termina pisando al botón de backup, que
// sigue reflowando en seco).
const TRAILING_FLIP_ID = '__trailing__';

interface PendingConfirm {
  title: string;
  message: string;
  variant?: 'sheet' | 'center';
  onConfirm: () => void;
}

export function Trips() {
  const navigate = useNavigate();
  const { trips, removeTrip, removeAllTrips, toggleTripFinished } = useTrips();
  const [, setLastTripId] = useLastTripId();
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [showBackup, setShowBackup] = useState(false);
  const [didImport, setDidImport] = useState(false);
  // Tarjetas en pleno fade de salida (recién borradas) — les sacamos el
  // click mientras se van, para no poder tocarlas dos veces.
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const cardNodesRef = useRef<Map<string, HTMLElement>>(new Map());

  const openTrip = (id: string) => {
    setLastTripId(id);
    navigate(`/viaje/${id}`);
  };

  // Anima la tarjeta yéndose (fade + deslizamiento) y recién ahí la saca
  // de verdad — así el resto de la lista tiene tiempo de reordenarse con
  // el mismo FLIP que ya usa el reorder de finalizados, en vez de saltar
  // en seco al hueco que deja.
  const playExitThenRemove = (id: string) => {
    const node = cardNodesRef.current.get(id);
    if (!node || prefersReducedMotion()) {
      removeTrip(id);
      return;
    }
    setExitingIds((prev) => new Set(prev).add(id));
    const anim = node.animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(28px)' }], {
      duration: DELETE_EXIT_MS,
      easing: 'ease',
      fill: 'forwards',
    });
    const finish = () => {
      removeTrip(id);
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };
    anim.finished.then(finish).catch(finish);
  };

  const deleteTrip = (id: string, name: string) => {
    setConfirm({
      title: t('¿Borrar "{name}"?', { name }),
      message: t('No se puede deshacer.'),
      onConfirm: () => {
        setConfirm(null);
        playExitThenRemove(id);
      },
    });
  };

  // Los finalizados van al final, sin reordenar dentro de cada grupo
  // (Array.sort es estable) — los activos quedan como ya venían (más
  // nuevo primero, por cómo addTrip los antepone). Reactivar uno vuelve
  // a este mismo orden solo, porque finalizar nunca mueve nada en el
  // array real (`trips`) — únicamente marca `finishedAt`.
  const sortedTrips = [...trips].sort((a, b) => Number(!!a.finishedAt) - Number(!!b.finishedAt));

  // Mismo FLIP que ya usan los ítems de la valija: anima el viaje que
  // sube/baja al finalizar o reactivar, y el reacomodo del resto cuando
  // se borra uno. Todo lo que va después de las tarjetas (tip, backup,
  // borrar todos, footer) se suma como un bloque más al final — si no,
  // al borrar un viaje esos elementos reflowan en seco a su lugar nuevo
  // mientras la última tarjeta todavía está viajando visualmente por
  // ese espacio, y se pisan un instante.
  const flipIds = [...sortedTrips.map((t) => t.id), TRAILING_FLIP_ID];
  const registerFlipNode = useFlipReorder(flipIds);
  const registerCard = (id: string) => (el: HTMLElement | null) => {
    registerFlipNode(id)(el);
    if (el) cardNodesRef.current.set(id, el);
    else cardNodesRef.current.delete(id);
  };

  const deleteAllTrips = () => {
    setConfirm({
      title: tn(trips.length, '¿Borrar el viaje guardado?', '¿Borrar los {n} viajes guardados?'),
      message: t('Vas a perder todo el progreso de empacado. Esto no se puede deshacer.'),
      onConfirm: () => {
        // segunda confirmación, encadenada — centrada, para que se note
        // que este paso es el que realmente importa
        setConfirm({
          title: t('Última confirmación'),
          message: t('Se van a borrar TODOS tus viajes para siempre. ¿Continuar?'),
          variant: 'center',
          onConfirm: () => {
            removeAllTrips();
            setConfirm(null);
          },
        });
      },
    });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.title}>{t('Mis viajes')}</div>
        <div className={styles.subtitle}>{t('Repetí una valija que ya te funcionó.')}</div>
        <Button className={styles.newTripBtn} onClick={() => navigate('/nuevo')}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <rect x="10" y="4" width="4" height="16" rx="2" fill="var(--paper)" />
            <rect x="4" y="10" width="16" height="4" rx="2" fill="var(--paper)" />
          </svg>
          {t('Nuevo viaje')}
        </Button>
      </div>

      <div className={styles.body}>
        {trips.length === 0 ? (
          <div className={styles.emptyState}>
            <Mascot size={64} />
            <div className={styles.emptyTitle}>{t('Todavía no armaste ninguna valija')}</div>
            <div className={styles.emptyDesc}>{t('Creá tu primer viaje y va a aparecer acá, listo para repetir.')}</div>
          </div>
        ) : (
          sortedTrips.map((trip) => {
            const pct = progressPct(trip.items);
            const done = pct === 100;
            const finished = Boolean(trip.finishedAt);
            const color = done ? 'var(--teal)' : 'var(--coral)';
            const exiting = exitingIds.has(trip.id);
            return (
              <button
                key={trip.id}
                ref={registerCard(trip.id)}
                type="button"
                className={`${styles.tripCard} ${finished ? styles.tripCardFinished : ''}`}
                style={exiting ? { pointerEvents: 'none' } : undefined}
                onClick={() => openTrip(trip.id)}
              >
                <ProgressRing pct={pct} color={finished ? 'var(--muted-3)' : color} />
                <div className={styles.tripInfo}>
                  <div className={styles.tripName}>{tripTitle(trip.form)}</div>
                  <div className={styles.tripMeta}>{tripListMeta(trip)}</div>
                  <div className={styles.tripState} style={{ color: finished ? 'var(--muted)' : color }}>
                    {finished
                      ? t('Viaje finalizado')
                      : done
                        ? t('Empacado completo')
                        : t('{done} de {total} empacado', { done: trip.items.filter((i) => i.done).length, total: trip.items.length })}
                  </div>
                </div>
                <span
                  role="button"
                  className={`${styles.finishBtn} ${finished ? styles.finishBtnActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTripFinished(trip.id);
                  }}
                  aria-label={finished ? t('Reactivar {name}', { name: tripTitle(trip.form) }) : t('Marcar {name} como finalizado', { name: tripTitle(trip.form) })}
                >
                  <svg width="14" height="11" viewBox="0 0 14 11">
                    <path
                      d="M1 5.5L5 9.5L13 1.5"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span
                  role="button"
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTrip(trip.id, tripTitle(trip.form));
                  }}
                  aria-label={t('Borrar {item}', { item: tripTitle(trip.form) })}
                >
                  ×
                </span>
                <svg width="9" height="16" viewBox="0 0 9 16" style={{ flex: 'none' }}>
                  <path d="M2 2l5 6-5 6" stroke="var(--muted-3)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })
        )}

        {/* Todo este bloque se registra como una sola unidad en el FLIP
            (ver TRAILING_FLIP_ID) para que se mueva entero en sincro con
            las tarjetas de arriba — si cada elemento se sincronizara por
            separado, el desfasaje entre ellos seguiría causando pisadas. */}
        <div className={styles.trailingGroup} ref={registerFlipNode(TRAILING_FLIP_ID)}>
          {trips.length > 0 && (
            <div className={styles.tip}>
              <Mascot size={46} />
              <div className={styles.tipText}>{t('Tip de Valu: guardá la valija del último viaje de trabajo y la reusás en 2 toques.')}</div>
            </div>
          )}

          {/* Puente Safari <-> ícono instalado: solo tiene sentido en la web (dos
              storages separados por iOS). La app nativa ya tiene un único storage,
              así que este botón no aplica ahí — y de paso evita el "↔" que no
              renderiza bien en el WebView nativo (ver LockIcon/UnlockIcon arriba). */}
          {!Capacitor.isNativePlatform() && (
            <button type="button" className={styles.backupBtn} onClick={() => setShowBackup(true)}>
              {t('Llevar mis datos a otro acceso (Safari ↔ pantalla de inicio)')}
            </button>
          )}

          {trips.length > 0 && (
            <button type="button" className={styles.deleteAllBtn} onClick={deleteAllTrips}>
              {t('Borrar todos los viajes')}
            </button>
          )}

          {/* Antes vivían en la pantalla de bienvenida — se mudaron acá al
              convertirla en un splash que transiciona solo, sin botones
              (ver Welcome.tsx). "Mis viajes" es la pantalla estable a la
              que siempre se puede volver por el bottom nav. */}
          <div className={styles.footer}>
            <div className={styles.version}>
              v{__APP_VERSION__} · {__BUILD_ID__}
            </div>
            <div className={styles.legalLinks}>
              <Link to="/privacidad">{t('Privacidad')}</Link>
              <Link to="/soporte">{t('Soporte')}</Link>
              {/* Cambio de idioma manual: por defecto se usa el del
                  dispositivo, esto es solo para quien quiera el otro. */}
              <button type="button" className={styles.langSwitch} onClick={() => switchLang(lang === 'es' ? 'en' : 'es')}>
                {lang === 'es' ? 'English' : 'Español'}
              </button>
            </div>
          </div>
          <div style={{ height: 20 }} />
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav active="viajes" />

      {showBackup && (
        <BackupSheet
          onImported={() => setDidImport(true)}
          onClose={() => {
            setShowBackup(false);
            if (didImport) window.location.reload();
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          variant={confirm.variant}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
