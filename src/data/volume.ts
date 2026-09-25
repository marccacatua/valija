import type { CategoryKey, MaletaKey, PackingItem } from '../types';

/**
 * Espacio en litros: un tamaño estándar por ítem (por unidad, doblado o
 * guardado como va en una valija) y una capacidad útil por tipo de valija.
 * Es una estimación, no una medición: sirve para decir "tu carry-on va al
 * 87 %" y para avisar cuando no entra todo con números en vez de a ojo.
 *
 * Referencias usadas para las capacidades (útiles, ya descontando ruedas,
 * manijas y el espacio que se pierde al acomodar):
 * - Mochila de mano típica: 20–25 L → 20 L.
 * - Carry-on de cabina (55 × 40 × 20 cm ≈ 44 L por fuera) → 38 L.
 * - Valija de bodega mediana (para 23 kg, 65–70 cm) → 75 L.
 */
export const BAG_CAPACITY_L: Record<MaletaKey, number> = {
  mochila: 20,
  carry: 38,
  bodega: 75,
};

/** Litros por unidad. Los ítems que no están acá (los que agrega el
 * usuario) usan el valor de su categoría (ver CATEGORY_DEFAULT_L). */
export const ITEM_LITERS: Record<string, number> = {
  // Ropa
  'Ropa interior': 0.2,
  Medias: 0.15,
  Pijama: 1,
  Remeras: 0.8,
  'Remeras deportivas': 0.5,
  Camisas: 0.8,
  'Buzo o campera liviana': 2,
  Buzos: 2,
  'Campera abrigada': 6,
  'Rompeviento impermeable': 1.5,
  'Campera liviana para correr': 1,
  'Saco o blazer': 3,
  'Outfit para salir': 1.2,
  Pantalones: 1.5,
  'Vestido o pollera': 0.8,
  'Short o pantalón de trekking': 0.8,
  'Short deportivo': 0.3,
  'Shorts o bermudas': 0.6,
  'Traje de baño': 0.3,
  Cinturón: 0.2,
  Bufanda: 0.6,
  'Gorro y guantes': 0.6,
  'Gorra o sombrero': 0.8,
  'Ojotas o sandalias': 1,
  'Zapatillas de trekking': 5,
  'Zapatillas cómodas para caminar': 4.5,
  'Championes para correr': 4.5,
  'Zapatos de vestir': 4,
  'Calzado para salir': 3.5,
  'Botas o calzado de abrigo': 6,
  // Higiene
  'Cepillo de dientes': 0.05,
  'Pasta de dientes': 0.15,
  'Pasta de dientes (mini, <100 ml)': 0.1,
  'Pasta de dientes (envase de 100 ml o menos)': 0.1,
  'Enjuague bucal': 0.5,
  Desodorante: 0.2,
  'Shampoo y acondicionador': 0.6,
  'Shampoo (mini, <100 ml)': 0.1,
  'Shampoo y acondicionador (envase de 100 ml o menos)': 0.2,
  'Skincare / crema': 0.2,
  'Afeitadora, pinza y corta uñas': 0.3,
  'Botiquín básico': 0.8,
  'Protector solar': 0.25,
  Repelente: 0.2,
  'Toalla de secado rápido': 0.8,
  'Vaselina (para la barba, ayuda a sellar la máscara)': 0.1,
  'Líquidos en envases de 100 ml': 0,
  // Documentos (todo cabe en la billetera o una carpeta)
  'DNI y pasaporte': 0.05,
  'Libreta de conducir': 0.02,
  'Pasajes / boarding pass': 0.02,
  'Reserva de alojamiento': 0.02,
  Billetera: 0.2,
  'Tarjetas y efectivo': 0.02,
  'Seguro de viaje': 0.02,
  'Confirmar que el pasaje incluye la valija de bodega': 0,
  'Seguro del auto y VTV': 0.02,
  'Credencial y tarjeta corporativa': 0.02,
  'Certificación de buceo (tarjeta PADI/SSI) y bitácora': 0.2,
  // Electrónica
  'Cargador del celular': 0.2,
  'Power bank': 0.3,
  Auriculares: 0.3,
  'Cable de carga extra': 0.1,
  'Adaptador de enchufe': 0.2,
  'Notebook y cargador': 2.5,
  'Cámara y memoria': 1,
  // Extras
  Candado: 0.1,
  'Candado para la valija de bodega': 0.1,
  'Candado para el carry-on': 0.1,
  'Lentes de sol': 0.3,
  'Bolsa para ropa sucia': 0.2,
  'Bolsas ziploc': 0.05,
  'Botella reutilizable': 0.8,
  'Antifaz y tapones': 0.2,
  'Almohada de viaje': 2,
  'Mate y termo': 2,
  'Snacks para el camino': 1,
  'Riñonera o bolso cruzado': 0.8,
  'Paraguas plegable': 0.6,
  'Toallón de playa': 2.5,
  'Libro o e-reader': 0.5,
  // Bebé
  Pañales: 4,
  'Toallitas húmedas': 0.8,
  'Crema para la irritación': 0.15,
  Termómetro: 0.05,
  'Medicación habitual y antifebril infantil': 0.3,
  'Botiquín pediátrico básico (suero fisiológico, curitas chicas)': 0.5,
  'Mamadera o vasito': 0.5,
  Babero: 0.1,
  'Utensilios de comida': 0.3,
  'Chupete y mordillo': 0.1,
  'Mantita o saco de dormir': 1.5,
  'Mudas de ropa de bebé': 0.4,
  'Pijamas de bebé': 0.4,
  'Traje de baño de bebé': 0.2,
  'Gorro y protector solar de bebé': 0.4,
  'Chaleco salvavidas de bebé': 3,
  'Entretenimiento para el viaje': 1,
  // Mascota
  Correa: 0.3,
  'Plato de comida y agua': 0.8,
  'Comida para los días de viaje': 4,
  'Cama o manta': 4,
  'Juguete favorito': 0.5,
  'Bolsas para las heces': 0.1,
  'Libreta sanitaria y vacunas': 0.05,
  'Medicación habitual (si toma)': 0.2,
  'Chaleco salvavidas para mascota': 2,
  // Esquí
  'Primera piel térmica (parte de arriba)': 0.4,
  'Primera piel térmica (parte de abajo)': 0.4,
  'Segunda capa de polar': 2,
  'Campera de nieve': 8,
  'Pantalón de nieve': 4,
  'Medias de ski': 0.25,
  'Guantes de nieve': 1,
  'Gorro térmico': 0.3,
  'Cuello o buff': 0.1,
  Antiparras: 1,
  Casco: 7,
  'Botas de esquí': 18,
  'Botas de nieve para caminar': 7,
  'Labial con protector solar (FPS)': 0.02,
  // Náutica
  'Calzado náutico antideslizante': 3.5,
  'Guantes de vela': 0.3,
  'Cordón flotante para los lentes de sol': 0.05,
  'Gorra o sombrero con barbijo': 0.8,
  'Abrigo extra en capas (en el mar hace más frío y viento que en tierra)': 3,
  'Muda de ropa extra (por si te mojás)': 2,
  'Bolsa estanca para celular y documentos': 0.5,
  'Pastillas para el mareo': 0.05,
  // Buceo
  'Traje de neopreno grueso (7mm) o semiseco': 8,
  'Traje de neopreno intermedio (5mm)': 5,
  'Traje de neopreno fino (3mm) o shorty': 3,
  'Chaleco compensador (BCD)': 10,
  'Regulador y octopus': 4,
  'Computadora de buceo': 0.3,
  'Máscara de buceo': 1,
  Snorkel: 0.5,
  'Aletas de buceo': 6,
  'Botas de neopreno': 1.5,
  'Guantes de neopreno': 0.5,
  'Boya de señalización de superficie': 1,
};

/** Para los ítems que agrega el usuario (no tienen tamaño propio). */
const CATEGORY_DEFAULT_L: Record<CategoryKey, number> = {
  docs: 0.05,
  tech: 0.3,
  higiene: 0.3,
  extras: 0.5,
  ropa: 0.8,
  bebe: 0.8,
  mascota: 1,
  ski: 1,
  nautica: 0.8,
  buceo: 1.5,
  camping: 0,
};

/**
 * Ítems que no van DENTRO de ninguna valija: se llevan o despachan aparte
 * (el cochecito y la butaca se entregan en la puerta del avión o van en
 * el auto, la transportadora es el bulto de la mascota, los esquís van en
 * su funda). Junto con la categoría "camping" (carpa, bolsa de dormir...)
 * forman la sección "Va aparte" del reparto y no suman litros.
 */
export const SEPARATE_ITEMS = [
  'Cochecito o mochila portabebé',
  'Butaca para auto',
  'Transportadora',
  'Esquís y bastones (o tabla de snowboard)',
];

export function isSeparateItem(item: PackingItem): boolean {
  return item.cat === 'camping' || SEPARATE_ITEMS.includes(item.name);
}

/** Litros de UNA unidad del ítem. */
export function itemLiters(item: Pick<PackingItem, 'name' | 'cat'>): number {
  return ITEM_LITERS[item.name] ?? CATEGORY_DEFAULT_L[item.cat];
}

// Lo que se lleva puesto el día del viaje no ocupa lugar en la valija: el
// abrigo más grande, el calzado más grande, y un pantalón y una remera.
const WORN_OUTERWEAR = [
  'Campera de nieve',
  'Campera abrigada',
  'Saco o blazer',
  'Buzo o campera liviana',
  'Rompeviento impermeable',
  'Campera liviana para correr',
];
const WORN_SHOES = [
  'Botas de nieve para caminar',
  'Botas o calzado de abrigo',
  'Zapatillas de trekking',
  'Zapatillas cómodas para caminar',
  'Championes para correr',
  'Zapatos de vestir',
  'Calzado para salir',
  'Calzado náutico antideslizante',
  'Ojotas o sandalias',
];
const WORN_BASICS = ['Pantalones', 'Remeras'];

/** Ids de los ítems de los que se descuenta 1 unidad por ir puestos. */
export function wornItemIds(items: PackingItem[]): Set<string> {
  const ids = new Set<string>();
  const biggest = (names: string[]) => {
    const candidates = items.filter((i) => names.includes(i.name));
    candidates.sort((a, b) => itemLiters(b) - itemLiters(a));
    return candidates[0];
  };
  const outer = biggest(WORN_OUTERWEAR);
  if (outer) ids.add(outer.id);
  const shoes = biggest(WORN_SHOES);
  if (shoes) ids.add(shoes.id);
  for (const i of items) if (WORN_BASICS.includes(i.name)) ids.add(i.id);
  return ids;
}
