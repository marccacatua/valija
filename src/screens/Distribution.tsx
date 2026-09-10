import { useNavigate, useParams } from 'react-router-dom';
import { MALETA_OPTIONS, labelFor, labelForMany } from '../data/catalog';
import { distributeItems } from '../data/distribute';
import { Button } from '../components/Button';
import { BackArrowIcon, MaletaIcons } from '../components/icons';
import { useTrips } from '../hooks/useTrips';
import styles from './Distribution.module.css';

export function Distribution() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { getTrip } = useTrips();

  const trip = getTrip(tripId);

  if (!trip) {
    return (
      <div className={styles.screen}>
        <div style={{ padding: 80 }}>
          No encontramos ese viaje.
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => navigate('/viajes')}>Ir a mis viajes</Button>
          </div>
        </div>
      </div>
    );
  }

  const bags = MALETA_OPTIONS.map((o) => o.key).filter((k) => trip.form.maletas.includes(k));
  const distribution = distributeItems(trip.items, trip.form.maletas);

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <button type="button" className={styles.backBtn} onClick={() => navigate(`/viaje/${trip.id}`)} aria-label="Volver">
            {BackArrowIcon}
          </button>
          <div>
            <div className={styles.headerTitle}>Cómo repartir tu equipaje</div>
            <div className={styles.headerSubtitle}>{labelForMany(MALETA_OPTIONS, bags)}</div>
          </div>
        </div>
      </div>

      <div className={styles.note}>
        💡 Separamos algunas unidades entre valijas para que un imprevisto
        con una (pérdida, demora) no te deje sin nada de eso. Es solo una
        sugerencia — no cambia tu checklist ni lo que ya tildaste.
      </div>

      <div className={styles.body}>
        {bags.map((bag) => {
          const list = distribution[bag];
          return (
            <div className={styles.bag} key={bag}>
              <div className={styles.bagHeader}>
                <div className={styles.bagIcon}>{MaletaIcons[bag]}</div>
                <span className={styles.bagTitle}>{labelFor(MALETA_OPTIONS, bag)}</span>
                <span className={styles.bagCount}>{list.length} ítems</span>
              </div>
              {list.length === 0 ? (
                <div className={styles.empty}>Nada asignado acá.</div>
              ) : (
                list.map((d, i) => (
                  <div className={styles.item} key={`${d.item.id}-${i}`}>
                    <span className={styles.itemName}>{d.item.name}</span>
                    {d.isSplit && <span className={styles.splitTag}>de {d.item.qty}</span>}
                    <span className={styles.itemQty}>×{d.qty}</span>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
