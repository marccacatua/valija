import type { CategoryKey, PackingItem, TripFormState } from '../types';

interface RawItem {
  cat: CategoryKey;
  name: string;
  qty: number;
}

const cap = (n: number, max: number) => Math.min(n, max);

/**
 * Orden de empaque dentro de la categoría "ropa": interior -> arriba ->
 * abajo -> accesorios -> calzado (el calzado queda último a propósito,
 * ocupa espacio y conviene acomodarlo al fondo/costado de la valija).
 * Cualquier ítem de ropa que no esté en esta lista (no debería pasar, la
 * lista cubre todo lo que genera buildRawItems) queda al final.
 */
const ROPA_ORDER = [
  // interior
  'Ropa interior',
  'Medias',
  'Pijama',
  // arriba
  'Remeras',
  'Remeras deportivas',
  'Camisas',
  'Buzo o campera liviana',
  'Buzos',
  'Campera abrigada',
  'Rompeviento impermeable',
  'Saco o blazer',
  'Outfit para salir',
  // abajo
  'Pantalones',
  'Short o pantalón de trekking',
  'Traje de baño',
  // accesorios
  'Lentes de sol',
  'Cinturón',
  'Bufanda',
  'Gorro y guantes',
  'Gorra o sombrero',
  // calzado (último)
  'Ojotas o sandalias',
  'Zapatillas de trekking',
  'Zapatillas cómodas para caminar',
  'Zapatos de vestir',
  'Calzado para salir',
  'Botas o calzado de abrigo',
];

/**
 * Reglas de armado de checklist, portadas del prototipo de Claude Design
 * (Valija.dc.html). Es una función pura: mismo form -> mismos ítems, sin
 * estado ni ids, para que sea fácil de testear y de ajustar reglas.
 */
export function buildRawItems(f: TripFormState): RawItem[] {
  const d = f.dias;
  const out: RawItem[] = [];
  const add = (cat: CategoryKey, name: string, qty?: number) =>
    out.push({ cat, name, qty: qty ?? 1 });
  // "Tipo de turismo" no se le pregunta a quien viaja por trabajo (ver
  // TripForm.tsx), así que sus reglas no deben depender de un valor de
  // turismo que el usuario nunca eligió.
  const leisure = f.motivo !== 'trabajo';

  add('ropa', 'Remeras', cap(d, 8));
  add('ropa', 'Ropa interior', cap(d + 1, 10));
  add('ropa', 'Medias', cap(d, 8));
  add('ropa', 'Pantalones', Math.max(1, Math.ceil(d / 4)));
  add('ropa', 'Pijama', d > 5 ? 2 : 1);
  add('ropa', 'Lentes de sol');
  add('ropa', 'Cinturón');
  if (f.clima === 'frio') {
    add('ropa', 'Campera abrigada');
    add('ropa', 'Buzos', 2);
    add('ropa', 'Gorro y guantes');
    add('ropa', 'Bufanda');
    add('ropa', 'Botas o calzado de abrigo');
  }
  if (f.clima === 'templado') add('ropa', 'Buzo o campera liviana');
  if (f.clima === 'lluvia' || f.dest === 'montana') add('ropa', 'Rompeviento impermeable');
  if (f.dest === 'playa' || f.clima === 'calor') {
    add('ropa', 'Traje de baño', 2);
    add('ropa', 'Gorra o sombrero');
  }
  if (f.dest === 'playa') add('ropa', 'Ojotas o sandalias');
  if (f.dest === 'montana' || (leisure && f.turismo === 'aventura')) add('ropa', 'Zapatillas de trekking');
  if (leisure && f.turismo === 'aventura') {
    add('ropa', 'Remeras deportivas', 2);
    add('ropa', 'Short o pantalón de trekking');
  }
  if (f.dest === 'ciudad') add('ropa', 'Zapatillas cómodas para caminar');
  if (f.motivo === 'trabajo') {
    add('ropa', 'Camisas', 2);
    add('ropa', 'Saco o blazer');
    add('ropa', 'Zapatos de vestir');
  }
  if (leisure && f.turismo === 'fiesta') {
    add('ropa', 'Outfit para salir', 2);
    add('ropa', 'Calzado para salir');
  }

  add('higiene', 'Cepillo y pasta de dientes');
  add('higiene', 'Enjuague bucal');
  add('higiene', 'Desodorante');
  add('higiene', 'Shampoo y acondicionador');
  add('higiene', 'Skincare / crema');
  add('higiene', 'Afeitadora, pinza y corta uñas');
  add('higiene', 'Botiquín básico');
  if (f.dest === 'playa' || f.clima === 'calor') add('higiene', 'Protector solar');
  if ((leisure && f.turismo === 'aventura') || f.dest === 'playa') add('higiene', 'Repelente');
  if (f.aloj === 'hostel' || f.aloj === 'amigos') add('higiene', 'Toalla de secado rápido');
  if (f.maleta === 'carry') add('higiene', 'Líquidos en envases de 100 ml');

  add('docs', 'DNI y pasaporte');
  add('docs', 'Pasajes / boarding pass');
  add('docs', 'Reserva de alojamiento');
  add('docs', 'Billetera');
  add('docs', 'Tarjetas y efectivo');
  if (f.transporte === 'avion') add('docs', 'Seguro de viaje');
  if (f.transporte === 'auto') {
    add('docs', 'Licencia de conducir');
    add('docs', 'Seguro del auto y VTV');
  }
  if (f.motivo === 'trabajo') add('docs', 'Credencial y tarjeta corporativa');

  add('tech', 'Cargador del celular');
  add('tech', 'Power bank');
  add('tech', 'Auriculares');
  add('tech', 'Cable extra', 2);
  if (f.transporte === 'avion') add('tech', 'Adaptador de enchufe');
  if (f.motivo === 'trabajo') add('tech', 'Notebook y cargador');
  if (leisure && (f.turismo === 'cultura' || f.turismo === 'aventura')) add('tech', 'Cámara y memoria');

  add('extras', 'Bolsa para ropa sucia');
  add('extras', 'Bolsas ziploc');
  add('extras', 'Botella reutilizable');
  if (f.aloj === 'hostel' || f.maleta === 'mochila') add('extras', 'Candado');
  if (f.transporte === 'avion' || f.transporte === 'bus') {
    add('extras', 'Antifaz y tapones');
    add('extras', 'Almohada de viaje');
  }
  if (f.transporte === 'auto' || f.transporte === 'bus') {
    add('extras', 'Mate y termo');
    add('extras', 'Snacks para el camino');
  }
  if (leisure && (f.turismo === 'aventura' || f.turismo === 'cultura')) add('extras', 'Riñonera o bolso cruzado');
  if (f.clima === 'lluvia') add('extras', 'Paraguas plegable');
  if (f.dest === 'playa') add('extras', 'Toallón de playa');
  if (leisure && f.turismo === 'relax') add('extras', 'Libro o e-reader');

  const ropaRank = (name: string) => {
    const idx = ROPA_ORDER.indexOf(name);
    return idx === -1 ? ROPA_ORDER.length : idx;
  };
  // Sort estable: solo reordena el bloque de "ropa" entre sí, todo lo
  // demás mantiene el orden en que se agregó arriba.
  out.sort((a, b) => (a.cat === 'ropa' && b.cat === 'ropa' ? ropaRank(a.name) - ropaRank(b.name) : 0));

  return out;
}

export function countItems(f: TripFormState): number {
  return buildRawItems(f).length;
}

export function buildItems(f: TripFormState): PackingItem[] {
  return buildRawItems(f).map((it, i) => ({
    id: `${i}-${it.cat}`,
    cat: it.cat,
    name: it.name,
    qty: it.qty,
    done: false,
  }));
}
