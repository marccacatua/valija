import { Capacitor } from '@capacitor/core';
import { persistItem } from '../data/storage';

/**
 * Pedido de calificación en el App Store.
 *
 * Reglas de Apple (guideline 5.6.1): se usa SOLO el cartel oficial de
 * estrellas (SKStoreReviewController). No se puede preguntar antes "¿te
 * gusta?" con un cartel propio y mandar a la tienda solo a quien dice que
 * sí. Además Apple decide si lo muestra y lo limita a 3 veces por año.
 *
 * Criterio: pedirlo en un momento feliz, no al abrir la app. Se pide
 * cuando una persona completa su SEGUNDO viaje al 100 % (ya vio que la app
 * le sirve), y después como mucho una vez cada ASK_EVERY_DAYS días.
 */
const REVIEW_KEY = 'valija:review';
export const PACKED_TRIPS_TO_ASK = 2;
export const ASK_EVERY_DAYS = 120;

export interface ReviewState {
  /** Viajes que alguna vez llegaron al 100 % (cada uno cuenta una vez). */
  packedTripIds: string[];
  /** Última vez que se pidió la calificación (ISO), o null. */
  lastAskedAt: string | null;
}

const EMPTY: ReviewState = { packedTripIds: [], lastAskedAt: null };

/** Decide si corresponde pedir la calificación. Pura, para poder testearla. */
export function shouldAskForReview(state: ReviewState, now: Date): boolean {
  if (state.packedTripIds.length < PACKED_TRIPS_TO_ASK) return false;
  if (!state.lastAskedAt) return true;
  const days = (now.getTime() - new Date(state.lastAskedAt).getTime()) / 86_400_000;
  return days >= ASK_EVERY_DAYS;
}

/** Registra que un viaje quedó al 100 % y devuelve el estado nuevo. Pura. */
export function registerPackedTrip(state: ReviewState, tripId: string): ReviewState {
  if (state.packedTripIds.includes(tripId)) return state;
  return { ...state, packedTripIds: [...state.packedTripIds, tripId] };
}

function readState(): ReviewState {
  try {
    const raw = window.localStorage.getItem(REVIEW_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as ReviewState) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

/**
 * Llamar cuando un viaje llega al 100 % empacado. En la web no hace nada
 * (no hay App Store); en la app nativa, si corresponde, pide el cartel de
 * Apple. Nunca rompe nada si el plugin falla.
 */
export async function onTripFullyPacked(tripId: string): Promise<void> {
  let state = registerPackedTrip(readState(), tripId);
  const now = new Date();
  const ask = Capacitor.isNativePlatform() && shouldAskForReview(state, now);
  if (ask) state = { ...state, lastAskedAt: now.toISOString() };
  persistItem(REVIEW_KEY, JSON.stringify(state));
  if (!ask) return;
  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch {
    // si el plugin no está o falla, no pasa nada: se intenta en otro viaje
  }
}
