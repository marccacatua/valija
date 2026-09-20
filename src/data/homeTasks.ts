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

/**
 * "¿Está todo listo para zarpar?" — mismo mecanismo que `buildHomeChecklist`
 * (tildar, agregar a mano, deshacer), pero para la embarcación: seguridad
 * y logística del barco, no pertenencias personales (eso vive en la
 * categoría "nautica" de `buildRawItems`). A propósito NO reemplaza la
 * lista de casa: quien sale a navegar probablemente también tenga que
 * dejar algo pronto en su casa antes de salir — las dos listas aparecen
 * juntas cuando `turismo === 'navegar'`. Orden: seguridad primero (lo
 * que salva vidas), después logística/mecánica del barco, por último
 * comunicación y planificación de la salida.
 */
const BOAT_TASKS = [
  'Chalecos salvavidas (uno por tripulante)',
  'Botiquín',
  'Extintor',
  'Bengalas',
  'Ancla y cabo en condiciones',
  'Luces de navegación',
  'Bomba de achique',
  'Nivel de combustible',
  'Batería cargada',
  'Documentación y matrícula de la embarcación',
  'Radio VHF u otro medio de comunicación',
  'Pronóstico meteorológico revisado',
  'Plan de navegación avisado a alguien en tierra',
];

export function buildBoatChecklist(form: TripFormState): HomeTask[] {
  if (form.motivo === 'trabajo' || form.turismo !== 'navegar') return [];
  return BOAT_TASKS.map((label, i) => ({ id: `boat-${i}`, label, done: false }));
}
