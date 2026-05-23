// Feature flags for staged launch.
// Toggle via Vite env vars (e.g. VITE_FEATURE_SIMPLE_LAUNCH_MODE=true).
//
// Canonical site URL (used by SeoHead/sitemap) is configured via
// `VITE_PUBLIC_SITE_URL` (see src/lib/siteUrl.ts). Default: https://bilgarasje.no.
export const PUBLIC_SITE_URL: string =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://bilgarasje.no";

  /**
   * Hides/de-prioritises secondary modules (marketplace, clubs, events, aktører)
   * to focus the launch on the core "share your car" flow.
   */
  simpleLaunchMode: import.meta.env.VITE_FEATURE_SIMPLE_LAUNCH_MODE !== "false",
  /**
   * Enables the relationship-type field on car submission flows.
   * Off until DB migration + UI integration is complete.
   */
  relationshipModelV1: import.meta.env.VITE_FEATURE_RELATIONSHIP_MODEL_V1 !== "false",
  /**
   * Pre-gate: ask for registration number before the wizard starts so we can
   * surface existing cars in Bilgarasje up-front ("sannhet før investering").
   */
  earlyRegnrGate: import.meta.env.VITE_FEATURE_EARLY_REGNR_GATE !== "false",
  /**
   * Phase 1 of relationship requests: when a user finds an existing car they
   * recognise, they can submit a structured request (former owner, restorer,
   * storyteller, ...) which is queued for admin/owner review. No edit rights
   * are granted automatically.
   */
  relationshipRequestsV1: import.meta.env.VITE_FEATURE_RELATIONSHIP_REQUESTS_V1 !== "false",
  /**
   * "Save car" — bookmark cars to a personal list. Built but hidden behind flag
   * during the focused launch (Utforsk biler + Legg inn bil only).
   * Default: OFF. Enable with VITE_FEATURE_SAVED_CARS=true.
   */
  savedCars: import.meta.env.VITE_FEATURE_SAVED_CARS === "true",
  /**
   * "Drive mode" — start/stop a private drive session that produces a private
   * car_event with duration. localStorage-backed for MVP.
   * Default: OFF. Enable with VITE_FEATURE_DRIVE_MODE=true.
   */
  driveMode: import.meta.env.VITE_FEATURE_DRIVE_MODE === "true",
  /**
   * "Spotting" — share a public car_event for a car you've seen in the wild.
   * Default: OFF. Enable with VITE_FEATURE_SPOTTING=true.
   */
  spotting: import.meta.env.VITE_FEATURE_SPOTTING === "true",
  /**
   * "Activity sessions" — unified Start tur MVP (drive/walk_spotting/meetup)
   * with image+note moments stored in car_events. DB-first with localStorage cache.
   * Default: OFF. Enable with VITE_FEATURE_ACTIVITY_SESSIONS=true.
   */
  activitySessions: import.meta.env.VITE_FEATURE_ACTIVITY_SESSIONS === "true",
  /**
   * Knowledge Hub V1 — replaces RelationshipRequestDialog on public car pages
   * with a low-friction "Hva vet du om bilen?" chip menu (observation,
   * identification, story, ownership). No new DB tables.
   */
  knowledgeHubV1: import.meta.env.VITE_FEATURE_KNOWLEDGE_HUB_V1 !== "false",
};
