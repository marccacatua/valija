import { LegalPage } from '../components/LegalPage';
import { SUPPORT_EMAIL } from '../data/contact';

export function Support() {
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
