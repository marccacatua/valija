# Changelog

Historial de versiones de Valija. Se actualiza en cada tanda de cambios,
junto con el número de versión en `package.json` (visible en la pantalla
de bienvenida de la app, abajo de todo). Ver `BACKLOG.md` para lo que
todavía no se hizo.

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
