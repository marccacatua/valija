import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CATEGORY_META, CATEGORY_ORDER } from '../data/catalog';
import { packedCount, progressNote, progressPct, tripMetaChips, tripTitle } from '../data/trip';
import { AddItemRow } from '../components/AddItemRow';
import { Button } from '../components/Button';
import { BottomNav } from '../components/BottomNav';
import { Mascot } from '../components/Mascot';
import { useFeatureFlag } from '../features/flags';
import { useLastTripId } from '../hooks/useLastTripId';
import { useTrips } from '../hooks/useTrips';
import type { CategoryKey, PackingItem } from '../types';
import styles from './Checklist.module.css';

export function Checklist() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { getTrip, toggleItem, bumpItem, addCustomItem, removeItem } = useTrips();
  const [, setLastTripId] = useLastTripId();
  const canAddCustomItems = useFeatureFlag('customItems');

  const trip = getTrip(tripId);

  useEffect(() => {
    if (trip) setLastTripId(trip.id);
  }, [trip, setLastTripId]);

  if (!trip) {
    return (
      <div className={styles.screen}>
        <div className={styles.notFound}>
          No encontramos ese viaje.
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => navigate('/viajes')}>Ir a mis viajes</Button>
          </div>
        </div>
      </div>
    );
  }

  const items = trip.items;
  const packed = packedCount(items);
  const pct = progressPct(items);
  const groups = CATEGORY_ORDER.map((key) => {
    const list = items.filter((i) => i.cat === key);
    return { key, list };
  }).filter((g) => g.list.length);

  const grouped = (key: CategoryKey, list: PackingItem[]) => {
    const meta = CATEGORY_META[key];
    return (
      <div className={styles.group} key={key}>
        <div className={styles.groupHeader}>
          <span className={styles.groupDot} style={{ background: meta.color }} />
          <span className={styles.groupTitle}>{meta.title}</span>
          <span className={styles.groupCount}>
            {list.filter((i) => i.done).length}/{list.length}
          </span>
        </div>
        {list.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.item}
            onClick={() => toggleItem(trip.id, item.id)}
          >
            <span className={`${styles.checkbox} ${item.done ? styles.checkboxDone : ''}`}>✓</span>
            <span className={`${styles.itemName} ${item.done ? styles.itemNameDone : ''}`}>{item.name}</span>
            <span className={styles.qtyControls} onClick={(e) => e.stopPropagation()}>
              {!item.noQty && (
                <>
                  <button
                    type="button"
                    className={`${styles.qtyBtn} ${styles.qtyDec}`}
                    onClick={() => bumpItem(trip.id, item.id, -1)}
                    aria-label={`Restar ${item.name}`}
                  >
                    –
                  </button>
                  <span className={styles.qtyValue}>{item.qty}</span>
                  <button
                    type="button"
                    className={`${styles.qtyBtn} ${styles.qtyInc}`}
                    onClick={() => bumpItem(trip.id, item.id, 1)}
                    aria-label={`Sumar ${item.name}`}
                  >
                    +
                  </button>
                </>
              )}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeItem(trip.id, item.id)}
                aria-label={`Borrar ${item.name}`}
              >
                ×
              </button>
            </span>
          </button>
        ))}
        {canAddCustomItems && <AddItemRow onAdd={(name) => addCustomItem(trip.id, key, name)} />}
      </div>
    );
  };

  return (
    <div className={styles.screen}>
      <div className={styles.hero}>
        <div className={styles.heroBlob} />
        <div className={styles.heroLabel}>Tu valija para</div>
        <div className={styles.heroTitle}>{tripTitle(trip.form)}</div>
        <div className={styles.chips}>
          {tripMetaChips(trip.form).map((label) => (
            <span className={styles.chip} key={label}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressCard}>
          <div style={{ flex: 1 }}>
            <div className={styles.progressCount}>
              <span className={styles.progressCountNum}>{packed}</span>
              <span className={styles.progressCountLabel}>de {items.length} empacado</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.progressNote}>{progressNote(items)}</div>
          </div>
          <Mascot size={56} />
        </div>
      </div>

      <div className={styles.groups}>
        {groups.map((g) => grouped(g.key, g.list))}

        {trip.form.maletas.length > 1 && (
          <Button onClick={() => navigate(`/viaje/${trip.id}/distribucion`)}>Ver cómo repartir en tus valijas</Button>
        )}
        <Button variant="teal" className={styles.saveButton} onClick={() => navigate('/viajes')}>
          Ver mis viajes
        </Button>
        <div style={{ height: 16 }} />
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav active="checklist" />
    </div>
  );
}
