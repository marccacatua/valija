interface MascotProps {
  size?: number;
  bodyColor?: string;
  strapColor?: string;
  animated?: boolean;
}

/** Valu, la valija mascota. Un solo componente parametrizable en vez de
 * repetir el mismo bloque de SVG en cada pantalla como hacía el prototipo. */
export function Mascot({ size = 56, bodyColor = '#FFC53D', strapColor = '#F3A81E', animated = false }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-label="Valu, la valija mascota"
      style={animated ? { animation: 'floaty 5s ease-in-out infinite' } : undefined}
    >
      <rect x="46" y="10" width="28" height="20" rx="10" fill="none" stroke="#241F1B" strokeWidth="6" />
      <rect x="14" y="26" width="92" height="76" rx="22" fill={bodyColor} />
      <rect x="14" y="52" width="92" height="14" rx="6" fill={strapColor} />
      <circle cx="45" cy="44" r="9" fill="#FFFDF8" />
      <circle cx="75" cy="44" r="9" fill="#FFFDF8" />
      <circle cx="46" cy="46" r="4.5" fill="#241F1B" />
      <circle cx="76" cy="46" r="4.5" fill="#241F1B" />
      <path d="M50 74q10 10 20 0" stroke="#241F1B" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="106" r="8" fill="#241F1B" />
      <circle cx="88" cy="106" r="8" fill="#241F1B" />
    </svg>
  );
}
