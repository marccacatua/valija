# Roadmap de Valija

Checklist interactiva (lo que se tilda queda guardado):
https://claude.ai/artifact/LMb1kqMbPuQ4Dhx7cGWELs

Esta es una copia de referencia, al 2026-09-24. El estado de cada tarea se
lleva en la checklist de arriba.

## 1. Publicar la versión paga (a la vuelta de las vacaciones)

Sale de `main` (v1.8.0 · 45b127f). La compra Pro (`valija_pro_unlock`) se
sube junto con esta versión.

- [ ] Mac: `git pull`, `npm ci`, `npm run build`, `npx cap sync ios`
- [ ] Xcode: MARKETING_VERSION 1.0 → 1.8.0, CURRENT_PROJECT_VERSION 1 → 2
- [ ] iPhone (sandbox): comprar Pro, cerrar y reabrir → Pro sigue activo
- [ ] iPhone: borrar y reinstalar → Pro vuelve solo o con "restaurar"
- [ ] iPhone: instalar encima de la v1.0 con viajes → los viajes siguen
- [ ] iPhone: vibra al tildar; en modo avión la letra es Nunito
- [ ] Archive → subir a App Store Connect
- [ ] Privacidad de la app: "Historial de compras" (funcionalidad, no vinculado, sin rastreo)
- [ ] Versión 1.8.0 con el IAP adjunto → enviar a revisión
- [ ] Borrar ramas viejas en GitHub: post-v1-ux, post-v1.1-fixes, ski-navegar

## 2. Versión en inglés (rama `i18n-en`)

- [ ] Probar la preview: valija-git-i18n-en-marccacatua.vercel.app/?lang=en
- [ ] Revisar el tono de las traducciones (`src/i18n/en.ts`, `src/i18n/enItems.ts`)
- [ ] Merge a main como v1.9.0 (después de publicar la v1.8.0)
- [ ] Info.plist: idioma base español + idiomas (es, en)
- [ ] Ficha de la tienda, capturas y nombre del IAP en inglés

## 3. Cantidades y espacio en las valijas

- [ ] Fix: "lavar ropa" sube los pantalones de 1 a 2 en viajes de 2–3 días
- [ ] Esquí + frío: sacar duplicados de ropa de calle (gorro/guantes, bufanda, botas, medias)
- [ ] Viajes largos sin lavar: sugerir "lavar ropa" desde 10 días
- [ ] Volumen estándar por ítem (litros) y capacidad por valija → "carry-on al 87 %"

## 4. Cambio de celular

- [ ] Verificar que los viajes pasan con la copia de iCloud / Inicio rápido
- [ ] "Exportar copia" como archivo .json vía hoja de compartir
- [ ] "Importar copia" desde Archivos, con validación

## 5. Más adelante

- [ ] Validar el texto del backup web
- [ ] `useTrips` sincronizado entre instancias
- [ ] Google Play
- [ ] Plan de promoción
- [ ] App hermana: la mochila del bebé
