# Bilgarasje — Product Doctrine

## Én setning
Bilgarasje er en feed av innlegg om norske biler — alt annet er enten måte å lage et innlegg, måte å finne et innlegg, eller noe vi skrur på senere.

## MVP (aktiv nå)
- Legg ut **innlegg** (tekst og/eller bilde)
- Valgfritt koble til bil
- Privat eller synlig for alle
- Utforsk = oppdage innlegg
- Biler og profiler = kontekst

## Beslutningsfilter
Hjelper dette noen å legge ut eller oppdage et innlegg knyttet til en bil?

## Ikke i aktiv MVP-UI
- Spørsmål / forum (DB beholdt, ruter redirecter til /hjem)
- Tur / aktivitet som egen app (skjult bak `FEATURES.activitySessions`)
- «Øyeblikk» som eget begrep i UI

## Teknisk
- `post_type` / `car_events` kan variere i DB; UI sier «Innlegg» der det er brukerinnhold.
- Canonical garasje = `/min-garasje`. `/garasje` og `/dashboard` redirecter dit.
- Privat innlegg: `feed_posts.is_visible = false` for feed-only manual posts.
