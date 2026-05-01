Jeg fant at `/app` nå stopper i app-feil etter de siste endringene rundt tur/aktivitet og auth. Det mest sannsynlige problemet er ikke selve innloggingen lenger: auth-kallene svarer 200, og `/app` sender korrekt til login når bruker ikke er innlogget. Feilen ligger i at tur-funksjonen fortsatt kjøres globalt i layout/navigasjon og på Start, selv når funksjonen egentlig er feature-flagget av for vanlige brukere. Den kan dermed lage en krasj/blank stopp ved refresh eller etter login.

Plan:

1. Gjør `/app` robust og login-trygg
   - Behold `/app` som innlogget app-entry.
   - Hvis auth ikke er ferdig: vis loader.
   - Hvis ikke innlogget: send til `/login?returnUrl=/app`.
   - Etter login: vis Start/dashboard uten å hoppe til onboarding.

2. Isoler tur-funksjonen bak feature flagg
   - Endre `Layout` slik at den ikke kaller `useActivitySession()` globalt med mindre `activitySessions` faktisk er aktivert.
   - Endre `BottomNav`, `FocusModeOverlay`, og eventuelle tur-widgets slik at de returnerer `null` før de starter tur-hooks når funksjonen er av.
   - Dette fjerner at en skjult/halvferdig tur-modul kan velte hele appen.

3. Rydd opp i Start-siden
   - Ikke kall `useActivitySession()` og `useLatestCompletedSession()` på Start når `activitySessions` er deaktivert.
   - For vanlige brukere skal Start vise trygg app-hjem: Mine biler, Utforsk, Garasje osv.
   - For testbrukeren som har tur-funksjonen aktivert, behold tur-intentene, men håndter feil lokalt uten ErrorBoundary.

4. Sikre `/aktiv` mot refresh uten aktiv tur
   - Hvis tur-funksjonen er av eller ingen aktiv tur finnes etter auth-ready: redirect til `/app`, ikke `/`.
   - Hvis auth fortsatt laster: vis loader, ikke anta at tur mangler.

5. Gjør ErrorBoundary mer nyttig som siste sikkerhetsnett
   - Knappen “Gå til appen” skal rydde tur-cache og gå til `/app`.
   - “Last inn på nytt” skal også rydde tur-cache.
   - Legg inn mer konkret debug-logging av faktisk `error.message` slik at neste feil ikke bare blir “Noe gikk galt”.

6. Fiks ref-advarselen som spammer konsollen
   - `LazyComponentWrapper`/route-wrapperen gir ref-advarsler i dev-preview. Jeg vil justere routing-wrapperen til å ikke sende refs videre til vanlige funksjonskomponenter.
   - Dette er trolig ikke hovedkrasjen, men gjør feilsøking og preview mye renere.

Tekniske filer jeg vil endre:
- `src/pages/AppEntry.tsx`
- `src/pages/Start.tsx`
- `src/pages/AktivTur.tsx`
- `src/components/layout/Layout.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/layout/FocusModeOverlay.tsx`
- `src/components/ErrorBoundary.tsx`
- Eventuelt små justeringer i `src/hooks/useActivitySession.ts` / `src/hooks/useLatestCompletedSession.ts` hvis nødvendig

Målet er at:
- `/app` aldri skal ende i blank side eller “Noe gikk galt” på grunn av tur-modulen.
- Utloggede brukere på `/app` alltid kommer til login.
- Innloggede brukere alltid kommer inn i app/dashboard.
- Tur-funksjonen kan fortsatt testes av testbruker, men er isolert slik at den ikke kan ødelegge resten av appen.