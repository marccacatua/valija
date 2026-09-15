interface MascotProps {
  size?: number;
  bodyColor?: string;
  strapColor?: string;
  animated?: boolean;
}

/** Valu, la valija mascota. Un solo componente parametrizable en vez de
 * repetir el mismo bloque de SVG en cada pantalla como hacía el prototipo. */
export function Mascot({ size = 56, bodyColor = 'var(--mustard)', strapColor = 'var(--mascot-strap)', animated = false }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-label="Valu, la valija mascota"
      // display:block evita el espacio fantasma que deja un <svg> inline
      // debajo suyo (alineado a la línea de base, como una <img>) — sin
      // esto, el div que lo envuelve mide unos px más de lo que ocupa el
      // dibujo, y eso se nota en el morph (features/mascotMorph.ts): la
      // copia fuerza el svg a 100% del contenedor, así que terminaba un
      // poquito más grande/abajo que la mascota real.
      style={{ display: 'block', ...(animated ? { animation: 'floaty 5s ease-in-out infinite' } : null) }}
    >
      <rect x="46" y="10" width="28" height="20" rx="10" fill="none" stroke="var(--ink)" strokeWidth="6" />
      <rect x="14" y="26" width="92" height="76" rx="22" fill={bodyColor} />
      <rect x="14" y="52" width="92" height="14" rx="6" fill={strapColor} />
      <circle cx="45" cy="44" r="9" fill="var(--paper)" />
      <circle cx="75" cy="44" r="9" fill="var(--paper)" />
      <circle cx="46" cy="46" r="4.5" fill="var(--ink)" />
      <circle cx="76" cy="46" r="4.5" fill="var(--ink)" />
      <path d="M50 74q10 10 20 0" stroke="var(--ink)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="106" r="8" fill="var(--ink)" />
      <circle cx="88" cy="106" r="8" fill="var(--ink)" />
    </svg>
  );
}
