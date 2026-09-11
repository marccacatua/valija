import type { HomeTask, TripFormState } from '../types';

/**
 * "¿Quedó todo pronto en casa?" — pedido de un amigo que probó la app:
 * antes de salir de viaje hay cosas para dejar resueltas en la casa que
 * no tienen nada que ver con la valija (apagar luces, cerrar llaves de
 * paso...). A propósito NO viven junto a los ítems de PackingItem ni
 * suman al contador de empacado: son una lista de tareas, no de cosas
 * para llevar. Es una lista fija (no depende de destino/clima como el
 * resto de la checklist) salvo la excepción de la heladera, que solo
 * tiene sentido para viajes largos.
 */
const BASE_HOME_TASKS = [
  'Apagar las luces',
  'Cerrar la llave de paso de agua',
  'Cerrar la llave de gas',
  'Sacar la basura',
  'Regar o encargar las plantas',
  'Avisarle a un vecino de confianza',
  'Cerrar bien puertas y ventanas',
  'Cargar todos los dispositivos',
  'Configurar el asistente (Alexa/Google Home) en modo ausente',
];

export function buildHomeChecklist(form: TripFormState): HomeTask[] {
  const labels = [...BASE_HOME_TASKS];
  if (form.dias >= 5) labels.splice(4, 0, 'Vaciar la heladera de comida perecedera');
  return labels.map((label, i) => ({ id: `home-${i}`, label, done: false }));
}
