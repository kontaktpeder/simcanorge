export type ListingTypeId = 'deler' | 'samleobjekter' | 'biler' | 'lagerplass';

export interface ListingTypeConfig {
  id: ListingTypeId;
  label: string;
  slug: string;
  locked: boolean;
  lockedMessage?: string;
  description?: string;
  carModelRequired: boolean;
}

export const LISTING_TYPES: ListingTypeConfig[] = [
  { id: 'deler', label: 'Bildeler', slug: 'deler', locked: false, carModelRequired: true, description: 'Motor, bremser, karosseri, interiør, elektrisk og annet' },
  { id: 'samleobjekter', label: 'Samleobjekter', slug: 'samleobjekter', locked: false, carModelRequired: false, description: 'Brosjyrer, skilt, modellbiler, merker og memorabilia' },
  {
    id: 'biler',
    label: 'Biler',
    slug: 'biler',
    locked: true,
    lockedMessage: 'Vi jobber med en løsning for å selge biler.',
    carModelRequired: false,
  },
  {
    id: 'lagerplass',
    label: 'Lagerplass',
    slug: 'lagerplass',
    locked: true,
    lockedMessage: 'Vi jobber med en løsning for å leie ut/selge lagerplass.',
    carModelRequired: false,
  },
];
