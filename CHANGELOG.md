# Changelog

Historial de versiones de Valija. Se actualiza en cada tanda de cambios,
junto con el número de versión en `package.json` (visible en la pantalla
de bienvenida de la app, abajo de todo). Ver `BACKLOG.md` para lo que
todavía no se hizo.

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
