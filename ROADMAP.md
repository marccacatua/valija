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
- [x] Aprobación de Apple (publicada)
- [x] Comprar Pro de verdad en la versión publicada
- [x] Borrar ramas ya mergeadas en GitHub (desde la web; acá da 403):
      calificacion, editar-viaje, espacio-litros, multi-turismo-clima,
      post-v1-ux, post-v1.1-fixes, ski-navegar, vista-arbol. **No** i18n-en.
- [ ] Info.plist: `ITSAppUsesNonExemptEncryption = NO`
- [x] UE: declaración de comerciante (DSA) enviada con documentos (2026-10-01)

## 2. Idiomas (v1.14.0, en main)

6 idiomas: rioplatense, España, Latinoamérica con tú, inglés, alemán y
portugués. Build 1.14.0 (4) subida el 2026-10-01 (la (2) tenía el código
viejo: no usarla).

- [x] Traducciones, selector de idioma y precio en moneda local
- [x] iOS declara en/es/de/pt-BR; sin pregunta de cifrado
- [ ] Crear la versión 1.14.0 en App Store Connect y cargar las fichas
      (textos: https://claude.ai/artifact/D6oj17CX34ceUfzoqVZTE1)
- [ ] Elegir la build 4 y enviar a revisión (sin tocar Valija Pro)
- [ ] Borrar la rama `i18n-en` en GitHub (ya está en main)

## 3. Cantidades y espacio en las valijas

Todo resuelto y en main (v1.9.0 a v1.12.0): lavar ropa, esquí sin
duplicados, viajes largos, litros, selección múltiple, editar opciones y
lista en árbol.

## 4. Cambio de celular

- [ ] Verificar que los viajes pasan con la copia de iCloud / Inicio rápido
- [ ] "Exportar copia" como archivo .json vía hoja de compartir
- [ ] "Importar copia" desde Archivos, con validación

## 5. Más adelante

- [ ] Android (Google Play), con los 6 idiomas desde el inicio

- [ ] Validar el texto del backup web
- [ ] `useTrips` sincronizado entre instancias
- [ ] Analíticas (TelemetryDeck): falta el App ID
- [ ] Google Play
- [ ] Plan de promoción
- [ ] App hermana: la mochila del bebé
