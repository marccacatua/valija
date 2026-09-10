# Backlog

Ideas para próximas versiones, con una nota de cómo encajarían en la
arquitectura actual (para que cualquier sesión futura pueda retomarlas sin
tener que releer todo el historial de chat).

## ~~Agregar ítems a mano~~ ✅ hecho en v0.4.0

Cada categoría de la checklist termina con una fila "Agregar ítem…".
Los ítems agregados así (`isCustom: true`) se pueden borrar con una ×;
los generados por `buildItems()` siguen sin poder borrarse, solo
destildarse. Usa el feature flag `customItems` (sigue en `pro: false`).

## "Valijas tipo" — guardar y clonar un viaje anterior como plantilla

Reusar las elecciones de un viaje pasado que funcionó bien, sin tener que
volver a tildar todo el formulario.

- El modelo de datos ya lo permite sin cambios: `Trip.form` tiene todas
  las elecciones. "Clonar" = `addTrip(tripAntiguo.form)` para crear un
  viaje nuevo con esa misma configuración (probablemente reseteando
  `dias` o dejando que el usuario lo ajuste antes de generar).
- Candidato a feature Pro: limitar cuántas plantillas puede guardar un
  usuario free. Ver si conviene extender el flag `unlimitedTrips` o sumar
  uno nuevo (`tripTemplates`) en `features/flags.ts`.
- Pendiente de decidir: ¿una plantilla es un `Trip` más en la lista, o una
  entidad separada (`TripTemplate`) para no mezclarla con el historial de
  viajes reales?

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
- **Asignar ítems a una valija/bolso específico** (Packr) — pensado para
  viajes con más de una maleta o en familia. Implica sumar un concepto de
  "bolso" (`bagId`) a `PackingItem` y un selector en la UI. Tiene sentido
  recién si primero resolvemos "viaje en familia".
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
