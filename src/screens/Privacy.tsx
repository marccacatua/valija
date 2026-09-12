import { LegalPage } from '../components/LegalPage';
import styles from '../components/LegalPage.module.css';
import { SUPPORT_EMAIL } from '../data/contact';

export function Privacy() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Valija está pensada para que armes tu checklist de viaje sin tener que crear una cuenta ni entregar ningún
        dato. Esta página explica, en criollo, qué información toca la app y qué no.
      </p>

      <h2>Qué datos recolectamos</h2>
      <p>Ninguno. Valija no tiene servidor propio: no hay un lugar donde tus datos "viajen" ni se guarden fuera de tu celular.</p>

      <h2>Dónde vive tu información</h2>
      <p>
        Todo lo que cargás — tus viajes, los ítems que agregás a mano, tus plantillas — se guarda únicamente en el
        almacenamiento local de tu propio dispositivo (el mismo mecanismo que usa cualquier sitio web para recordar
        tus preferencias). Nunca sale de tu celular salvo que vos decidas compartirlo a propósito (por ejemplo, con
        el botón "Compartir checklist", o al usar "Llevar mis datos a otro acceso").
      </p>

      <h2>Qué NO hacemos</h2>
      <ul>
        <li>No pedimos ni guardamos tu nombre, mail, ni ningún dato de contacto.</li>
        <li>No usamos analítica que identifique a personas ni rastree tu actividad.</li>
        <li>No mostramos publicidad de terceros.</li>
        <li>No vendemos ni compartimos información con nadie — no hay información nuestra para compartir.</li>
        <li>No accedemos a tu cámara, contactos, ubicación ni ningún otro permiso del celular.</li>
      </ul>

      <h2>La única conexión a internet que hace la app</h2>
      <p>
        Al abrir Valija, se carga una tipografía desde Google Fonts para que se vea bien. Esa carga la hace tu
        navegador directamente contra Google, sin pasar por nosotros — es el único tráfico de red que genera la app
        en su uso normal.
      </p>

      <h2>Compra dentro de la app</h2>
      <p>
        Si desbloqueás Valija Pro, esa compra la procesa Apple a través de App Store — nosotros no vemos ni guardamos
        tu información de pago en ningún momento.
      </p>

      <h2>Borrar tus datos</h2>
      <p>
        Podés borrar un viaje puntual o todos tus viajes en cualquier momento desde "Mis viajes" dentro de la app. Si
        además querés borrar cualquier rastro local, alcanza con borrar los datos del sitio/app desde los ajustes de
        tu navegador o celular.
      </p>

      <h2>Cambios a esta política</h2>
      <p>
        Si en el futuro sumamos algo que sí recolecte datos (por ejemplo, analítica anónima de uso para mejorar la
        app), esta página se va a actualizar antes de que eso pase, con la fecha del cambio.
      </p>

      <h2>Contacto</h2>
      <p>
        ¿Dudas sobre esto? Escribinos a{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <div className={styles.updated}>Última actualización: septiembre de 2026.</div>
    </LegalPage>
  );
}
