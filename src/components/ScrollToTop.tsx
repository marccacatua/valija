import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** React Router no resetea el scroll entre rutas (a diferencia de una
 * navegación multi-página tradicional). Sin esto, venir de una pantalla
 * larga a una corta deja la ventana scrolleada más abajo del contenido
 * nuevo, mostrando la pantalla en blanco. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
