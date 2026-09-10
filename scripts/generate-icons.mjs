// Genera los íconos de la PWA a partir de un SVG inline (Valu sobre fondo
// coral). Correr con `node scripts/generate-icons.mjs` si hace falta
// regenerarlos (cambio de paleta, etc).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

function mascotSvg({ size, mascotScale, cornerRadius }) {
  const m = (size * mascotScale) / 120; // el mascot original está en un viewBox 120x120
  const cx = size / 2;
  const cy = size / 2;
  const offsetX = cx - 60 * m;
  const offsetY = cy - 60 * m;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF6A3D"/>
      <stop offset="62%" stop-color="#F2522A"/>
      <stop offset="100%" stop-color="#E0431F"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#bg)"/>
  <g transform="translate(${offsetX} ${offsetY}) scale(${m})">
    <rect x="46" y="10" width="28" height="20" rx="10" fill="none" stroke="#241F1B" stroke-width="6"/>
    <rect x="14" y="26" width="92" height="76" rx="22" fill="#FFC53D"/>
    <rect x="14" y="52" width="92" height="14" rx="6" fill="#F3A81E"/>
    <circle cx="45" cy="44" r="9" fill="#FFFDF8"/>
    <circle cx="75" cy="44" r="9" fill="#FFFDF8"/>
    <circle cx="46" cy="46" r="4.5" fill="#241F1B"/>
    <circle cx="76" cy="46" r="4.5" fill="#241F1B"/>
    <path d="M50 74q10 10 20 0" stroke="#241F1B" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="106" r="8" fill="#241F1B"/>
    <circle cx="88" cy="106" r="8" fill="#241F1B"/>
  </g>
</svg>`;
}

const targets = [
  { file: 'icon-192.png', size: 192, mascotScale: 1.35, cornerRadius: 40 },
  { file: 'icon-512.png', size: 512, mascotScale: 1.35, cornerRadius: 108 },
  { file: 'icon-maskable-512.png', size: 512, mascotScale: 0.95, cornerRadius: 0 },
  { file: 'apple-touch-icon.png', size: 180, mascotScale: 1.35, cornerRadius: 40 },
];

for (const t of targets) {
  const svg = mascotSvg(t);
  await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, t.file));
  console.log('generated', t.file);
}
