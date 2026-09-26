import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ALOJ_OPTIONS,
  CLIMA_OPTIONS,
  DEST_OPTIONS,
  MALETA_OPTIONS,
  MOTIVO_OPTIONS,
  TRANSPORTE_OPTIONS,
  TURISMO_OPTIONS,
} from '../data/catalog';
import { countItems } from '../data/buildItems';
import { DEFAULT_FORM, LAVA_ROPA_AUTO_DIAS } from '../data/trip';
import { mergeTripForm } from '../data/mergeTrip';
import { Button } from '../components/Button';
import { Mascot } from '../components/Mascot';
import { OptionCard } from '../components/OptionCard';
import { OptionChip } from '../components/OptionChip';
import { PaywallSheet } from '../components/PaywallSheet';
import { SectionLabel } from '../components/SectionLabel';
import { DurationStepper } from '../components/DurationStepper';
import { BackArrowIcon, ClimaIcons, DestIcons, MaletaIcons, MascotaIcon, NinoIcon } from '../components/icons';
import { FREE_TRIP_LIMIT, useFeatureFlag, useIsPro } from '../features/flags';
import { useTrips } from '../hooks/useTrips';
import { useLastTripId } from '../hooks/useLastTripId';
import type { TripFormState } from '../types';
import styles from './TripForm.module.css';

export function TripForm() {
  const navigate = useNavigate();
  const { trips, addTrip, getTrip, editTrip } = useTrips();
  const [, setLastTripId] = useLastTripId();
  const [isPro] = useIsPro();
  const canExtraCategories = useFeatureFlag('extraCategories');
  // Con /viaje/:tripId/editar, el mismo formulario edita un viaje ya
  // creado: arranca con sus opciones y guarda con mergeTripForm (sin
  // perder tildes, cantidades ni ítems propios).
  const { tripId } = useParams<{ tripId: string }>();
  const editing = tripId ? getTrip(tripId) : undefined;
  const [form, setForm] = useState<TripFormState>(() => editing?.form ?? DEFAULT_FORM);
  const [showPaywall, setShowPaywall] = useState(false);
  // "Lavar ropa" automático en viajes largos: se marca solo al llegar a
  // LAVA_ROPA_AUTO_DIAS, y se desmarca solo si se vuelve a acortar el
  // viaje — mientras la persona no lo haya tocado a mano. Si lo toca, su
  // elección manda y no se vuelve a cambiar solo.
  // Al editar, lo que ya estaba elegido se respeta: no se marca solo.
  const [lavaRopaTouched, setLavaRopaTouched] = useState(Boolean(editing));
  const [lavaRopaAuto, setLavaRopaAuto] = useState(false);

  // Tope de la versión gratis: se chequea acá (antes de mostrar el
  // formulario) y no recién al tocar "Armar mi valija", para no hacer
  // llenar todo el form a alguien que ya está en el límite.
  const atFreeLimit = !editing && !isPro && trips.length >= FREE_TRIP_LIMIT;

  const set = <K extends keyof TripFormState>(key: K, value: TripFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleMaleta = (key: TripFormState['maletas'][number]) =>
    setForm((prev) => {
      const has = prev.maletas.includes(key);
      if (has && prev.maletas.length === 1) return prev; // siempre al menos una
      const maletas = has ? prev.maletas.filter((m) => m !== key) : [...prev.maletas, key];
      return { ...prev, maletas };
    });

  // Mismo patrón que toggleMaleta: se puede combinar más de un destino
  // (playa + montaña, playa + ciudad) y siempre queda al menos uno.
  const toggleDest = (key: TripFormState['dest'][number]) =>
    setForm((prev) => {
      const has = prev.dest.includes(key);
      if (has && prev.dest.length === 1) return prev;
      const dest = has ? prev.dest.filter((d) => d !== key) : [...prev.dest, key];
      return { ...prev, dest };
    });

  // Bebé, mascota y camping son categorías extra (Pro): sin desbloquear,
  // tocarlas abre el paywall en vez de seleccionarlas.
  const selectBebe = () => {
    if (!canExtraCategories) {
      setShowPaywall(true);
      return;
    }
    set('bebe', !form.bebe);
  };

  const selectMascota = () => {
    if (!canExtraCategories) {
      setShowPaywall(true);
      return;
    }
    set('mascota', !form.mascota);
  };

  const selectAloj = (key: TripFormState['aloj']) => {
    if (key === 'camping' && !canExtraCategories) {
      setShowPaywall(true);
      return;
    }
    set('aloj', key);
  };

  // Mismo patrón que el destino: se pueden combinar varios y siempre queda
  // al menos uno.
  const toggleClima = (key: TripFormState['clima'][number]) =>
    setForm((prev) => {
      const has = prev.clima.includes(key);
      if (has && prev.clima.length === 1) return prev;
      return { ...prev, clima: has ? prev.clima.filter((c) => c !== key) : [...prev.clima, key] };
    });

  const toggleTransporte = (key: TripFormState['transporte'][number]) =>
    setForm((prev) => {
      const has = prev.transporte.includes(key);
      if (has && prev.transporte.length === 1) return prev;
      return { ...prev, transporte: has ? prev.transporte.filter((x) => x !== key) : [...prev.transporte, key] };
    });

  const selectTurismo = (key: TripFormState['turismo'][number]) => {
    if ((key === 'ski' || key === 'navegar' || key === 'buceo') && !canExtraCategories) {
      setShowPaywall(true);
      return;
    }
    setForm((prev) => {
      const has = prev.turismo.includes(key);
      if (has && prev.turismo.length === 1) return prev;
      return { ...prev, turismo: has ? prev.turismo.filter((x) => x !== key) : [...prev.turismo, key] };
    });
  };

  const setDias = (next: number) => {
    if (!lavaRopaTouched && next >= LAVA_ROPA_AUTO_DIAS && !form.lavaRopa) {
      setForm((prev) => ({ ...prev, dias: next, lavaRopa: true }));
      setLavaRopaAuto(true);
      return;
    }
    if (!lavaRopaTouched && next < LAVA_ROPA_AUTO_DIAS && lavaRopaAuto) {
      setForm((prev) => ({ ...prev, dias: next, lavaRopa: false }));
      setLavaRopaAuto(false);
      return;
    }
    set('dias', next);
  };

  const toggleLavaRopa = (next: boolean) => {
    setLavaRopaTouched(true);
    setLavaRopaAuto(false);
    set('lavaRopa', next);
  };

  const handleGenerate = () => {
    const trip = addTrip(form);
    setLastTripId(trip.id);
    navigate(`/viaje/${trip.id}`);
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const res = editTrip(editing.id, form);
    if (!res) return;
    navigate(`/viaje/${editing.id}`, {
      state: { edited: { previous: res.previous, added: res.result.added, removed: res.result.removed } },
    });
  };

  const itemsPreview = countItems(form);
  // Vista previa de lo que va a cambiar si se guarda la edición.
  const editPreview = useMemo(() => (editing ? mergeTripForm(editing, form) : null), [editing, form]);
  const hasSki = form.turismo.includes('ski');
  const hasBuceo = form.turismo.includes('buceo');

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate(editing ? `/viaje/${editing.id}` : '/viajes')}
            aria-label="Volver"
          >
            {BackArrowIcon}
          </button>
          <div>
            <div className={styles.headerTitle}>{editing ? 'Editar viaje' : 'Nuevo viaje'}</div>
            <div className={styles.headerSubtitle}>
              {editing ? 'Lo que ya tildaste y tus ítems propios se mantienen' : 'Todo con un toque · sin escribir nada'}
            </div>
          </div>
        </div>
      </div>

      {atFreeLimit ? (
        <div className={styles.body}>
          <div className={styles.limitState}>
            <Mascot size={64} />
            <div className={styles.limitTitle}>Llegaste al límite de {FREE_TRIP_LIMIT} viajes gratis</div>
            <div className={styles.limitDesc}>
              Borrá o pausá alguno de tus viajes guardados en "Mis viajes" para hacer lugar, o desbloqueá viajes
              ilimitados con Valija Pro.
            </div>
            <Button onClick={() => setShowPaywall(true)}>Desbloquear Valija Pro</Button>
            <Button variant="inverted" onClick={() => navigate('/viajes')}>
              Ir a mis viajes
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.body}>
          <div>
            <SectionLabel hint="opcional">¿A dónde?</SectionLabel>
            <input
              className={styles.nameInput}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej. Bariloche"
            />
          </div>

          <div>
            <SectionLabel>Motivo</SectionLabel>
            <div className={styles.wrap}>
              {MOTIVO_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt.key}
                  label={opt.label}
                  selected={form.motivo === opt.key}
                  onSelect={() => set('motivo', opt.key)}
                />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel hint="elegí uno o varios">Destino</SectionLabel>
            <div className={styles.grid3}>
              {DEST_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.key}
                  label={opt.label}
                  icon={DestIcons[opt.key]}
                  selected={form.dest.includes(opt.key)}
                  onSelect={() => toggleDest(opt.key)}
                />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel hint="elegí uno o varios">Clima</SectionLabel>
            <div className={styles.grid4}>
              {CLIMA_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.key}
                  compact
                  label={opt.label}
                  icon={ClimaIcons[opt.key]}
                  selected={form.clima.includes(opt.key)}
                  onSelect={() => toggleClima(opt.key)}
                />
              ))}
            </div>
          </div>

          {form.motivo !== 'trabajo' && (
            <div>
              <SectionLabel hint="elegí uno o varios">Tipo de turismo</SectionLabel>
              <div className={styles.wrap}>
                {TURISMO_OPTIONS.map((opt) => (
                  <OptionChip
                    key={opt.key}
                    label={opt.label}
                    selected={form.turismo.includes(opt.key)}
                    locked={(opt.key === 'ski' || opt.key === 'navegar' || opt.key === 'buceo') && !canExtraCategories}
                    onSelect={() => selectTurismo(opt.key)}
                  />
                ))}
              </div>
              {(hasSki || hasBuceo) && (
                <>
                  <div className={styles.wrap} style={{ marginTop: 8 }}>
                    <OptionChip
                      label="Llevo mi propio equipo"
                      selected={form.equipoPropio}
                      onSelect={() => set('equipoPropio', !form.equipoPropio)}
                    />
                  </div>
                  <div className={styles.equipoHint}>
                    {hasSki && hasBuceo
                      ? form.equipoPropio
                        ? 'Sumamos esquís, botas y casco, y traje, chaleco, regulador y aletas. El tubo y el lastre se alquilan siempre.'
                        : 'Asumimos que alquilás allá el equipo de esquí y el de buceo.'
                      : hasSki
                        ? form.equipoPropio
                          ? 'Sumamos esquís, botas y casco a tu lista.'
                          : 'Asumimos que alquilás esquís, botas y casco allá.'
                        : form.equipoPropio
                          ? 'Sumamos traje, chaleco, regulador y aletas. El tubo y el lastre se alquilan siempre.'
                          : 'Asumimos que alquilás traje, chaleco, regulador, aletas, tubo y lastre allá.'}
                  </div>
                </>
              )}
              {/* Con varios climas se sugiere SUMAR frío (la playa del mismo
                  viaje puede tener calor), no reemplazar lo elegido. */}
              {hasSki && form.clima.includes('calor') && !form.clima.includes('frio') && (
                <div className={styles.climaWarning}>
                  <span>¿Esquí con calor? En la nieve suele hacer frío.</span>
                  <button type="button" className={styles.climaFix} onClick={() => toggleClima('frio')}>
                    Sumar Frío
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <SectionLabel>Vestuario</SectionLabel>
            <div className={styles.wrap}>
              <OptionChip
                label="Sumar vestidos / pollera"
                selected={form.vestidos}
                onSelect={() => set('vestidos', !form.vestidos)}
              />
              <OptionChip
                label="Voy a hacer deporte"
                selected={form.deporte}
                onSelect={() => set('deporte', !form.deporte)}
              />
            </div>
          </div>

          <div>
            <SectionLabel hint="opcional, elegí uno o los dos">¿Viajás con niño chico y/o mascota?</SectionLabel>
            <div className={styles.grid2}>
              <OptionCard label="Niño chico" icon={NinoIcon} selected={form.bebe} locked={!canExtraCategories} onSelect={selectBebe} />
              <OptionCard label="Mascota" icon={MascotaIcon} selected={form.mascota} locked={!canExtraCategories} onSelect={selectMascota} />
            </div>
          </div>

          <div>
            <SectionLabel>Alojamiento</SectionLabel>
            <div className={styles.wrap}>
              {ALOJ_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt.key}
                  label={opt.label}
                  selected={form.aloj === opt.key}
                  locked={opt.key === 'camping' && !canExtraCategories}
                  onSelect={() => selectAloj(opt.key)}
                />
              ))}
            </div>
            <div className={styles.wrap} style={{ marginTop: 8 }}>
              <OptionChip
                label="Pienso lavar ropa en el viaje"
                selected={form.lavaRopa}
                onSelect={() => toggleLavaRopa(!form.lavaRopa)}
              />
            </div>
          </div>

          <div>
            <SectionLabel hint="elegí uno o varios">Transporte</SectionLabel>
            <div className={styles.wrap}>
              {TRANSPORTE_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt.key}
                  label={opt.label}
                  selected={form.transporte.includes(opt.key)}
                  onSelect={() => toggleTransporte(opt.key)}
                />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Duración</SectionLabel>
            <DurationStepper days={form.dias} onChange={setDias} />
            {lavaRopaAuto && form.lavaRopa && (
              <div className={styles.autoNotice}>
                <span>
                  Como son {LAVA_ROPA_AUTO_DIAS} días o más, marcamos "Pienso lavar ropa en el viaje": la lista calcula la
                  ropa para lavar en el camino.
                </span>
                <button type="button" className={styles.climaFix} onClick={() => toggleLavaRopa(false)}>
                  No voy a lavar
                </button>
              </div>
            )}
          </div>

          <div>
            <SectionLabel hint="elegí una o varias">Tipo de maleta</SectionLabel>
            <div className={styles.grid3}>
              {MALETA_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.key}
                  label={opt.label}
                  icon={MaletaIcons[opt.key]}
                  selected={form.maletas.includes(opt.key)}
                  onSelect={() => toggleMaleta(opt.key)}
                />
              ))}
            </div>
          </div>

          <div className={styles.scrollPad} />
        </div>
      )}

      {!atFreeLimit && (
        <div className={styles.footer}>
          {editing && editPreview ? (
            <>
              <div className={styles.editSummary}>
                {editPreview.added === 0 && editPreview.removed === 0 && editPreview.requantified === 0
                  ? 'Con estos cambios la lista queda igual.'
                  : [
                      editPreview.added > 0 && `Se ${editPreview.added === 1 ? 'suma 1 ítem' : `suman ${editPreview.added} ítems`}`,
                      editPreview.removed > 0 && `se ${editPreview.removed === 1 ? 'saca 1' : `sacan ${editPreview.removed}`}`,
                      editPreview.requantified > 0 &&
                        `${editPreview.requantified === 1 ? 'cambia 1 cantidad' : `cambian ${editPreview.requantified} cantidades`}`,
                    ]
                      .filter(Boolean)
                      .join(', ')
                      .replace(/^./, (c) => c.toUpperCase()) + '.'}
              </div>
              <Button onClick={handleSaveEdit}>Guardar cambios</Button>
            </>
          ) : (
            <Button onClick={handleGenerate}>Armar mi valija · {itemsPreview} ítems</Button>
          )}
        </div>
      )}

      {showPaywall && <PaywallSheet onClose={() => setShowPaywall(false)} />}
    </div>
  );
}
