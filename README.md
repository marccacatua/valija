# Valija

PWA de checklist de equipaje. Implementación real, basada en un prototipo de
Claude Design, con estructura mantenible y persistencia local de verdad.

Ver `CHANGELOG.md` para el historial de versiones y `BACKLOG.md` para lo
que sigue.

## Correr en desarrollo

```bash
npm install
npm run dev
```

Abrí la URL que muestra Vite desde el celular (misma red) para probar el
flujo de instalación, o `npm run build && npm run preview` para probar el
build de producción con el service worker activo (en dev el SW no se
registra).

## Estructura

- `src/types.ts` — modelo de datos (`Trip`, `PackingItem`, `TripFormState`).
- `src/data/catalog.ts` — opciones del formulario (destino, clima, motivo, etc.).
- `src/data/buildItems.ts` — reglas de armado de la checklist, portadas 1:1
  del prototipo (`buildItems` del `.dc.html`).
- `src/data/trip.ts` — helpers de presentación (título, chips, progreso).
- `src/hooks/useTrips.ts` — única fuente de verdad de los viajes guardados,
  persistidos en `localStorage` (reemplaza el array `SEED` hardcodeado del
  prototipo).
- `src/features/flags.ts` — registro de features "pro" (viajes ilimitados,
  ítems propios, plantillas, repetir viaje) y el modelo de precios (pago
  único, ver comentarios en el archivo).
- `src/features/purchase.ts` — capa de compra: en la app nativa usa
  RevenueCat de verdad, en la web/PWA (donde StoreKit no existe) sigue
  siendo un desbloqueo local sin cobro.
- `src/screens/` — las pantallas del flujo (Welcome, Intro, TripForm,
  Checklist, Distribution, Trips, Privacy, Support), una por archivo con
  su CSS module.
- `src/components/` — piezas de UI compartidas (mascota, botones, chips,
  bottom nav, sheets, etc).

## PWA

Configurada con `vite-plugin-pwa` (manifest + service worker autoUpdate).
Los íconos salen de `scripts/generate-icons.mjs` (correlo de nuevo si cambia
la paleta o el ícono). `vercel.json` agrega el rewrite de SPA para que
cualquier URL (`/privacidad`, `/viajes`, etc.) funcione entrando directo,
no solo navegando desde adentro de la app.

## App nativa (iOS)

El proyecto ya está empaquetado con Capacitor en `ios/`. Ver
`scripts/generate-screenshots.mjs` para regenerar las capturas de App
Store Connect, y `qa/README.md` para correr el QA antes de subir un build
nuevo.

## Versionado: web (de prueba) vs. App Store (publicado)

Son dos números completamente separados, cada uno resuelve una pregunta
distinta — no hace falta (ni conviene) que coincidan:

- **`package.json` (visible en la app, abajo de la bienvenida)** versiona
  la *web*: sube en cada cambio que se prueba en `valija-ten.vercel.app`,
  sin importar si ese cambio ya está "listo para Apple" o es solo una
  prueba. Es el historial de desarrollo, documentado en `CHANGELOG.md`.
- **La versión del proyecto de Xcode** (`ios/App/App.xcodeproj`,
  campos "Version" y "Build" en la pestaña General, o `MARKETING_VERSION`
  / `CURRENT_PROJECT_VERSION` en el `.pbxproj`) es la que identifica cada
  build subido a TestFlight/App Store Connect — la que importa para
  responder "¿cuál compilé y subí?".
  - **Version** (`MARKETING_VERSION`) es lo que ve el usuario final en la
    ficha de la app (`1.0`, `1.0.1`, `1.1`…) — arranca en `1.0` para el
    primer envío a revisión, sin relación con en qué `0.x.x` esté la web
    en ese momento.
    - **Build** (`CURRENT_PROJECT_VERSION`) tiene que subir en **cada**
    archivo/subida a App Store Connect, aunque la Version no cambie —
    Apple no acepta dos builds con el mismo número de build para la
    misma Version. Convención simple: `1`, `2`, `3`… en orden, sin saltos.

  En la práctica: cuando estés por compilar en Xcode para subir a
  TestFlight, fijate esos dos campos ahí (no en `package.json`) para
  saber "qué es lo que estoy por mandar". Después de cada subida exitosa,
  subí el Build en 1 antes de la próxima.
