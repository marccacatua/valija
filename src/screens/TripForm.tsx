import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { DEFAULT_FORM } from '../data/trip';
import { Button } from '../components/Button';
import { OptionCard } from '../components/OptionCard';
import { OptionChip } from '../components/OptionChip';
import { SectionLabel } from '../components/SectionLabel';
import { DurationStepper } from '../components/DurationStepper';
import { BackArrowIcon, ClimaIcons, DestIcons, MaletaIcons } from '../components/icons';
import { useTrips } from '../hooks/useTrips';
import { useLastTripId } from '../hooks/useLastTripId';
import type { TripFormState } from '../types';
import styles from './TripForm.module.css';

export function TripForm() {
  const navigate = useNavigate();
  const { addTrip } = useTrips();
  const [, setLastTripId] = useLastTripId();
  const [form, setForm] = useState<TripFormState>(DEFAULT_FORM);

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

  const handleGenerate = () => {
    const trip = addTrip(form);
    setLastTripId(trip.id);
    navigate(`/viaje/${trip.id}`);
  };

  const itemsPreview = countItems(form);

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/viajes')} aria-label="Volver">
            {BackArrowIcon}
          </button>
          <div>
            <div className={styles.headerTitle}>Nuevo viaje</div>
            <div className={styles.headerSubtitle}>Todo con un toque · sin escribir nada</div>
          </div>
        </div>
      </div>

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
          <SectionLabel>Clima</SectionLabel>
          <div className={styles.grid4}>
            {CLIMA_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                compact
                label={opt.label}
                icon={ClimaIcons[opt.key]}
                selected={form.clima === opt.key}
                onSelect={() => set('clima', opt.key)}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Vestuario</SectionLabel>
          <div className={styles.wrap}>
            <OptionChip
              label="Sumar vestidos / pollera"
              selected={form.vestidos}
              onSelect={() => set('vestidos', !form.vestidos)}
            />
          </div>
        </div>

        <div>
          <SectionLabel>Motivo</SectionLabel>
          <div className={styles.wrap}>
            {MOTIVO_OPTIONS.map((opt) => (
              <OptionChip key={opt.key} label={opt.label} selected={form.motivo === opt.key} onSelect={() => set('motivo', opt.key)} />
            ))}
          </div>
        </div>

        {form.motivo !== 'trabajo' && (
          <div>
            <SectionLabel>Tipo de turismo</SectionLabel>
            <div className={styles.wrap}>
              {TURISMO_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt.key}
                  label={opt.label}
                  selected={form.turismo === opt.key}
                  onSelect={() => set('turismo', opt.key)}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Alojamiento</SectionLabel>
          <div className={styles.wrap}>
            {ALOJ_OPTIONS.map((opt) => (
              <OptionChip key={opt.key} label={opt.label} selected={form.aloj === opt.key} onSelect={() => set('aloj', opt.key)} />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Transporte</SectionLabel>
          <div className={styles.wrap}>
            {TRANSPORTE_OPTIONS.map((opt) => (
              <OptionChip
                key={opt.key}
                label={opt.label}
                selected={form.transporte === opt.key}
                onSelect={() => set('transporte', opt.key)}
              />
            ))}
          </div>
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

        <div>
          <SectionLabel>Duración</SectionLabel>
          <DurationStepper days={form.dias} onChange={(next) => set('dias', next)} />
        </div>

        <div className={styles.scrollPad} />
      </div>

      <div className={styles.footer}>
        <Button onClick={handleGenerate}>Armar mi valija · {itemsPreview} ítems</Button>
      </div>
    </div>
  );
}
