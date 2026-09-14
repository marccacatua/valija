import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CATEGORY_META, CATEGORY_ORDER } from '../data/catalog';
import { isPackingTight } from '../data/distribute';
import { QUICK_GROUP_META, QUICK_GROUP_ORDER, quickGroupFor } from '../data/quickGroups';
import { packedCount, progressNote, progressPct, shareText, tripMetaChips, tripTitle } from '../data/trip';
import { AddItemRow } from '../components/AddItemRow';
import { ApplyTemplateSheet } from '../components/ApplyTemplateSheet';
import { Button } from '../components/Button';
import { BottomNav } from '../components/BottomNav';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { BackArrowIcon, EditIcon, LockIcon } from '../components/icons';
import { Mascot } from '../components/Mascot';
import { PaywallSheet } from '../components/PaywallSheet';
import { SaveTemplateSheet } from '../components/SaveTemplateSheet';
import { templatePlaceholder } from '../data/trip';
import { useFeatureFlag } from '../features/flags';
import { useFlipReorder } from '../hooks/useFlipReorder';
import { useLastTripId } from '../hooks/useLastTripId';
import { useMascotMorphTarget } from '../hooks/useMascotMorphTarget';
import { useTemplates } from '../hooks/useTemplates';
import { useTrips } from '../hooks/useTrips';
import type { CategoryKey, HomeTask, ItemTemplate, PackingItem } from '../types';
import styles from './Checklist.module.css';

export function Checklist() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const {
    getTrip,
    toggleItem,
    bumpItem,
    setItemsDone,
    renameTrip,
    toggleHomeTask,
    addHomeTask,
    removeHomeTask,
    addCustomItem,
    removeItem,
    cloneTrip,
  } = useTrips();
  const { templates, saveTemplate, removeTemplate } = useTemplates();
  const [, setLastTripId] = useLastTripId();
  const canAddCustomItems = useFeatureFlag('customItems');
  const canUseTemplates = useFeatureFlag('tripTemplates');
  const canExport = useFeatureFlag('exportChecklist');
  const canClone = useFeatureFlag('cloneTrip');
  const [sheet, setSheet] = useState<'save' | 'apply' | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ItemTemplate | null>(null);
  const [view, setView] = useState<'detallada' | 'rapida'>('detallada');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [search, setSearch] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);

  const trip = getTrip(tripId);
  const items = trip?.items ?? [];

  useEffect(() => {
    if (trip) setLastTripId(trip.id);
  }, [trip, setLastTripId]);

  // Búsqueda + "solo sin empacar": solo afectan qué se muestra en la vista
  // detallada, nunca el dato de fondo (progreso, vista rápida) — filtrar no
  // debería poder "perder" un ítem, solo ocultarlo momentáneamente.
  const matchesFilter = (item: PackingItem) => {
    const matchesSearch = search.trim() === '' || item.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesPending = !onlyPending || !item.done;
    return matchesSearch && matchesPending;
  };

  // Mismo criterio que "Mis viajes" con los finalizados: los tildados bajan
  // al fondo de su categoría (sort estable, no reordena entre sí ni a los
  // pendientes) — quedan arriba de "Agregar ítem", que sigue siempre último.
  const groups = CATEGORY_ORDER.map((key) => {
    const list = items
      .filter((i) => i.cat === key && matchesFilter(i))
      .sort((a, b) => Number(a.done) - Number(b.done));
    return { key, list };
  }).filter((g) => g.list.length);

  // El hook necesita el orden VISIBLE actual en cada render para poder
  // compararlo contra el anterior — por eso se llama acá arriba, antes de
  // cualquier return, con el id de cada ítem tal como aparece hoy en la
  // vista detallada (categoría por categoría, tildados al fondo).
  const registerItemNode = useFlipReorder(groups.flatMap((g) => g.list.map((i) => i.id)));
  const mascotMorphRef = useMascotMorphTarget<HTMLDivElement>();

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

  const customItemsInTrip = items.filter((i) => i.isCustom);
  const customHomeTasksInTrip = trip.homeChecklist.filter((t) => t.isCustom);

  const handleSaveTemplate = (name: string, chosenItems: PackingItem[], chosenTasks: HomeTask[]) => {
    saveTemplate(
      name,
      chosenItems.map((i) => ({ cat: i.cat, name: i.name })),
      chosenTasks.map((t) => t.label),
    );
    setSheet(null);
  };

  const handleApplyTemplate = (template: ItemTemplate) => {
    for (const it of template.items) {
      addCustomItem(trip.id, it.cat, it.name);
    }
    for (const label of template.homeTasks ?? []) {
      addHomeTask(trip.id, label);
    }
    setSheet(null);
  };

  const startEditingName = () => {
    setNameDraft(trip.form.name);
    setEditingName(true);
  };

  const saveEditingName = () => {
    renameTrip(trip.id, nameDraft);
    setEditingName(false);
  };

  // "Quiero ir al mismo lugar otra vez": duplica form + ítems + tareas de
  // casa (con lo agregado a mano incluido) pero recién armado, sin nada
  // tildado, y te deja directo en el viaje nuevo.
  const handleClone = () => {
    const clone = cloneTrip(trip.id);
    if (clone) {
      setLastTripId(clone.id);
      navigate(`/viaje/${clone.id}`);
    }
  };

  // Comparte por el share sheet nativo cuando está disponible (celular); si
  // no (desktop, o el usuario lo cancela), cae a copiar al portapapeles con
  // un feedback breve — nunca deja al usuario sin ninguna confirmación.
  const handleShare = async () => {
    const text = shareText(trip);
    if (navigator.share) {
      try {
        await navigator.share({ title: tripTitle(trip.form), text });
      } catch {
        // el usuario cerró el share sheet sin elegir nada: no es un error
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sin permiso de portapapeles: no hay fallback mejor que ofrecer
    }
  };

  // título que se ve si el usuario deja el nombre vacío — mismo fallback
  // que usa tripTitle(), útil como placeholder para no mostrar un campo
  // en blanco sin ninguna pista de qué va a pasar
  const autoTitle = tripTitle({ ...trip.form, name: '' });

  const packed = packedCount(items);
  const pct = progressPct(items);
  const isFiltering = search.trim() !== '' || onlyPending;

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
            ref={registerItemNode(item.id)}
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
        <div className={styles.heroTop}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/viajes')} aria-label="Volver a mis viajes">
            {BackArrowIcon}
          </button>
          <div className={styles.heroLabel}>Tu valija para</div>
        </div>
        {editingName ? (
          <input
            autoFocus
            className={styles.heroTitleInput}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={saveEditingName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEditingName();
              if (e.key === 'Escape') setEditingName(false);
            }}
            placeholder={autoTitle}
          />
        ) : (
          <div className={styles.heroTitleRow}>
            <div className={styles.heroTitle}>{tripTitle(trip.form)}</div>
            <button type="button" className={styles.editNameBtn} onClick={startEditingName} aria-label="Cambiar nombre del viaje">
              {EditIcon}
            </button>
          </div>
        )}
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
          <div className={styles.mascotMorph} ref={mascotMorphRef}>
            <Mascot size={56} />
          </div>
        </div>
      </div>

      {isPackingTight(items, trip.form.maletas) && (
        <div className={styles.spaceNote}>
          ⚠️ Tenés bastantes ítems que ocupan lugar para las valijas que elegiste — quizás convenga sumar una
          valija más, o una más grande.
        </div>
      )}

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

      {view === 'detallada' && (
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ítem…"
          />
          <button
            type="button"
            className={`${styles.pendingToggle} ${onlyPending ? styles.pendingToggleActive : ''}`}
            onClick={() => setOnlyPending((v) => !v)}
          >
            Sin empacar
          </button>
        </div>
      )}

      <div className={styles.groups}>
        {view === 'detallada' ? (
          groups.length > 0 ? (
            groups.map((g) => grouped(g.key, g.list))
          ) : (
            isFiltering && <div className={styles.noResults}>No hay ítems que coincidan con la búsqueda.</div>
          )
        ) : (
          quickGroups.map((g) => groupedQuick(g.key, g.list))
        )}

        <div className={styles.homeSection}>
          <div className={styles.homeSectionHeader}>
            <span className={styles.homeSectionTitle}>
              {trip.form.turismo === 'navegar' ? '¿Está todo listo en el barco?' : '¿Quedó todo pronto en casa?'}
            </span>
            <span className={styles.groupCount}>
              {trip.homeChecklist.filter((t) => t.done).length}/{trip.homeChecklist.length}
            </span>
          </div>
          <div className={styles.homeSectionHint}>
            {trip.form.turismo === 'navegar'
              ? 'No suma al progreso de la valija — chequeos de seguridad antes de zarpar.'
              : 'No suma al progreso de la valija — son cosas para dejar resueltas antes de salir.'}
          </div>
          {trip.homeChecklist.map((task) => (
            <button key={task.id} type="button" className={styles.item} onClick={() => toggleHomeTask(trip.id, task.id)}>
              <span className={`${styles.checkbox} ${task.done ? styles.checkboxDone : ''}`}>✓</span>
              <span className={`${styles.itemName} ${task.done ? styles.itemNameDone : ''}`}>{task.label}</span>
              <span onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeHomeTask(trip.id, task.id)}
                  aria-label={`Borrar ${task.label}`}
                >
                  ×
                </button>
              </span>
            </button>
          ))}
          {canAddCustomItems && <AddItemRow onAdd={(label) => addHomeTask(trip.id, label)} />}
        </div>

        {trip.form.maletas.length > 1 && (
          <Button onClick={() => navigate(`/viaje/${trip.id}/distribucion`)}>Ver cómo repartir en tus valijas</Button>
        )}
        {canUseTemplates && (customItemsInTrip.length > 0 || customHomeTasksInTrip.length > 0) && (
          <Button variant="inverted" onClick={() => setSheet('save')}>
            Guardar ítems como plantilla
          </Button>
        )}
        {canUseTemplates && (
          <Button variant="inverted" onClick={() => setSheet('apply')}>
            Aplicar una plantilla
          </Button>
        )}
        {canClone && (
          <Button variant="inverted" onClick={handleClone}>
            Repetir este viaje
          </Button>
        )}
        {!canAddCustomItems && (
          <Button variant="inverted" onClick={() => setShowPaywall(true)}>
            {LockIcon} Desbloquear ítems propios, plantillas y repetir viaje
          </Button>
        )}
        {canExport && (
          <Button variant="inverted" onClick={handleShare}>
            {copied ? 'Copiado ✓' : 'Compartir checklist'}
          </Button>
        )}
        <Button variant="teal" className={styles.saveButton} onClick={() => navigate('/viajes')}>
          Ver mis viajes
        </Button>
        <div style={{ height: 16 }} />
      </div>

      <div style={{ flex: 1 }} />
      <BottomNav active="checklist" />

      {showPaywall && <PaywallSheet onClose={() => setShowPaywall(false)} />}

      {sheet === 'save' && (
        <SaveTemplateSheet
          items={customItemsInTrip}
          homeTasks={customHomeTasksInTrip}
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
