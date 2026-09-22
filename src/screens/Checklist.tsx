import { useEffect, useRef, useState } from 'react';
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
import { UndoSnackbar } from '../components/UndoSnackbar';
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
    toggleBoatTask,
    addBoatTask,
    removeBoatTask,
    addCustomItem,
    removeItem,
    restoreItem,
    restoreHomeTask,
    restoreBoatTask,
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
  // Guarda lo último borrado (ítem o tarea de casa) para poder ofrecer
  // "Deshacer" un rato corto — ver UndoSnackbar. Si se borra otra cosa
  // mientras tanto, se pisa: solo se puede deshacer el borrado más reciente.
  const [pendingUndo, setPendingUndo] = useState<
    | { kind: 'item'; data: PackingItem; index: number }
    | { kind: 'homeTask'; data: HomeTask; index: number }
    | { kind: 'boatTask'; data: HomeTask; index: number }
    | null
  >(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trip = getTrip(tripId);
  const items = trip?.items ?? [];
  const homeChecklist = trip?.homeChecklist ?? [];
  const boatChecklist = trip?.boatChecklist ?? [];

  useEffect(() => {
    if (trip) setLastTripId(trip.id);
  }, [trip, setLastTripId]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

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

  // Mismo criterio que las categorías de arriba: las tareas tildadas bajan
  // al fondo de "¿Quedó todo pronto en casa?"/"¿Está todo listo para
  // zarpar?" en vez de quedarse mezcladas con las pendientes.
  const sortedHomeChecklist = [...homeChecklist].sort((a, b) => Number(a.done) - Number(b.done));
  const sortedBoatChecklist = [...boatChecklist].sort((a, b) => Number(a.done) - Number(b.done));

  // El hook necesita el orden VISIBLE actual en cada render para poder
  // compararlo contra el anterior — por eso se llama acá arriba, antes de
  // cualquier return, con el id de cada ítem tal como aparece hoy en la
  // vista detallada (categoría por categoría, tildados al fondo) más las
  // tareas de casa y de barco, que se reordenan con el mismo criterio.
  const registerItemNode = useFlipReorder([
    ...groups.flatMap((g) => g.list.map((i) => i.id)),
    ...sortedHomeChecklist.map((t) => t.id),
    ...sortedBoatChecklist.map((t) => t.id),
  ]);
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

  const UNDO_TIMEOUT_MS = 5000;

  const armUndo = (undo: NonNullable<typeof pendingUndo>) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setPendingUndo(undo);
    undoTimeoutRef.current = setTimeout(() => setPendingUndo(null), UNDO_TIMEOUT_MS);
  };

  // Borra al toque (sin pedir confirmación: es una acción muy frecuente y
  // casi siempre a propósito) pero deja un rato corto para deshacer, por
  // si el toque fue sin querer.
  const handleRemoveItem = (item: PackingItem) => {
    const index = items.findIndex((i) => i.id === item.id);
    removeItem(trip.id, item.id);
    armUndo({ kind: 'item', data: item, index });
  };

  const handleRemoveHomeTask = (task: HomeTask) => {
    const index = homeChecklist.findIndex((t) => t.id === task.id);
    removeHomeTask(trip.id, task.id);
    armUndo({ kind: 'homeTask', data: task, index });
  };

  const handleRemoveBoatTask = (task: HomeTask) => {
    const index = boatChecklist.findIndex((t) => t.id === task.id);
    removeBoatTask(trip.id, task.id);
    armUndo({ kind: 'boatTask', data: task, index });
  };

  const handleUndo = () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    if (pendingUndo?.kind === 'item') restoreItem(trip.id, pendingUndo.data, pendingUndo.index);
    else if (pendingUndo?.kind === 'homeTask') restoreHomeTask(trip.id, pendingUndo.data, pendingUndo.index);
    else if (pendingUndo?.kind === 'boatTask') restoreBoatTask(trip.id, pendingUndo.data, pendingUndo.index);
    setPendingUndo(null);
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
                onClick={() => handleRemoveItem(item)}
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

  // Casa y barco comparten exactamente el mismo layout — título, hint,
  // lista tildable con FLIP, borrar/deshacer, agregar a mano — con datos
  // y handlers distintos. Una sola función en vez de duplicar el JSX.
  const taskSection = (opts: {
    title: string;
    hint: string;
    tasks: HomeTask[];
    sorted: HomeTask[];
    onToggle: (taskId: string) => void;
    onRemove: (task: HomeTask) => void;
    onAdd: (label: string) => void;
  }) => (
    <div className={styles.homeSection}>
      <div className={styles.homeSectionHeader}>
        <span className={styles.homeSectionTitle}>{opts.title}</span>
        <span className={styles.groupCount}>
          {opts.tasks.filter((t) => t.done).length}/{opts.tasks.length}
        </span>
      </div>
      <div className={styles.homeSectionHint}>{opts.hint}</div>
      {opts.sorted.map((task) => (
        <button key={task.id} ref={registerItemNode(task.id)} type="button" className={styles.item} onClick={() => opts.onToggle(task.id)}>
          <span className={`${styles.checkbox} ${task.done ? styles.checkboxDone : ''}`}>✓</span>
          <span className={`${styles.itemName} ${task.done ? styles.itemNameDone : ''}`}>{task.label}</span>
          <span onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.removeBtn} onClick={() => opts.onRemove(task)} aria-label={`Borrar ${task.label}`}>
              ×
            </button>
          </span>
        </button>
      ))}
      {canAddCustomItems && <AddItemRow onAdd={opts.onAdd} />}
    </div>
  );

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

        {/* Con turismo === 'navegar' (ver buildBoatChecklist), el barco
            REEMPLAZA a la de casa en vez de sumarse — decidido por el
            usuario al ver las dos juntas en un preview real ("se ve
            mal"). homeChecklist se sigue generando igual por dentro
            (no se tocó el modelo de datos), solo se prioriza cuál se
            muestra. */}
        {boatChecklist.length > 0
          ? taskSection({
              title: '¿Está todo listo para zarpar?',
              hint: 'Seguridad y logística de la embarcación — no tiene nada que ver con la valija personal.',
              tasks: boatChecklist,
              sorted: sortedBoatChecklist,
              onToggle: (taskId) => toggleBoatTask(trip.id, taskId),
              onRemove: handleRemoveBoatTask,
              onAdd: (label) => addBoatTask(trip.id, label),
            })
          : taskSection({
              title: '¿Quedó todo pronto en casa?',
              hint: 'No suma al progreso de la valija — son cosas para dejar resueltas antes de salir.',
              tasks: homeChecklist,
              sorted: sortedHomeChecklist,
              onToggle: (taskId) => toggleHomeTask(trip.id, taskId),
              onRemove: handleRemoveHomeTask,
              onAdd: (label) => addHomeTask(trip.id, label),
            })}

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

      {pendingUndo && (
        <UndoSnackbar
          message={pendingUndo.kind === 'item' ? `"${pendingUndo.data.name}" borrado` : `"${pendingUndo.data.label}" borrada`}
          onUndo={handleUndo}
        />
      )}

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
