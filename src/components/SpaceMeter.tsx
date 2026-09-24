import { MALETA_OPTIONS, labelFor } from '../data/catalog';
import type { FitPlan, SpaceSummary } from '../data/distribute';
import { fmtLiters, t, tn } from '../i18n';
import styles from './SpaceMeter.module.css';

interface SpaceMeterProps {
  summary: SpaceSummary;
  /** Plan para bajar cantidades si no entra (ver fitToBags). */
  fitPlan: FitPlan | null;
  onFit: () => void;
  onChangeBags: () => void;
}


/**
 * "Tu carry-on, al 87 %": cuánto ocupa el viaje en las valijas elegidas,
 * estimado con los litros estándar de cada ítem (ver data/volume.ts).
 * Verde hasta 85 %, mostaza hasta 100 % ("va justo"), coral si no entra
 * — y en ese caso ofrece cambiar las valijas ahí mismo.
 */
export function SpaceMeter({ summary, fitPlan, onFit, onChangeBags }: SpaceMeterProps) {
  const { perBag, usedL, capacityL, pct, overflow } = summary;
  const single = perBag.length === 1;
  const title = single
    ? t('Espacio en tu {bag}', { bag: labelFor(MALETA_OPTIONS, perBag[0].bag).toLowerCase() })
    : t('Espacio en tus valijas');
  const level = overflow || pct > 100 ? 'over' : pct >= 85 ? 'tight' : 'ok';

  return (
    <div className={`${styles.card} ${styles[level]}`}>
      <div className={styles.head}>
        <span className={styles.title}>{title}</span>
        <span className={styles.pct}>{pct} %</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className={styles.detail}>
        {t('Unos {used} L de {cap} L · estimado con tamaños estándar, sin contar lo que llevás puesto.', { used: fmtLiters(usedL), cap: capacityL })}
      </div>
      {level === 'tight' && !overflow && <div className={styles.message}>{t('Va justo: si sumás algo más, quizás no entre.')}</div>}
      {level === 'over' && (
        <div className={styles.message}>
          ⚠️ {t('No te entra todo.')}{' '}
          {fitPlan?.fits && fitPlan.removed > 0
            ? tn(
                fitPlan.removed,
                'Podemos llevar {n} prenda menos (y lavar en el viaje), o sumar una valija.',
                'Podemos llevar {n} prendas menos (y lavar en el viaje), o sumar una valija.',
              )
            : t('Ni bajando cantidades entra: conviene sumar una valija más, o una más grande.')}
          {fitPlan?.fits && fitPlan.removed > 0 && (
            <button type="button" className={styles.fitBtn} onClick={onFit}>
              {t('Ajustar cantidades para que entre')}
            </button>
          )}
          <button type="button" className={styles.action} onClick={onChangeBags}>
            {t('Cambiar valijas')}
          </button>
        </div>
      )}
    </div>
  );
}
