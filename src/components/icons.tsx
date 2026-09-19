// Iconitos SVG puntuales del formulario, portados 1:1 del prototipo visual.
export const DestIcons = {
  playa: (
    <svg width="34" height="26" viewBox="0 0 34 26">
      <circle cx="10" cy="9" r="7" fill="var(--mustard)" />
      <path d="M2 20q5-5 10 0t10 0t10 0" stroke="var(--teal)" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </svg>
  ),
  montana: (
    <svg width="34" height="26" viewBox="0 0 34 26">
      <polygon points="12,3 22,21 2,21" fill="var(--teal)" />
      <polygon points="23,9 32,21 15,21" fill="var(--mountain-dark)" />
    </svg>
  ),
  ciudad: (
    <svg width="34" height="26" viewBox="0 0 34 26">
      <rect x="3" y="8" width="8" height="13" rx="2" fill="var(--violet)" />
      <rect x="13" y="3" width="8" height="18" rx="2" fill="var(--violet-dark)" />
      <rect x="23" y="11" width="8" height="10" rx="2" fill="var(--violet)" />
    </svg>
  ),
};

export const ClimaIcons = {
  calor: (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7" fill="var(--mustard)" />
    </svg>
  ),
  templado: (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="9" cy="9" r="5.5" fill="var(--mustard)" />
      <rect x="8" y="13" width="14" height="8" rx="4" fill="var(--cloud)" />
    </svg>
  ),
  frio: (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <rect x="7" y="7" width="10" height="10" rx="2" transform="rotate(45 12 12)" fill="var(--sky)" />
    </svg>
  ),
  lluvia: (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="8" rx="4" fill="var(--cloud)" />
      <circle cx="8" cy="18" r="2.2" fill="var(--sky)" />
      <circle cx="14" cy="18" r="2.2" fill="var(--sky)" />
    </svg>
  ),
};

export const MaletaIcons = {
  carry: (
    <svg width="24" height="26" viewBox="0 0 24 26">
      <rect x="9" y="2" width="6" height="6" rx="3" fill="none" stroke="var(--ink)" strokeWidth="2.6" />
      <rect x="3" y="8" width="18" height="15" rx="5" fill="var(--mustard)" />
    </svg>
  ),
  bodega: (
    <svg width="24" height="26" viewBox="0 0 24 26">
      <rect x="8" y="2" width="8" height="5" rx="2.5" fill="none" stroke="var(--ink)" strokeWidth="2.6" />
      <rect x="1" y="7" width="22" height="17" rx="5" fill="var(--teal)" />
    </svg>
  ),
  mochila: (
    <svg width="24" height="26" viewBox="0 0 24 26">
      <path d="M6 24V11a6 6 0 0112 0v13z" fill="var(--violet)" />
      <rect x="9" y="14" width="6" height="6" rx="2" fill="var(--cream)" />
    </svg>
  ),
};

// Íconos de la pregunta combinada "¿Viajás con niño chico y/o mascota?"
// (TripForm.tsx) — un biberón para niño chico, una huella para mascota.
export const NinoIcon = (
  <svg width="20" height="30" viewBox="0 0 20 30">
    <path d="M8 2h4v4h-4z" fill="var(--baby-pink-dark)" />
    <rect x="6" y="6" width="8" height="4" rx="2" fill="var(--baby-pink-dark)" />
    <rect x="3" y="10" width="14" height="18" rx="5" fill="var(--baby-pink)" />
  </svg>
);

export const MascotaIcon = (
  <svg width="30" height="28" viewBox="0 0 30 28">
    <ellipse cx="15" cy="20" rx="9" ry="7" fill="var(--clay)" />
    <circle cx="4" cy="9" r="3.6" fill="var(--clay)" />
    <circle cx="11" cy="3" r="3.8" fill="var(--clay)" />
    <circle cx="19" cy="3" r="3.8" fill="var(--clay)" />
    <circle cx="26" cy="9" r="3.6" fill="var(--clay)" />
  </svg>
);

export const CampingIcon = (
  <svg width="26" height="26" viewBox="0 0 26 26">
    <polygon points="13,3 24,23 2,23" fill="var(--forest)" />
    <polygon points="13,3 17,23 9,23" fill="var(--forest-dark)" />
  </svg>
);

// Reemplazan a los emoji 🔒/🔓 que se usaban antes: en el WebView nativo de
// iOS (Capacitor) esos glyphs no renderizaban (aparecía un "?" en un
// cuadrado) — encontrado probando la primera build real en Xcode. `currentColor`
// a propósito (a diferencia del resto de los íconos de este archivo, que fijan
// un color con `var(--token)`): estos aparecen mezclados en distinto texto
// (chip bloqueado, botón de desbloquear, badge del paywall), cada uno con su
// propio color, así que conviene que hereden el color del texto que acompañan.
export const LockIcon = (
  <svg width="13" height="15" viewBox="0 0 13 15" style={{ verticalAlign: '-1.5px' }}>
    <path d="M3 6.5V4.5a3.5 3.5 0 017 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="1.5" y="6.5" width="10" height="7.5" rx="2" fill="currentColor" />
  </svg>
);

export const UnlockIcon = (
  <svg width="13" height="15" viewBox="0 0 13 15" style={{ verticalAlign: '-1.5px' }}>
    <path d="M3 6.5V4.5a3.5 3.5 0 016.5-1.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="1.5" y="6.5" width="10" height="7.5" rx="2" fill="currentColor" />
  </svg>
);

export const BackArrowIcon = (
  <svg width="12" height="18" viewBox="0 0 12 18">
    <path d="M9 2L3 9l6 7" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const EditIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path
      d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.83l-1.17-1.17a2 2 0 0 0-2.83 0L4 16v4Z"
      fill="none"
      stroke="var(--paper)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
