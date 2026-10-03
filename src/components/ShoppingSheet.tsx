import { useState } from 'react';
import { itemLabel, t } from '../i18n';
import type { PackingItem } from '../types';
import styles from './TemplateSheets.module.css';

interface Props {
  title: string;
  items: PackingItem[];
  onToggleBought: (itemId: string) => void;
  onClose: () => void;
}

const lineFor = (item: PackingItem) => (item.noQty || item.qty <= 1 ? itemLabel(item.name) : `${itemLabel(item.name)} × ${item.qty}`);

/** Texto para mandar por WhatsApp/Notas: solo lo que falta comprar. */
export function shoppingText(title: string, items: PackingItem[]): string {
  const pending = items.filter((i) => !i.bought);
  return [t('Para comprar · {trip}', { trip: title }), ...pending.map((i) => `• ${lineFor(i)}`)].join('\n');
}

/**
 * "Lo tengo que comprar": la lista de compras del viaje. Se tilda lo que
 * se va comprando; cuando el ítem se empaca (tildado en la valija) sale
 * solo de esta lista.
 */
export function ShoppingSheet({ title, items, onToggleBought, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  // Mismo criterio que "Compartir checklist": hoja nativa si existe, si no
  // se copia al portapapeles con un aviso breve.
  const share = async () => {
    const text = shoppingText(title, items);
    if (navigator.share) {
      try {
        await navigator.share({ title: t('Para comprar · {trip}', { trip: title }), text });
      } catch {
        // cerró la hoja de compartir sin elegir nada
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sin permiso de portapapeles
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('Para comprar · {trip}', { trip: title })}>
        <div className={styles.title}>{t('Para comprar · {trip}', { trip: title })}</div>
        <div className={styles.subtitle}>{t('Tildá lo que vas comprando. Cuando lo pongas en la valija, sale solo de esta lista.')}</div>

        <div className={styles.list}>
          {items.map((item) => (
            <button key={item.id} type="button" className={styles.row} onClick={() => onToggleBought(item.id)}>
              <span className={`${styles.checkbox} ${item.bought ? styles.checkboxOn : ''}`}>✓</span>
              <span className={`${styles.name} ${item.bought ? styles.nameDone : ''}`}>{lineFor(item)}</span>
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={share}>
            {copied ? t('Copiado ✓') : t('Compartir lista')}
          </button>
          <button type="button" className={styles.cancel} onClick={onClose}>
            {t('Cerrar')}
          </button>
        </div>
      </div>
    </div>
  );
}
