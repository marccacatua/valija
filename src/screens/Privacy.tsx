import { LegalPage } from '../components/LegalPage';
import styles from '../components/LegalPage.module.css';
import { SUPPORT_EMAIL } from '../data/contact';
import { lang } from '../i18n';

export function Privacy() {
  if (lang === 'en') return <PrivacyEn />;
  if (lang === 'de') return <PrivacyDe />;
  if (lang === 'pt') return <PrivacyPt />;
  if (lang === 'es-ES' || lang === 'es-419') return <PrivacyTu />;
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

// Español "con tú" (España y Latinoamérica): mismo texto que el rioplatense,
// sin voseo y con palabras que se entienden en todos lados ("teléfono",
// "correo").
function PrivacyTu() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Valija está pensada para que hagas tu checklist de viaje sin tener que crear una cuenta ni entregar ningún
        dato. Esta página explica, en palabras sencillas, qué información toca la app y qué no.
      </p>

      <h2>Qué datos recogemos</h2>
      <p>Ninguno. Valija no tiene servidor propio: no hay un lugar donde tus datos "viajen" ni se guarden fuera de tu teléfono.</p>

      <h2>Dónde vive tu información</h2>
      <p>
        Todo lo que introduces — tus viajes, los ítems que añades a mano, tus plantillas — se guarda únicamente en el
        almacenamiento local de tu propio dispositivo (el mismo mecanismo que usa cualquier sitio web para recordar
        tus preferencias). Nunca sale de tu teléfono salvo que tú decidas compartirlo a propósito (por ejemplo, con
        el botón "Compartir checklist", o al usar "Llevar mis datos a otro acceso").
      </p>

      <h2>Qué NO hacemos</h2>
      <ul>
        <li>No pedimos ni guardamos tu nombre, correo ni ningún dato de contacto.</li>
        <li>No usamos analítica que identifique a personas ni rastree tu actividad.</li>
        <li>No mostramos publicidad de terceros.</li>
        <li>No vendemos ni compartimos información con nadie — no tenemos información que compartir.</li>
        <li>No accedemos a tu cámara, contactos, ubicación ni a ningún otro permiso del teléfono.</li>
      </ul>

      <h2>Conexiones a internet</h2>
      <p>
        Para crear y guardar tus viajes, Valija no se conecta a internet: todo (incluida la tipografía) viene dentro
        de la app.
      </p>

      <h2>Compra dentro de la app</h2>
      <p>
        Si desbloqueas Valija Pro, esa compra la procesa Apple a través del App Store — nosotros nunca vemos ni
        guardamos tu información de pago. Para confirmar la compra y poder restaurarla, la app usa RevenueCat, un
        servicio que recibe de Apple el comprobante de compra asociado a un identificador anónimo (no tu nombre, tu
        correo ni tus viajes).
      </p>

      <h2>Borrar tus datos</h2>
      <p>
        Puedes borrar un viaje concreto o todos tus viajes en cualquier momento desde "Mis viajes" dentro de la app.
        Si además quieres borrar cualquier rastro local, basta con borrar los datos del sitio/app desde los ajustes
        de tu navegador o teléfono.
      </p>

      <h2>Cambios en esta política</h2>
      <p>
        Si en el futuro añadimos algo que sí recoja datos (por ejemplo, analítica anónima de uso para mejorar la
        app), esta página se actualizará antes de que eso ocurra, con la fecha del cambio.
      </p>

      <h2>Contacto</h2>
      <p>
        ¿Dudas sobre esto? Escríbenos a <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <div className={styles.updated}>Última actualización: octubre de 2026.</div>
    </LegalPage>
  );
}

function PrivacyDe() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <p>
        Mit Valija erstellst du deine Packliste, ohne ein Konto anzulegen oder irgendwelche Daten preiszugeben. Diese
        Seite erklärt in einfachen Worten, mit welchen Informationen die App arbeitet und mit welchen nicht.
      </p>

      <h2>Welche Daten wir erheben</h2>
      <p>Keine. Valija hat keinen eigenen Server: Deine Daten werden nirgendwohin „übertragen“ und nirgends außerhalb deines Telefons gespeichert.</p>

      <h2>Wo deine Informationen gespeichert sind</h2>
      <p>
        Alles, was du eingibst — deine Reisen, selbst hinzugefügte Artikel, deine Vorlagen —, wird ausschließlich im
        lokalen Speicher deines eigenen Geräts abgelegt (derselbe Mechanismus, mit dem sich jede Website deine
        Einstellungen merkt). Es verlässt dein Telefon nur, wenn du es bewusst teilst (zum Beispiel mit der
        Schaltfläche „Checkliste teilen“ oder mit „Daten zwischen Safari und Home-Bildschirm übertragen“).
      </p>

      <h2>Was wir NICHT tun</h2>
      <ul>
        <li>Wir fragen weder nach deinem Namen noch nach deiner E-Mail-Adresse oder anderen Kontaktdaten und speichern sie nicht.</li>
        <li>Wir verwenden keine Analyse-Tools, die Personen identifizieren oder deine Aktivität verfolgen.</li>
        <li>Wir zeigen keine Werbung von Dritten.</li>
        <li>Wir verkaufen oder teilen keine Informationen — wir haben gar keine, die wir teilen könnten.</li>
        <li>Wir greifen nicht auf Kamera, Kontakte, Standort oder andere Berechtigungen deines Telefons zu.</li>
      </ul>

      <h2>Internetverbindungen</h2>
      <p>Zum Erstellen und Speichern deiner Reisen verbindet sich Valija nicht mit dem Internet: Alles (auch die Schriftart) ist in der App enthalten.</p>

      <h2>In-App-Kauf</h2>
      <p>
        Wenn du Valija Pro freischaltest, wickelt Apple den Kauf über den App Store ab — wir sehen oder speichern
        deine Zahlungsdaten zu keinem Zeitpunkt. Um den Kauf zu bestätigen und wiederherstellen zu können, nutzt die
        App RevenueCat, einen Dienst, der von Apple den Kaufbeleg erhält, verknüpft mit einer anonymen Kennung (nicht
        mit deinem Namen, deiner E-Mail-Adresse oder deinen Reisen).
      </p>

      <h2>Deine Daten löschen</h2>
      <p>
        Du kannst jederzeit eine einzelne Reise oder alle deine Reisen unter „Meine Reisen“ in der App löschen. Wenn
        du zusätzlich alle lokalen Spuren entfernen möchtest, lösche einfach die Website- bzw. App-Daten in den
        Einstellungen deines Browsers oder Telefons.
      </p>

      <h2>Änderungen dieser Erklärung</h2>
      <p>
        Sollten wir künftig etwas hinzufügen, das doch Daten erhebt (zum Beispiel anonyme Nutzungsstatistiken zur
        Verbesserung der App), wird diese Seite vorher aktualisiert, mit dem Datum der Änderung.
      </p>

      <h2>Kontakt</h2>
      <p>
        Fragen dazu? Schreib uns an <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <div className={styles.updated}>Zuletzt aktualisiert: Oktober 2026.</div>
    </LegalPage>
  );
}

function PrivacyPt() {
  return (
    <LegalPage title="Política de privacidade">
      <p>
        O Valija foi pensado para você montar seu checklist de viagem sem criar uma conta nem fornecer nenhum dado.
        Esta página explica, em palavras simples, quais informações o app usa e quais não.
      </p>

      <h2>Quais dados coletamos</h2>
      <p>Nenhum. O Valija não tem servidor próprio: seus dados não "viajam" para lugar nenhum nem ficam guardados fora do seu celular.</p>

      <h2>Onde ficam suas informações</h2>
      <p>
        Tudo o que você cadastra — suas viagens, os itens que adiciona à mão, seus modelos — fica guardado apenas no
        armazenamento local do seu próprio aparelho (o mesmo mecanismo que qualquer site usa para lembrar suas
        preferências). Nada sai do seu celular, a não ser que você decida compartilhar de propósito (por exemplo, com
        o botão "Compartilhar checklist" ou com "Transferir dados entre Safari e Tela de Início").
      </p>

      <h2>O que NÃO fazemos</h2>
      <ul>
        <li>Não pedimos nem guardamos seu nome, e-mail ou qualquer dado de contato.</li>
        <li>Não usamos análises que identifiquem pessoas ou rastreiem sua atividade.</li>
        <li>Não mostramos publicidade de terceiros.</li>
        <li>Não vendemos nem compartilhamos informações com ninguém — não temos informações para compartilhar.</li>
        <li>Não acessamos sua câmera, contatos, localização nem nenhuma outra permissão do celular.</li>
      </ul>

      <h2>Conexões com a internet</h2>
      <p>Para montar e salvar suas viagens, o Valija não se conecta à internet: tudo (inclusive a fonte) já vem dentro do app.</p>

      <h2>Compra no app</h2>
      <p>
        Se você desbloquear o Valija Pro, a compra é processada pela Apple através da App Store — nós nunca vemos nem
        guardamos suas informações de pagamento. Para confirmar a compra e permitir restaurá-la, o app usa o
        RevenueCat, um serviço que recebe da Apple o comprovante de compra associado a um identificador anônimo (não ao
        seu nome, e-mail ou viagens).
      </p>

      <h2>Apagar seus dados</h2>
      <p>
        Você pode excluir uma viagem ou todas as suas viagens a qualquer momento em "Minhas viagens", dentro do app. Se
        quiser apagar também qualquer rastro local, basta limpar os dados do site/app nos ajustes do navegador ou do
        celular.
      </p>

      <h2>Mudanças nesta política</h2>
      <p>
        Se no futuro adicionarmos algo que colete dados (por exemplo, estatísticas anônimas de uso para melhorar o
        app), esta página será atualizada antes disso, com a data da mudança.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas? Escreva para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <div className={styles.updated}>Última atualização: outubro de 2026.</div>
    </LegalPage>
  );
}
