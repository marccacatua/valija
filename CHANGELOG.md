# Changelog

Historial de versiones de Valija. Se actualiza en cada tanda de cambios,
junto con el número de versión en `package.json` (visible en el pie de
"Mis viajes"). Ver `BACKLOG.md` para lo que todavía no se hizo.

## Sin publicar — rama `multi-turismo-clima` (a prueba)

- **Clima y tipo de turismo se pueden elegir de a varios**, igual que el
  destino ("elegí uno o varios", siempre queda al menos uno). Pensado
  para viajes largos: por ejemplo, calor + frío, o relax + cultural +
  esquí.
- **La lista suma lo de cada opción**, salvo tres reemplazos a propósito:
  - Con frío, el buzo liviano de "templado" sobra, porque ya van los
    buzos y la campera.
  - Con esquí, sigue sin bufanda, botas de abrigo ni rompeviento, porque
    los cubre el equipo de esquí. El rompeviento vuelve si además se
    navega.
  - En buceo va un solo traje: el del clima más frío.
- **La ropa de calle baja solo si el viaje es únicamente de esquí.** Con
  esquí + otra actividad, esos otros días se usa ropa normal.
- Esquí con calor sin frío: el aviso ahora ofrece **"Sumar Frío"** en vez
  de reemplazar el clima. "Llevo mi propio equipo" con esquí y buceo a la
  vez explica los dos equipos.
- **Viajes ya guardados:** se migran solos al abrirlos (un clima y un
  turismo pasan a ser una lista de uno), sin perder nada. Hay un test con
  un viaje viejo de navegar.
- QA: combinatorio sin errores, con 840 combinaciones múltiples nuevas
  que verifican que la lista incluya todo lo de cada opción suelta.
  Playwright 203/203.
- Pendiente al hacer el merge: resolver con las ramas `i18n-en` y
  `espacio-litros`, que tocan los mismos archivos, y traducir "Sumar Frío"
  y el texto del equipo doble.

## v1.9.0

**Cantidades más certeras** (salió de la revisión de la lógica).

- **"Lavar ropa" se marca solo en viajes de 10 días o más**, con un aviso
  debajo de la duración y un botón "No voy a lavar" para desmarcarlo. Si
  el viaje se vuelve a acortar, se desmarca solo. Si la persona lo toca a
  mano, su elección manda y no se vuelve a cambiar solo.
- **Fix: "lavar ropa" ya no sube los pantalones.** En 2 o 3 días pasaba de
  1 a 2; ahora solo puede bajar la cantidad (tope 2). Sin lavar, el tope
  es de 4 pantalones (antes 30 días daban 8).
- **Esquí sin duplicados de abrigo.** Se mantiene lo que se usa fuera de
  la pista (campera abrigada, gorro y guantes para salir a comer o
  pasear). Se saca lo que el equipo de esquí ya cubre:
  - "Bufanda": la reemplaza el cuello/buff.
  - "Botas o calzado de abrigo" y "Zapatillas de trekking": las
    reemplazan las botas de nieve.
  - "Rompeviento impermeable": la campera de nieve ya lo es.
  - Buzos: pasan de 2 a 1, porque el polar cumple esa función.
  - Medias comunes: tope de 3, porque en la pista se usan las de esquí.
    En 7 días de esquí eran 13 pares y ahora son 9.
- QA: combinatorio sin errores (con reglas nuevas para esquí y
  pantalones), Playwright 188/188.

## v1.8.0

**Los viajes y la compra de Pro, más seguros en la app nativa.** Hay
que probarlo en un iPhone antes de publicar (ver ROADMAP.md).

- **Guardado durable:** en la app de iOS, todo lo que se guarda (viajes,
  plantillas, Pro, último viaje) se copia también a Preferences
  (UserDefaults), que iOS no borra por falta de espacio y que entra en el
  backup de iCloud y en la migración a un iPhone nuevo. Al abrir la app
  se restaura desde ahí. Quienes vengan de una versión anterior se migran
  solos la primera vez que la abran. En la web no cambia nada.
- **Pro se verifica al abrir la app:** se le consulta a RevenueCat en
  segundo plano. Si el almacenamiento se había perdido, Pro vuelve solo;
  si Apple reembolsó la compra, se apaga. Si no hay internet, no se toca
  nada.
- **Fix: la vibración (haptics) no estaba incluida en el proyecto iOS.**
  Faltaba sincronizar el plugin (`npx cap sync ios`). Ya quedó en
  `Package.swift` junto con Preferences.
- Manifiesto de privacidad: se declara el uso de UserDefaults (motivo
  CA92.1), que Apple exige.
- QA: Playwright 180/180.

## v1.7.1

Primera tanda de la revisión general de código (seguridad, performance,
arquitectura).

- **La tipografía Nunito ahora viene dentro de la app** (antes se pedía
  a Google Fonts). La app nativa se ve bien desde el primer arranque
  aunque no haya internet, y ya no hay tráfico hacia Google. Entra en el
  precache del service worker.
- **Política de privacidad actualizada:** ya no menciona Google Fonts y
  ahora sí menciona RevenueCat, que antes no figuraba y confirma la
  compra de Pro.
- **Fix de plurales:** "Playa en 1 días", "Te faltan 1 ítems" y
  "¿Borrar los 1 viajes guardados?" ahora dicen "1 día", "Te falta 1
  ítem" y "¿Borrar el viaje guardado?".
- QA: nueva prueba que falla si la app hace cualquier request fuera de
  su propio origen. Playwright 180/180 y combinatorio sin errores.

## v1.7.0

- **Aviso de esquí con calor:** si elegís Esquí con clima Calor, abajo
  del turismo aparece "¿Esquí con calor? En la nieve suele hacer frío."
  con un botón "Cambiar a Frío" de un toque. Es solo una sugerencia, no
  se cambia nada solo. Con Templado no aparece, porque el esquí de
  primavera existe. QA: Playwright 178/179 (solo el flake conocido del
  fade de la mascota).

## v1.6.1

- **Nuevo orden del formulario:** ¿A dónde? → Motivo → Destino → Clima →
  Tipo de turismo (lo demás no cambia). Primero se define el contexto
  del viaje (para qué, dónde y con qué clima) y después la actividad.
  Además, si el motivo es trabajo, el turismo ni aparece.

## v1.6.0

**Pregunta de equipo propio o alquilado en esquí y buceo.** Al elegir
Esquí o Buceo aparece el chip "Llevo mi propio equipo", con una línea
que explica qué se suma o qué se asume alquilado.

- **Esquí:** con equipo propio se suman Casco, Botas de esquí y "Esquís
  y bastones (o tabla de snowboard)". Si es alquilado, la lista queda
  como antes.
- **Buceo:** ⚠️ ahora, por defecto, se asume que el equipo es alquilado
  y la categoría lista solo lo personal (6 ítems: computadora, máscara,
  snorkel, botas y guantes de neopreno, boya). Con equipo propio se
  suman el traje (según el clima), el BCD, el regulador y octopus, y las
  aletas (10 ítems). El tubo y el lastre no aparecen nunca.
- El aviso de espacio también tiene en cuenta los esquís y las botas.
- QA: Playwright 173/174 (solo el flake conocido del fade de la
  mascota) y combinatorio sin errores.

## v1.5.1

- **Fix: buceo ya no lista "Cinturón de lastre y plomos"** — el usuario
  avisó que el lastre también se alquila en la mayoría de los centros
  de buceo (junto con el tubo de oxígeno, como combo). La categoría
  "Buceo" queda en 10 ítems.

## v1.5.0

**Viajes de buceo** (dentro de Pro). Nueva categoría de turismo con 11
ítems personales, asumiendo que solo el tubo de oxígeno se alquila:
traje de neopreno (grueso/fino/intermedio según el clima), BCD,
regulador y octopus, computadora de buceo, máscara, snorkel, aletas,
botas y guantes de neopreno, cinturón de lastre, y boya de
señalización. Suma "Certificación de buceo (PADI/SSI)" en Documentos y
"Vaselina" en Higiene (ayuda a sellar la máscara para quienes tienen
barba), y reutiliza "Protector solar" ya existente. QA: 168/168
Playwright + 752.640 combinaciones sin errores.

## v1.4.0

- 🧪 **A prueba: "Cambiar valijas" desde el aviso de espacio** — cuando
  aparece "quizás convenga sumar una valija más", ahora hay un link que
  abre una hoja para cambiar Carry-on/Bodega/Mochila sin rehacer el
  viaje. No borra el progreso ya tildado ni las cantidades ajustadas —
  ver `BACKLOG.md` para el detalle técnico y por qué está marcado como
  prueba (fácil de revertir si no convence en el uso real).

## v1.3.1

- **Fix: el tipo de turismo (Esquí, Navegar, etc.) no aparecía en
  ningún lado de la checklist** — la fila de chips arriba nunca lo
  mostraba. Ahora aparece justo después del motivo (oculto con motivo
  "trabajo", igual que en el formulario).

## v1.3.0

**Viajes de esquí y navegar** (dentro de Pro). Dos categorías nuevas de
turismo, cada una con su equipo personal:

- **Esquí**: baja "Remeras" y "Pantalones" de calle porque se pasa el
  día con el equipo de nieve puesto, y suma 12 ítems técnicos (primera
  piel térmica, segunda capa de polar, campera y pantalón de nieve,
  medias de ski, guantes, gorro, cuello/buff, antiparras, botas de
  nieve para caminar, labial con FPS). Se asume que esquís, botas de
  esquí y casco se alquilan — no se listan. Permite combinarse con
  clima cálido (existe el ski de primavera).
- **Navegar**: suma 8 ítems personales (calzado náutico, guantes de
  vela, cordón flotante para los lentes de sol, gorra con barbijo,
  abrigo extra, muda de recambio, bolsa estanca, pastillas para el
  mareo) y **reemplaza** "¿Quedó todo pronto en casa?" por una lista de
  seguridad y logística del barco, "¿Está todo listo para zarpar?"
  (chalecos salvavidas, botiquín, extintor, bengalas, y el resto de lo
  esperable antes de zarpar).
- Las dos reutilizan ítems ya existentes en vez de duplicarlos
  ("Protector solar", "Rompeviento impermeable") y suman al aviso de
  "puede que necesites más espacio" cuando corresponde.
- QA: 153/153 Playwright + 752.640 combinaciones sin errores.

## v1.2.1

- **Fix: orden de la categoría "Mascota"** — pasa de estar pegada a
  "Bebé" (antes de "Ropa") a ir al final, junto a "Camping": sus ítems
  (correa, comida, transportadora) son logística situacional, no algo
  relacionado con higiene/vestuario propio.
- **Fix menor: 3 ítems de "deporte" mal agrupados en la vista rápida**
  ("Short deportivo", "Championes para correr", "Campera liviana para
  correr") — ahora se agrupan con calzado/abrigo en vez de caer al
  genérico "ropa".

## v1.2.0

**Mascota, deporte, y una tanda de fixes de animación encontrados
usando la app a fondo.** Primera versión bajo el nuevo criterio de
versionado: de acá en adelante la versión sube en cada tanda mergeada a
`main`, en vez de quedar fija por varios commits (ver `BACKLOG.md`).

- **Viajar con mascota** (dentro de Pro): la pregunta de bebé se
  unificó con una nueva de mascota — "¿Viajás con niño chico y/o
  mascota?", con dos tarjetas con ícono que se pueden tocar juntas para
  "ambos". Categoría propia con correa, comida, transportadora (si es
  en avión), chaleco salvavidas (si hay playa), y el resto de lo
  esperable para viajar con una mascota.
- **Toggle "Voy a hacer deporte"** (gratis): suma remeras y short
  deportivo (escalan con los días), championes para correr, y una
  campera liviana si hace frío o llueve. Se unifica con turismo
  "aventura" para no duplicar ítems si se dan las dos condiciones.
- **"Libreta de conducir" ahora siempre visible** en Documentos, junto
  a "DNI y pasaporte" (antes solo aparecía si el transporte era auto).
- **Fix: "Deshacer" un borrado reponía el ítem al fondo de su
  categoría**, no en su lugar original — ahora vuelve exactamente a
  donde estaba.
- **Fix: un ítem restaurado con "Deshacer" se pisaba visualmente con su
  vecino** durante la animación de reacomodo.
- **Fix: al borrar un viaje en "Mis viajes", la tarjeta que sube se
  pisaba con el "Tip de Valu" y con el botón de backup de abajo** — todo
  el bloque de después de las tarjetas ahora viaja junto, como una sola
  unidad, en vez de reflowar en seco.
- QA: 142/142 Playwright + 752.640 combinaciones sin errores.

## v1.1.0

**"Lista de nativez" + fixes encontrados usando la app a fondo.** Todo
mergeado desde la rama `post-v1-ux`, sin el mockup exploratorio de
ski/navegar (esas dos features quedan pendientes de decisión de producto
antes de programarse de verdad — ver `BACKLOG.md`).

- **Bienvenida rediseñada, estilo splash que transiciona sola** (sin
  botones): usuario nuevo lee un mensaje corto y pasa a Intro; usuario
  que vuelve va directo a su último viaje sin terminar. La mascota
  "viaja" con una animación propia (morph) entre pantallas, con el fondo
  desvaneciéndose en sincronía.
- **Animación al tildar un ítem** (FLIP): en vez de reordenarse en seco,
  viaja a su nueva posición. Incluye un fix real encontrado usando la
  app en el celular: el ítem "saltaba" al tildar cerca del borde
  superior después de scrollear (la animación medía posición relativa
  al viewport en vez de a la página completa).
- **Deshacer un ítem o tarea de casa borrada por error**: sigue
  borrándose al toque, sin pedir confirmación, pero aparece un aviso con
  "Deshacer" por 5 segundos antes de que quede firme.
- **Fix: tildar una tarea de "¿Quedó todo pronto en casa?" ahora la
  manda al fondo de la lista**, igual que ya pasaba con los ítems de la
  valija.
- Haptics al tildar ítems/tareas/grupos y al finalizar un viaje;
  `user-select` deshabilitado en botones; `prefers-reduced-motion`
  respetado en todas las animaciones nuevas.
- No hay cambios en cómo se guardan los viajes: los datos ya guardados
  en el celular siguen funcionando exactamente igual después de
  actualizar.
- QA: 125/125 tests de Playwright + 752.640 combinaciones sin errores.

## v1.0.0

**Primer envío real a revisión de Apple.** Sincronizado con el Version 1.0 /
Build 1 que ya está subido a App Store Connect. Se verificó de punta a
punta el flujo de compra real: API key de RevenueCat conectada,
entitlement `valija_pro` vinculado a `valija_pro_unlock`, build subido y
"Listo para revisión", y una compra de prueba completada con éxito en
ambiente Sandbox desde un iPhone real.

## v0.20.7

- **Fix: identificador de entitlement de RevenueCat** — el código usaba
  `ENTITLEMENT_ID = 'pro'`, pero el entitlement ya creado en el dashboard
  de RevenueCat tiene el identificador `valija_pro` (no se puede renombrar
  ahí sin recrearlo). Se corrigió el código para usar `valija_pro`, así
  coincide con lo real. Sin este fix, una compra se cobraba pero
  `customerInfo.entitlements.active` nunca daba `true` — el Pro no se
  desbloqueaba nunca, ni siquiera con una compra exitosa.

## v0.20.6

- **Conectado RevenueCat con la key real de Apple**: se reemplazó el
  placeholder `TU-API-KEY-PUBLICA-DE-REVENUECAT` en `features/purchase.ts`
  por la API key pública real del proyecto "Valija" en RevenueCat (App
  Store), obtenida tras crear ahí el In-App Purchase Key (P8 + Key ID +
  Issuer ID) que reemplaza al secreto legacy. Sin código nuevo, solo el
  valor de la constante. No cambia nada en la versión web/PWA (sigue
  desbloqueando Pro localmente, sin tocar RevenueCat, gracias al gateo
  por `Capacitor.isNativePlatform()`).

## v0.20.5

Encontrado probando la primera build real en Xcode (¡primera vez corriendo
en un iPhone/simulador de verdad!).

- **Fix: el emoji 🔒/🔓 no renderizaba en el WebView nativo de iOS**
  (aparecía un "?" en un cuadrado en su lugar) — se veía bien en Chrome/la
  web, pero no en el WKWebView que usa la app empaquetada. Se reemplazó por
  íconos SVG propios (`LockIcon`/`UnlockIcon` en `components/icons.tsx`,
  con `currentColor` para adaptarse al color del texto de cada lugar donde
  aparecen) en: el chip bloqueado de bebé/camping (`OptionChip`,
  `OptionCard`), el botón "Desbloquear ítems propios..." de la Checklist, y
  el badge del paywall.
- **"Llevar mis datos a otro acceso" ya no aparece en la app nativa**: ese
  botón (puente Safari ↔ ícono instalado) resuelve un problema que es
  específico de la web — iOS separa el storage entre la pestaña de Safari y
  el ícono instalado, algo que no existe en la app empaquetada (un único
  storage). De paso tenía el mismo problema de renderizado (el símbolo "↔"
  tampoco se veía bien nativo). Sigue disponible en la versión web/PWA para
  quien todavía la use así. Gateado con `Capacitor.isNativePlatform()` en
  `Trips.tsx`, mismo patrón que ya usa `features/purchase.ts`.
- QA: 106/106 (Playwright) — se ajustó un test que buscaba el botón de
  desbloquear por su texto exacto (incluía el emoji viejo).

## v0.20.4

- **Aviso de espacio también en la Checklist**: el aviso ⚠️ de "bulto vs.
  cantidad de valijas" (v0.20.0) solo vivía en la pantalla de
  Distribución, que no existe con una sola valija — justo el caso donde
  más falta hace poder avisarlo, porque no hay una segunda valija a la
  que mover algo. Ahora se muestra en las dos pantallas (debajo de la
  barra de progreso en la Checklist, y donde ya estaba en Distribución),
  reusando la misma `isPackingTight()` de `distribute.ts` — mismo texto,
  mismo estilo. Mockup mostrado y aprobado antes de commitear.
- Fix de un test flaky en `qa/ui.mjs` ("Hay 2 viajes guardados antes de
  borrar"): `.count()` no reintenta como `waitForSelector`, así que a
  veces corría antes de que la segunda tarjeta terminara de montarse.
- QA: 106/106 (Playwright), incluye 2 casos nuevos para el aviso en la
  Checklist (aparece con 1 sola valija cuando hay bulto real; no
  aparece en un viaje liviano).

## v0.20.3

Preparativos de código para la futura subida al App Store — todavía NO
es la versión que se sube (eso se decide aparte, recién cuando esté
todo listo de verdad: cuenta de RevenueCat con API key real, producto
creado en App Store Connect, firma resuelta en Xcode). Hasta ese
momento el número de `package.json` sigue subiendo libremente por cada
tanda de cambios, como siempre — ver la nota de "Versionado" en el
README.

- **`PrivacyInfo.xcprivacy` sumado al proyecto de Xcode**: el archivo ya
  existía en el repo (`ios/App/App/PrivacyInfo.xcprivacy`) pero nunca
  había quedado agregado a `project.pbxproj` — sin eso, Xcode no lo
  empaqueta en el `.ipa` aunque el archivo esté en la carpeta. Se agregó
  a mano la referencia (`PBXFileReference`, `PBXBuildFile`, grupo y fase
  de Resources) con el mismo patrón que usa el resto de los recursos del
  proyecto.
- **`ios/App/App/public` resincronizado**: `npm run build && npx cap
  sync ios` para que el proyecto nativo tenga el build de producción
  con todos los cambios hasta v0.20.2 (esa carpeta es generada, no se
  versiona — hay que repetir este paso antes de cualquier Archive).
- **Fix en `scripts/generate-screenshots.mjs`**: el generador de
  capturas para App Store Connect tildaba ítems por posición en la
  lista (`rows.nth(i)`) — desde que los tildados bajan al fondo de su
  categoría (v0.20.1), esa posición cambia con cada click, y con
  exactamente 6 clicks sobre una categoría de 6 ítems el resultado neto
  terminaba siendo 0 tildados (se destildaban entre sí). Se cambió a
  clickear por nombre de ítem, que no depende del orden. Capturas
  regeneradas para los 3 tamaños de iPhone.
- El Version/Build de Xcode (`ios/App/App.xcodeproj/project.pbxproj`)
  quedó en 1.0 / build 1 (valor por defecto del scaffold, sin tocar) —
  no significa nada todavía; recién el día de la subida real se
  sincroniza con la versión de `package.json` de ese momento.

## v0.20.2

- **Bebé y Camping pasan a ser Pro**: decisión del usuario. Se reusó el
  flag `extraCategories` (existía en `features/flags.ts` desde el MVP,
  pero nunca estuvo conectado a nada) y ahora sí gatea "¿Viajás con bebé
  o niño chico?" y el alojamiento "Camping" en `TripForm.tsx`. Sin
  Valija Pro, esos dos chips se ven con 🔒 y tocarlos abre el paywall en
  vez de seleccionarlos; con Pro, se seleccionan normal. Se sumó el
  beneficio a la lista de `PaywallSheet`. El generador (`buildItems.ts`)
  no cambió — sigue generando esas categorías igual si el campo viene en
  `true`, el control de acceso vive solo en la UI del formulario, mismo
  criterio que el resto de las features Pro (ítems propios, plantillas,
  repetir viaje). QA: 104/104 (Playwright), incluye 4 casos nuevos que
  chequean el gating en ambos sentidos (sin Pro abre paywall y no
  selecciona; con Pro selecciona normal).

## v0.20.1

- **Ítems tildados bajan al fondo de su categoría**: mismo criterio que
  ya usa "Mis viajes" con los viajes finalizados (`Checklist.tsx`,
  `sort` estable por `done`) — al tildar un ítem, baja debajo de los
  pendientes de esa misma categoría, quedando arriba de "Agregar ítem".
  No toca la Vista rápida (ahí no se ven ítems individuales) ni la
  sección de casa. QA: 100/100 (Playwright), incluye 3 casos nuevos que
  chequean el orden antes/después de tildar y la posición relativa a
  "Agregar ítem".
- El mockup del estilo "tilde" para vestidos/bebé/lavar ropa (backlog)
  no se implementó — no convenció, queda para pensarlo más adelante.

## v0.20.0

Ronda de ajustes tras probar la v0.19.0 con un viaje real (bebé + playa
+ camping + varias valijas). Todo lógica/UX, sin tocar el estilo visual
del formulario (esa parte queda como mockup pendiente de aprobación,
ver `BACKLOG.md`).

- **Camping**: "Repelente industrial" se unificó con el "Repelente" de
  Higiene (mismo ítem). En "Cómo repartir tu equipaje", los ítems de
  camping ya no se reparten dentro de ninguna valija — aparecen en su
  propia sección aparte (`distributeItems()` ahora devuelve
  `{ byBag, campingItems }`).
- **Pantalones y remeras con "lavar ropa"**: dejan de compartir el
  mismo tope que ropa interior/medias. Pantalones baja a un fijo de 2
  (se reusan mucho más antes de lavarse); remeras sube a un tope propio
  de 6 (se ensucian más rápido, incluye margen para salir).
- **Bebé + playa**: traje de baño de bebé pasa a cantidad 2 (antes 1) y
  se suma "Chaleco salvavidas de bebé".
- **Playa + 7 días o más**: suma "Zapatillas cómodas para caminar",
  antes solo aparecía por ciudad o montaña/aventura.
- **Candados**: con bodega + carry-on elegidos juntos, se piden 2
  candados nombrados (uno por valija) en vez de uno genérico, y cada
  uno se reparte a su valija dueña (`PREFERRED_BAG` en
  `distribute.ts`). El candado pasa a ser el primer ítem de "Extras" en
  la checklist.
- **Almohada de viaje y libro/e-reader**: misma prioridad que
  documentos/electrónica al repartir entre valijas (mochila primero).
- **Aviso de espacio en distribución**: heurística simple de "bulto"
  por ítem vs. cantidad de valijas elegidas; si da alto, aparece un
  segundo aviso ⚠️ debajo del de siempre, misma estética.
- **Botón de volver en "Tu valija para..."**: la checklist no tenía
  forma de volver atrás; ahora lleva a "Mis viajes".
- QA: `qa/combinatorial.ts` cubre todo lo anterior (repelente,
  zapatillas, candados en el cruce principal; traje de baño/chaleco de
  bebé y las nuevas fórmulas de pantalones/remeras en los bloques
  dedicados) — 752.640 combinaciones, 0 errores. `qa/ui.mjs` suma 6
  casos nuevos (97/97 OK).

## v0.19.0

- **Tres pedidos del backlog, implementados de punta a punta**:
  - **"¿Pensás lavar ropa en el viaje?"**: nuevo toggle junto a
    Alojamiento en `TripForm.tsx`. Con lavaRopa activo, remeras/ropa
    interior/medias dejan de escalar con la duración completa del
    viaje y se topean en ~4 días (se van reponiendo lavando) — el
    resto de la ropa (abrigo, calzado, pantalones) no cambia.
  - **Alojamiento "Camping"**: quinta opción de `AlojKey`. Trae su
    propia categoría "Camping" (carpa, bolsa de dormir, colchoneta,
    linterna, encendedor, cuerda, hacha o machete, repelente
    industrial, anafe) — separada del resto, no mezclada en Extras.
  - **"¿Viajás con bebé o niño chico?"**: toggle nuevo, junto a
    Vestuario. Trae la categoría "Bebé" (pañales, higiene, alimentación,
    descanso, mudas de ropa propias) con condicionales que reusan
    campos existentes (traje de baño con playa/calor, butaca con
    transporte auto).
  - Dos categorías nuevas (`bebe`, `camping`) con sus propios colores
    (`--baby-pink`, `--forest` en `index.css`) y sus grupos en la vista
    rápida — el resto de la UI (Checklist, plantillas, distribución) ya
    las soporta sin cambios, por iterar sobre `CATEGORY_ORDER`
    genéricamente.
  - QA combinatorio: `lavaRopa`/`bebe` se prueban en bloques dedicados
    (cruzados solo contra los campos de los que depende su lógica) en
    vez de sumarlos al gran cruce de todo — eso multiplicaba el total
    x4 para probar dos campos con dependencias chicas. `camping` sí
    entra en el cruce grande (solo agrega una opción más a `aloj`).
    752.640 combinaciones probadas, 0 errores.
  - QA de Playwright: 5 casos nuevos — 89/89 en total.

## v0.18.1

- **Fix: el buscador de la checklist hacía zoom en iOS** — el input nuevo
  de v0.18.0 pisaba sin querer el piso global de 16px con un
  `font: 700 14px` explícito (el mismo problema de v0.10.1, reintroducido
  sin darse cuenta). Corregido, y agregado un chequeo de QA que revisa
  **todos** los inputs de la app de una sola vez, para que una tercera
  vez no pase desapercibida.
- **RevenueCat conectado**: `features/purchase.ts` ahora usa el SDK real
  en la app nativa (Capacitor) para comprar y restaurar, con la API real
  verificada contra sus propios tipos publicados. En la web/PWA sigue
  siendo el desbloqueo local sin cobro de antes — no cambia nada para
  quienes ya la usan por Safari. Falta pegar la API key de RevenueCat y
  crear el producto `valija_pro_unlock` (entitlement `pro`) una vez que
  exista la cuenta.
- **Mail de contacto real** en `data/contact.ts` (privacidad y soporte).
- QA: 3 casos nuevos de Playwright (ningún input queda por debajo de
  16px en ninguna pantalla) — 84/84 en total.

## v0.18.0

- **Buscar/filtrar ítems en la checklist**: nueva barra de búsqueda por
  nombre + toggle "Sin empacar" arriba de la vista detallada — útil
  cuando la lista crece con ítems agregados a mano. El filtro solo
  cambia qué se ve, nunca el progreso real (tildar sigue funcionando
  igual, esté filtrado o no). Gratis, sin feature flag.
  - QA: 4 casos nuevos de Playwright, más un fix de estabilidad en un
    test existente que empezaba a fallar de forma intermitente bajo
    carga (le faltaba esperar el render antes de contar) — 81/81 en
    total.

## v0.17.1

- **Botón real de "Desbloquear Valija Pro"**: hasta ahora las features
  pagas simplemente desaparecían para un usuario gratis, sin ninguna
  forma de comprar desde la propia app. Nuevo `PaywallSheet` (con los
  beneficios listados, precio y "restaurar compra") disparado desde el
  tope de 3 viajes en `TripForm` y desde un botón "🔒 Desbloquear…" en
  la checklist. Todavía no cobra nada de verdad — `features/purchase.ts`
  deja la capa de compra lista y aislada para conectar RevenueCat/StoreKit
  más adelante sin tocar ningún componente.
  - **Bug real encontrado y corregido en el camino**: `useIsPro()` usaba
    el hook genérico `useLocalStorage`, que mantiene un estado en
    memoria por instancia — si el paywall (montado en un sheet aparte)
    prendía `isPro`, la checklist de atrás no se enteraba hasta
    recargar la página. Reescrito con `useSyncExternalStore` para que
    todos los componentes que leen `isPro` en la misma página se
    actualicen al toque, sin recargar nada.
  - QA: 1 caso nuevo de Playwright (comprar en el sheet desbloquea sin
    recargar) — 77/77 en total.

## v0.17.0

- **Requisitos de privacidad para el App Store, listos**: páginas
  `/privacidad` y `/soporte` (contenido honesto — Valija no recolecta
  ningún dato, todo vive en el dispositivo), enlazadas desde la
  bienvenida junto al número de versión. `PrivacyInfo.xcprivacy` para el
  target de iOS (sin tracking, sin datos recolectados, sin uso de APIs
  de "razón requerida" — coherente con que la app no tiene SDKs de
  analítica ni de terceros). Falta un solo paso manual en Xcode:
  agregar ese archivo al proyecto vía "Add Files to App…" (no se pudo
  automatizar sin arriesgar corromper el `.pbxproj` a mano).
  - Pendiente antes de enviar a revisión: reemplazar el mail placeholder
    en `data/contact.ts` por el mail de soporte real — a propósito no
    se decidió solo, es información pública permanente.
- **`vercel.json`**: agrega el rewrite estándar de SPA (`/* -> /index.html`).
  Sin esto, entrar directo a una URL como `/privacidad` o `/viajes`
  (en vez de navegar desde adentro de la app) podía devolver 404 en
  Vercel — necesario para que Apple pueda abrir la política de
  privacidad como URL suelta.
- **Capturas para App Store Connect**: `scripts/generate-screenshots.mjs`
  arma un viaje de ejemplo real (con progreso) y saca capturas de las
  4 pantallas clave en los 3 tamaños de iPhone que pide Apple
  (6.9″/6.7″/6.5″), guardadas en `store-assets/screenshots/`.
  Reproducible cuando haga falta actualizarlas.
- QA: 72/72 sin regresiones (combinatorio + Playwright).

## v0.16.1

- **Fix urgente**: activar el paywall dejó sin ver sus viajes/Pro a
  quienes ya usaban la app instalada en la pantalla de inicio (iOS separa
  el `localStorage` de Safari del de la app standalone — ver
  `BACKLOG.md`). Nueva pantalla "Llevar mis datos a otro acceso" en "Mis
  viajes": exporta los viajes/plantillas/estado Pro a un texto (vía
  portapapeles) y los importa del otro lado sin duplicar ni pisar nada.
  - `data/backup.ts`, `components/BackupSheet.tsx`.
  - QA: 6 casos nuevos de Playwright — 72/72 en total.

## v0.16.0

- **Modelo de precios definido y activado**: pago único de USD 0,99
  (StoreKit "non-consumable", sin suscripción) para desbloquear Valija
  Pro. Gratis para siempre: el generador de checklist completo, las 5
  pantallas, distribución por valija, y **compartir/exportar la
  checklist** (a propósito nunca pago — cada checklist compartida es
  publicidad gratis de la app). Detrás del pago: viajes guardados
  ilimitados (gratis: tope de 3), agregar ítems/tareas propias,
  plantillas, y repetir un viaje anterior.
  - `features/flags.ts`: `customItems`, `tripTemplates` y
    `unlimitedTrips` pasan a `pro: true`; nuevo flag `cloneTrip`
    (también pro) para "Repetir este viaje"; nueva constante
    `FREE_TRIP_LIMIT = 3`.
  - `TripForm.tsx`: al llegar al tope gratis, "Nuevo viaje" muestra un
    aviso en vez del formulario (se chequea antes de mostrar el form,
    no recién al enviarlo).
  - Todavía no hay compra real (eso espera a StoreKit, más adelante en
    el roadmap de publicación) — `isPro` sigue siendo un booleano de
    localStorage, ahora con más peso real detrás.
  - QA: 5 casos nuevos de Playwright (tope gratis + qué se ve/no según
    plan) — 66/66 en total.

## v0.15.0

- **Proyecto iOS con Capacitor**: primer paso hacia la publicación en el
  App Store. `capacitor.config.ts` (bundle id `com.valija.app`),
  proyecto Xcode generado en `ios/` (usa Swift Package Manager, sin
  CocoaPods), e ícono 1024x1024 para App Store Connect generado desde
  la misma mascota que ya usan los íconos de la PWA
  (`scripts/generate-icons.mjs`). Todavía no se compiló ni se probó en
  un dispositivo — eso requiere Xcode en una Mac.
- **Compartir checklist**: nuevo botón "Compartir checklist" en la
  checklist de un viaje — arma un texto agrupado por categoría (más la
  sección de casa aparte) y lo manda al share sheet nativo
  (`navigator.share`) cuando está disponible; si no, lo copia al
  portapapeles con feedback "Copiado ✓". Conecta el flag
  `exportChecklist` que ya existía sin uso. Gratis (`pro: false`).
  - QA: 1 caso nuevo de Playwright — 60/60 en total.

## v0.14.1

- **Repetir un viaje**: nuevo botón "Repetir este viaje" en la
  checklist — crea un viaje nuevo con la misma configuración (destino,
  clima, todo el formulario) y los mismos ítems y tareas de casa
  agregados a mano, pero recién armado: nada tildado, sin finalizar.
  Pensado para "quiero ir al mismo lugar otra vez" sin rehacer el
  formulario ni recordar qué habías agregado a mano la vez pasada.
  Era la mitad pendiente de la idea de "valijas tipo" (ver
  `BACKLOG.md`) — la otra mitad (plantillas de ítems sueltos) ya
  estaba desde v0.10.0.
  - `cloneTrip` en `useTrips.ts`. Gratis, sin feature flag.
  - QA: 3 casos nuevos de Playwright — 59/59 en total.

## v0.14.0

- **Marcar un viaje como finalizado**: en "Mis viajes" ahora hay un
  botón de tilde junto al de borrar — al finalizar un viaje, la
  tarjeta se atenúa, muestra "Viaje finalizado" y baja al final de la
  lista (los activos quedan siempre arriba, más nuevo primero). Es
  reversible (se puede reactivar) y no borra nada: el viaje se puede
  seguir abriendo normalmente para consultarlo más adelante.
- Evaluamos también achicar la sección "¿Quedó todo pronto en casa?"
  en la vista rápida y agregar swipe para borrar/finalizar en "Mis
  viajes" — quedan documentadas las razones para no hacerlo (todavía)
  en `BACKLOG.md`.
- QA: 4 casos nuevos de Playwright — 56/56 en total.

## v0.13.1

- **Las plantillas ahora también guardan tareas de casa**: hasta ahora
  una plantilla solo podía llevarse ítems propios de la valija; si
  alguien agregaba algo como "Llevar al perro a guardería" en la
  sección de casa, no había forma de reusarlo en el próximo viaje. La
  hoja de "Guardar como plantilla" ahora ofrece las dos cosas por
  separado ("De la valija" / "De casa", con subtítulo solo cuando hay
  de ambas) y el contador de cada plantilla suma los dos tipos.
  - Solo las tareas de casa agregadas a mano entran como candidatas
    (las generadas por defecto ya están en todo viaje nuevo, no hace
    falta guardarlas). Nuevo campo `isCustom` en `HomeTask` para
    distinguirlas, igual que ya existía en `PackingItem`.
  - `ItemTemplate.homeTasks` es opcional — las plantillas guardadas
    antes de esta versión se siguen leyendo bien, solo que no tienen
    tareas de casa para ofrecer.
  - QA: 3 casos nuevos de Playwright — 52/52 en total.

## v0.13.0

- **"¿Quedó todo pronto en casa?"**: idea de un amigo que probó la
  app — una sección nueva y separada al final de la checklist, para las
  cosas de la casa que hay que dejar resueltas antes de salir de viaje
  (apagar las luces, cerrar las llaves de agua y de gas por separado,
  sacar la basura, regar las plantas, avisarle a un vecino, cerrar
  puertas y ventanas, cargar los dispositivos, configurar el asistente
  en modo ausente, y vaciar la heladera si el viaje dura 5 días o más).
  A propósito NO suma al contador "X de N empacado" — son tareas, no
  cosas para llevar.
  - Se puede borrar cualquier tarea (por si alguien no tiene plantas,
    por ejemplo) y agregar las propias, igual que con los ítems de la
    valija — sin cantidad, porque no tiene sentido "contar" una tarea.
  - `Trip` suma un campo nuevo (`homeChecklist`); los viajes guardados
    antes de esta versión lo generan solo la primera vez que se abren.
  - QA: invariantes nuevas en el harness combinatorio (ids únicos, la
    tarea de la heladera aparece si y solo si el viaje dura 5+ días) y
    6 casos nuevos de Playwright — 49/49 en total.

## v0.12.2

- **Transporte no se veía en ningún lado**: el punto 3 de la vuelta
  anterior en realidad se refería a los chips debajo de "Tu valija
  para..." (no al formulario) — `tripMetaChips()` calculaba destino,
  clima, motivo, días y maletas, pero nunca incluía transporte. Se
  agregó.
- **Orden de categorías**: "Higiene" pasa a mostrarse antes que "Ropa"
  (coincide con el orden que ya tenía la vista rápida) — evita la
  incoherencia de que el mensaje de progreso invite a seguir con una
  categoría que en la lista aparece más abajo que otra.

## v0.12.1

- **Choque con la barra de estado en PWA instalada**: al agregar la app
  a la pantalla de inicio, el título de cada pantalla se pisaba con el
  reloj y la isla de la cámara (no pasaba entrando por Safari). Es un
  efecto esperado de `apple-mobile-web-app-status-bar-style:
  black-translucent` (deja la barra de estado transparente encima del
  contenido) sin el padding que hace falta para compensarlo. Se agregó
  `env(safe-area-inset-top)` al tope de las 6 pantallas.
- **"Transporte" y "Tipo de maleta" podían quedar tapados por el botón
  flotante** del formulario en pantallas más bajas o con la barra de
  Safari visible: el contenedor no reservaba espacio de sobra al final,
  así que en ciertas alturas de viewport el sticky del botón no
  alcanzaba a "destrabarse" antes del final del documento. Se agregó un
  colchón fijo debajo de "Duración".
- **Mensaje de progreso más útil**: además de "Arrancá por los
  documentos" y "¡Valija lista!", ahora cuando termina una categoría
  entera invita a seguir con la próxima (ej. "Ahora seguí con la ropa")
  en vez de repetir siempre "Te faltan N ítems".
- **QA a partir de ahora vive en el repo** (`qa/`): el harness
  combinatorio (`npm run qa:logic`) y la suite de Playwright
  (`npm run qa:ui`, levanta su propio servidor de preview) que se
  venían usando de forma manual durante esta ronda de pruebas, ahora
  con sus propias dependencias (`playwright`, `tsx`) para poder
  correrlos en cualquier momento futuro. Ver `qa/README.md`.

## v0.12.0

- **Combinar destinos**: "Destino" pasa de elegir uno solo a poder elegir
  varios a la vez (playa + montaña, playa + ciudad, etc.), mismo patrón
  que ya usa "Tipo de maleta" — se puede combinar libremente y siempre
  queda al menos uno seleccionado. La checklist generada suma los ítems
  de cada destino elegido (ej. playa + montaña trae ojotas Y zapatillas
  de trekking), sin duplicados: son reglas aditivas independientes que
  ya convivían bien entre sí. Viajes guardados con la forma vieja
  (`dest` como un solo valor) se migran solos a array al leerlos.
- **Renombrar un viaje ya creado**: antes el nombre quedaba fijo para
  siempre después de armar la valija. Ahora se puede tocar el ícono de
  lápiz junto al título en la checklist y escribir uno nuevo en
  cualquier momento; dejarlo vacío vuelve a mostrar el título automático
  (destino + días), igual que al crear el viaje.
- QA: harness combinatorio actualizado a los 7 subconjuntos no vacíos de
  destino (602.112 combinaciones de formulario, 4.214.784 chequeos de
  distribución) y 7 casos nuevos de Playwright para destino combinado y
  renombrado — 41/41 casos pasando en total.

## v0.11.0

- **Vista rápida de la checklist**: un amigo que probó la app dijo que la
  checklist detallada (~40 ítems) le resultaba pesada para revisar. En
  vez de un checklist separado (dos botones al armar el viaje), se
  agregó un toggle "Detallada / Rápida" arriba de la lista — mismo
  viaje, mismos ítems reales, solo cambia cómo se presentan.
  - En "Rápida" los ítems se agrupan en 9 temas grandes en vez de las 5
    categorías de siempre (`data/quickGroups.ts`): Documentos, Higiene,
    Ropa, Ropa de trabajo, Ropa para salir, Abrigo, Calzado, Electrónica,
    Extras — separa de "Ropa" lo que hoy vive mezclado. Cubre el 100%
    de lo que genera `buildRawItems` (verificado con las mismas 258.048
    combinaciones del QA de la v0.10.2) y a un ítem personalizado con
    nombre libre le toca el grupo de su categoría.
  - Tocar un grupo marca (o desmarca) todos sus ítems de una — un solo
    toque en vez de N. El progreso de la valija sigue siendo el mismo
    dato de siempre; no hay dos checklists ni dos fuentes de verdad,
    cambiar de vista no pierde nada de lo ya tildado.
  - Nuevo método `setItemsDone` en `useTrips` para el marcado en bloque
    (una sola actualización, no N seguidas).

## v0.10.2

- **Colores a variables CSS**: se migró toda la paleta hardcodeada
  (hex y `rgba(...)`) en `.module.css`, íconos SVG y componentes a
  `var(--token)` definidos en `index.css` — cero hex/rgba sueltos fuera
  de esa definición. No cambia nada visualmente (verificado con
  capturas antes/después en las 6 pantallas), pero es el prerequisito
  que faltaba para poder ofrecer modo oscuro (ver `BACKLOG.md`).
- **QA exhaustivo, sin bugs encontrados**:
  - Lógica pura (`buildRawItems` + `distributeItems`): 258.048
    combinaciones de formulario (destino × clima × motivo × turismo ×
    alojamiento × transporte × todos los subconjuntos de maletas ×
    vestidos × 12 duraciones representativas) contra 1.806.336 chequeos
    de distribución, verificando que no haya ítems duplicados, ninguna
    cantidad menor a 1, los ítems sin cantidad (`noQty`) siempre en 1,
    el orden de "ropa" respetado y que la suma repartida entre valijas
    siempre cierre con la cantidad original del ítem.
  - Flujos de UI (Playwright): 25 casos — límites del stepper de
    cantidad y de días, ítems sin cantidad, ítems personalizados en las
    5 categorías, plantillas (selección parcial, aplicar, borrar con
    confirmación), pantalla de distribución con distintas combinaciones
    de valijas, y borrado de viajes (individual y borrado total con
    doble confirmación).

## v0.10.1

- **Zoom automático de iOS**: los inputs de "Agregar ítem" y de nombre de
  plantilla tenían letra de 15px — por debajo de 16px, Safari en iOS
  hace zoom al enfocar el campo y a veces la app queda con el zoom
  metido. Subidos a 16px, y agregada una regla global de seguridad
  (`input { font-size: 16px }` como piso) para que ningún input futuro
  reintroduzca el problema.
- **Ejemplo de plantilla según el viaje**: el placeholder del nombre de
  plantilla ya no es siempre "Kit yacimiento" — ahora sugiere algo
  relevante al destino/motivo del viaje actual (playa → "Kit snorkel",
  montaña → "Kit escalada", ciudad+trabajo → "Kit oficina", ciudad+salidas
  → "Kit noche de salida", ciudad en general → "Kit museos").
- **Confirmación al borrar una plantilla**: antes se borraba al toque, sin
  vuelta atrás y sin avisar. Ahora pide confirmación (mismo componente
  `ConfirmDialog` que ya usábamos para viajes), encadenada sobre la hoja
  de "Aplicar una plantilla".

## v0.10.0

- **Plantillas personales**: podés guardar un grupo de ítems que agregaste
  a mano (con checkboxes para elegir cuáles) como una plantilla con
  nombre, y aplicarla en cualquier viaje futuro con un toque. Pensado
  para casos bien personales que la app nunca va a sugerir sola — el
  ejemplo real que la motivó es un kit de EPP para viajes a yacimiento
  (mameluco, lentes de protección, casco, botas). 100% privado, vive
  solo en tu celular, nunca alimenta el generador de checklist.
  - `useTemplates` (hook nuevo) + `SaveTemplateSheet` / `ApplyTemplateSheet`
    (componentes nuevos) + `ItemTemplate` (tipo nuevo).
  - Ya está atado a un feature flag (`tripTemplates`), documentado junto a
    `customItems` como el diferenciador free/pro para el lanzamiento en
    el App Store (ver v0.9.6).
- **Bug real encontrado al probar esto**: aplicar una plantilla con más
  de un ítem hacía que solo el último quedara guardado — `updateTrip` en
  `useTrips.ts` armaba el array nuevo a partir de un `trips` externo
  (closure) en vez de la forma funcional de `setTrips`, así que varias
  actualizaciones seguidas dentro del mismo clic se pisaban entre sí en
  vez de encadenarse. No se había notado antes porque hasta ahora nunca
  se llamaba a `addCustomItem` más de una vez seguida sin que React
  re-renderizara en el medio. Corregido para que use la forma funcional
  correctamente.

## v0.9.6

- **Documentos primero**: reordenada la checklist (antes Ropa, Higiene,
  Documentos, Electrónica, Extras → ahora Documentos, Ropa, Higiene,
  Electrónica, Extras), coherente con el mensaje "Arrancá por los
  documentos" que ya mostraba la barra de progreso.
- **"Extras" evaluado ítem por ítem**: la mayoría no tiene sentido
  contarla (botella reutilizable, antifaz y tapones, candado, almohada
  de viaje, mate y termo, riñonera, paraguas, toallón, libro/e-reader,
  lentes de sol, bolsa para ropa sucia) — pasan a `addSingle`, sin +/-.
  Se mantiene el +/- solo en lo que sí varía en cantidad real: bolsas
  ziploc y snacks para el camino.
- De paso, "Electrónica" (que ya no mostraba +/- desde v0.9.5) usa ahora
  el mismo mecanismo genérico (`noQty`) en vez de un caso especial por
  categoría — mismo resultado, código más simple.
- Documentado en `features/flags.ts` (sin activar todavía): la decisión
  de que `customItems` y la futura `tripTemplates` sean el diferenciador
  free/pro en la versión de App Store.

## v0.9.5

- La categoría "Electrónica" deja de mostrar el paso a paso de cantidad
  (+/-): no tiene sentido llevar "2 cargadores" o "3 auriculares", son
  ítems que se llevan o no. Ahora es solo checkbox + nombre + borrar,
  como un recordatorio de cargarlo/empacarlo. El resto de las categorías
  no cambia.
- Renombrado "Cable extra" (qty 2, confuso — ¿extra de qué?) a "Cable de
  carga extra" (qty 1): un cable de repuesto por si el principal falla o
  se olvida, no una cantidad a elegir.

## v0.9.4

- `ConfirmDialog` suma una variante `center`: en vez de la hoja que sube
  desde abajo, se muestra centrada con ícono de advertencia y borde
  rosado. Se usa solo en el último paso de "Borrar todos los viajes" —
  el más grave de la cadena — para que se note que es distinto de una
  confirmación cualquiera.

## v0.9.3

- Reemplazados los `window.confirm()` (diálogo nativo del sistema, gris,
  sin estilo) por un componente propio (`ConfirmDialog`) para borrar un
  viaje y para la doble confirmación de "Borrar todos los viajes" — se
  ven con la tipografía y colores de Valija en vez de la alerta del
  navegador/sistema. Importante de cara a la publicación en el App
  Store: esto no se arregla al compilar con Capacitor, hay que hacerlo
  del lado del código (`window.confirm()` siempre es nativo, empaquetar
  no cambia el comportamiento de JS).

## v0.9.2

- Botón "Borrar todos los viajes" al final de "Mis viajes" (solo visible
  si hay al menos uno). Pide **dos** confirmaciones seguidas, la segunda
  aclarando explícitamente que es irreversible — cancelar en cualquiera
  de las dos no borra nada.

## v0.9.1

- Revertido el redirect automático de v0.9.0: la bienvenida vuelve a
  mostrarse siempre en "/" (aporta identidad de marca, no era el
  problema real).
- En cambio, la bienvenida ahora verifica si hay viajes guardados: si
  hay, el botón principal pasa a decir "Armar un nuevo viaje" (salta la
  intro, va directo al formulario) y aparece un botón nuevo "Mis viajes
  anteriores". Si no hay viajes, queda igual que siempre ("Empecemos").
- El botón "Nuevo viaje" en "Mis viajes" se movió arriba, junto al
  título, en vez de al final de la lista — más accesible con muchos
  viajes guardados.

## v0.9.0

- **No más bienvenida repetida**: si ya tenés viajes guardados, abrir la
  app te lleva directo a "Mis viajes" en vez de mostrar la pantalla de
  bienvenida/onboarding cada vez. Esa pantalla ahora es solo para la
  primera vez (0 viajes guardados).
- **Borrar viajes**: cada tarjeta en "Mis viajes" tiene una × para
  eliminarla (con confirmación, no tiene deshacer) — así no se acumulan
  para siempre.

## v0.8.0

- **Líquidos de higiene con variante de tamaño**: pasta de dientes y
  shampoo dejan de ser un solo ítem genérico. Si hay bodega, se agrega
  la versión normal (va a la bodega) y, si el viaje es de 7 días o más
  y además hay carry-on o mochila, se suma una versión mini de menos de
  100ml para el día a día del viaje. Sin bodega, salen directo como
  "envase de 100 ml o menos" (no tiene sentido duplicar).
- El cepillo de dientes y las versiones mini quedan marcados para ir
  siempre a la mochila en la pantalla de distribución, junto a los
  lentes de sol.
- El recordatorio genérico "Líquidos en envases de 100 ml" ahora solo
  aparece cuando no hay bodega (cubre protector solar, skincare,
  repelente — que no tienen variante propia todavía).

## v0.7.2

- "Lentes de sol" pasa de la categoría "Ropa" a "Extras" — encaja mejor
  ahí que como prenda.
- En la pantalla de distribución, los lentes de sol ahora van siempre a
  la mochila (o al carry-on si no hay mochila), sin importar la
  categoría: no tiene sentido facturarlos, se usan en el momento.
- Confirmado (ya era así, sin cambios): se ofrecen siempre, en cualquier
  viaje, sin condición de clima ni destino.

## v0.7.1

- Corregido el algoritmo de distribución: el "respaldo" de ítems con más
  de una unidad ahora va al **carry-on** (la valija pensada justamente
  para una muda de repuesto), no a la mochila. Con carry-on + bodega +
  mochila seleccionados, antes la mochila se llenaba de ropa y el
  carry-on quedaba vacío — reportado por prueba real de usuario.

## v0.7.0

- **Múltiples maletas por viaje**: "Tipo de maleta" pasa de selección
  única a multi-selección (podés viajar con carry-on + mochila, bodega +
  mochila, las 3, etc). El dato viejo (`form.maleta`, una sola) se migra
  solo a `form.maletas` (array) al leer viajes guardados de antes — no
  rompe nada de lo que ya tenían guardado los usuarios.
- **Pantalla nueva "Cómo repartir tu equipaje"**: si el viaje tiene más
  de una maleta, aparece un botón en la checklist que lleva a una
  recomendación de qué va en cada una. Reglas: documentos y electrónica
  van en la maleta que llevás con vos (mochila > carry-on > bodega);
  ítems con más de una unidad se reparten entre la maleta principal y
  otra, para no perder todo de una categoría si una maleta se pierde o
  se demora. Es una vista de solo lectura derivada de la checklist — no
  cambia los ítems reales ni lo que ya tildaste.

## v0.6.0

- **Vestuario neutral**: nuevo toggle "Sumar vestidos / pollera" en el
  formulario, independiente de motivo/turismo — no le preguntamos género
  a nadie, cualquiera lo puede activar.
- **Shorts/bermudas de uso diario**: clima calor o destino playa ahora
  suma shorts para el día a día, separados del traje de baño (antes solo
  aparecía ropa de playa, faltaba ropa casual de calor).
- Se agrega este `CHANGELOG.md`.

## v0.5.0

- La categoría "Ropa" ahora se ordena por cómo se empaca: interior →
  arriba → abajo → accesorios → calzado (el calzado queda último a
  propósito).
- Cualquier ítem de la checklist se puede borrar con la ×, no solo los
  agregados a mano — algunos viajeros no usan todo lo que sugerimos.

## v0.4.0

- Se puede agregar ítems propios al final de cada categoría de la
  checklist ("Agregar ítem…"), y borrarlos.

## v0.3.0

- Corregido: "Tipo de turismo" se ocultaba mal cuando el motivo era
  "Trabajo" — el campo seguía influyendo en la checklist aunque no se
  viera en el formulario (colaba ítems de ocio en viajes de trabajo).
- Número de versión visible en la pantalla de bienvenida, para confirmar
  qué build se está probando después de cada deploy.

## v0.2.0

- Ampliado el detalle de la checklist generada (`buildItems`): lentes de
  sol, cinturón, billetera, enjuague bucal, corta uñas, bolsas ziploc,
  almohada de viaje, riñonera para turismo aventura/cultural, ropa y
  calzado deportivo diferenciado para turismo aventura, calzado para
  salir en turismo fiesta, botas para clima frío.

## v0.1.0

- Primera versión de la PWA, a partir del prototipo de Claude Design
  (`Valija.dc.html`): 5 pantallas (bienvenida, intro, nuevo viaje,
  checklist, mis viajes), lógica de `buildItems` portada del prototipo,
  persistencia de viajes en `localStorage` (reemplaza el array `SEED`
  hardcodeado), manifest + service worker para que sea instalable, y
  estructura de feature flags lista para features "pro" a futuro.
