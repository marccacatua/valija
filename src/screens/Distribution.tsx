import { useNavigate, useParams } from 'react-router-dom';
import { MALETA_OPTIONS, labelFor, labelForMany } from '../data/catalog';
import { distributeItems, spaceSummary } from '../data/distribute';
import { Button } from '../components/Button';
import { BackArrowIcon, CampingIcon, MaletaIcons } from '../components/icons';
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
  const { byBag, separateItems } = distributeItems(trip.items, trip.form.maletas);
  const space = spaceSummary(trip.items, trip.form.maletas);
  const fmtL = (l: number) => (l < 10 ? l.toFixed(1).replace('.', ',') : String(Math.round(l)));

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

      {space.overflow && (
        <div className={`${styles.note} ${styles.noteWarning}`}>
          ⚠️ No te entra todo: quizás convenga sumar una valija más, o una más grande.
        </div>
      )}

      <div className={styles.body}>
        {bags.map((bag) => {
          const list = byBag[bag];
          const load = space.perBag.find((b) => b.bag === bag)!;
          const over = load.usedL > load.capacityL + 0.01;
          return (
            <div className={styles.bag} key={bag}>
              <div className={styles.bagHeader}>
                <div className={styles.bagIcon}>{MaletaIcons[bag]}</div>
                <span className={styles.bagTitle}>{labelFor(MALETA_OPTIONS, bag)}</span>
                <span className={styles.bagCount}>{list.length} ítems</span>
              </div>
              <div className={styles.load}>
                <div className={styles.loadTrack}>
                  <div
                    className={`${styles.loadFill} ${over ? styles.loadFillOver : load.pct >= 85 ? styles.loadFillTight : ''}`}
                    style={{ width: `${Math.min(load.pct, 100)}%` }}
                  />
                </div>
                <span className={`${styles.loadLabel} ${over ? styles.loadLabelOver : ''}`}>
                  {fmtL(load.usedL)} de {load.capacityL} L · {load.pct} %
                </span>
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

        {separateItems.length > 0 && (
          <div className={styles.bag}>
            <div className={styles.bagHeader}>
              <div className={styles.bagIcon}>{CampingIcon}</div>
              <span className={styles.bagTitle}>Va aparte</span>
              <span className={styles.bagCount}>{separateItems.length} ítems</span>
            </div>
            <div className={styles.empty}>No entra en ninguna valija: se lleva o se despacha por separado.</div>
            {separateItems.map((item) => (
              <div className={styles.item} key={item.id}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemQty}>×{item.qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
