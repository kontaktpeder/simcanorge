/**
 * Felles regler for å bygge metadata på en ny "spotting"-cars-rad,
 * brukt både av useSpotCar og useActivityMoments slik at de ikke divergerer.
 *
 * Regler:
 *  - Kun bilde (verken regnr eller tittel/modell) → "Ukjent bil" / "Ukjent" + identification_status="unknown"
 *  - Regnr og/eller tittel/modell → identification_status="identified"
 *    - Tittel = bruker-input hvis gitt, ellers "Observert bil"
 *    - Modell = bruker-input hvis gitt, ellers "Ukjent"
 *  - registration_number settes på cars når regnr er gitt (trimmet original-streng)
 */
export interface SpottingCarInsertMeta {
  displayTitle: string;
  displayModel: string;
  isUnknown: boolean;
  identification_status: "unknown" | "identified";
  registration_number: string | null;
}

export function buildSpottingCarInsertMeta(params: {
  registrationNumberRaw?: string | null;
  registrationNumberNormalized?: string | null;
  titleOrModel?: string | null;
}): SpottingCarInsertMeta {
  const titleTrimmed = (params.titleOrModel ?? "").trim();
  const regnrNormalized = (params.registrationNumberNormalized ?? "").trim();
  const hasRegnr = regnrNormalized.length >= 2;
  const hasTitle = titleTrimmed.length > 0;
  const isUnknown = !hasRegnr && !hasTitle;

  const displayTitle = isUnknown ? "Ukjent bil" : titleTrimmed || "Observert bil";
  const displayModel = isUnknown ? "Ukjent" : titleTrimmed || "Ukjent";

  const regForCar = hasRegnr
    ? (params.registrationNumberRaw ?? "").replace(/\s+/g, " ").trim() || null
    : null;

  return {
    displayTitle,
    displayModel,
    isUnknown,
    identification_status: isUnknown ? "unknown" : "identified",
    registration_number: regForCar,
  };
}
