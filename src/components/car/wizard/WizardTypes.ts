import type { RelationshipType } from "@/lib/relationshipTypes";

export interface WizardData {
  // Step 0: Images
  images: File[];
  imagePreviews: string[];

  // Step 1: Brand/Model
  brand: string;
  car_model: string;
  brand_id?: number | null;
  model_id?: number | null;

  // Step 2: Details
  variant: string;
  body_type: string;
  car_year: string;
  registration_number: string;
  category: string;

  // Step 3: Story
  car_story: string;
  tags: string;

  // Step 4: Contact
  owner_name: string;
  email: string;
  phone: string;

  // Step 4b: Relationship (v1, behind feature flag)
  relationship_type: RelationshipType | "";
  relationship_note: string;

  // Step 5: Consent & submit
  allowEdits: boolean | null;
  allowInstagram: boolean;
  privacyAccepted: boolean;
  clubLinkRequested: boolean;
  clubPageId: string;
  clubMessage: string;
  /** Innlogget bruker: vil de publisere nå (true) eller lagre som kladd (false)? */
  publishImmediately: boolean | null;
}

export const INITIAL_WIZARD_DATA: WizardData = {
  images: [],
  imagePreviews: [],
  brand: "",
  car_model: "",
  variant: "",
  body_type: "",
  car_year: "",
  registration_number: "",
  category: "registrert",
  car_story: "",
  tags: "",
  owner_name: "",
  email: "",
  phone: "",
  relationship_type: "current_owner",
  relationship_note: "",
  allowEdits: null,
  allowInstagram: false,
  privacyAccepted: false,
  clubLinkRequested: false,
  clubPageId: "",
  clubMessage: "",
  publishImmediately: null,
};

export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

export const STEP_LABELS = [
  "Bilder",
  "Merke",
  "Detaljer",
  "Historikk",
  "Din info",
  "Send inn",
] as const;
