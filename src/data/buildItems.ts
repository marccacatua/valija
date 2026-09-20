import type { CategoryKey, PackingItem, TripFormState } from '../types';

interface RawItem {
  cat: CategoryKey;
  name: string;
  qty: number;
  /** true si es un ítem que no tiene sentido contar (se lleva o no): oculta el +/- en la checklist. */
  noQty?: boolean;
}

const cap = (n: number, max: number) => Math.min(n, max);

/**
 * Orden de empaque dentro de la categoría "ropa": interior -> arriba ->
 * abajo -> accesorios -> calzado (el calzado queda último a propósito,
 * ocupa espacio y conviene acomodarlo al fondo/costado de la valija).
 * Cualquier ítem de ropa que no esté en esta lista (no debería pasar, la
 * lista cubre todo lo que genera buildRawItems) queda al final.
 */
export const ROPA_ORDER = [
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
  'Campera liviana para correr',
  'Saco o blazer',
  'Outfit para salir',
  // abajo
  'Pantalones',
  'Vestido o pollera',
  'Short o pantalón de trekking',
  'Short deportivo',
  'Shorts o bermudas',
  'Traje de baño',
  // accesorios (lentes de sol vive en "extras", no acá — ver buildRawItems)
  'Cinturón',
  'Bufanda',
  'Gorro y guantes',
  'Gorra o sombrero',
  // calzado (último)
  'Ojotas o sandalias',
  'Zapatillas de trekking',
  'Zapatillas cómodas para caminar',
  'Championes para correr',
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
  // Para ítems que no tiene sentido contar (se llevan o no): el cargador,
  // la botella, el antifaz. Queda siempre en 1, sin +/- en la checklist.
  const addSingle = (cat: CategoryKey, name: string) => out.push({ cat, name, qty: 1, noQty: true });
  // "Tipo de turismo" no se le pregunta a quien viaja por trabajo (ver
  // TripForm.tsx), así que sus reglas no deben depender de un valor de
  // turismo que el usuario nunca eligió.
  const leisure = f.motivo !== 'trabajo';

  // Si se va a lavar ropa, las mudas no escalan con la duración completa
  // del viaje — alcanza con un tope fijo bajo (se van reponiendo). Un
  // viaje corto no se ve afectado (ya estaba por debajo del tope).
  const mudaDias = f.lavaRopa ? Math.min(d, 4) : d;
  // Las remeras se ensucian/transpiran más rápido que el resto de las
  // mudas — conviene un tope algo más alto que el general al lavar ropa,
  // para tener alguna de sobra (incluida una para salir).
  const remerasDias = f.lavaRopa ? Math.min(d, 6) : d;
  // Esquiando pasás casi todo el día con el equipo de nieve puesto (ver
  // más abajo la categoría "ski") — la ropa de calle solo hace falta
  // para las noches y los días de viaje, no escala con la duración
  // completa como en un viaje normal. Se aplica un tope propio, más bajo
  // que el que ya calcula lavaRopa (si se dan las dos condiciones juntas
  // gana la más restrictiva).
  const isSki = leisure && f.turismo === 'ski';
  const isNavegar = leisure && f.turismo === 'navegar';
  add('ropa', 'Remeras', cap(isSki ? Math.min(remerasDias, 4) : remerasDias, 8));
  add('ropa', 'Ropa interior', cap(mudaDias + 1, 10));
  add('ropa', 'Medias', cap(mudaDias, 8));
  // Lavando ropa los pantalones no necesitan escalar con la duración del
  // viaje: se reusan varios días antes de lavarse, a diferencia de
  // remeras/interior/medias.
  const pantalonesBase = f.lavaRopa ? 2 : Math.max(1, Math.ceil(d / 4));
  add('ropa', 'Pantalones', isSki ? Math.min(pantalonesBase, 2) : pantalonesBase);
  add('ropa', 'Pijama', d > 5 ? 2 : 1);
  add('ropa', 'Cinturón');
  if (f.clima === 'frio') {
    add('ropa', 'Campera abrigada');
    add('ropa', 'Buzos', 2);
    add('ropa', 'Gorro y guantes');
    add('ropa', 'Bufanda');
    add('ropa', 'Botas o calzado de abrigo');
  }
  if (f.clima === 'templado') add('ropa', 'Buzo o campera liviana');
  // También para navegar: en el mar hace falta un rompeviento/impermeable
  // igual que en la montaña o con lluvia — mismo ítem, no uno propio de
  // "náutica" (evita duplicar algo que ya existe).
  if (f.clima === 'lluvia' || f.dest.includes('montana') || isNavegar) add('ropa', 'Rompeviento impermeable');
  if (f.dest.includes('playa') || f.clima === 'calor') {
    add('ropa', 'Traje de baño', 2);
    add('ropa', 'Gorra o sombrero');
    add('ropa', 'Shorts o bermudas', cap(Math.ceil(d / 2), 4));
  }
  if (f.dest.includes('playa')) add('ropa', 'Ojotas o sandalias');
  if (f.vestidos) add('ropa', 'Vestido o pollera', Math.max(1, Math.ceil(d / 3)));
  if (f.dest.includes('montana') || (leisure && f.turismo === 'aventura')) add('ropa', 'Zapatillas de trekking');
  if (leisure && f.turismo === 'aventura') add('ropa', 'Short o pantalón de trekking');
  // Turismo "aventura" ya asume que hacés actividad física, pero el
  // checkbox de deporte cubre al resto (trabajo con gimnasio en el
  // hotel, relax en la playa pero corriendo todas las mañanas, etc.) —
  // se unifica para no duplicar "Remeras deportivas" si se dan las dos
  // condiciones juntas.
  const haceDeporte = f.deporte || (leisure && f.turismo === 'aventura');
  if (haceDeporte) {
    // Deportivas se ensucian/transpiran más rápido que la ropa normal —
    // escala con los días en vez de quedar fija en 2, con un piso de 2
    // para viajes cortos.
    add('ropa', 'Remeras deportivas', cap(Math.max(2, Math.ceil(d / 2)), 5));
    add('ropa', 'Short deportivo', cap(Math.ceil(d / 3), 3));
    addSingle('ropa', 'Championes para correr');
    if (f.clima === 'frio' || f.clima === 'lluvia') addSingle('ropa', 'Campera liviana para correr');
  }
  if (f.dest.includes('ciudad')) add('ropa', 'Zapatillas cómodas para caminar');
  // Viaje solo de playa pero largo: en algún momento del viaje hace falta
  // un calzado cómodo que no sea ojota (paseos, terminal, un día nublado).
  else if (f.dest.includes('playa') && d >= 7) add('ropa', 'Zapatillas cómodas para caminar');
  if (f.motivo === 'trabajo') {
    add('ropa', 'Camisas', 2);
    add('ropa', 'Saco o blazer');
    add('ropa', 'Zapatos de vestir');
  }
  if (leisure && f.turismo === 'fiesta') {
    add('ropa', 'Outfit para salir', 2);
    add('ropa', 'Calzado para salir');
  }

  // Si hay bodega, los líquidos grandes van ahí; si además hay una valija
  // "de mano" (carry-on/mochila) y el viaje es largo, sumamos una versión
  // mini de <100ml para tener a mano durante el viaje (ver distribute.ts:
  // esas versiones mini + el cepillo van siempre a la mochila). Sin
  // bodega, todo tiene que entrar en <100ml directamente, no hay versión
  // grande que valga la pena llevar.
  const hasBodega = f.maletas.includes('bodega');
  const hasCarryAlong = f.maletas.includes('carry') || f.maletas.includes('mochila');
  const wantsMiniBackup = hasBodega && hasCarryAlong && d >= 7;

  add('higiene', 'Cepillo de dientes');
  if (hasBodega) {
    add('higiene', 'Pasta de dientes');
    if (wantsMiniBackup) add('higiene', 'Pasta de dientes (mini, <100 ml)');
  } else {
    add('higiene', 'Pasta de dientes (envase de 100 ml o menos)');
  }
  add('higiene', 'Enjuague bucal');
  add('higiene', 'Desodorante');
  if (hasBodega) {
    add('higiene', 'Shampoo y acondicionador');
    if (wantsMiniBackup) add('higiene', 'Shampoo (mini, <100 ml)');
  } else {
    add('higiene', 'Shampoo y acondicionador (envase de 100 ml o menos)');
  }
  add('higiene', 'Skincare / crema');
  add('higiene', 'Afeitadora, pinza y corta uñas');
  add('higiene', 'Botiquín básico');
  // También con esquí (la nieve refleja los rayos, quema igual o más que
  // en la playa) y navegando (el reflejo del agua quema más que en
  // tierra) — mismo ítem genérico, no versiones propias por actividad.
  if (f.dest.includes('playa') || f.clima === 'calor' || isSki || isNavegar) add('higiene', 'Protector solar');
  if ((leisure && f.turismo === 'aventura') || f.dest.includes('playa') || f.aloj === 'camping') add('higiene', 'Repelente');
  if (f.aloj === 'hostel' || f.aloj === 'amigos') add('higiene', 'Toalla de secado rápido');
  // El resto de los líquidos (protector solar, skincare, repelente,
  // enjuague bucal) no tienen versión mini propia; si no hay bodega les
  // toca igual entrar en <100ml, así que dejamos el recordatorio general.
  if (hasCarryAlong && !hasBodega) add('higiene', 'Líquidos en envases de 100 ml');

  // Identificación primero, juntas: DNI/pasaporte y libreta de conducir
  // son las dos cosas que sirven para identificarte, van de la mano.
  add('docs', 'DNI y pasaporte');
  // Sirve como identificación aunque no manejes en el viaje (para alquilar
  // un auto en destino, por ejemplo) — no depende de f.transporte.
  add('docs', 'Libreta de conducir');
  add('docs', 'Pasajes / boarding pass');
  add('docs', 'Reserva de alojamiento');
  add('docs', 'Billetera');
  add('docs', 'Tarjetas y efectivo');
  if (f.transporte === 'avion') add('docs', 'Seguro de viaje');
  if (f.transporte === 'auto') add('docs', 'Seguro del auto y VTV');
  if (f.motivo === 'trabajo') add('docs', 'Credencial y tarjeta corporativa');

  addSingle('tech', 'Cargador del celular');
  addSingle('tech', 'Power bank');
  addSingle('tech', 'Auriculares');
  addSingle('tech', 'Cable de carga extra');
  if (f.transporte === 'avion') addSingle('tech', 'Adaptador de enchufe');
  if (f.motivo === 'trabajo') addSingle('tech', 'Notebook y cargador');
  if (leisure && (f.turismo === 'cultura' || f.turismo === 'aventura')) addSingle('tech', 'Cámara y memoria');

  // El candado va primero en "extras" a propósito: conviene tenerlo bien
  // visible y no perdido en el medio de la lista. Con bodega + carry-on
  // juntos van 2 candados nombrados (uno por valija, ver distribute.ts
  // para cómo se reparten) — si no, alcanza con uno genérico por
  // seguridad en hostel o mochila.
  if (f.maletas.includes('bodega') && f.maletas.includes('carry')) {
    addSingle('extras', 'Candado para la valija de bodega');
    addSingle('extras', 'Candado para el carry-on');
  } else if (f.aloj === 'hostel' || f.maletas.includes('mochila')) {
    addSingle('extras', 'Candado');
  }

  // Extras evaluado ítem por ítem: lo que se "consume" o se usa en más de
  // una unidad (bolsas, snacks) conserva el +/-; lo que es un objeto único
  // (botella, antifaz...) va con addSingle.
  addSingle('extras', 'Lentes de sol');
  addSingle('extras', 'Bolsa para ropa sucia');
  add('extras', 'Bolsas ziploc');
  addSingle('extras', 'Botella reutilizable');
  if (f.transporte === 'avion' || f.transporte === 'bus') {
    addSingle('extras', 'Antifaz y tapones');
    addSingle('extras', 'Almohada de viaje');
  }
  if (f.transporte === 'auto' || f.transporte === 'bus') {
    addSingle('extras', 'Mate y termo');
    add('extras', 'Snacks para el camino');
  }
  if (leisure && (f.turismo === 'aventura' || f.turismo === 'cultura')) addSingle('extras', 'Riñonera o bolso cruzado');
  if (f.clima === 'lluvia') addSingle('extras', 'Paraguas plegable');
  if (f.dest.includes('playa')) addSingle('extras', 'Toallón de playa');
  if (leisure && f.turismo === 'relax') addSingle('extras', 'Libro o e-reader');

  // Categoría propia y separada del resto (no se mezcla con la ropa/
  // higiene del adulto) — mismo criterio que llevó a separar "¿Quedó
  // todo pronto en casa?" de la checklist de empaque.
  if (f.bebe) {
    addSingle('bebe', 'Pañales');
    addSingle('bebe', 'Toallitas húmedas');
    addSingle('bebe', 'Crema para la irritación');
    addSingle('bebe', 'Termómetro');
    addSingle('bebe', 'Medicación habitual y antifebril infantil');
    addSingle('bebe', 'Botiquín pediátrico básico (suero fisiológico, curitas chicas)');
    addSingle('bebe', 'Mamadera o vasito');
    addSingle('bebe', 'Babero');
    addSingle('bebe', 'Utensilios de comida');
    addSingle('bebe', 'Chupete y mordillo');
    addSingle('bebe', 'Mantita o saco de dormir');
    add('bebe', 'Mudas de ropa de bebé', cap(d + 2, 10));
    add('bebe', 'Pijamas de bebé', d > 5 ? 2 : 1);
    if (f.dest.includes('playa') || f.clima === 'calor') {
      add('bebe', 'Traje de baño de bebé', 2);
      addSingle('bebe', 'Gorro y protector solar de bebé');
    }
    if (f.dest.includes('playa')) addSingle('bebe', 'Chaleco salvavidas de bebé');
    if (f.transporte === 'auto') addSingle('bebe', 'Butaca para auto');
    addSingle('bebe', 'Cochecito o mochila portabebé');
    addSingle('bebe', 'Entretenimiento para el viaje');
  }

  // Categoría propia, mismo criterio que "Bebé": independiente del resto,
  // no se mezcla con la ropa/higiene de la persona.
  if (f.mascota) {
    addSingle('mascota', 'Correa');
    addSingle('mascota', 'Plato de comida y agua');
    addSingle('mascota', 'Comida para los días de viaje');
    addSingle('mascota', 'Cama o manta');
    addSingle('mascota', 'Juguete favorito');
    add('mascota', 'Bolsas para las heces');
    addSingle('mascota', 'Libreta sanitaria y vacunas');
    addSingle('mascota', 'Medicación habitual (si toma)');
    if (f.transporte === 'avion') addSingle('mascota', 'Transportadora');
    if (f.dest.includes('playa')) addSingle('mascota', 'Chaleco salvavidas para mascota');
  }

  // Categoría propia: equipo técnico de esquí, distinto de la ropa de
  // calle de arriba (que ya baja de cantidad más arriba, ver isSki).
  // Se asume que esquís, botas de esquí y casco se ALQUILAN en el
  // centro de ski (lo más común) — solo se lista lo personal. Orden:
  // de adentro hacia afuera por capas (primera piel -> polar -> campera
  // y pantalón de nieve), después los accesorios que se usan puestos,
  // el calzado para andar por el pueblo (no la pista) al final, y la
  // protección solar (la nieve refleja tanto o más que la playa).
  if (isSki) {
    // Se ensucian/transpiran como cualquier base layer — escala con los
    // días con un piso de 2, igual criterio que "Remeras deportivas".
    add('ski', 'Primera piel térmica (parte de arriba)', cap(Math.max(2, Math.ceil(d / 3)), 4));
    add('ski', 'Primera piel térmica (parte de abajo)', cap(Math.max(2, Math.ceil(d / 3)), 4));
    // El polar no se ensucia tan rápido, no hace falta uno por día.
    add('ski', 'Segunda capa de polar', d > 4 ? 2 : 1);
    addSingle('ski', 'Campera de nieve');
    addSingle('ski', 'Pantalón de nieve');
    // Se mojan/transpiran cada día de esquí — 1 par por día con un tope
    // más alto que el resto (se pueden secar de un día para el otro).
    add('ski', 'Medias de ski', cap(Math.max(2, d), 6));
    addSingle('ski', 'Guantes de nieve');
    addSingle('ski', 'Gorro térmico');
    addSingle('ski', 'Cuello o buff');
    addSingle('ski', 'Antiparras');
    addSingle('ski', 'Botas de nieve para caminar');
    addSingle('ski', 'Labial con protector solar (FPS)');
  }

  // Categoría propia: equipo personal de navegación — el chequeo de
  // seguridad de la embarcación (chalecos, botiquín, bengalas, etc.) va
  // en una lista aparte (ver `homeTasks.ts` / `boatChecklist`), no acá:
  // esto es lo que la PERSONA se pone/lleva encima, no lo del barco.
  // Orden: calzado -> accesorios propios de estar en cubierta ->
  // protección extra contra frío/agua -> contingencias.
  if (isNavegar) {
    addSingle('nautica', 'Calzado náutico antideslizante');
    addSingle('nautica', 'Guantes de vela');
    // Accesorio para los lentes de sol que ya suma "Extras" — no una
    // segunda gafa, para no duplicar.
    addSingle('nautica', 'Cordón flotante para los lentes de sol');
    addSingle('nautica', 'Gorra o sombrero con barbijo');
    // En el mar hace más frío y viento que en tierra aunque el clima
    // elegido sea "calor" — independiente de la rama de clima, que no
    // lo cubre en ese caso.
    addSingle('nautica', 'Abrigo extra en capas (en el mar hace más frío y viento que en tierra)');
    addSingle('nautica', 'Muda de ropa extra (por si te mojás)');
    addSingle('nautica', 'Bolsa estanca para celular y documentos');
    addSingle('nautica', 'Pastillas para el mareo');
  }

  // Solo si el alojamiento es "Camping" — ítems bien distintos al resto,
  // por eso su propia categoría en vez de mezclarlos en Extras.
  if (f.aloj === 'camping') {
    addSingle('camping', 'Carpa');
    addSingle('camping', 'Bolsa de dormir');
    addSingle('camping', 'Colchoneta o aislante');
    addSingle('camping', 'Linterna o frontal');
    addSingle('camping', 'Encendedor o fósforos');
    addSingle('camping', 'Cuerda');
    addSingle('camping', 'Hacha o machete');
    addSingle('camping', 'Anafe o cocina portátil');
  }

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
    noQty: it.noQty,
  }));
}
