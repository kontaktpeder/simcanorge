import type { CarOwnerAccessRow } from "@/lib/carEditAccess";
import { canEditCarInDashboard } from "@/lib/carEditAccess";

export type CarPageAudience = "unknown" | "stewarded" | "mine";

export type CarPageAudienceInput = {
  userId?: string | null;
  carOwners?: CarOwnerAccessRow[] | null;
};

export function hasSteward(carOwners?: CarOwnerAccessRow[] | null): boolean {
  return !!carOwners?.some((o) => o.role === "owner" || o.role === "admin");
}

export function resolveCarPageAudience(input: CarPageAudienceInput): CarPageAudience {
  const { userId, carOwners } = input;
  if (userId && canEditCarInDashboard(userId, carOwners ?? [])) {
    return "mine";
  }
  if (hasSteward(carOwners)) {
    return "stewarded";
  }
  return "unknown";
}

export type ContributionActionId =
  | "photos"
  | "model"
  | "story"
  | "claim"
  | "correction"
  | "edit"
  | "post";

type AudienceConfig = {
  contextLine: string | null;
  sectionTitle: string;
  actions: readonly ContributionActionId[];
};

export const CAR_PAGE_AUDIENCE_CONFIG: Record<CarPageAudience, AudienceConfig> = {
  unknown: {
    contextLine: "Vi vet lite om denne bilen.",
    sectionTitle: "Hjelp oss dokumentere den",
    actions: ["photos", "model", "story", "claim"],
  },
  stewarded: {
    contextLine: null,
    sectionTitle: "Bidra til historien",
    actions: ["photos", "correction", "story"],
  },
  mine: {
    contextLine: "Dette er din bil.",
    sectionTitle: "Forvalt bilen",
    actions: ["edit", "photos", "post"],
  },
};
