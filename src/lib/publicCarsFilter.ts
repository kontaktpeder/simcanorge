/**
 * Temporary Simca Norge launch filter.
 *
 * When true, public listings (archive, search, hubs, featured, etc.) only
 * include cars that an admin has approved (`approved_at` is set).
 *
 * - Direct URLs `/biler/:slug` still work for published cars.
 * - Min garasje still shows the owner's cars (with a notice if unapproved).
 * - Admin is unchanged.
 *
 * Flip to `false` to show all published cars again in public listings.
 */
export const PUBLIC_CARS_REQUIRE_ADMIN_APPROVAL = true;

type QueryWithApprovedAt = {
  not: (column: string, operator: string, value: null) => unknown;
};

/** Apply `.not("approved_at", "is", null)` when the launch filter is on. */
export function applyPublicCarsApprovalFilter<T extends QueryWithApprovedAt>(query: T): T {
  if (!PUBLIC_CARS_REQUIRE_ADMIN_APPROVAL) return query;
  return query.not("approved_at", "is", null) as T;
}

export function isCarAdminApproved(car: { approved_at?: string | null }): boolean {
  return !!car.approved_at;
}
