// Feature flags for staged launch.
// Toggle via Vite env vars (e.g. VITE_FEATURE_SIMPLE_LAUNCH_MODE=true).
export const FEATURES = {
  /**
   * Hides/de-prioritises secondary modules (marketplace, clubs, events, aktører)
   * to focus the launch on the core "share your car" flow.
   */
  simpleLaunchMode: import.meta.env.VITE_FEATURE_SIMPLE_LAUNCH_MODE !== "false",
  /**
   * Enables the relationship-type field on car submission flows.
   * Off until DB migration + UI integration is complete.
   */
  relationshipModelV1: import.meta.env.VITE_FEATURE_RELATIONSHIP_MODEL_V1 === "true",
};
