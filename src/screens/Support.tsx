import { LegalPage } from '../components/LegalPage';
import { SUPPORT_EMAIL } from '../data/contact';
import { lang } from '../i18n';

export function Support() {
  if (lang === 'en') return <SupportEn />;
  return (
    <LegalPage title="Soporte">
      <p>¿Necesitás ayuda con Valija? Acá van las dudas más comunes.</p>

      <h2>¿Cómo empiezo?</h2>
      <p>
        Tocá "Armar mi valija", contestá unas pocas preguntas sobre el viaje (destino, clima, cuántos días) y la
        checklist se arma sola. Podés tildar los ítems a medida que vas empacando.
      </p>

      <h2>Abrí la app en Safari e instalada, y no veo lo mismo de un lado que del otro</h2>
      <p>
        Es una particularidad de iOS: la versión que abrís en Safari y la que instalaste en la pantalla de inicio
        guardan la información por separado, como si fueran dos dispositivos distintos. Para pasar tus datos de un
        lado al otro, andá a "Mis viajes" y tocá "Llevar mis datos a otro acceso" — copiás tus datos de un lado y los
        pegás del otro, sin perder nada.
      </p>

      <h2>¿Cómo desbloqueo Valija Pro?</h2>
      <p>
        Desde cualquier viaje, si tocás una función Pro (agregar ítems propios, plantillas, o repetir un viaje) te va
        a aparecer la opción de desbloquearlo con un pago único, sin suscripción.
      </p>

      <h2>Borré un viaje por error, ¿lo puedo recuperar?</h2>
      <p>Por ahora no — borrar un viaje es definitivo, por eso la app siempre pide confirmación antes de hacerlo.</p>

      <h2>¿Puedo usar Valija sin conexión a internet?</h2>
      <p>Sí, una vez que la abriste la primera vez, podés seguir usándola sin conexión para consultar o tildar tus viajes.</p>

      <h2>Contacto</h2>
      <p>
        Si tu duda no está acá, escribinos a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}

function SupportEn() {
  return (
    <LegalPage title="Support">
      <p>Need help with Valija? Here are the most common questions.</p>

      <h2>How do I get started?</h2>
      <p>
        Tap "Pack my bag", answer a few quick questions about the trip (destination, weather, how many days) and the
        checklist builds itself. You can tick items off as you pack.
      </p>

      <h2>I opened the app in Safari and from the Home Screen, and they don't show the same thing</h2>
      <p>
        It's an iOS quirk: the version you open in Safari and the one you added to your Home Screen store their data
        separately, as if they were two different devices. To move your data from one to the other, go to "My trips"
        and tap "Move my data between Safari and Home Screen" — you copy your data on one side and paste it on the
        other, without losing anything.
      </p>

      <h2>How do I unlock Valija Pro?</h2>
      <p>
        From any trip, if you tap a Pro feature (adding your own items, templates, or repeating a trip) you'll get the
        option to unlock it with a one-time payment, no subscription.
      </p>

      <h2>I deleted a trip by mistake. Can I get it back?</h2>
      <p>Not for now — deleting a trip is permanent, which is why the app always asks for confirmation first.</p>

      <h2>Can I use Valija offline?</h2>
      <p>Yes. Once you've opened it the first time, you can keep using it offline to check or tick off your trips.</p>

      <h2>Contact</h2>
      <p>
        If your question isn't here, write to us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
