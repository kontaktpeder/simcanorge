
## Problem

På `/send-inn` (og `/legg-til-bil` som routes hit når du er utlogget) får eksisterende brukere ingen tydelig "jeg har konto"-vei. Wizarden ber om navn + e-post + telefon på `StepContact` ("HVEM ER DU?"), og bruker en **auth-last magic link**-flyt: vi sender en innloggingslenke etter innsending og kobler bilen til kontoen som matcher e-posten.

For en helt ny bruker funker dette. For en eksisterende bruker er det forvirrende:

- Det *ser ut* som hen lager en ny konto.
- Hvis hen åpner `/login` i en annen fane for å logge inn, mister hen alt hen har skrevet inn i wizarden (state lever i `CarWizard`, ikke i localStorage).
- Hvis hen fyller inn feil e-post (f.eks. en privat i stedet for kontoens), havner bilen i "mismatch"-flyten **etterpå** — dårlig opplevelse.

`CarWizard` har allerede prefill når brukeren *er* logget inn (`useEffect` på `user?.email`), så hvis vi får hen logget inn *før* eller *underveis i* wizarden, faller resten på plass automatisk: e-post + navn fylles, lås-flagget i `StepContact` (`emailLocked`/`nameLocked`) slår inn, og `handleSubmit` går rett inn i den autentiserte grenen (skip OTP, rett til garasje + PostCreateActionOverlay).

## Løsning

Tre små, sammenhengende grep — ingen endringer i datamodellen.

### 1. "Har du allerede konto? Logg inn" – øverst på `/send-inn`-gate-siden

I `SendInnBil.tsx` (både `gate`- og `wizard`-stegene) viser vi en diskré, men tydelig stripe over hovedinnholdet **kun når brukeren er utlogget**:

> **Har du allerede en bruker?** [Logg inn] — så husker vi hvem du er.

- Lenke til `/login?returnUrl=/legg-til-bil` (ikke `/send-inn`, fordi `LeggTilBil` redirecter innloggede brukere rett til `/dashboard/opprett-bil` der wizarden kjører i den autentiserte flyten med PostCreateActionOverlay).
- Bruker premium-dark + teal-aksent, samme stil som resten av wizard-headeren.
- Rendrer kun når `!user` (les via ny `useAuth()`-hook i `SendInnBil`).

### 2. Inline "Logg inn"-knapp i `StepContact` ("HVEM ER DU?")

Dette er stedet i flyten der forvirringen treffer hardest (skjermbildet ditt). Vi legger en liten linje **rett under undertittelen** når `emailLocked` er `false` (= utlogget):

> Har du allerede en konto? **Logg inn** så slipper du å skrive på nytt.

- "Logg inn" er en `<Link>` til `/login?returnUrl=/legg-til-bil`.
- Vi viser den **ikke** når `emailLocked` er true (innlogget bruker — da er feltet allerede låst og prefilt).
- Krever ny prop `showLoginHint?: boolean` på `StepContact`, satt fra `CarWizard` basert på `!user`.

### 3. Bevar utkastet i sessionStorage så "logg inn og kom tilbake" ikke nullstiller wizarden

Dette er den viktige delen som gjør #1 og #2 *trygge* å bruke. I dag mister man alt skrevet hvis man navigerer til `/login`.

I `CarWizard.tsx`:

- Når brukeren er **utlogget**, persist `data` + `step` til `sessionStorage` under nøkkel `wizard:draft:guest` på hver `setData`/`setStep`. Bilder (`File`-objekter) **ekskluderes** — de kan ikke serialiseres trygt; vi behåller bare `imagePreviews`-URLene som hint, og lar brukeren re-velge filer hvis nødvendig (vi viser en liten note: "Last opp bildene på nytt – resten husker vi").
- Ved mount: hvis `sessionStorage` har et utkast og brukeren er **utlogget**, restore `data` (uten `images`) + `step`.
- Ved mount **innlogget** og det finnes et guest-utkast: restore det også (slik at "logg inn → tilbake til wizard" sømløst fortsetter, med e-post + navn nå låst og prefilt fra kontoen via det eksisterende `useEffect`). Slett utkastet etter vellykket `handleSubmit`.

Dette krever ingen DB-endringer og ingen nye routes.

### 4. (Bonus, lite scope) `returnUrl`-respekt fra `LeggTilBil`

`LeggTilBil` er i dag en ren `<Navigate>`-redirect. Den er allerede riktig: utlogget → `/send-inn`, innlogget → `/dashboard/opprett-bil`. Når vi sender innlogget bruker fra `/login?returnUrl=/legg-til-bil` lander de på `LeggTilBil`, som så redirecter videre til `/dashboard/opprett-bil` med en gang. Det fungerer som vi vil — men sessionStorage-utkastet (#3) gjør at wizarden i `/dashboard/opprett-bil` plukker opp draften og fortsetter der brukeren slapp. Ingen kodeendring nødvendig her, men dette er hvorfor `returnUrl` peker til `/legg-til-bil` og ikke `/dashboard/opprett-bil` direkte (slik at utloggede med utløpt sesjon ikke ender på en route som krever auth).

## Filer som endres

- `src/pages/SendInnBil.tsx` — legg til "Har du konto?"-stripe i `gate`- og `wizard`-stegene når utlogget.
- `src/components/car/wizard/StepContact.tsx` — legg til `showLoginHint`-prop og rendre inline "Logg inn"-lenke når true.
- `src/components/car/wizard/CarWizard.tsx` — send `showLoginHint={!user}` til `StepContact`; legg til sessionStorage persist + restore (ekskluder `images`).

## Hva dette løser konkret

- Eksisterende bruker som lander på `/send-inn` ser umiddelbart at det finnes en innloggings-vei.
- Når hen klikker "Logg inn" og kommer tilbake, er wizarden der hen slapp, og navn + e-post er låst og prefilt fra kontoen.
- "Mismatch"-flyten i `SendInnBil` blir mye sjeldnere triggert, fordi brukere med konto ikke lenger trenger å gjette riktig e-post i wizard-skjemaet.
- Helt nye brukere merker ingen forskjell — magic-link-flyten er uendret.

## Hva dette *ikke* løser (med vilje, for å holde scope)

- Vi auto-detekterer ikke "denne e-posten finnes allerede som bruker" mens brukeren skriver i `StepContact`. Det krever en ny RPC og er en separat forbedring.
- Bilder må re-velges hvis man logger inn midt i wizarden. Å persiste `File`-objekter krever IndexedDB og er overkill her.
