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
- `src/features/flags.ts` — registro de features "pro". Todo vive en
  `pro: false` en este MVP; el día que se sume un paywall alcanza con
  flipear un flag acá (ver comentarios en el archivo).
- `src/screens/` — las 5 pantallas del flujo (Welcome, Intro, TripForm,
  Checklist, Trips), una por archivo con su CSS module.
- `src/components/` — piezas de UI compartidas (mascota, botones, chips,
  bottom nav, etc).

## PWA

Configurada con `vite-plugin-pwa` (manifest + service worker autoUpdate).
Los íconos salen de `scripts/generate-icons.mjs` (correlo de nuevo si cambia
la paleta o el ícono). Para publicar en el App Store más adelante, el paso
siguiente natural es envolver este build con Capacitor.
