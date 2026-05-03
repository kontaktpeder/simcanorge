import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { LEGAL_DOCS_LAST_UPDATED } from "@/config/legalDocs";

const Personvern = () => {
  return (
    <Layout>
      <PageHeader
        title="PERSONVERNERKLÆRING"
        subtitle="Slik håndterer vi dine personopplysninger"
      />

      <section className="poster-section">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">
              Sist oppdatert: <strong>{LEGAL_DOCS_LAST_UPDATED}</strong>
            </p>

            <p className="text-muted-foreground">
              Denne erklæringen beskriver personopplysninger knyttet til Bilgarasje.no. Bruk av tjenesten reguleres
              også av{" "}
              <Link to="/vilkar" className="text-primary hover:underline">
                brukervilkårene
              </Link>
              .
            </p>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">1. Behandlingsansvarlig</h2>
              <ul className="space-y-2 text-foreground">
                <li><strong>Nettside:</strong> Bilgarasje.no</li>
                <li><strong>Eier:</strong> Peter Arnt Halvorsen</li>
                <li><strong>Teknisk ansvarlig:</strong> Peder August Halvorsen</li>
                <li><strong>Sted:</strong> Grimstad, Norge</li>
                <li><strong>Kontakt (generelt):</strong> <a href="mailto:p-ahalvo@online.no" className="text-primary hover:underline">p-ahalvo@online.no</a></li>
                <li><strong>Teknisk support:</strong> <a href="mailto:kontaktpeder@gmail.com" className="text-primary hover:underline">kontaktpeder@gmail.com</a></li>
              </ul>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">2. Hvilke opplysninger vi behandler</h2>
              <p className="mb-4 text-muted-foreground">Avhengig av hva du gjør i tjenesten kan vi behandle:</p>

              <h3 className="font-display text-lg mb-2">A) Brukerkonto og profil</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>E-postadresse og autentiseringsdata knyttet til innlogging (leverandør: Supabase Auth)</li>
                <li>Profilinformasjon du legger inn (f.eks. visningsnavn, slug, profilbilde, bio, lokasjon)</li>
              </ul>

              <h3 className="font-display text-lg mb-2">B) Biler, historikk og aktivitet</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>Data om bil (merke, modell, år, kallenavn/tittel, bilder, tekst, registreringsnummer der det oppgis)</li>
                <li>Tidslinjehendelser (tekst, bilder, synlighet som offentlig/privat der funksjonen finnes)</li>
                <li>Aktivitet som turer/øyeblikk/spotting når disse funksjonene er tilgjengelige</li>
              </ul>

              <h3 className="font-display text-lg mb-2">C) Feed og sosiale funksjoner</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>Innlegg i felles feed (tekst og pekere til bil/arrangement/annonse etter hva som publiseres)</li>
                <li>Likes og kommentarer knyttet til innlegg eller innhold</li>
              </ul>

              <h3 className="font-display text-lg mb-2">D) Skjemaer og henvendelser</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>Innsending av bil/historie (navn, e-post, telefon, bilder, fritekst)</li>
                <li>Deleforespørsel, kontaktskjema og meldinger til oss</li>
              </ul>

              <h3 className="font-display text-lg mb-2">E) Drift og forbedring</h3>
              <p className="text-muted-foreground">
                Vi kan loggføre tekniske hendelser i begrenset omfang (for eksempel produktnavn for en handling i appen)
                for feilsøking og forbedring. Dette knyttes normalt til innlogget bruk der det er teknisk mulig.
              </p>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">3. Formål og rettslig grunnlag (GDPR)</h2>
              <p className="mb-2 text-muted-foreground">Vi behandler opplysninger for å:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>levere og sikre tjenesten (konto, innhold, feed, kommentarer)</li>
                <li>publisere og vise innhold du ber om å gjøre synlig</li>
                <li>svare på henvendelser og administrere support</li>
                <li>oppfylle rettslige forpliktelser</li>
              </ul>
              <p className="mb-2 text-muted-foreground">Hjemmel i hovedsak:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Samtykke (art. 6 nr. 1 bokstav a) der du eksplisitt godtar (f.eks. ved registrering eller innsending)</li>
                <li>Berettiget interesse (art. 6 nr. 1 bokstav f) for drift, sikkerhet og begrenset analyse</li>
                <li>Avtale (art. 6 nr. 1 bokstav b) der behandling er nødvendig for å levere en bestilt tjeneste</li>
              </ul>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">4. Lagring, sletting og overføring</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Innhold lagres så lenge det er aktivt i tjenesten eller til du ber om sletting/anonymisering, med mindre vi må beholde det av rettslige grunner.</li>
                <li>Henvendelser kan lagres i en begrenset periode (typisk inntil 12–24 måneder) med mindre lengre lagring er nødvendig.</li>
                <li>Databehandling kan skje utenfor EØS dersom underleverandør krever det (f.eks. USA) – da skal det ligge til grunn lovlige overføringsmekanismer (standardkontraktsklausuler e.l.).</li>
              </ul>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">5. Databehandlere</h2>
              <p className="mb-2 text-muted-foreground">For drift brukes blant annet:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>Supabase – database, autentisering, fillagring og relaterte tjenester for appen</li>
                <li>E-postleverandør (f.eks. Resend eller tilsvarende) for transaksjonelle e-poster der dette er i bruk</li>
              </ul>
              <p className="text-muted-foreground">
                Underleverandører behandler data på våre vegne i henhold til databehandleravtale der det kreves.
              </p>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">6. Informasjonskapsler og lokal lagring</h2>
              <p className="text-muted-foreground">
                Innlogging og økt kan kreve at nettleseren tillater lokal lagring (for eksempel localStorage eller
                tilsvarende). Enkelte deler av grensesnittet kan bruke teknisk nødvendig lagring (f.eks. for UI-preferanser).
                Vi bruker ikke informasjonskapsler til målrettet annonsering fra vår side gjennom denne erklæringen.
              </p>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">7. Bilder og registreringsnummer</h2>
              <p className="text-muted-foreground">
                Bilder kan vise personer eller kjennemerker. Registreringsnummer kan anses som personopplysning.
                Unngå å publisere sensitiv informasjon du ikke ønsker offentlig. Ta kontakt for sletting, sladding eller
                retting.
              </p>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">8. Dine rettigheter</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Innsyn, retting, sletting, begrensning og dataportabilitet der det følger av regelverket</li>
                <li>Klage til Datatilsynet</li>
              </ul>
              <p className="text-muted-foreground">
                Henvendelser:{" "}
                <a href="mailto:p-ahalvo@online.no" className="text-primary hover:underline font-medium">
                  p-ahalvo@online.no
                </a>
              </p>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">9. Endringer</h2>
              <p className="text-muted-foreground">
                Erklæringen kan oppdateres. Revisjonsdato settes manuelt i kildekode (<code>LEGAL_DOCS_LAST_UPDATED</code>) når
                innholdet faktisk endres.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Personvern;
