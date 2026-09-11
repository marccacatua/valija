// Claves de las opciones del formulario de viaje. Se mantienen como union types
// (en vez de string suelto) para que el catálogo y buildItems queden acoplados
// por el compilador: agregar una opción nueva obliga a manejarla en todos lados.
export type DestKey = 'playa' | 'montana' | 'ciudad';
export type ClimaKey = 'calor' | 'templado' | 'frio' | 'lluvia';
export type MotivoKey = 'placer' | 'trabajo';
export type TurismoKey = 'relax' | 'aventura' | 'cultura' | 'fiesta';
export type AlojKey = 'hotel' | 'depto' | 'hostel' | 'amigos';
export type TransporteKey = 'avion' | 'auto' | 'bus' | 'tren';
export type MaletaKey = 'carry' | 'bodega' | 'mochila';

export type CategoryKey = 'ropa' | 'higiene' | 'docs' | 'tech' | 'extras';

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
}

export interface Trip {
  id: string;
  createdAt: string;
  form: TripFormState;
  items: PackingItem[];
  homeChecklist: HomeTask[];
}

/** Plantilla personal de ítems (ej. "Kit yacimiento"), privada del
 * usuario — nunca alimenta buildItems(), solo se puede aplicar a mano. */
export interface ItemTemplate {
  id: string;
  name: string;
  items: { cat: CategoryKey; name: string }[];
  createdAt: string;
}
