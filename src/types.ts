// Claves de las opciones del formulario de viaje. Se mantienen como union types
// (en vez de string suelto) para que el catálogo y buildItems queden acoplados
// por el compilador: agregar una opción nueva obliga a manejarla en todos lados.
export type DestKey = 'playa' | 'montana' | 'ciudad';
export type ClimaKey = 'calor' | 'templado' | 'frio' | 'lluvia';
export type MotivoKey = 'placer' | 'trabajo';
export type TurismoKey = 'relax' | 'aventura' | 'cultura' | 'fiesta' | 'ski' | 'navegar' | 'buceo';
/** 'camping' es alojamiento (define cómo/dónde dormís), no destino — se
 * puede acampar en la playa, la montaña o el campo por igual. */
export type AlojKey = 'hotel' | 'depto' | 'hostel' | 'amigos' | 'camping';
export type TransporteKey = 'avion' | 'auto' | 'bus' | 'tren';
export type MaletaKey = 'carry' | 'bodega' | 'mochila';

export type CategoryKey = 'ropa' | 'higiene' | 'docs' | 'tech' | 'extras' | 'bebe' | 'mascota' | 'ski' | 'nautica' | 'buceo' | 'camping';

export interface TripFormState {
  name: string;
  /** Array porque se puede combinar más de un destino en el mismo viaje:
   * playa + montaña, playa + ciudad, etc. */
  dest: DestKey[];
  clima: ClimaKey;
  motivo: MotivoKey;
  turismo: TurismoKey;
  aloj: AlojKey;
  transporte: TransporteKey;
  /** Array porque se puede viajar con más de una: carry-on + mochila, bodega + mochila, etc. */
  maletas: MaletaKey[];
  dias: number;
  /** Sumar vestidos/pollera a la checklist. Independiente de todo lo demás:
   * no le preguntamos género a nadie, es una preferencia de vestuario. */
  vestidos: boolean;
  /** Si se va a lavar ropa durante el viaje: baja el cálculo de mudas
   * (remeras/interior/medias) a un tope fijo en vez de escalar con `dias`,
   * sin importar cuánto dure el viaje completo. */
  lavaRopa: boolean;
  /** Viaja con bebé o niño chico: suma la categoría "Bebé" completa,
   * separada del resto (no se mezcla con la ropa/higiene del adulto). */
  bebe: boolean;
  /** Viaja con mascota: suma la categoría "Mascota" completa (correa,
   * comida, transportadora, etc.) — independiente de bebé, se puede
   * combinar (la pregunta del form las junta, pero son dos flags). */
  mascota: boolean;
  /** Va a hacer deporte en el viaje (correr, gimnasio, etc.), más allá
   * del turismo elegido: suma remeras/short deportivo y championes, y
   * unifica con turismo "aventura" para no duplicar ítems si se dan
   * las dos condiciones juntas (ver buildItems.ts). */
  deporte: boolean;
  /** Solo aplica con turismo esquí o buceo: true si la persona lleva su
   * propio equipo en vez de alquilarlo en destino. Cambia qué ítems de
   * equipo pesado aparecen (esquís/botas/casco, o BCD/regulador/traje/
   * aletas). El tubo y el lastre de buceo se alquilan siempre. */
  equipoPropio: boolean;
}

export interface PackingItem {
  id: string;
  cat: CategoryKey;
  name: string;
  qty: number;
  done: boolean;
  /** true si lo agregó el usuario a mano (informativo — cualquier ítem se puede borrar, sea generado o no). */
  isCustom?: boolean;
  /** true si no tiene sentido contarlo (se lleva o no): oculta el +/- en la checklist. */
  noQty?: boolean;
}

/** Tarea de "antes de salir de casa" (apagar luces, cerrar llaves de
 * paso, etc.) — a propósito separada de PackingItem: no es algo que se
 * empaca, así que no suma al contador "X de N empacado". */
export interface HomeTask {
  id: string;
  label: string;
  done: boolean;
  /** true si la agregó el usuario a mano (las generadas por defecto no la
   * tienen) — solo las propias se ofrecen para guardar en una plantilla,
   * igual que con los ítems de la valija. */
  isCustom?: boolean;
}

export interface Trip {
  id: string;
  createdAt: string;
  form: TripFormState;
  items: PackingItem[];
  homeChecklist: HomeTask[];
  /** Lista de tareas de "¿está todo listo para zarpar?" — mismo tipo y
   * mecanismo que `homeChecklist` (tildar, agregar a mano, deshacer),
   * pero para la embarcación, no la casa. Vacía salvo `turismo ===
   * 'navegar'`: no reemplaza `homeChecklist` (dejar algo pronto en casa
   * es independiente de zarpar), se suma aparte. */
  boatChecklist: HomeTask[];
  /** Cuándo se marcó el viaje como finalizado — sin valor significa que
   * sigue activo. Se guarda la fecha (no un simple booleano) por si en
   * el futuro sirve mostrar "finalizado el 12 sept"; hoy solo se usa
   * para ordenar los finalizados al final de "Mis viajes". */
  finishedAt?: string;
}

/** Plantilla personal de ítems (ej. "Kit yacimiento"), privada del
 * usuario — nunca alimenta buildItems(), solo se puede aplicar a mano. */
export interface ItemTemplate {
  id: string;
  name: string;
  items: { cat: CategoryKey; name: string }[];
  /** Tareas de casa incluidas en la plantilla (opcional: las plantillas
   * guardadas antes de esta función no tienen el campo). */
  homeTasks?: string[];
  createdAt: string;
}
