## Hva som faktisk skjedde med kompisen din

Jeg leste gjennom `CarWizard.tsx` og `DashboardBilDetalj.tsx`, og bekreftet:

1. **Wizarden har INGEN publisering.** Innlogget bruker setter alltid `status: "draft"` (linje 222 i `CarWizard.tsx`). Selv om kompisen din "trykket publiser" et eller annet sted, så *kunne* han ikke publisert fra wizarden.
2. **Eneste måte å publisere på i dag er via en liten "Publiser bilen"-knapp dypt inne i `/dashboard/bil/:id`**, som han sannsynligvis aldri åpnet etter å ha lagd bruker.
3. **Hva han kan ha trykket:** "Send inn"-knappen i wizarden — som *føles* som publisering ("Send inn" = jeg er ferdig), men teknisk lagrer som draft i hans private garasje.

**Dette er ikke en UI-bug, det er en løftesvik.** Han trodde han delte bilen med fellesskapet. Resultatet: bilen ligger i en privat skuff, usynlig for alle.

---

## Den emosjonelle innsikten

Bilgarasje handler ikke om å registrere data. Det handler om **stolthet** — å vise frem en bil man er glad i, til andre som forstår hva den betyr. Hver gang vi sier "Send inn" eller "Lagre som utkast" i stedet for **"Vis den frem"**, mister vi grunnen brukeren faktisk er her.

Plan: **Fjern "draft som default" for innloggede brukere. Gjør publisering til hovedhandlingen, og pakk den inn i språk som matcher følelsen.**

---

## Endringer

### 1. `StepSave.tsx` — Bytt tone og gi to tydelige veier (innlogget bruker)

**Fra dette:**
> *Nesten ferdig! Fortell oss hvem du er, så tar vi vare på bilen din.*
> [Send inn]

**Til dette (innlogget bruker, har minst 1 bilde):**
> # Klar til å vise den frem?
> *Bilen din havner i Bilgarasjen — der andre som er glad i bil kan se den, kommentere, og oppdage historien bak.*
>
> [**Publiser nå** — primær, stor, grønn knapp]
> *Lagre som kladd og publiser senere* — sekundær tekstlenke

Microcopy under primærknappen:
> Du kan alltid skjule den igjen. Registreringsnummer vises aldri offentlig.

**Hvorfor to knapper, ikke én med checkbox:**
Et valg mellom **"Vis den frem"** og **"Vent litt"** er en emosjonell beslutning. En checkbox er en byråkratisk en. Ifølge minnet (`mem://design/visual-identity`) bruker dere "Premium Dark" med Chakra Petch på CTA — denne knappen *skal* føles som et høydepunkt.

**Hvis < 1 bilde:** vis bare "Lagre som kladd" + en hint om at minst 1 bilde trengs for publisering, med en "Tilbake til bilder"-lenke. Ikke straff — guide.

**Innlogget vs. gjest:** Sjekk `useAuth().user`. For gjest beholder vi dagens flyt (de har ikke konto, så draft-i-garasje gir ikke mening — de går via submission-flyten uansett).

### 2. `WizardTypes.ts` — Legg til feltet

```ts
publishImmediately: boolean | null; // null = ikke valgt enda; brukes bare i innlogget gren
```
`INITIAL_WIZARD_DATA`: `publishImmediately: null`

### 3. `CarWizard.tsx` — Bruk feltet i innlogget gren (linje 205-229)

```ts
const wantsToPublish = data.publishImmediately === true;
const hasImages = uploadedUrls.length > 0;
const canPublishNow = wantsToPublish && hasImages && !!data.brand && !!data.car_model;

const status = canPublishNow ? "published" : "draft";
const published_at = canPublishNow ? new Date().toISOString() : null;
```

Bruk `status` og `published_at` i `cars.insert(...)`. Send `publishedNow: canPublishNow` videre i `onSuccess`-callbacken.

**Toast må matche følelsen:**
- Publisert: `"Bilen er live! 🎉"` *"Andre kan nå se historien din."*
- Kladd: `"Lagret i garasjen din"` *"Publiser når du er klar."*

### 4. `DashboardOpprettBil.tsx` — Smartere redirect etter suksess

`handleWizardSuccess` mottar nå `publishedNow`:
- **Publisert:** redirect til `/biler/{slug}` (offentlig profil) — *belønningen er å se bilen sin live*. Eventuelt vis `PostPublishOnboardingOverlay` der med "Del lenken med kompisen din"-CTA.
- **Kladd:** redirect til `/dashboard/bil/{carId}` med en banner som sier *"Bilen din venter på å bli sett"* + ett-klikks "Publiser nå"-knapp øverst.

### 5. `DashboardBilDetalj.tsx` — Fix det som er ekkelt i dag

**a)** Erstatt `confirm('Er du sikker på at du vil avpublisere bilen?')` (linje 221) med en ordentlig `AlertDialog`. Mykere språk: **"Skjul midlertidig"** i stedet for "Avpubliser". Forklaring: *"Bilen forsvinner fra Bilgarasjen og blir liggende trygt i garasjen din. Du kan vise den frem igjen når som helst."*

**b)** For draft-biler: gjør "Klar for publisering?"-boksen mer emosjonell. I stedet for bare en sjekkliste, legg til en linje øverst:
> *Bilen din ligger og venter. Klar til å la andre se den?*

Knappen heter fortsatt "Publiser bilen", men ledsages av microcopy:
> Du kan alltid skjule den igjen.

**c)** Hvis `canPublish` er `false` på grunn av manglende bilde: vis tydelig hvorfor med en direktelenke til bildebehandling i samme kort. Ikke bare en grå knapp.

### 6. `SendInnBil.tsx` (gjest-flyt) — uendret logikk, lett microcopy-justering

Gjester går via `submission` → admin-godkjenning, så her endrer vi ikke flyten. Men `StepSave`-tonen ("Klar til å vise den frem?") gjelder uansett — for gjest er undertittelen bare litt annerledes:
> *Vi tar imot bilen og hjelper deg å vise den frem så snart vi har sjekket den.*

---

## Hva dette løser

| Før | Etter |
|---|---|
| "Send inn" føles som publisering, men er ikke det | Eksplisitt "Publiser nå" — ingen tvil |
| Publiserings-knapp gjemt på dashbord-side de aldri besøker | Publisering er hovedhandlingen i wizarden |
| Default = draft (skummelt og usynlig) | Default-handling = del bilen med fellesskapet |
| Tone: data-innsamling | Tone: stolthet og deling |
| Etter "send inn": ender på dashbord uten kontekst | Etter publisering: ender på offentlig profil — belønning |
| `confirm()` ved avpublisering | `AlertDialog` med mykere "skjul midlertidig"-språk |

---

## Filer som endres

- `src/components/car/wizard/WizardTypes.ts` — nytt felt
- `src/components/car/wizard/CarWizard.tsx` — bruk `publishImmediately` for innlogget; sende `publishedNow` til `onSuccess`
- `src/components/car/wizard/StepSave.tsx` — ny tone, to-veis CTA, conditional på `useAuth`
- `src/pages/DashboardOpprettBil.tsx` — smartere redirect basert på `publishedNow`
- `src/pages/DashboardBilDetalj.tsx` — `AlertDialog` i stedet for `confirm`, varmere microcopy på draft-banner
- `src/pages/SendInnBil.tsx` — kun toneoppdatering i wizard-tittel via `StepSave`

Ingen DB-endringer — `cars` har allerede `status` og `published_at`. RLS tillater allerede eier å sette `published_at` (se "Owners can update their cars"-policy).

## Hva jeg IKKE rører

- Gjest-submission-flyten (admin-godkjenning beholdes — det er en helt egen tillitsmekanikk)
- Publication-request-systemet for biler eid av andre
- `RegNrGate`, relasjonsforespørsler, success-side — alt fra forrige iterasjon står
