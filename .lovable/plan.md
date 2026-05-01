## Problem

Når du har en aktiv tur og refresher (eller logger inn på nytt) på `/app`, vises ErrorBoundary-skjermen «Noe gikk galt» og knappene gjør ingenting nyttig.

## Hva som skjer

1. `/app` (`AppEntry`) venter på `useAuth().isLoading`. Bra.
2. Men `Layout`, `BottomNav`, `FocusModeOverlay` og `Start` kaller alle `useActivitySession()` med en gang `Start` rendres.
3. `useActivitySession` leser cache fra `localStorage` (`active_activity_session_id_v1`) og kjører `fetchActiveSession(user.id)` så snart `user` finnes.
4. Ved refresh kan `user` være satt før Supabase-sesjonen er fullt restorert i klienten — eller `getUser()` kan kort feile pga. nettverk/JWT-rotasjon. Da kaster `react-query`-spørringen, eller `LastTripCard`/`ActiveSessionBanner` får uventet form på data.
5. Den ufangede feilen propagerer opp i React-treet og treffer `<ErrorBoundary>` rundt `<AppRoutes/>` i `App.tsx`. Hele appen erstattes med «Noe gikk galt». «Gå til forsiden» går til `/` (som med ny smart-routing redirecter logget-inn bruker rett tilbake til `/app` → samme krasj igjen). «Last inn på nytt» gjør samme.

I tillegg: `ErrorBoundary` rundt **hele** appen er for grovkornet — én tur-feil tar ned alt.

## Endringer

### 1) `src/components/ErrorBoundary.tsx` — gjenopprett uten full reload-loop
- Fjern hardkodet `window.location.href = '/'` (sender innloggede rett tilbake til feil-siden). Bytt til:
  - «Last inn på nytt» → `window.location.reload()` (beholdes).
  - «Gå til forsiden» → `window.location.assign('/app')` for innloggede, `'/'` ellers. Enklest: bruk `'/app'` siden ErrorBoundary uansett oftest treffer der.
- La «Last inn»-knappen først tømme localStorage-nøklene som kan trigge looping: `active_activity_session_id_v1`, `active_drive_session_v1`, `activity_focus_minimized_v1`. Det gir brukeren en vei ut av en korrupt tur-cache.

### 2) `src/hooks/useActivitySession.ts` — robust mot transient feil
- Vent til auth er klar: bytt `enabled: !!user` til å også sjekke `!isLoading` fra `useAuth` (legg til `isLoading` i destruct).
- `fetchActiveSession`: omslutt i try/catch og returner `null` ved feil i stedet for å kaste — vi vil aldri at en feilet «hent aktiv tur»-spørring skal velte hele appen.
- Legg til `retry: 1` og `refetchOnWindowFocus: false` i `useQuery`.
- Hvis cached id finnes men `select` returnerer 0 rader (ikke bare `data === null`), fjern cache-id'en (allerede gjort), og logg én gang.

### 3) `src/hooks/useActivityMoments.ts` — samme robusthet
- Samme: `enabled: !!sessionId && !!user`, fang feil i `queryFn` og returner `[]` i stedet for å kaste, så `LastTripCard`/`AktivTur` aldri får undefined.

### 4) `src/hooks/useLatestCompletedSession.ts` — samme
- Fang feil og returner `null` i `queryFn`.

### 5) `src/App.tsx` — finkornet ErrorBoundary
- Behold den ytre `ErrorBoundary` som siste forsvarslinje.
- I `routes/index.tsx` (eller direkte i `Start.tsx`/`Layout.tsx`): wrap `LastTripCard`-blokken i `Start.tsx` og `FocusModeOverlay` i `Layout.tsx` med en lokal lite-error-boundary (eller bare `try/catch`-aktig fallback ved at hooks returnerer trygge default-verdier — punkt 2–4 dekker det meste).

### 6) `src/pages/AppEntry.tsx` — ikke last `Start` før admin-check er ferdig
- Vis loader så lenge `isLoading` er `true` (allerede gjort). Ekstra: hvis `user` finnes men `session` mangler kort, vent én tick før vi rendrer `Start` (forhindrer race der RLS-spørringer kjører uten gyldig JWT).
- Konkret: `if (isLoading || (user && !session)) return <Loader />`.

### 7) Liten polering
- I `useAuth.tsx`: ved `getUserError` gjør vi nå `signOut()`. Det kan være for aggressivt ved transient nettverksfeil og kan «ulogge» brukere som blir flaket. Bytt til: kun `signOut()` hvis `getUserError?.status === 401`/`403`, ellers behold lokal sesjon og la `onAuthStateChange` håndtere det. Dette løser «refresh logger meg ut»-tilfellet.

## Forventet resultat

- Refresh på `/app` med aktiv tur → siden lastes normalt, FocusModePill vises, tur-data laster (eller faller stille tilbake til ingen aktiv tur hvis serveren ikke svarer).
- En enkelt feilet tur-spørring krasjer ikke lenger hele appen.
- Hvis ErrorBoundary likevel slår inn: «Last inn»-knappen tømmer korrupt tur-cache slik at brukeren kommer videre.
- Transient nett-feil ulogger ikke brukeren.

## Filer som endres

- `src/components/ErrorBoundary.tsx`
- `src/hooks/useActivitySession.ts`
- `src/hooks/useActivityMoments.ts`
- `src/hooks/useLatestCompletedSession.ts`
- `src/hooks/useAuth.tsx`
- `src/pages/AppEntry.tsx`
