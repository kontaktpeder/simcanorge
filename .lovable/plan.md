# Smart auth-ruting for bilgarasje.no og /app

## Mål

1. **Førstegangsbesøkende** på `bilgarasje.no` skal se onboarding (`RegistrerBil`) — som i dag.
2. **Innloggede brukere** som besøker `bilgarasje.no` skal automatisk sendes inn i appen (`/app`) — ikke se onboarding.
3. **/app** skal *alltid* føles som appen: innlogget = dashboard, utlogget = sendes til `/login`. Ingen blank skjerm.
4. **Logg ut** skal sende brukeren til `/login` (ikke til onboarding eller blank `/app`).

## Hva som er feil i dag

- `src/pages/Hjem.tsx` returnerer alltid `RegistrerBil`, også for innloggede. Da må de manuelt navigere til `/app`.
- `src/pages/AppEntry.tsx` har riktig logikk (utlogget → `/login?returnUrl=/app`), men `useAuth` har en race der `isLoading` aldri settes til `false` for *utloggede* brukere som har en stale session i localStorage som feiler `getUser()`. Resultat: evig BrandLoader = "blank skjerm".
- `Konto.tsx` `handleSignOut` navigerer til `/` (= onboarding) etter logout. Bør gå til `/login`.

## Endringer

### 1. `src/pages/Hjem.tsx` — smart root
Bruk `useAuth`. Mens auth lastes, vis `BrandLoader`. Når klar:
- Innlogget → `<Navigate to="/app" replace />`
- Utlogget → `<RegistrerBil />` (onboarding som i dag)

Dette gir SEO/førsteinntrykk for nye besøkende, og null friksjon for innloggede.

### 2. `src/hooks/useAuth.tsx` — fiks `isLoading`-race
I `getSession().then(...)`-blokken: i grenen der `getUser()` feiler og vi gjør `signOut()`, settes `isLoading` til `false` (det gjøres allerede). Men det finnes ingen `isLoading=false`-vei dersom `getSession()` selv kaster. Pakk hele blokken i `try/finally` slik at `setIsLoading(false)` alltid kjører til slutt. Dette eliminerer "evig loader" på `/app`.

### 3. `src/pages/AppEntry.tsx` — uendret logikk, men verifisér
Beholder dagens redirect til `/login?returnUrl=/app&reason=app` for utloggede. Med fiksen i useAuth vil dette nå alltid trigge i stedet for å henge.

### 4. `src/pages/Konto.tsx` — logg ut → /login
Endre `handleSignOut` og `handleDeleteAccount` til å navigere til `/login` i stedet for `/` etter signOut. Bruker som logger ut skal lande på en innloggings-skjerm, ikke på onboarding-flyten for nye brukere.

### 5. `src/pages/Login.tsx` — smart returnUrl-default
`returnUrl` defaulter i dag til `/`. For brukere som logger inn fra root (uten returnUrl) skal vi sende til `/app` i stedet. Endre default fra `'/'` til `'/app'` i `safeInternalPath(searchParams.get('returnUrl'), '/app')`.

## Resulterende flyt

```text
Førstegangsbesøkende (utlogget)
  bilgarasje.no/  →  RegistrerBil (onboarding)
  → "Logg inn"     →  /login  →  /app (dashboard)

Innlogget bruker
  bilgarasje.no/   →  redirect til /app (Start/dashboard)
  bilgarasje.no/app → Start/dashboard direkte

Utlogget bruker som åpner /app direkte
  /app  →  redirect til /login?returnUrl=/app
  → logger inn  →  tilbake til /app

Logg ut fra /konto
  signOut()  →  navigate("/login")  (ikke onboarding, ikke blank app)
```

## Filer som endres

- `src/pages/Hjem.tsx` — smart redirect for innloggede
- `src/hooks/useAuth.tsx` — try/finally rundt session-init for å garantere `isLoading=false`
- `src/pages/Konto.tsx` — logout/delete navigerer til `/login`
- `src/pages/Login.tsx` — default returnUrl `/app`

Ingen DB-endringer, ingen nye routes, ingen pakkeendringer.
