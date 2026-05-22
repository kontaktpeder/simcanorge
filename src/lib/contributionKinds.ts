export type ContributionKind =
  | "ownership"
  | "identification"
  | "story"
  | "observation";

export const KNOWLEDGE_CHIPS: {
  kind: ContributionKind;
  label: string;
  subtitle: string;
  emphasis?: "primary";
}[] = [
  {
    kind: "observation",
    label: "Har flere bilder",
    subtitle: "Ny observasjon på denne bilen",
    emphasis: "primary",
  },
  {
    kind: "identification",
    label: "Vet hvilken modell det er",
    subtitle: "Merke, modell, år",
  },
  {
    kind: "story",
    label: "Kjenner historien",
    subtitle: "Det du vet om bilens liv",
  },
  {
    kind: "ownership",
    label: "Jeg eier bilen",
    subtitle: "Eller har hatt den",
  },
];
