# Roadmap de Valija

Checklist interactiva (lo que se tilda queda guardado):
https://claude.ai/artifact/LMb1kqMbPuQ4Dhx7cGWELs

Esta es una copia de referencia, al 2026-10-01. El estado de cada tarea se
lleva en la checklist de arriba.

## 1. Publicar la versión paga

Enviada a revisión el 2026-10-01: versión 1.13.0 (build 2, `main` ·
8734dfe) junto con la compra Valija Pro (`valija_pro_unlock`). Publicación
automática al aprobarse.

- [x] Mac: `git pull`, `npm ci`, `npm run build`, `npx cap sync ios`
- [x] Xcode: Version 1.13.0, Build 2
- [x] iPhone (sandbox): comprar Pro, cerrar y reabrir → Pro sigue activo
- [x] iPhone: borrar y reinstalar → Pro vuelve con "restaurar"
- [x] iPhone: instalar encima de la v1.0 con viajes → los viajes siguen
- [x] iPhone: vibra al tildar; en modo avión la letra es Nunito
- [x] iPhone: pedido de calificación al completar el 2.º viaje
- [x] Archive → subir a App Store Connect
- [x] Privacidad de la app: "Historial de compras" (funcionalidad, no vinculado, sin rastreo)
- [x] Subtítulo y palabras clave
- [x] Versión 1.13.0 con el IAP en el mismo envío → enviada a revisión
- [ ] Aprobación de Apple
- [ ] Comprar Pro de verdad en la versión publicada (y pedir reembolso si se quiere)
- [x] Borrar ramas ya mergeadas en GitHub (desde la web; acá da 403):
      calificacion, editar-viaje, espacio-litros, multi-turismo-clima,
      post-v1-ux, post-v1.1-fixes, ski-navegar, vista-arbol. **No** i18n-en.
- [ ] Info.plist: `ITSAppUsesNonExemptEncryption = NO`
- [ ] UE: declaración de comerciante (DSA) en Business → cumplimiento normativo

## 2. Versión en inglés (rama `i18n-en`)

- [ ] Probar la preview: valija-git-i18n-en-marccacatua.vercel.app/?lang=en
- [ ] Revisar el tono de las traducciones (`src/i18n/en.ts`, `src/i18n/enItems.ts`)
- [ ] Merge a main (después de que se publique la v1.13.0)
- [ ] Info.plist: idioma base español + idiomas (es, en)
- [ ] Ficha de la tienda, capturas y nombre del IAP en inglés

## 3. Cantidades y espacio en las valijas

Todo resuelto y en main (v1.9.0 a v1.12.0): lavar ropa, esquí sin
duplicados, viajes largos, litros, selección múltiple, editar opciones y
lista en árbol.

## 4. Cambio de celular

- [ ] Verificar que los viajes pasan con la copia de iCloud / Inicio rápido
- [ ] "Exportar copia" como archivo .json vía hoja de compartir
- [ ] "Importar copia" desde Archivos, con validación

## 5. Más adelante

- [ ] Validar el texto del backup web
- [ ] `useTrips` sincronizado entre instancias
- [ ] Analíticas (TelemetryDeck): falta el App ID
- [ ] Google Play
- [ ] Plan de promoción
- [ ] App hermana: la mochila del bebé
