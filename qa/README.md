# QA

Dos scripts complementarios, pensados para correr después de tocar
`buildItems.ts`, `distribute.ts` o cualquier pantalla, antes de dar por
buena una versión.

## `npm run qa:logic`

Recorre el producto cartesiano de **todas** las opciones del formulario
(cientos de miles de combinaciones) y verifica invariantes de
`buildRawItems`, `distributeItems` y `quickGroupFor`: sin ítems
duplicados, ninguna cantidad inválida, nada se pierde al repartir entre
valijas, etc. Es lógica pura — no abre un navegador, corre en segundos.

## `npm run qa:ui`

Hace un build de producción, levanta un servidor de preview local y
corre ~40 casos con Playwright contra la app real: steppers de
cantidad, ítems personalizados, plantillas, distribución entre valijas,
vista rápida, combinar destinos, renombrar un viaje, borrado de viajes,
etc. Antes de la primera vez hay que instalar el navegador una sola vez:

```
npx playwright install chromium
```

Si por algo el navegador ya está instalado en una ruta no estándar
(por ejemplo en un sandbox de CI) se puede apuntar directo con la
variable `QA_CHROMIUM_PATH=/ruta/al/chrome npm run qa:ui`, sin tocar el
script.

## `npm run qa`

Corre los dos, en orden.

Ninguno de los dos modifica el código de la app: ambos son de solo
lectura sobre el comportamiento. Si algo falla, el mensaje incluye el
form/paso exacto que lo disparó.
