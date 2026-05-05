export interface CarCategory {
  id: string;
  label: string;
}

/**
 * Felles kategorier brukt i bil-wizard, dashboard-redigering og admin.
 * Husk å oppdatere her hvis du legger til/endrer kategorier — det slår igjennom alle steder.
 */
export const CAR_CATEGORIES: CarCategory[] = [
  { id: "registrert", label: "Registrert" },
  { id: "avregistrert", label: "Avregistrert" },
  { id: "restaurering", label: "Restaureringsprosjekt" },
  { id: "historisk", label: "Historisk bil" },
  { id: "vrak", label: "Vrak" },
];

export const getCarCategoryLabel = (id: string | null | undefined): string => {
  if (!id) return "—";
  return CAR_CATEGORIES.find(c => c.id === id)?.label ?? id;
};
