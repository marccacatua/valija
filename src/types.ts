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
  maleta: MaletaKey;
  dias: number;
}

export interface PackingItem {
  id: string;
  cat: CategoryKey;
  name: string;
  qty: number;
  done: boolean;
}

export interface Trip {
  id: string;
  createdAt: string;
  form: TripFormState;
  items: PackingItem[];
}
