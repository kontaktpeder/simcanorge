/**
 * Dashboard redigering (/dashboard/bil/:id) krever car_owners-rad med role "owner".
 * Bruk samme sannhet på offentlig bilside slik at "Rediger bil" alltid matcher faktisk tilgang.
 */
export const DASHBOARD_CAR_EDIT_ROLE = "owner" as const;

export type CarOwnerAccessRow = {
  user_id: string;
  role: string;
};

export function canEditCarInDashboard(
  userId: string | undefined,
  carOwners: CarOwnerAccessRow[] | undefined | null,
): boolean {
  if (!userId || !carOwners?.length) return false;
  return carOwners.some(
    (r) => r.user_id === userId && r.role === DASHBOARD_CAR_EDIT_ROLE,
  );
}
