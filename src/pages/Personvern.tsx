import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";

const Personvern = () => {
  const lastUpdated = new Date().toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Layout>
      <PageHeader
        title="PERSONVERNERKLÆRING"
        subtitle="Slik håndterer vi dine personopplysninger"
      />

      <section className="poster-section">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">Sist oppdatert: <strong>{lastUpdated}</strong></p>

            {/* Section 1 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">1. Hvem vi er</h2>
              <ul className="space-y-2 text-foreground">
                <li><strong>Nettside:</strong> Simca Norge</li>
                <li><strong>Eier:</strong> Peter Arnt Halvorsen</li>
                <li><strong>Teknisk ansvarlig:</strong> Peder August Halvorsen</li>
                <li><strong>Sted:</strong> Grimstad, Norge</li>
                <li><strong>Teknisk support:</strong> <a href="mailto:kontaktpeder@gmail.com" className="text-primary hover:underline">kontaktpeder@gmail.com</a></li>
                <li><strong>Kontakt:</strong> <a href="mailto:p-ahalvo@online.no" className="text-primary hover:underline">p-ahalvo@online.no</a></li>
              </ul>
              <p className="mt-4 text-muted-foreground">
                Simca Norge er en ideell formidlingsside for entusiaster av Simca, Talbot og Matra. 
                Nettsiden brukes til å dele bilhistorier, formidle bildeler og svare på henvendelser fra publikum.
              </p>
            </div>

            {/* Section 2 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">2. Hvilke personopplysninger vi samler inn</h2>
              <p className="mb-4">Når du bruker nettsiden kan vi samle inn følgende opplysninger:</p>
              
              <h3 className="font-display text-lg mb-2">A) Innsending av bil og historie</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>Navn (brukes som kreditering ved publisering)</li>
                <li>E-post</li>
                <li>Eventuelt telefonnummer</li>
                <li>Bilder du laster opp</li>
                <li>Tekst og informasjon du selv sender inn (historie, detaljer, tilstand)</li>
              </ul>

              <h3 className="font-display text-lg mb-2">B) Deleforespørsel</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>Navn</li>
                <li>E-post</li>
                <li>Eventuelt telefonnummer</li>
                <li>Bilmodell og årsmodell</li>
                <li>Melding og forespurte deler</li>
              </ul>

              <h3 className="font-display text-lg mb-2">C) Kontaktmelding</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>Navn</li>
                <li>E-post</li>
                <li>Eventuelt telefonnummer</li>
                <li>Emne og meldingsinnhold</li>
              </ul>

              <h3 className="font-display text-lg mb-2">D) Enkel bruksstatistikk (uten cookies)</h3>
              <p className="text-muted-foreground">
                Vi kan registrere <strong>aggregert bruk</strong> av nettsiden (f.eks. antall besøk siste 30 dager og aktive brukere i øyeblikket).
                Vi bruker <strong>ikke cookies</strong>, og vi samler ikke inn personidentifiserende sporingsdata.
              </p>
            </div>

            {/* Section 3 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">3. Hva vi bruker opplysningene til</h2>
              <p className="mb-4">Personopplysninger brukes kun for å:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>behandle og publisere bilinnsendinger</li>
                <li>kreditere bidragsytere med navn</li>
                <li>svare på deleforespørsler</li>
                <li>besvare kontaktmeldinger</li>
                <li>administrere innboks og henvendelser</li>
                <li>forbedre nettsiden gjennom anonym, aggregert statistikk</li>
              </ul>
              <p className="mt-4 text-muted-foreground font-medium">
                Vi bruker ikke opplysningene til markedsføring eller videresalg.
              </p>
            </div>

            {/* Section 4 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">4. Redigering og publisering av innsendt innhold</h2>
              <p className="mb-4">
                Ved innsending av bil/historie må du samtykke til at Simca Norge kan <strong>redigere og forbedre</strong> innholdet før publisering.
              </p>
              <p className="mb-2">Dette innebærer:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>retting av skrivefeil</li>
                <li>presisering av tekniske detaljer</li>
                <li>strukturering av teksten</li>
              </ul>
              <p className="text-muted-foreground">
                <strong>Budskapet og historien endres ikke</strong>, og navnet ditt brukes som kreditering dersom du har oppgitt det.
              </p>
            </div>

            {/* Section 5 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">5. Rettslig grunnlag (GDPR)</h2>
              <p className="mb-4">Vi behandler personopplysninger basert på:</p>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <strong>Samtykke</strong> (GDPR art. 6 nr. 1 a)<br />
                  – når du sender inn innhold og godkjenner vilkår
                </li>
                <li>
                  <strong>Berettiget interesse</strong> (GDPR art. 6 nr. 1 f)<br />
                  – for å drifte nettsiden og svare på henvendelser
                </li>
                <li>
                  <strong>Forespørsel</strong> (GDPR art. 6 nr. 1 b)<br />
                  – når du ber oss undersøke deler eller ta kontakt
                </li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">6. Lagringstid</h2>
              <p className="mb-4">Vi lagrer opplysninger så lenge det er nødvendig:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Bilinnsendinger:</strong> lagres så lenge artikkelen er publisert, eller til du ber om endring eller fjerning</li>
                <li><strong>Deleforespørsler og kontaktmeldinger:</strong> lagres normalt i opptil <strong>12 måneder</strong></li>
                <li><strong>Bruksstatistikk:</strong> lagres kun i aggregert form og uten persondata</li>
              </ul>
            </div>

            {/* Section 7 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">7. Databehandlere og tekniske løsninger</h2>
              <p className="mb-4">For å drifte nettsiden bruker vi følgende tjenester:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li><strong>Lovable Cloud</strong> – nettsideplattform, database og bildelagring</li>
                <li><strong>Resend</strong> – utsending av e-post (bekreftelser og varsler)</li>
              </ul>
              <p className="text-muted-foreground">
                Disse leverandørene behandler kun data på våre vegne og i tråd med gjeldende personvernlovgivning.
              </p>
            </div>

            {/* Section 8 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">8. Dine rettigheter</h2>
              <p className="mb-4">Du har rett til å:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>få innsyn i hvilke opplysninger vi har om deg</li>
                <li>be om retting av feil</li>
                <li>be om sletting av opplysninger</li>
                <li>trekke tilbake samtykke</li>
                <li>be om at innhold anonymiseres eller fjernes</li>
              </ul>
              <p className="text-muted-foreground mb-2">
                Henvendelser sendes til: <a href="mailto:p-ahalvo@online.no" className="text-primary hover:underline font-medium">p-ahalvo@online.no</a>
              </p>
              <p className="text-muted-foreground">
                Du kan også klage til <strong>Datatilsynet</strong> dersom du mener regelverket ikke følges.
              </p>
            </div>

            {/* Section 9 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">9. Bilder og personopplysninger</h2>
              <p className="text-muted-foreground mb-2">
                Bilder kan inneholde personopplysninger (f.eks. personer eller registreringsnummer).
                Gi beskjed dersom noe bør sladdes, endres eller fjernes.
              </p>
              <p className="text-muted-foreground font-medium">
                Vi anbefaler å <strong>ikke laste opp sensitiv informasjon</strong>.
              </p>
            </div>

            {/* Section 10 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">10. Sikkerhet</h2>
              <p className="text-muted-foreground">
                Kun eier og teknisk ansvarlig har tilgang til administrasjon og innboks.
                Vi benytter rimelige tekniske tiltak for å sikre data mot uautorisert tilgang.
              </p>
            </div>

            {/* Section 11 */}
            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">11. Endringer</h2>
              <p className="text-muted-foreground">
                Denne personvernerklæringen kan oppdateres ved behov. 
                Dato for siste oppdatering vil alltid fremgå øverst på siden.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Personvern;
