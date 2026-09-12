import { useState } from 'react';
import { exportBackup, importBackup } from '../data/backup';
import { Button } from './Button';
import styles from './BackupSheet.module.css';

interface BackupSheetProps {
  onClose: () => void;
  onImported: () => void;
}

/**
 * Puente manual entre Safari y la app instalada en la pantalla de inicio
 * (ver comentario en data/backup.ts sobre por qué hace falta): exportar
 * copia todo al portapapeles, importar lo pega y lo suma a lo que ya hay.
 */
export function BackupSheet({ onClose, onImported }: BackupSheetProps) {
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleExport = async () => {
    const data = exportBackup();
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setCopyFallback(null);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Sin acceso al portapapeles: mostramos el texto para copiarlo a mano
      setCopyFallback(data);
    }
  };

  const handleImport = () => {
    setError('');
    setResult(null);
    try {
      const { addedTrips, addedTemplates, unlockedPro } = importBackup(pasteValue);
      const parts = [];
      if (addedTrips > 0) parts.push(`${addedTrips} viaje${addedTrips === 1 ? '' : 's'}`);
      if (addedTemplates > 0) parts.push(`${addedTemplates} plantilla${addedTemplates === 1 ? '' : 's'}`);
      if (unlockedPro) parts.push('Pro desbloqueado');
      setResult(parts.length > 0 ? `Listo: se sumó ${parts.join(' y ')}.` : 'Ya tenías todo esto — no había nada nuevo para sumar.');
      setPasteValue('');
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo restaurar ese texto.');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>Llevar mis datos a otro acceso</div>
        <div className={styles.hint}>
          Safari y el ícono en la pantalla de inicio guardan los datos por separado — esto los pasa de uno al otro.
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>1. Acá tenés tus datos actuales</div>
          <Button variant="inverted" onClick={handleExport}>
            {copied ? 'Copiado ✓' : 'Copiar mis datos'}
          </Button>
          {copyFallback && (
            <>
              <div className={styles.hint}>No se pudo copiar solo — mantené tocado el texto para copiarlo a mano:</div>
              <textarea className={styles.textarea} readOnly value={copyFallback} onFocus={(e) => e.target.select()} />
            </>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>2. Pegalo acá (en el otro acceso)</div>
          <textarea
            className={styles.textarea}
            placeholder="Pegá acá el texto que copiaste del otro lado…"
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
          />
          <Button onClick={handleImport} disabled={!pasteValue.trim()}>
            Restaurar
          </Button>
          {result && <div className={styles.resultOk}>{result}</div>}
          {error && <div className={styles.resultError}>{error}</div>}
        </div>

        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
