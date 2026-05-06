// Shared constants for car relationship types.
// Access role (owner/editor/admin) lives on car_owners.role.
// Relationship type describes the public/historical relation to the car.

export type RelationshipType =
  | "current_owner"
  | "former_owner"
  | "restorer"
  | "storyteller"
  | "contributor"
  | "other";

export const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; helper?: string }[] = [
  { value: "current_owner", label: "Eier" },
  { value: "former_owner", label: "Tidligere eier" },
  { value: "restorer", label: "Mekaniker / restauratør" },
  { value: "storyteller", label: "Historiekjenner" },
  { value: "contributor", label: "Bidragsyter (fotograf, deleinnkjøper, familie/venn, klubbmedlem)" },
  { value: "other", label: "Annet" },
];

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  current_owner: "Eier",
  former_owner: "Tidligere eier",
  restorer: "Mekaniker / restauratør",
  storyteller: "Historiekjenner",
  contributor: "Bidragsyter",
  other: "Annet",
};

export const RELATIONSHIP_NOTE_MAX = 300;
