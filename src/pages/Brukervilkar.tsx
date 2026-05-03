import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { LEGAL_DOCS_LAST_UPDATED } from "@/config/legalDocs";

export default function Brukervilkar() {
  return (
    <Layout>
      <PageHeader
        title="BRUKERVILKÅR"
        subtitle="Vilkår for bruk av Bilgarasje.no"
      />

      <section className="poster-section">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">
              Sist oppdatert: <strong>{LEGAL_DOCS_LAST_UPDATED}</strong>
            </p>

            <p className="text-muted-foreground">
              Ved å bruke Bilgarasje.no forutsetter vi at du aksepterer disse vilkårene sammen med{" "}
              <Link to="/personvern" className="text-primary hover:underline">
                personvernerklæringen
              </Link>
              .
            </p>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">1. Tjenesten</h2>
              <p className="text-muted-foreground mb-3">
                Bilgarasje.no er en digital møteplass for bilinteresserte i Norge. Tjenesten kan blant annet omfatte
                registrering og visning av biler og historikk, tidslinjehendelser, felles feed, kommentarer og likes,
                brukerprofiler, samt funksjoner som øyeblikk, turer og spotting når disse er aktivert i tjenesten.
              </p>
              <p className="text-muted-foreground">
                Vi kan endre funksjonalitet for å drifte, forbedre eller sikre tjenesten. Vesentlige endringer i disse
                vilkårene gjøres synlige ved oppdatering av denne siden og ny «sist oppdatert»-dato.
              </p>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">2. Brukerkonto og sikkerhet</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Du er ansvarlig for å holde innloggingsinformasjon og enhetsikkerhet for din konto.</li>
                <li>Du skal oppgi korrekt informasjon der dette kreves for å gjennomføre en handling (f.eks. innsending).</li>
                <li>Du skal ikke opprette eller bruke kontoer for å omgå suspensjon, begrensninger eller moderering.</li>
              </ul>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">3. Innhold og lisens</h2>
              <p className="text-muted-foreground mb-3">
                Du beholder opphavsrett til innhold du selv skaper. Du gir Bilgarasje.no en ikke-eksklusiv,
                vederlagsfri rett til å vise, lagre, teknisk tilpasse og distribuere innholdet innenfor tjenesten
                (inkludert i feed, søk og deling på tvers av moduler som er en del av produktet).
              </p>
              <p className="text-muted-foreground mb-2">Du skal ikke publisere innhold som:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>er ulovlig, trakasserende, hatefulle ytringer, voldelig oppfordrende, pornografisk eller diskriminerende;</li>
                <li>krenker tredjeparts rettigheter (personvern, åndsverk, varemerke mv.);</li>
                <li>er spam, villedende, skadelig kode eller forsøk på å kompromittere tjenesten;</li>
                <li>avslører andres sensitive personopplysninger uten saklig grunnlag.</li>
              </ul>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">4. Offentlig synlighet</h2>
              <p className="text-muted-foreground">
                Avhengig av hva du publiserer og hvilke innstillinger som finnes i tjenesten, kan innhold være synlig
                for andre brukere eller offentlig på internett (for eksempel bilprofiler, offentlige øyeblikk og
                innlegg i feed). Du er ansvarlig for å vurdere hva du deler. Se{" "}
                <Link to="/personvern" className="text-primary hover:underline">
                  personvernerklæringen
                </Link>{" "}
                om bilder og registreringsnummer.
              </p>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">5. Moderering og avslutning</h2>
              <p className="text-muted-foreground">
                Vi kan fjerne innhold, begrense tilgang eller avslutte konto uten forhåndsvarsel dersom vilkår eller
                lov brytes, ved sikkerhetsrisiko, eller av driftsmessige årsaker. Du kan be om sletting og utøve
                rettigheter som beskrevet i personvernerklæringen.
              </p>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">6. Ansvarsbegrensning</h2>
              <p className="text-muted-foreground">
                Tjenesten leveres «som den er». Vi er ikke ansvarlige for innhold publisert av brukere, for innhold på
                eksterne lenker, eller for indirekte tap. Norsk rett gjelder for tolkning av vilkårene.
              </p>
            </div>

            <div className="border-chrome bg-card p-6 rounded-xl">
              <h2 className="headline-sm text-accent mb-4">7. Kontakt</h2>
              <p className="text-muted-foreground">
                Generelle henvendelser:{" "}
                <a href="mailto:p-ahalvo@online.no" className="text-primary hover:underline font-medium">
                  p-ahalvo@online.no
                </a>
                . Teknisk:{" "}
                <a href="mailto:kontaktpeder@gmail.com" className="text-primary hover:underline font-medium">
                  kontaktpeder@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
