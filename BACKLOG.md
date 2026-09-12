# Backlog

Ideas para próximas versiones, con una nota de cómo encajarían en la
arquitectura actual (para que cualquier sesión futura pueda retomarlas sin
tener que releer todo el historial de chat).

## Swipe para borrar/finalizar en "Mis viajes"

Hoy borrar y marcar como finalizado son botones explícitos en la
tarjeta (`Trips.tsx`, `.deleteBtn` / `.finishBtn`). Un swipe horizontal
(como Mail de iOS) sería más "nativo", pero se decidió dejarlo para
después de publicar: hay que distinguir bien un swipe horizontal del
scroll vertical de la lista (fácil de romper cualquiera de los dos sin
una librería), y es un gesto no descubrible sin una pista visual. Los
botones ya cubren la misma funcionalidad sin ese riesgo.

## Animación de transición entre pantallas

Slide u otra transición al navegar (ej. Welcome → Mis viajes) usando
`react-router-dom` + una librería como `framer-motion`/`motion`. Aditivo,
no toca lógica existente. Lo que hay que pensar es el tipo de transición
por caso (¿todas iguales, o distinta según de dónde a dónde se navega?).

## ~~Agregar ítems a mano~~ ✅ hecho en v0.4.0

Cada categoría de la checklist termina con una fila "Agregar ítem…".
Los ítems agregados así (`isCustom: true`) se pueden borrar con una ×;
los generados por `buildItems()` siguen sin poder borrarse, solo
destildarse. Usa el feature flag `customItems` (sigue en `pro: false`).

## ~~"Valijas tipo" — plantillas de ítems propios~~ ✅ v0.10.0 (parcial) + v0.14.1 (completo)

Se implementó la mitad de esta idea, la de mayor pedido real (caso de
uso concreto: EPP de yacimiento): guardar un grupo de ítems agregados a
mano como plantilla con nombre (`useTemplates`, `ItemTemplate`), y
aplicarla en cualquier viaje futuro. Queda gateada detrás de
`tripTemplates` en `features/flags.ts`.

La otra mitad ("repetir un viaje anterior COMPLETO sin volver a tildar
todo el formulario") se hizo en v0.14.1: `cloneTrip` en `useTrips.ts`
copia `form` + `items` + `homeChecklist` (con lo agregado a mano
incluido) reseteando `done` a `false` en todo, y el botón "Repetir este
viaje" en `Checklist.tsx` te deja directo en el viaje nuevo. No se
limitó a ningún feature flag — es gratis, como el resto del generador.

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
