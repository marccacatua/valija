import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { BottomNav } from '../components/BottomNav';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Mascot } from '../components/Mascot';
import { ProgressRing } from '../components/ProgressRing';
import { progressPct, tripListMeta, tripTitle } from '../data/trip';
import { useLastTripId } from '../hooks/useLastTripId';
import { useTrips } from '../hooks/useTrips';
import styles from './Trips.module.css';

interface PendingConfirm {
  title: string;
  message: string;
  variant?: 'sheet' | 'center';
  onConfirm: () => void;
}

export function Trips() {
  const navigate = useNavigate();
  const { trips, removeTrip, removeAllTrips } = useTrips();
  const [, setLastTripId] = useLastTripId();
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);

  const openTrip = (id: string) => {
    setLastTripId(id);
    navigate(`/viaje/${id}`);
  };

  const deleteTrip = (id: string, name: string) => {
    setConfirm({
      title: `¿Borrar "${name}"?`,
      message: 'No se puede deshacer.',
      onConfirm: () => {
        removeTrip(id);
        setConfirm(null);
      },
    });
  };

  const deleteAllTrips = () => {
    setConfirm({
      title: `¿Borrar los ${trips.length} viajes guardados?`,
      message: 'Vas a perder todo el progreso de empacado. Esto no se puede deshacer.',
      onConfirm: () => {
        // segunda confirmación, encadenada — centrada, para que se note
        // que este paso es el que realmente importa
        setConfirm({
          title: 'Última confirmación',
          message: 'Se van a borrar TODOS tus viajes para siempre. ¿Continuar?',
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
        <div className={styles.title}>Mis viajes</div>
        <div className={styles.subtitle}>Repetí una valija que ya te funcionó.</div>
        <Button className={styles.newTripBtn} onClick={() => navigate('/nuevo')}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <rect x="10" y="4" width="4" height="16" rx="2" fill="var(--paper)" />
            <rect x="4" y="10" width="16" height="4" rx="2" fill="var(--paper)" />
          </svg>
          Nuevo viaje
        </Button>
      </div>

      <div className={styles.body}>
        {trips.length === 0 ? (
          <div className={styles.emptyState}>
            <Mascot size={64} />
            <div className={styles.emptyTitle}>Todavía no armaste ninguna valija</div>
            <div className={styles.emptyDesc}>Creá tu primer viaje y va a aparecer acá, listo para repetir.</div>
          </div>
        ) : (
          trips.map((trip) => {
            const pct = progressPct(trip.items);
            const done = pct === 100;
            const color = done ? 'var(--teal)' : 'var(--coral)';
            return (
              <button key={trip.id} type="button" className={styles.tripCard} onClick={() => openTrip(trip.id)}>
                <ProgressRing pct={pct} color={color} />
                <div className={styles.tripInfo}>
                  <div className={styles.tripName}>{tripTitle(trip.form)}</div>
                  <div className={styles.tripMeta}>{tripListMeta(trip)}</div>
                  <div className={styles.tripState} style={{ color }}>
                    {done ? 'Empacado completo' : `${trip.items.filter((i) => i.done).length} de ${trip.items.length} empacado`}
                  </div>
                </div>
                <span
                  role="button"
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTrip(trip.id, tripTitle(trip.form));
                  }}
                  aria-label={`Borrar ${tripTitle(trip.form)}`}
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

        {trips.length > 0 && (
          <div className={styles.tip}>
            <Mascot size={46} />
            <div className={styles.tipText}>Tip de Valu: guardá la valija del último viaje de trabajo y la reusás en 2 toques.</div>
          </div>
        )}

        {trips.length > 0 && (
          <button type="button" className={styles.deleteAllBtn} onClick={deleteAllTrips}>
            Borrar todos los viajes
          </button>
        )}
        <div style={{ height: 20 }} />
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav active="viajes" />

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
