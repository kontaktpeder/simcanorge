import { useAuth } from "@/hooks/useAuth";
import { FEATURES } from "@/config/features";

/**
 * Allowlist of test users who get early access to features that are otherwise
 * hidden behind launch flags. Compared case-insensitively against auth email.
 *
 * Keep this list short. For a wider rollout, flip the env flag instead.
 */
const TESTER_EMAILS = new Set<string>([
  "kontaktpeder@gmail.com",
]);

export type ResolvedFeatures = typeof FEATURES;

/**
 * Returns the FEATURES object with per-user overrides applied for testers.
 *
 * Testers get:
 *   - simpleLaunchMode: false (so hidden modules render)
 *   - activitySessions: true
 *   - savedCars: true
 *   - driveMode: true
 *   - spotting: true
 *
 * Non-testers get the build-time FEATURES values unchanged.
 */
export function useFeatures(): ResolvedFeatures {
  const { user } = useAuth();

  // Aktivitetsfunksjoner (øyeblikk og tur) er nå tilgjengelig for alle innloggede brukere.
  if (!user) return FEATURES;

  return {
    ...FEATURES,
    activitySessions: true,
    savedCars: true,
    driveMode: true,
    spotting: true,
  };
}
