# Backlog

Ideas para próximas versiones, con una nota de cómo encajarían en la
arquitectura actual (para que cualquier sesión futura pueda retomarlas sin
tener que releer todo el historial de chat).

## ~~Agregar ítems a mano~~ ✅ hecho en v0.4.0

Cada categoría de la checklist termina con una fila "Agregar ítem…".
Los ítems agregados así (`isCustom: true`) se pueden borrar con una ×;
los generados por `buildItems()` siguen sin poder borrarse, solo
destildarse. Usa el feature flag `customItems` (sigue en `pro: false`).

## ~~"Valijas tipo" — plantillas de ítems propios~~ ✅ v0.10.0 (parcial)

Se implementó la mitad de esta idea, la de mayor pedido real (caso de
uso concreto: EPP de yacimiento): guardar un grupo de ítems agregados a
mano como plantilla con nombre (`useTemplates`, `ItemTemplate`), y
aplicarla en cualquier viaje futuro. Queda gateada detrás de
`tripTemplates` en `features/flags.ts`.

**Sigue pendiente** la otra mitad, distinta: clonar un viaje anterior
COMPLETO (todas las elecciones del formulario — destino, clima, motivo,
etc.) para no tener que volver a tildar todo. Notas de cuando se pensó:

- El modelo de datos ya lo permite sin cambios: `Trip.form` tiene todas
  las elecciones. "Clonar" = `addTrip(tripAntiguo.form)` para crear un
  viaje nuevo con esa misma configuración (probablemente reseteando
  `dias` o dejando que el usuario lo ajuste antes de generar).
- Candidato a sumarse también a `unlimitedTrips` o un flag propio si se
  quiere limitar cuántos "viajes tipo" completos puede guardar un
  usuario free.

## Pregunta "¿vas a hacer deporte en este viaje?"

Hoy la ropa deportiva sale de `turismo === 'aventura'`, pero motivo y
deporte son independientes (podés viajar por trabajo y entrenar en los
ratos libres).

- Sumar un campo `deporte: boolean` a `TripFormState` (en `types.ts`),
  independiente de `motivo` y `turismo`.
- En `buildItems.ts`, cambiar la condición de ropa deportiva de
  `f.turismo === 'aventura'` a `f.deporte` (o combinar ambas: turismo
  aventura ya asume deporte, pero el checkbox lo cubre para el resto de
  los casos).
- Requiere sumar el control al formulario (`TripForm.tsx`) — probablemente
  un toggle simple, no un grupo de opciones como el resto.

## Modo oscuro

Toggle de tema (claro/oscuro/según sistema), guardado en localStorage.

- ✅ Hecho (v0.10.2): toda la paleta vive en variables CSS en `index.css`
  y no queda un solo hex/rgba hardcodeado en ningún `.module.css`, `.tsx`
  ni `.ts` fuera de la definición de `:root` — gradientes, `CATEGORY_META`,
  fills de SVG en `icons.tsx`/`Mascot.tsx`, sombras y overlays, todo pasa
  por `var(--token)` (algunos con `color-mix()` para las traslúcidas que
  antes eran `rgba(...)`). Lo que falta para el modo oscuro real es
  únicamente sumar los valores oscuros bajo `:root[data-theme="dark"]` y
  el toggle — ya no hace falta auditar nada más.
- Pensarlo como "coral sobre tinta oscura" en vez de un dark mode gris
  genérico, para no perder la identidad de marca (sticker/Duolingo).
- El control (toggle) necesita un lugar — hoy no hay pantalla de
  "ajustes"; probablemente haya que crear una, aunque sea mínima.

## Estética/paleta según el tipo de viaje

Que el "skin" de la checklist cambie según el viaje (ej. playa con
turquesas y coral, montaña con verdes y tierras, ciudad con violetas),
en vez de una única paleta fija para todas.

- Hoy `CATEGORY_META` fija un color por categoría (ropa, higiene, docs,
  tech, extras) igual para cualquier viaje — esto conviviría con eso o
  lo reemplazaría, hay que decidir cuál gana visualmente.
- Tocaría sobre todo el hero de `Checklist.tsx` (hoy gradiente coral fijo)
  y quizás la mascota (`Mascot.tsx` ya acepta `bodyColor`/`strapColor`
  como props, listo para variar).
- Es más una decisión de diseño que de ingeniería — antes de picar
  código conviene explorar 2-3 combinaciones de paleta por tipo de
  destino (con Claude Design, por ejemplo) para no terminar con algo
  que rompa la identidad visual ya validada con los usuarios de prueba.

## Ideas de la competencia (Packr, Pack, PackPoint, WhatToPack, Packing Checklist)

Investigado en el App Store (2026-09) para no reinventar la rueda. Anotado
por si sirve de referencia al priorizar, no todo es para hacer ya.

- **Compartir/exportar la checklist como texto.** Ya existe el flag
  `exportChecklist` en `features/flags.ts` sin conectar a nada. Es chico:
  armar un string a partir de `trip.items` agrupado por categoría y usar
  `navigator.share` (con fallback a copiar al portapapeles).
- **Filtrar/buscar ítems** dentro de la checklist (packed/sin empacar, por
  categoría, o buscar por nombre). Útil cuando la lista crece con ítems
  a mano. Bajo esfuerzo, todo el estado ya está en `trip.items`.
- ~~Asignar ítems a una valija/bolso específico~~ ✅ v0.7.0, como
  recomendación de solo lectura (`src/data/distribute.ts` + pantalla
  `Distribution.tsx`), no como asignación persistida por ítem. Si más
  adelante se quiere dejar editable a mano (mover un ítem puntual de una
  maleta a otra), ahí sí hace falta sumar `bagId` a `PackingItem` como
  estaba pensado acá originalmente.
- **Clima real del destino en vez de una categoría** (PackPoint es la
  referencia: pide destino + fechas y trae el pronóstico real, ajusta la
  lista día a día). Mejora grande sobre nuestro selector actual de
  Calor/Templado/Frío/Lluvia, pero requiere geocodificar el destino +
  una API de clima + manejar el caso sin conexión. Candidato a v3+, no a
  la próxima iteración.
- **Modo familia** (Packr, feature paga): cada integrante con su propia
  sub-lista dentro del mismo viaje, más una vista combinada. Se conecta
  directo con la idea ya anotada arriba de "viaje en familia o solo".
- **Validación del modelo de precios**: el patrón más común entre estas
  apps es "una lista/viaje gratis, ilimitados de pago" (WhatToPack) o
  "generación básica gratis, clima detallado + modo familia de pago"
  (Packr). Confirma que `unlimitedTrips` es un buen candidato a ser el
  primer flag que efectivamente cobre algo, antes que features más de
  nicho.
