# Backlog

## En curso en la rama `post-v1-ux` (arrancado 2026-09-14)

Mientras la v1.0.0 está en revisión de Apple, se decidió avanzar en
paralelo con la "lista de nativez" + las dos features grandes, todo en
una rama aparte (`post-v1-ux`) para no tocar `main` — que se mantiene
igual a lo que Apple tiene en revisión — hasta que esto se pruebe en un
iPhone real y se apruebe mergear.

**Hecho en la rama, pendiente de probar en el celular:**
- Haptics (`@capacitor/haptics`, `src/features/haptics.ts`) en tildar un
  ítem, una tarea de casa, un grupo entero (vista rápida), y un toque
  más fuerte al marcar un viaje finalizado. No-op silencioso en web.
- `user-select: none` en botones/`[role=button]` — ya no se selecciona
  texto al mantener presionado un ítem.
- `prefers-reduced-motion` respetado: bloque global en CSS para
  transiciones/animaciones, más un helper (`features/motion.ts`) para
  el código que anima por JS (ver los dos puntos siguientes).
- **Animación FLIP al tildar un ítem** (opción A del plan: código
  propio con Web Animations API, sin librería nueva) —
  `hooks/useFlipReorder.ts`. El ítem se queda tildado en su lugar
  ~220ms y recién ahí viaja a su nueva posición en ~300ms, para no
  perder el feedback del tilde. Falta calibrar esos dos números
  mirándolo en un iPhone real.
- **Bienvenida rediseñada estilo Headspace** (`screens/Welcome.tsx`):
  ya no tiene botones — transiciona sola. Usuario nuevo ve un mensaje
  corto ("A partir de ahora no te olvidás más nada") y pasa a Intro;
  usuario que vuelve ve solo la mascota un instante y va **directo a su
  último viaje sin terminar** (o a "Mis viajes" si no queda ninguno
  activo). Tocar la pantalla saltea la espera en cualquier caso. La
  versión y los links de Privacidad/Soporte, que vivían en esta
  pantalla, se mudaron a un pie discreto en "Mis viajes".
- **Morph del logo entre Bienvenida y el viaje** — código propio con Web
  Animations API, **no** la View Transitions API del browser: se probó
  primero con `document.startViewTransition` (más simple, sin manejar
  DOM a mano), pero no animaba de verdad ni en Chrome ni en Safari
  (iOS 26) — el usuario lo probó en su iPhone real y confirmó que el
  logo aparecía ya en su posición final, sin transición visible. Se
  reemplazó por el mismo tipo de técnica que ya usa el FLIP del
  checklist: `features/mascotMorph.ts` guarda la posición y una copia
  del HTML de la mascota justo antes de que Welcome navegue afuera;
  `hooks/useMascotMorphTarget.ts`, usado en Checklist e Intro, la
  recoge al montar, arma una copia en `position: fixed` y anima con
  `element.animate()` desde esa posición hasta la propia (ocultando el
  original real mientras dura, para que no se vean las dos
  superpuestas). Ojo con el bug que salió al construirlo: el `<svg>` de
  la mascota tiene `width`/`height` fijos como atributos, así que
  animar el tamaño del `<div>` que lo envuelve no lo achicaba solo —
  hubo que forzar `width:100%;height:100%` en el `<svg>` clonado para
  que seguiera al contenedor. Si el destino no tiene mascota ("Mis
  viajes"), no pasa nada especial (ni falla ni deja nada colgado).
  Duración 420ms por defecto, misma curva que el FLIP para que se
  sienta consistente. Andá con confianza en cualquier browser — no
  depende de ninguna API experimental. Ya probado en un iPhone real
  (iOS 26) y ajustado dos veces con feedback directo del usuario:
  - Usuario nuevo (Bienvenida → Intro): se sentía demasiado rápido —
    ahora dura el doble, 840ms (`NEW_USER_MORPH_MS` en `Welcome.tsx`,
    pisa el default vía el segundo argumento de `armMascotMorph`). El
    caso de usuario que vuelve se dejó en 420ms, que ya andaba bien.
  - Usuario que vuelve (Bienvenida → Checklist): quedaba un glitch de
    un frame al terminar — un instante en el que ni la copia animada ni
    la mascota real estaban visibles. Causa: ocultar/mostrar la real se
    hacía con estado de React (`setHidden`), que no es síncrono con
    sacar la copia del DOM. Se cambió a escribir `style.visibility`
    directo sobre el nodo en el mismo tick que se agrega/saca la copia
    — verificado midiendo cuadro por cuadro (cada 20ms) que siempre hay
    exactamente una mascota visible, nunca cero.
  - En los dos casos, el usuario vio un "saltito" justo al terminar: el
    destino final no coincidía exactamente con dónde queda la mascota
    real. Causa: se animaba `left/top/width/height` directo, que son
    propiedades de layout — cada cuadro reacomoda la página y puede
    quedar una diferencia de sub-píxel justo al final. Se cambió a la
    técnica FLIP clásica con `transform` (compuesto por GPU, sin
    relayout en cada cuadro): la copia queda parada desde el arranque
    en el tamaño y posición finales reales, y un `transform` invertido
    la hace *verse* en el origen; se anima ese transform hasta la
    identidad. Verificado comparando el rect real contra el de la copia
    ya terminada: coinciden exacto (diferencia 0.00px) en los dos casos.
- QA actualizado: 113/113 tests de Playwright (7 nuevos para la
  bienvenida, 2 de ellos verificando que el morph realmente anima en
  vuelo y no es un salto seco) + 752.640 combinaciones sin errores. Se
  ajustó el test de reordenamiento para esperar a que termine la
  animación antes de medir posiciones.
- **Identificador de build en el pie de "Mis viajes"**: como en esta
  rama no se sube la versión en cada push (se sube recién al mergear a
  `main`), se agregó `__BUILD_ID__` (hash corto del commit — lo toma de
  `VERCEL_GIT_COMMIT_SHA` en el deploy, o de `git rev-parse` en local)
  al lado de la versión, para poder confirmar a simple vista que se
  está viendo el último push sin tener que preguntar.

**Sin tocar todavía (decidido explícitamente por el usuario, 2026-09-14):**
- Fichas por país (ASO) y español neutro/selector de idioma: esperar a
  que Apple apruebe la app.
- Google Play, promoción, versión en inglés: quedan para después de la
  licencia del usuario (~15 días desde el 14/09).

**Cómo seguimos:** falta que el usuario compile esta rama en su iPhone
y la prueba de verdad — sobre todo calibrar los tiempos del FLIP y de
la bienvenida, que un simulador o una captura no pueden juzgar del
todo. Recién después de eso conviene mergear a `main`, subir versión
(probablemente v1.1.0) y generar un build nuevo para Apple.

## Pendientes para retomar tras el envío a revisión (v1.0.0, 2026-09-14)

El usuario va a estar de licencia ~15 días desde acá. Anotado para
retomar a la vuelta, en este orden sugerido:

1. **Resultado de la revisión de Apple**: si aprobaron o rechazaron
   Valija (ver mail de Apple), y resolver lo que pidan si hay rechazo.
2. **Publicación en Google Play**: arrancar el mismo proceso que
   hicimos para iOS pero del lado de Android (cuenta de Google Play
   Console, ficha, capturas, revisar si Capacitor necesita algo
   especial para Android que no tocamos en esta ronda).
3. ~~**Animación fluida al tildar ítems**~~ ✅ implementada en la rama
   `post-v1-ux` (ver arriba), falta calibrar en dispositivo real.
4. ~~**Rediseño de la pantalla de bienvenida, estilo Headspace**~~ ✅
   implementado en la rama `post-v1-ux` (ver arriba): se hizo directo
   en código, sin pasar por Design (decisión del usuario), y el destino
   del usuario que vuelve es su último viaje sin terminar.
5. **Estrategia de promoción de la app**: pensar dónde y cómo
   promocionarla (¿desde esta misma conversación, desde claude.ai,
   desde Cowork?). Foco inicial: **países de habla hispana**, hasta
   que exista una versión en inglés (ítem aparte, ver abajo). En
   pausa hasta que Apple apruebe la app.
6. **Español neutro o selector de idioma** (para cuando se piense la
   promoción/expansión): evaluar si conviene neutralizar un poco el
   español actual (hoy tiene modismos rioplatenses: "boarding pass",
   "carry-on", etc.) o dejar que el usuario elija idioma/variante.
   Importante: **evitar agregarle fricción al usuario** — la esencia
   de Valija es ser rápida y cómoda, así que si se agrega selección de
   idioma tiene que ser mínima (por ejemplo, autodetectada del
   dispositivo, sin una pantalla extra que haya que completar). En
   pausa hasta que Apple apruebe la app.
7. **Versión en inglés**: traducir la app para poder promocionarla
   fuera del mundo hispanohablante — depende de resolver primero el
   punto anterior (neutralizar/decidir variantes) para no traducir dos
   veces.
8. ~~**¿Seguimos en PWA/Capacitor o nos pasamos a Swift nativo?**~~ ✅
   Decidido (2026-09-14): **seguimos en Capacitor** (opción C del plan —
   si algún día hace falta algo puntual, un módulo nativo específico en
   vez de reescribir todo). Pasar a Swift implicaría además reescribir
   todo de nuevo en Kotlin para Google Play y tirar los 752k casos de
   QA que ya tenemos.
9. ~~**Bloquear la rotación de pantalla**~~ ✅ hecho (pendiente de
   verificar en el dispositivo). La app rotaba a horizontal y quedaba
   mal; ahora `UISupportedInterfaceOrientations` en `Info.plist` sólo
   permite `Portrait` en iPhone. Se dejó iPad con las 4 orientaciones
   a propósito: Apple pide que las apps de iPad que soportan
   multitarea funcionen en todas las orientaciones, y restringirlo
   podría generar un rechazo en una revisión futura.

> 📋 El análisis completo de cada uno de estos puntos (con opciones,
> pros y contras, esfuerzo estimado y recomendación) está en el
> artifact **"Después de la v1.0"**, armado el 2026-09-14 mientras la
> v1.0 estaba en revisión:
> https://claude.ai/code/artifact/a25b62b9-00d1-4b69-bd9a-30e70c00a221

## Viajes de ski (próxima versión, dentro de Pro)

Pedido del usuario (2026-09-14), a partir de feedback de un conocido.
Va **dentro de la versión paga**, igual que bebé y camping.

**El dato clave que lo hace distinto:** esquiando pasás casi todo el día
con el equipo puesto, así que **se usa menos ropa normal** de lo que la
app calcularía hoy para la misma cantidad de días. No es "montaña con
más abrigo": es un viaje donde la ropa de calle baja y aparece un set
técnico que hoy no existe en el catálogo.

**Cómo modelarlo (decisión a tomar juntos).** Hoy `camping` no es un
destino sino un alojamiento, justamente porque se puede acampar en
cualquier lado (ver el comentario en `types.ts`). Con ski pasa algo
parecido: esquiar es *lo que hacés*, y el destino sigue siendo la
montaña. Las tres opciones:

- **a) `TurismoKey: 'ski'`** — el que más se parece a cómo ya está
  pensado el modelo: queda al lado de relax/aventura/cultura/fiesta,
  combina naturalmente con `dest: montana` + `clima: frio`, y no
  agrega una pregunta nueva al formulario. Contra: es menos visible
  que un destino, y al ser una función paga conviene que se vea.
- **b) `DestKey: 'ski'`** — el más descubrible (aparece entre playa /
  montaña / ciudad, que es lo primero que toca el usuario). Contra:
  rompe un poco la semántica, porque el ski no es un lugar.
- **c) Un booleano propio**, como `bebe`. Contra: suma otra pregunta
  al formulario, y el usuario pidió explícitamente no agregar fricción.

*Recomendación:* **(a)**, y sumarle una `CategoryKey: 'ski'` propia para
el equipo — exactamente el mismo patrón que ya usa camping (una opción
dentro de un selector que ya existe + su propia categoría de ítems).

**La lógica de cantidades.** El mecanismo ya existe: `lavaRopa` hoy
capea las mudas con `Math.min(d, 4)` en vez de escalar con los días
(`buildItems.ts:76-87`). Ski usaría la misma técnica en la otra
dirección: bajar remeras y pantalones de calle, y sumar aparte lo
técnico. Ojo con dos cosas: las **medias de ski** son gruesas y van
aparte de las comunes (aprox. 1 par cada 2 días), y hay que dejar
**ropa de après-ski** para la noche — no todo el viaje es en la pista.

**Ítems a incluir** (borrador para revisar): primera piel térmica,
campera y pantalón de nieve, segunda capa de polar, medias de ski,
guantes, gorro, cuello/buff, antiparras, casco, botas de nieve para
caminar, y **protector solar de factor alto + labial con FPS** — la
nieve refleja los rayos y es donde más gente se quema sin darse cuenta.

**Decisión de producto pendiente:** la mayoría **alquila** skis, botas
y casco en el centro de ski, así que no habría que hacerlos empacar.
¿Asumimos alquiler por defecto (y listamos sólo lo personal), o
preguntamos? Preguntar es una pregunta más en un formulario que
queremos corto — mi sugerencia es asumir alquiler y dejar que quien
lleve equipo propio lo agregue como ítem suyo.

**Enganches con lo que ya existe:**
- El equipo de ski es voluminoso: hay que darle peso alto en
  `BULK_WEIGHTS` (`distribute.ts`) para que el aviso de "quizás
  necesitás más espacio" salte cuando corresponde.
- Gateado con el flag `extraCategories`, el mismo que ya cubre bebé y
  camping: así los que ya pagaron Pro lo reciben sin costo extra. Hay
  que actualizar el texto del paywall (`PaywallSheet.tsx`), que hoy
  nombra sólo "bebé/niño chico y camping".
- Sumar una opción al union type agrega ~190k combinaciones al QA
  combinatorio (hoy 752.640). No es problema, pero hay que escribir las
  invariantes nuevas: que con ski baje la ropa de calle respecto del
  mismo viaje sin ski, que aparezca la primera piel, y que sin ski no
  se cuele ningún ítem de nieve.
- A definir: si ski + clima cálido es una combinación válida (existe el
  ski de primavera) o si conviene bloquearla.

## Toggles estilo "tilde" para vestidos/bebé/lavar ropa (probado, no convenció — descartado por ahora)

Pedido del usuario (2026-09) tras probar la v0.19.0: reemplazar el
estilo actual (pastilla tipo `OptionChip`, igual al resto de las
opciones de selección única) por el mismo checkbox cuadrado con tilde
que ya se usa para marcar ítems empacados en la checklist, para las 3
opciones booleanas del formulario: "Sumar vestidos / pollera", "¿Viajás
con bebé o niño chico?" y "Pienso lavar ropa en el viaje".

Se armó un mockup real (componente `CheckRow` temporal en
`TripForm.tsx`, mismos tokens que `.checkbox`/`.checkboxDone` de
`Checklist.module.css`) y se mandaron capturas antes de construir de
verdad, tal como pidió el usuario. **Resultado: no le convenció como
quedó visualmente** — queda descartado por ahora, revertido sin
commitear. Si se retoma más adelante, pensar una alternativa distinta
al simple checkbox cuadrado (quizás algo a medio camino entre el chip
actual y el tilde) en vez de repetir el mismo mockup.

## ~~Ajustes de lógica y UX pedidos tras probar la v0.19.0~~ ✅ hecho en v0.20.0

Ronda de feedback del usuario (2026-09) usando la app real con bebé +
playa + camping + varias valijas. Todos chicos y de bajo riesgo,
implementados directo sin mockup previo:

- **Repelente de camping**: "Repelente industrial" se unificó con el
  "Repelente" que ya sumaba Higiene por aventura/playa — mismo ítem, no
  tiene sentido tenerlo separado. Camping ya no genera su propio
  repelente.
- **Camping en "Cómo repartir tu equipaje"**: sus ítems ya no se
  reparten dentro de ninguna valija (no tiene sentido meter una carpa
  "en" el carry-on) — `distributeItems()` los devuelve aparte
  (`campingItems`) y la pantalla los muestra en su propia sección, con
  la aclaración "Va aparte, no entra en ninguna valija".
- **Pantalones y remeras con "lavar ropa"**: separados del tope general
  de mudas. Pantalones baja a un tope fijo de 2 (se reusan mucho más
  que el resto antes de lavarse); remeras usa un tope propio más alto
  (6 en vez del general de 4) porque se ensucian/transpiran más rápido.
- **Bebé en la playa**: traje de baño de bebé pasa a cantidad 2 (antes
  1) y se suma "Chaleco salvavidas de bebé".
- **Zapatillas en viajes largos de playa**: si el destino es solo playa
  (sin ciudad) y dura 7+ días, se suma "Zapatillas cómodas para
  caminar" — antes solo aparecía por ciudad o montaña/aventura.
- **Candados por valija**: con bodega + carry-on elegidos a la vez, se
  piden 2 candados nombrados ("Candado para la valija de bodega" /
  "Candado para el carry-on"), y cada uno se reparte a su valija dueña
  en la pantalla de distribución (`PREFERRED_BAG` en `distribute.ts`).
  Sin esa combinación, sigue el candado genérico de siempre (hostel o
  mochila). Además el candado pasó a ser lo primero de "Extras" en la
  checklist, no algo perdido en el medio.
- **Almohada de viaje y libro/e-reader**: ahora tienen la misma
  prioridad que documentos/electrónica al repartir entre valijas
  (mochila primero, después carry-on) — sumados a `ALWAYS_WITH_YOU` en
  `distribute.ts`.
- **Aviso de espacio ("bulto") en distribución**: heurística simple por
  ítem (`BULK_WEIGHTS` en `distribute.ts` — campera abrigada, botas,
  cochecito de bebé, butaca para auto, etc.) comparada contra la
  cantidad de valijas elegidas; si da alto, aparece una segunda nota
  tipo ⚠️ debajo de la de "Separamos alguna unidad...", misma estética.
  Es orientativa, no una cuenta real de volumen — fácil de ajustar los
  pesos/umbral con más feedback de uso real. **Refinado en v0.20.4**: el
  mismo aviso se sumó también a la Checklist (debajo de la barra de
  progreso) — con 1 sola valija no existe pantalla de Distribución
  donde mostrarlo, y era justo el caso donde más hace falta.
- **Botón de volver en "Tu valija para..."**: la pantalla de checklist
  no tenía forma de volver atrás; se sumó una flecha en el header
  (mismo estilo que "Nuevo viaje"/Distribución) que lleva a "Mis
  viajes" — desde ahí se puede borrar el viaje mal armado y empezar de
  nuevo.

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
- **Actualizado en v0.20.5**: el botón "Llevar mis datos a otro acceso"
  se ocultó en la app nativa (`Capacitor.isNativePlatform()` en
  `Trips.tsx`) — ahí no aplica, es un único storage. Sigue visible en
  la web/PWA mientras siga en uso. Si en algún momento se discontinúa
  la web (o se resuelve con una cuenta real), ahí sí conviene borrar
  `BackupSheet.tsx`/`data/backup.ts` del todo en vez de solo ocultarlos.

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

## ~~Viajar con bebé o niño pequeño~~ ✅ hecho en v0.19.0

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

## ~~"¿Pensás lavar ropa en el viaje?"~~ ✅ hecho en v0.19.0

Pedido del usuario (2026-09): hoy no se pregunta nada sobre esto — la
cantidad de mudas se calcula solo en función de `dias`, asumiendo que
no se lava ropa en ningún lado. Un toggle explícito, independiente del
alojamiento (se puede lavar en un hotel con lavandería, en depto de
amigos, o no poder en un hostel sin esa comodidad — no correlaciona 1:1
con `aloj`), deja elegir esto sin importar dónde te alojás.

- `TripFormState`: sumar `lavaRopa: boolean` (default `false`).
- UI en `TripForm.tsx`: un checkbox/chip chico al lado de la sección
  "Alojamiento" (mismo patrón que `OptionChip` ya usado para
  "Sumar vestidos / pollera") — no un grupo de opciones aparte.
- En `buildItems.ts`: donde hoy se calculan las mudas con algo como
  `cap(dias + 1, 10)`, agregar una rama cuando `f.lavaRopa` es true que
  tope el cálculo mucho más bajo (ej. alcanza con mudas para ~3-4 días
  sin importar cuánto dure el viaje completo, porque se van reponiendo
  lavando). Aplica a remeras/ropa interior/medias — no a lo que no tiene
  sentido lavar seguido (abrigo, calzado).
- Barato de probar en el QA combinatorio existente: agregar el nuevo
  campo a las combinaciones y verificar que con `lavaRopa: true` la
  cantidad de mudas nunca supere el tope reducido, sin importar `dias`.

## ~~Destino "Camping"~~ ✅ hecho en v0.19.0 (como alojamiento, no destino)

Pedido del usuario (2026-09), marcado como importante: acampar trae
ítems bien distintos al resto (cuerda, hacha, machete, encendedor,
carpa, bolsa de dormir, colchoneta, linterna, repelente industrial,
kit de fuego) que no tiene sentido mezclar con ninguna categoría
existente. Pidió explícitamente que aparezca como su propia lista
separada, no repartida en Ropa/Higiene/Extras.

**Cómo encaja en la arquitectura**: incluirlo como un valor más de
`AlojKey` (hoy `'hotel' | 'depto' | 'hostel' | 'amigos'`) en vez de
como un toggle aparte o un valor de `DestKey` — "cómo vas a dormir" es
exactamente lo que ya representa `aloj`, y se puede acampar en la
playa, la montaña o el campo por igual, así que no depende de
`dest`. Selección única, como el resto de las opciones de alojamiento
(no tiene sentido combinar "hotel" y "camping" en el mismo viaje).

- `AlojKey`: sumar `'camping'`. `ALOJ_OPTIONS`: nueva opción "Camping"
  con ícono propio.
- `CategoryKey`: sumar `'camping'` (una categoría nueva, no una
  sub-lista de Extras) — es la parte que cumple el pedido de "que se
  vea como su propia lista". `CATEGORY_META`: título "Camping" + un
  color nuevo. `CATEGORY_ORDER`: agregarla al final (es la más
  situacional de todas, igual que hoy "Extras" queda última).
  `quickGroups.ts`: un solo grupo rápido `camping`, sin dividir.
- En `buildItems.ts`, un bloque `if (f.aloj === 'camping') { add(...) }`
  con los ítems de acampar — mismo patrón que ya usa `vestidos`/`bebe`
  (propuesto), nada disperso por el resto del generador. Al ser
  alojamiento exclusivo, cuando `aloj === 'camping'` tiene sentido
  *no* agregar algunos ítems que si asumen "hotel/depto" (ej. no hace
  falta "toallón" de las de higiene si ya se suma uno de camping,
  a revisar caso por caso al implementar para no duplicar).
- Como es su propia categoría, ya queda automáticamente separada de
  las demás en ambas vistas (detallada y rápida) sin tocar nada más.

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

- ~~Filtrar/buscar ítems~~ ✅ v0.18.0 (parcial): buscador por nombre +
  toggle "Sin empacar" en la vista detallada (`Checklist.tsx`), sin tocar
  el progreso real. Queda pendiente el filtro por categoría si hace
  falta más adelante — con la búsqueda por nombre ya cubre el caso de
  uso principal (encontrar un ítem agregado a mano entre muchos).
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
