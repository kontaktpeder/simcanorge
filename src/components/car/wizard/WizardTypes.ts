export interface WizardData {
  // Step 0: Images
  images: File[];
  imagePreviews: string[];

  // Step 1: Brand/Model
  brand: string;
  car_model: string;

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

  // Step 5: Consent & submit
  allowEdits: boolean | null;
  allowInstagram: boolean;
  privacyAccepted: boolean;
  clubLinkRequested: boolean;
  clubPageId: string;
  clubMessage: string;
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
  allowEdits: null,
  allowInstagram: false,
  privacyAccepted: false,
  clubLinkRequested: false,
  clubPageId: "",
  clubMessage: "",
};

export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

export const STEP_LABELS = [
  "Bilder",
  "Merke",
  "Detaljer",
  "Historikk",
  "Kontakt",
  "Send inn",
] as const;
