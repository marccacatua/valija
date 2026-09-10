# Backlog

Ideas para próximas versiones, con una nota de cómo encajarían en la
arquitectura actual (para que cualquier sesión futura pueda retomarlas sin
tener que releer todo el historial de chat).

## Agregar ítems a mano

El usuario puede querer sumar un ítem puntual que `buildItems()` no
contempla (algo muy suyo, no generalizable).

- Ya existe el feature flag `customItems` en `src/features/flags.ts`
  (hoy `pro: false`) pensado exactamente para esto.
- Implementación sugerida: en `Checklist.tsx`, un input/botón "+ Agregar
  ítem" al final de cada grupo. Necesita un método nuevo en `useTrips`
  (algo como `addCustomItem(tripId, cat, name)`) que haga push a
  `trip.items` con un `id` nuevo.

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
