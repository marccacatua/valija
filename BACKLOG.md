# Backlog

Ideas para próximas versiones, con una nota de cómo encajarían en la
arquitectura actual (para que cualquier sesión futura pueda retomarlas sin
tener que releer todo el historial de chat).

## ~~Safari vs. ícono en pantalla de inicio: storage separado~~ ✅ mitigado en v0.16.1

Encontrado en producción (2026-09): iOS le da a la web abierta en Safari
y a la misma web instalada como ícono en la pantalla de inicio dos
`localStorage` completamente separados (no es un bug de Valija, es así
como Safari particiona el storage entre "pestaña" y "app standalone").
Un usuario que usó la app en Safari y después la instaló como ícono
(o viceversa) ve la app "vacía" del otro lado — no perdió nada, está
viendo el otro cajón.

Esto se volvió urgente cuando activamos el paywall (v0.16.0): el atajo
`?pro=1` (`main.tsx`) solo funciona en Safari, porque el ícono instalado
arranca siempre en el `start_url` del manifest (vite-plugin-pwa), sin
query params — no hay address bar en modo standalone para escribir
`?pro=1` ahí adentro.

**Mitigación implementada** (no resuelve la partición en sí, que es un
límite de iOS): puente manual vía portapapeles del sistema, que sí cruza
esa frontera aunque el storage no la cruce.
- `data/backup.ts`: `exportBackup()` junta `valija:trips`,
  `valija:templates` y `valija:isPro` en un JSON con versión (`v: 1`);
  `importBackup()` lo suma a lo que ya hay (dedup por id, nunca
  reemplaza ni borra) y prende Pro si venía prendido de cualquier lado.
- `components/BackupSheet.tsx`: pantalla con "Copiar mis datos"
  (a portapapeles, con fallback a texto seleccionable si falla) y un
  textarea para pegar y restaurar. Accesible desde "Mis viajes".
- **Solución real pendiente** (para cuando haya más superficie/tiempo):
  la versión nativa empaquetada con Capacitor no tiene esta partición
  (storage único) — una vez publicada en el App Store, este problema
  desaparece solo para quien la instale desde ahí. Para la web seguiría
  existiendo mientras no haya una cuenta con sync en un servidor.

## Analítica de uso (qué features se usan, cuánta gente usa la app)

Pedido del usuario (2026-09): poder ver más adelante cuánta gente usa
la app y qué usan más, para priorizar mejoras con datos reales en vez
de a ojo. Mejor esperar a tener usuarios reales post-lanzamiento antes
de decidir qué medir — instrumentar de más antes de tiempo es trabajo
tirado si después no sirve para nada.

- **App Store Connect ya da algo gratis sin escribir una línea**:
  descargas, retención por cohortes, crashes — alcanza para responder
  "¿cuánta gente la instaló y vuelve?" apenas se publique.
- Para "qué es lo que más usan" (por feature, no solo por pantalla) hace
  falta instrumentar eventos a mano: ej. `viaje_creado`,
  `plantilla_aplicada`, `checklist_compartida`, `vista_rapida_usada`.
  Candidato recomendado: **PostHog** (tiene plan gratis generoso, es
  "event-based" — pensado justo para esto — y el mismo SDK sirve para
  medir uso en la PWA y en la app empaquetada con Capacitor sin
  duplicar trabajo). Alternativa más simple pero más limitada:
  Plausible (bueno para "cuánta gente entra", flojo para "qué tocan").
- Importante para no romper la confianza de nadie: nunca mandar datos
  personales ni el contenido de un viaje (destino, fechas, ítems) — solo
  qué acción se hizo, no el detalle. Hay que sumar una líena a una futura
  política de privacidad (obligatoria igual para publicar en el App
  Store) contándolo.
- Se conecta con `features/flags.ts`: una vez que exista, sirve también
  para medir qué tan seguido se topan con un muro de "esto es Pro" — dato
  clave para ajustar el precio o qué va gratis/pago más adelante.

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

## Viajar con bebé o niño pequeño

Pedido del usuario (2026-09): sumar la posibilidad de armar la parte de
la valija de un bebé/niño chico — pañales, termómetro, su ropa, etc.
Pidió explícitamente pensar la lista con cuidado, no copiar un borrador
de ejemplo tal cual.

**Cómo encaja en la arquitectura**: NO como una "valija extra" (un
4to tipo de maleta) — las maletas (`MaletaKey`) son el contenedor
físico donde entra todo lo demás, un bolso de bebé se guarda dentro
del carry-on/bodega/mochila igual que la ropa. La forma correcta es
un toggle en el formulario, igual que `vestidos: boolean` hoy, más una
categoría NUEVA (no repartir sus ítems entre `ropa`/`higiene`
existentes) para que se pueda escanear todo junto de un vistazo — el
mismo razonamiento que llevó a separar "¿Quedó todo pronto en casa?"
en vez de mezclarlo con la checklist de empaque.

- `TripFormState`: sumar `bebe: boolean` (o `ninoPequeno`, definir
  nombre — cubre bebé y niño chico, no hace falta separar en dos
  toggles a menos que la lista de ítems difiera mucho por edad).
- `CategoryKey`: sumar `'bebe'`. `CATEGORY_META`: título "Bebé" + un
  color nuevo (los 5 tokens actuales — coral/teal/violeta/mostaza/cielo
  — ya están usados, elegir uno que no choque, ej. un rosa/lila suave).
  `CATEGORY_ORDER`: ubicarla cerca de "Higiene" (bastante superpuesta
  temáticamente — pañales, cremas, termómetro).
  `quickGroups.ts`: un solo grupo rápido `bebe`, sin dividir (la lista
  no es tan larga como para necesitarlo).
- Ítems propuestos en `buildItems.ts` (repensados desde cero, no es la
  lista literal que tiró el usuario como ejemplo — algunos con la misma
  lógica condicional que ya usa el resto de la app, para que se sienta
  parte del mismo sistema y no una lista pegada aparte):
  - Higiene/salud: pañales, toallitas húmedas, crema para la
    irritación, termómetro, medicación habitual y antifebril infantil,
    botiquín pediátrico básico (suero fisiológico nasal, curitas
    chicas) — todos qty=1 ("una provisión", mismo criterio que ya usa
    la app para shampoo/pasta de dientes, no tiene sentido contar
    pañales unidad por unidad.
  - Alimentación: mamadera/vasito, babero, utensilios de comida.
  - Descanso/contención: chupete y mordillo, mantita o saco de dormir.
  - Ropa (separada de la ropa del adulto, en su propia categoría):
    mudas de ropa con cantidad escalada por día igual que la del adulto
    pero con más margen (`cap(d + 2, 10)` en vez de `cap(d + 1, 10)` —
    se ensucian más seguido), pijamas.
  - Condicionales que reusan campos que YA existe en el formulario, para
    que se sienta igual de "inteligente" que el resto de la app:
    - `dest.includes('playa') || clima === 'calor'` → traje de baño y
      gorro/protector solar de bebé (mismo condicional que ya usa la
      ropa de baño del adulto).
    - `transporte === 'auto'` → butaca/silla para auto.
    - Siempre: cochecito o mochila portabebé, y algo de entretenimiento
      para el viaje (más importante cuanto más largo el trayecto, pero
      no vale la pena condicionarlo a `dias` — un vuelo corto también
      lo necesita).
- El toggle también podría alimentar la vista rápida sin cambios
  (ya agrupa por categoría) y las plantillas sin cambios (ya funcionan
  por `cat` genérico).
- Que no complique el generador: seguir el patrón de `vestidos` —
  un `if (f.bebe) { add(...) }` bloque, no dispersarlo por todo
  `buildRawItems`.

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

- ~~Compartir/exportar la checklist como texto~~ ✅ hecho (v0.15.0):
  `shareText()` en `data/trip.ts` arma el texto agrupado por categoría
  más la sección de casa aparte; el botón "Compartir checklist" en
  `Checklist.tsx` usa `navigator.share` cuando está disponible y si no
  cae a copiar al portapapeles con feedback "Copiado ✓". Gateado detrás
  de `exportChecklist` (sigue en `pro: false`).

## Compartir: sumar el link de descarga, y evaluar poder importar

Pedido del usuario (2026-09) sobre la función de compartir que ya
existe (`shareText()` en `data/trip.ts`, ver arriba). Dos ideas
relacionadas, ninguna para hacer ya:

- **Agregar el link de descarga al texto compartido.** Chico en código
  (una línea más en `shareText()`, tipo "📱 Armá la tuya con Valija:
  <link>"), pero no tiene sentido hacerlo antes de tener a dónde
  apuntar: hoy no existe ni la ficha del App Store ni una landing page.
  Anotarlo para cuando exista esa URL — ahí sí es de 5 minutos.
- **Importar un viaje recibido por este medio.** Bastante más grande,
  pensarlo bien antes de meter mano:
  - El texto humano de `shareText()` (para leer en WhatsApp) no es el
    formato ideal para volver a parsear — mejor no reusarlo tal cual.
    La opción más prolija es un **link con los datos codificados** (ej.
    el `form` + los ítems agregados a mano, en base64 en un query param
    o un deep link `valija://importar?...`), separado del texto legible
    que ya se comparte.
  - Requiere manejar el caso "quien lo recibe no tiene la app
    instalada todavía" — el link debería primero mandar a instalarla
    (App Store) y recién después poder abrir el import (universal
    link / deferred deep link, más trabajo de lo que parece a primera
    vista).
  - Versionado: si el formato de `TripFormState` cambia con el tiempo,
    un link viejo compartido hace tiempo tiene que seguir importando
    algo razonable, no romperse.
  - Vale la pena solo si de verdad se usa "invitar a alguien a armar
    la misma valija" como flujo real (ej. dos personas yendo al mismo
    viaje) — confirmar que hay ganas de eso antes de construirlo.

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
