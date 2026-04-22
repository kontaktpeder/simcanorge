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
  { value: "current_owner", label: "Jeg eier den nå" },
  { value: "former_owner", label: "Jeg har eid den tidligere" },
  { value: "restorer", label: "Jeg har restaurert / jobbet med den" },
  { value: "storyteller", label: "Jeg kjenner historien" },
  { value: "contributor", label: "Jeg bidrar med dokumentasjon" },
  { value: "other", label: "Annet" },
];

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  current_owner: "Nåværende eier",
  former_owner: "Tidligere eier",
  restorer: "Restauratør",
  storyteller: "Historieforteller",
  contributor: "Bidragsyter",
  other: "Annet",
};

export const RELATIONSHIP_NOTE_MAX = 300;
