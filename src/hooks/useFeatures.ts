import { useAuth } from "@/hooks/useAuth";
import { FEATURES } from "@/config/features";

/**
 * Allowlist of test users som får tidlig tilgang til funksjoner som ellers er
 * gjemt bak launch-flagg. MVP: vanlige brukere ser IKKE tur/spotting/drive/
 * savedCars med mindre env er satt.
 */
const TESTER_EMAILS = new Set<string>([
  "kontaktpeder@gmail.com",
]);

export type ResolvedFeatures = typeof FEATURES;

function isTester(email: string | undefined): boolean {
  if (!email) return false;
  return TESTER_EMAILS.has(email.trim().toLowerCase());
}

export function useFeatures(): ResolvedFeatures {
  const { user } = useAuth();
  if (!user) return FEATURES;

  if (!isTester(user.email ?? undefined)) {
    return FEATURES;
  }

  return {
    ...FEATURES,
    activitySessions: true,
    spotting: true,
    driveMode: true,
    savedCars: true,
  };
}
