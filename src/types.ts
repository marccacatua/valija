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
  dest: DestKey;
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

export interface Trip {
  id: string;
  createdAt: string;
  form: TripFormState;
  items: PackingItem[];
}

/** Plantilla personal de ítems (ej. "Kit yacimiento"), privada del
 * usuario — nunca alimenta buildItems(), solo se puede aplicar a mano. */
export interface ItemTemplate {
  id: string;
  name: string;
  items: { cat: CategoryKey; name: string }[];
  createdAt: string;
}
