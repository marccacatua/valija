import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CATEGORY_META, CATEGORY_ORDER } from '../data/catalog';
import { QUICK_GROUP_META, QUICK_GROUP_ORDER, quickGroupFor } from '../data/quickGroups';
import { packedCount, progressNote, progressPct, tripMetaChips, tripTitle } from '../data/trip';
import { AddItemRow } from '../components/AddItemRow';
import { ApplyTemplateSheet } from '../components/ApplyTemplateSheet';
import { Button } from '../components/Button';
import { BottomNav } from '../components/BottomNav';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Mascot } from '../components/Mascot';
import { SaveTemplateSheet } from '../components/SaveTemplateSheet';
import { templatePlaceholder } from '../data/trip';
import { useFeatureFlag } from '../features/flags';
import { useLastTripId } from '../hooks/useLastTripId';
import { useTemplates } from '../hooks/useTemplates';
import { useTrips } from '../hooks/useTrips';
import type { CategoryKey, ItemTemplate, PackingItem } from '../types';
import styles from './Checklist.module.css';

export function Checklist() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { getTrip, toggleItem, bumpItem, setItemsDone, addCustomItem, removeItem } = useTrips();
  const { templates, saveTemplate, removeTemplate } = useTemplates();
  const [, setLastTripId] = useLastTripId();
  const canAddCustomItems = useFeatureFlag('customItems');
  const canUseTemplates = useFeatureFlag('tripTemplates');
  const [sheet, setSheet] = useState<'save' | 'apply' | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ItemTemplate | null>(null);
  const [view, setView] = useState<'detallada' | 'rapida'>('detallada');

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
  const customItemsInTrip = items.filter((i) => i.isCustom);

  const handleSaveTemplate = (name: string, chosen: PackingItem[]) => {
    saveTemplate(
      name,
      chosen.map((i) => ({ cat: i.cat, name: i.name })),
    );
    setSheet(null);
  };

  const handleApplyTemplate = (template: ItemTemplate) => {
    for (const it of template.items) {
      addCustomItem(trip.id, it.cat, it.name);
    }
    setSheet(null);
  };

  const packed = packedCount(items);
  const pct = progressPct(items);
  const groups = CATEGORY_ORDER.map((key) => {
    const list = items.filter((i) => i.cat === key);
    return { key, list };
  }).filter((g) => g.list.length);

  // Vista rápida: mismos ítems, agrupados en temas más grandes (ver
  // data/quickGroups.ts) para revisar de un vistazo en vez de ítem por
  // ítem — pedido de un amigo que probó la app y le pareció demasiado
  // larga la checklist detallada.
  const quickGroups = QUICK_GROUP_ORDER.map((key) => {
    const list = items.filter((i) => quickGroupFor(i) === key);
    return { key, list };
  }).filter((g) => g.list.length);

  const toggleQuickGroup = (list: PackingItem[]) => {
    const allDone = list.every((i) => i.done);
    setItemsDone(
      trip.id,
      list.map((i) => i.id),
      !allDone,
    );
  };

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

  const groupedQuick = (key: string, list: PackingItem[]) => {
    const meta = QUICK_GROUP_META[key as keyof typeof QUICK_GROUP_META];
    const allDone = list.every((i) => i.done);
    return (
      <button
        type="button"
        key={key}
        className={`${styles.quickGroup} ${allDone ? styles.quickGroupDone : ''}`}
        onClick={() => toggleQuickGroup(list)}
      >
        <span className={`${styles.checkbox} ${allDone ? styles.checkboxDone : ''}`}>✓</span>
        <span className={styles.quickGroupInfo}>
          <span className={`${styles.groupTitle} ${allDone ? styles.itemNameDone : ''}`}>{meta.title}</span>
          <span className={styles.quickGroupHint}>{list.length} ítems</span>
        </span>
        <span className={styles.groupCount}>
          {list.filter((i) => i.done).length}/{list.length}
        </span>
      </button>
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

      <div className={styles.viewToggle}>
        <button
          type="button"
          className={`${styles.viewToggleBtn} ${view === 'detallada' ? styles.viewToggleBtnActive : ''}`}
          onClick={() => setView('detallada')}
        >
          Detallada
        </button>
        <button
          type="button"
          className={`${styles.viewToggleBtn} ${view === 'rapida' ? styles.viewToggleBtnActive : ''}`}
          onClick={() => setView('rapida')}
        >
          Rápida
        </button>
      </div>

      <div className={styles.groups}>
        {view === 'detallada'
          ? groups.map((g) => grouped(g.key, g.list))
          : quickGroups.map((g) => groupedQuick(g.key, g.list))}

        {trip.form.maletas.length > 1 && (
          <Button onClick={() => navigate(`/viaje/${trip.id}/distribucion`)}>Ver cómo repartir en tus valijas</Button>
        )}
        {canUseTemplates && customItemsInTrip.length > 0 && (
          <Button variant="inverted" onClick={() => setSheet('save')}>
            Guardar ítems como plantilla
          </Button>
        )}
        {canUseTemplates && (
          <Button variant="inverted" onClick={() => setSheet('apply')}>
            Aplicar una plantilla
          </Button>
        )}
        <Button variant="teal" className={styles.saveButton} onClick={() => navigate('/viajes')}>
          Ver mis viajes
        </Button>
        <div style={{ height: 16 }} />
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav active="checklist" />

      {sheet === 'save' && (
        <SaveTemplateSheet
          items={customItemsInTrip}
          placeholderExample={templatePlaceholder(trip.form)}
          onSave={handleSaveTemplate}
          onCancel={() => setSheet(null)}
        />
      )}
      {sheet === 'apply' && (
        <ApplyTemplateSheet
          templates={templates}
          onApply={handleApplyTemplate}
          onRemove={(id) => setTemplateToDelete(templates.find((t) => t.id === id) ?? null)}
          onCancel={() => setSheet(null)}
        />
      )}
      {templateToDelete && (
        <ConfirmDialog
          title={`¿Borrar la plantilla "${templateToDelete.name}"?`}
          message="No se puede deshacer."
          onConfirm={() => {
            removeTemplate(templateToDelete.id);
            setTemplateToDelete(null);
          }}
          onCancel={() => setTemplateToDelete(null)}
        />
      )}
    </div>
  );
}
