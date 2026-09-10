import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { BottomNav } from '../components/BottomNav';
import { Mascot } from '../components/Mascot';
import { ProgressRing } from '../components/ProgressRing';
import { progressPct, tripListMeta, tripTitle } from '../data/trip';
import { useLastTripId } from '../hooks/useLastTripId';
import { useTrips } from '../hooks/useTrips';
import styles from './Trips.module.css';

export function Trips() {
  const navigate = useNavigate();
  const { trips, removeTrip } = useTrips();
  const [, setLastTripId] = useLastTripId();

  const openTrip = (id: string) => {
    setLastTripId(id);
    navigate(`/viaje/${id}`);
  };

  const deleteTrip = (id: string, name: string) => {
    if (window.confirm(`¿Borrar "${name}"? No se puede deshacer.`)) {
      removeTrip(id);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.title}>Mis viajes</div>
        <div className={styles.subtitle}>Repetí una valija que ya te funcionó.</div>
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
            const color = done ? '#12A594' : '#FF6A3D';
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
                  <path d="M2 2l5 6-5 6" stroke="#D8C6B7" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })
        )}

        <Button onClick={() => navigate('/nuevo')}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <rect x="10" y="4" width="4" height="16" rx="2" fill="#FFFDF8" />
            <rect x="4" y="10" width="16" height="4" rx="2" fill="#FFFDF8" />
          </svg>
          Nuevo viaje
        </Button>

        {trips.length > 0 && (
          <div className={styles.tip}>
            <Mascot size={46} />
            <div className={styles.tipText}>Tip de Valu: guardá la valija del último viaje de trabajo y la reusás en 2 toques.</div>
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav active="viajes" />
    </div>
  );
}
