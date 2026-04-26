## Problemet

Kompisen din trykte "send inn" i wizarden og trodde han publiserte. Han gjorde det ikke – fordi:

1. **Publiser-valget i `StepConsent` er gjemt** mellom klubb-tilknytning, Instagram-godkjenning og personvern. Det ser ut som en innstilling, ikke en handling.
2. **Ingen forhåndsvalg** – `publishImmediately = null` → defaulter til `draft`.
3. **Etter "Send inn" havner draft-brukere på `/dashboard/bil/:id`** – en lang redigeringsside hvor "Publiser bilen"-knappen er en av mange elementer.
4. **`PostPublishOnboardingOverlay` finnes** og er fin – men vises kun etter publisering. De som havnet i draft får ingen feiring, ingen veileder, ingen tydelig vei videre.

Du har rett: **publisering må flyttes ut av wizard-skjemaet og bli sin egen tydelige beslutning rett etter at bilen er lagret.**

---

## Løsning

### A. Fjern publish-valget fra wizarden helt

**Fil: `src/components/car/wizard/StepConsent.tsx`**

- Fjern hele "Publiser nå / Lagre som kladd"-blokken (linje 51-114). 
- Wizarden ender med ren "Lagre bilen"-intensjon – ingen forvirring om hva knappen gjør.
- Tittelen endres tilbake til noe enklere: *"Klar til å lagre bilen?"* med undertittel: *"Du bestemmer hva som skal skje videre om litt."*

**Fil: `src/components/car/wizard/CarWizard.tsx`** (linje 210-214)

- `wantsToPublish`-logikken erstattes av: bilen lagres **alltid** som draft for innloggede brukere.
- Vi sender fortsatt `publishedNow: false` og `slug` videre til `onSuccess` for kompatibilitet.
- Toast oppdateres: *"Bilen er klar 🚗"* / *"Velg hva du vil gjøre videre."* (ikke "Lagret i garasjen din" – for nøytralt).

**Fil: `src/components/car/wizard/WizardTypes.ts`**

- Vi *kan* la `publishImmediately`-feltet stå urørt (uskadelig), eller fjerne det hvis vi vil rydde. Anbefaling: la det stå for nå – ingen kostnad, og hvis vi senere vil tilby "ekspress-publiser" i wizarden er feltet der.

---

### B. Nytt "Hva vil du nå?"-vindu (kjernen av endringen)

**Ny fil: `src/components/car/PostCreateActionOverlay.tsx`**

Vises rett etter at wizarden lukker, FØR brukeren havner på en side. Inspirert av `PostPublishOnboardingOverlay` (samme estetikk – Premium Dark, Chakra Petch, teal-glow), men med et helt annet budskap:

**Tittel:** *"Bilen er lagret 🎉"*  
**Undertittel:** *"`{title}` ligger trygt i garasjen din. Hva vil du nå?"*

**Hero-preview:** Første bilde (hvis lastet opp) – samme som `PostPublishOnboardingOverlay` har.

**Status-stripe under bildet:** En liten, ærlig melding:
- ✅ "Bilen er synlig i din garasje"
- 🔒 "Den er ikke synlig for andre ennå"

Dette gir kontekst – kompisen din ville ha *sett* at den ikke var publisert, ikke trodd det skjedde automatisk.

**Tre tydelige handlinger** (i prioritert rekkefølge):

1. **Primær (stor, teal-glow CTA, Chakra Petch):** *"Publiser nå – la andre se den"*  
   Underbeskrivelse: *"Bilen blir synlig i Bilgarasjen. Du kan skjule den igjen når som helst."*  
   Disabled hvis krav ikke er oppfylt (mangler bilde / merke / modell), med en liten forklaring under: *"Trenger minst ett bilde først."*  
   Ved klikk: kjører samme `handlePublish`-logikk som finnes i `DashboardBilDetalj` (`update cars set status='published', published_at=now()`), så lukker overlayet og navigerer til `/biler/{slug}` – med `PostPublishOnboardingOverlay` som vises der.

2. **Sekundær (outline):** *"Rediger mer først"*  
   Underbeskrivelse: *"Legg til historie, flere bilder, eller endre detaljer."*  
   Ved klikk: lukker overlayet og navigerer til `/dashboard/bil/{carId}`.

3. **Tertiær (ghost / link):** *"Utforsk Bilgarasjen"*  
   Underbeskrivelse: *"Se hva andre deler. Du kan publisere bilen din senere."*  
   Ved klikk: navigerer til `/biler` (oversikt over publiserte biler).

**Lukk-knapp** øverst til høyre – men *ikke* en "X som lukker uten konsekvens". Hvis brukeren lukker med X, defaulter den til samme som *"Rediger mer først"* (sender til dashboard-detalj). Dette er bevisst: vi vil ikke at de skal kunne klikke seg bort fra valget uten å gjøre noe.

**Ingen `localStorage`-flagg** – overlayet vises kun én gang per opprettelse, så ingen "har sett før"-logikk trengs.

---

### C. Kobler det sammen

**Fil: `src/pages/DashboardOpprettBil.tsx`**

`handleWizardSuccess` endres fra direkte `navigate(...)` til å sette state som vises overlayet:

```ts
const [postCreate, setPostCreate] = useState<{ carId: string; slug: string; title: string; firstImageUrl: string | null } | null>(null);

const handleWizardSuccess = async ({ carId, slug }: ...) => {
  queryClient.invalidateQueries({ queryKey: ["my-cars"] });
  queryClient.invalidateQueries({ queryKey: ["my-cars-count"] });
  
  // Hent det vi trenger for overlay (tittel, første bilde)
  const { data: car } = await supabase
    .from("cars")
    .select("title, slug, car_images(image_url, sort_order)")
    .eq("id", carId)
    .single();
  
  const firstImage = car?.car_images?.sort((a,b) => a.sort_order - b.sort_order)[0]?.image_url ?? null;
  setPostCreate({ carId, slug: car?.slug ?? slug ?? "", title: car?.title ?? "Bilen din", firstImageUrl: firstImage });
};
```

Render `<PostCreateActionOverlay ... />` når `postCreate` er satt.

---

### D. Liten polering på sidesporene

**`DashboardBilDetalj.tsx`:** Behold dagens "Bilen din ligger og venter"-banner – den er fortsatt verdifull for brukere som velger "Rediger mer først" eller kommer tilbake senere. Ingen endring her.

**`SendInnBil.tsx` (gjest-flyt):** Uendret. Gjester går via admin-godkjenning – overlayet gjelder kun innloggede brukere som lagrer rett til `cars`-tabellen.

---

## Hva dette løser

| Før | Etter |
|---|---|
| Publish-valg gjemt mellom klubb/Instagram/personvern | Publish er en egen, dedikert beslutning etter lagring |
| `publishImmediately` defaulter til null → draft | Brukeren *må* aktivt velge: publiser, rediger, eller utforsk |
| "Bilen er lagret"-toast forsvinner på 4 sek | Tydelig overlay som krever et valg |
| Etter draft: lang redigeringsside uten klar kontekst | Overlay som forklarer status og viser veien videre |
| Kompisen din tror han publiserte → bilen forblir usynlig | Han ser eksplisitt "🔒 Ikke synlig for andre ennå" + tydelig "Publiser nå"-knapp |

---

## Filer som endres

- **Ny:** `src/components/car/PostCreateActionOverlay.tsx`
- `src/components/car/wizard/StepConsent.tsx` – fjern publish-blokk, oppdater copy
- `src/components/car/wizard/CarWizard.tsx` – alltid draft, oppdater toast
- `src/pages/DashboardOpprettBil.tsx` – render overlay i stedet for direkte navigate

Ingen DB-endringer. Ingen endringer i `WizardTypes.ts` (med mindre vi vil rydde – kan tas senere).

---

## Hva jeg IKKE rører

- Gjest-flyten (`SendInnBil.tsx`) – admin-godkjenning står
- `PostPublishOnboardingOverlay` – fortsetter å vises etter publisering, uendret
- `DashboardBilDetalj` "Bilen din ligger og venter"-banner – fortsatt nyttig som backup
- `useCarRelationshipGate` og relasjons-flyten fra forrige iterasjon
