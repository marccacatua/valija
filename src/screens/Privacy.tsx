import { LegalPage } from '../components/LegalPage';
import styles from '../components/LegalPage.module.css';
import { SUPPORT_EMAIL } from '../data/contact';
import { lang } from '../i18n';

export function Privacy() {
  if (lang === 'en') return <PrivacyEn />;
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

      <h2>Conexiones a internet</h2>
      <p>
        Para armar y guardar tus viajes, Valija no se conecta a internet: todo (incluida la tipografía) viene dentro
        de la app.
      </p>

      <h2>Compra dentro de la app</h2>
      <p>
        Si desbloqueás Valija Pro, esa compra la procesa Apple a través de App Store — nosotros no vemos ni guardamos
        tu información de pago en ningún momento. Para confirmar la compra y poder restaurarla, la app usa
        RevenueCat, un servicio que recibe de Apple el comprobante de compra asociado a un identificador anónimo
        (no tu nombre, tu email ni tus viajes).
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

// Versión en inglés: texto completo aparte (no frase por frase),
// porque es un documento legal que se lee de corrido.
function PrivacyEn() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        Valija is designed so you can build your packing checklist without creating an account or handing over any
        data. This page explains, in plain words, what information the app touches and what it doesn't.
      </p>

      <h2>What data we collect</h2>
      <p>None. Valija has no server of its own: there is nowhere for your data to "travel" to or be stored outside your phone.</p>

      <h2>Where your information lives</h2>
      <p>
        Everything you enter — your trips, the items you add yourself, your templates — is stored only in your own
        device's local storage (the same mechanism any website uses to remember your preferences). It never leaves
        your phone unless you choose to share it on purpose (for example, with the "Share checklist" button, or with
        "Move my data between Safari and Home Screen").
      </p>

      <h2>What we DON'T do</h2>
      <ul>
        <li>We don't ask for or store your name, email or any contact details.</li>
        <li>We don't use analytics that identify people or track your activity.</li>
        <li>We don't show third-party ads.</li>
        <li>We don't sell or share information with anyone — we don't have any information to share.</li>
        <li>We don't access your camera, contacts, location or any other phone permission.</li>
      </ul>

      <h2>Internet connections</h2>
      <p>To build and save your trips, Valija doesn't connect to the internet: everything (including the font) ships inside the app.</p>

      <h2>In-app purchase</h2>
      <p>
        If you unlock Valija Pro, the purchase is processed by Apple through the App Store — we never see or store
        your payment information. To confirm the purchase and let you restore it, the app uses RevenueCat, a service
        that receives the purchase receipt from Apple, tied to an anonymous identifier (not your name, your email or
        your trips).
      </p>

      <h2>Deleting your data</h2>
      <p>
        You can delete a single trip or all of your trips at any time from "My trips" inside the app. If you also want
        to remove every local trace, just clear the site/app data from your browser or phone settings.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we ever add something that does collect data (for example, anonymous usage analytics to improve the app),
        this page will be updated before that happens, with the date of the change.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this? Write to us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <div className={styles.updated}>Last updated: September 2026.</div>
    </LegalPage>
  );
}
