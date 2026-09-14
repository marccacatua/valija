import { Capacitor } from '@capacitor/core';
import type { ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Capa fina sobre @capacitor/haptics: en la app nativa dispara feedback
 * háptico real; en la web/PWA es un no-op silencioso (no hay vibración
 * confiable en Safari, y no vale la pena la complejidad de la Vibration
 * API para un feedback que en web no se nota igual). Nunca puede tirar
 * la interacción del usuario abajo, así que todo va envuelto en
 * try/catch y sin awaitear la promesa desde donde se llama.
 */
let haptics: typeof import('@capacitor/haptics').Haptics | null = null;
let loading: Promise<void> | null = null;

function loadHaptics() {
  if (!loading) {
    loading = import('@capacitor/haptics').then((mod) => {
      haptics = mod.Haptics;
    });
  }
  return loading;
}

async function impact(style: ImpactStyle) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await loadHaptics();
    await haptics?.impact({ style });
  } catch {
    // Dispositivo sin motor háptico, o plugin no disponible — no es crítico.
  }
}

async function notification(type: NotificationType) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await loadHaptics();
    await haptics?.notification({ type });
  } catch {
    // idem
  }
}

/** Toque liviano — la interacción que más se repite (tildar un ítem,
 * una tarea de casa, un grupo entero en la vista rápida). */
export function hapticTap() {
  void impact('LIGHT' as ImpactStyle);
}

/** Toque un poco más marcado — acciones con más peso (marcar un viaje
 * como finalizado, borrar algo). */
export function hapticMedium() {
  void impact('MEDIUM' as ImpactStyle);
}

/** Patrón de éxito — reservado para momentos de cierre real (ej. llegar
 * al 100% de la checklist), no para cualquier tilde. */
export function hapticSuccess() {
  void notification('SUCCESS' as NotificationType);
}
