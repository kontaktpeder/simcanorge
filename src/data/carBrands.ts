// Complete list of Simca, Talbot and Matra models with year ranges and variants

export interface CarModel {
  name: string;
  yearFrom: number;
  yearTo: number;
  variants?: string[];
}

export interface CarBrand {
  name: string;
  models: CarModel[];
}

export const CAR_BRANDS: CarBrand[] = [
  {
    name: "Simca",
    models: [
      // Aronde
      { name: "Aronde", yearFrom: 1948, yearTo: 1953 },
      { name: "Aronde 1300", yearFrom: 1951, yearTo: 1958 },
      { name: "Aronde 90A / P60", yearFrom: 1958, yearTo: 1963 },
      // 1000-serien
      { name: "1000", yearFrom: 1961, yearTo: 1978, variants: ["Standard", "GL", "GLS", "Special", "Commerciale"] },
      { name: "1000 Coupé (Bertone)", yearFrom: 1962, yearTo: 1967 },
      { name: "1000 Rallye", yearFrom: 1970, yearTo: 1971 },
      { name: "1000 Rallye 1", yearFrom: 1970, yearTo: 1972 },
      { name: "1000 Rallye 2", yearFrom: 1972, yearTo: 1978 },
      { name: "1000 Rallye 3", yearFrom: 1970, yearTo: 1978 },
      // 1100-serien
      { name: "1100", yearFrom: 1967, yearTo: 1985, variants: ["Standard", "GL", "GLS", "Special", "TI", "ES"] },
      { name: "1100 TI", yearFrom: 1973, yearTo: 1978 },
      { name: "1100 VF1", yearFrom: 1972, yearTo: 1985, variants: ["Standard", "Fourgonnette", "Break"] },
      { name: "1100 VF2", yearFrom: 1972, yearTo: 1985, variants: ["Standard", "Fourgonnette", "Break"] },
      { name: "1100 VF Pick-Up", yearFrom: 1972, yearTo: 1978 },
      { name: "1100 Pickup / Van", yearFrom: 1967, yearTo: 1981 },
      // 1200 S Coupé
      { name: "1200 S Coupé", yearFrom: 1967, yearTo: 1971 },
      // 1300/1301/1500/1501
      { name: "1300", yearFrom: 1963, yearTo: 1966, variants: ["Standard", "GL", "GLS"] },
      { name: "1301", yearFrom: 1966, yearTo: 1975, variants: ["Standard", "GL", "GLS", "Special", "Tourisme"] },
      { name: "1307", yearFrom: 1975, yearTo: 1980, variants: ["GL", "GLS", "S"] },
      { name: "1308", yearFrom: 1975, yearTo: 1980, variants: ["GL", "GLS", "GT"] },
      { name: "1309", yearFrom: 1975, yearTo: 1980, variants: ["SX", "GTS"] },
      { name: "1500", yearFrom: 1963, yearTo: 1966, variants: ["Standard", "GL", "GLS"] },
      { name: "1501", yearFrom: 1967, yearTo: 1975, variants: ["Standard", "GL", "GLS", "Special", "Tourisme"] },
      // 160/180/2-Litre
      { name: "160", yearFrom: 1969, yearTo: 1973 },
      { name: "180", yearFrom: 1970, yearTo: 1977 },
      { name: "2-Litre", yearFrom: 1973, yearTo: 1977 },
      // Horizon
      { name: "Horizon", yearFrom: 1977, yearTo: 1986, variants: ["LS", "GL", "GLS", "SX", "Premium"] },
      // Vedette
      { name: "Vedette", yearFrom: 1954, yearTo: 1961 },
      { name: "Versailles", yearFrom: 1954, yearTo: 1961 },
      { name: "Régence", yearFrom: 1954, yearTo: 1961 },
      { name: "Chambord", yearFrom: 1954, yearTo: 1961 },
      { name: "Beaulieu", yearFrom: 1954, yearTo: 1961 },
      { name: "Ariane 8", yearFrom: 1957, yearTo: 1963 },
      // Sport
      { name: "8 Sport", yearFrom: 1948, yearTo: 1952 },
      { name: "9 Sport", yearFrom: 1952, yearTo: 1954 },
      // Nyttekjøretøy
      { name: "1000 Commerciale", yearFrom: 1961, yearTo: 1978 },
    ],
  },
  {
    name: "Talbot",
    models: [
      { name: "Horizon", yearFrom: 1979, yearTo: 1986, variants: ["LS", "GL", "GLS", "SX", "Premium"] },
      { name: "Alpine", yearFrom: 1979, yearTo: 1985, variants: ["GL", "GLS", "SX"] },
      { name: "Solara", yearFrom: 1980, yearTo: 1986, variants: ["LS", "GL", "GLS", "SX"] },
      { name: "Samba", yearFrom: 1981, yearTo: 1986, variants: ["LS", "GL", "GLS", "Cabriolet", "Rallye"] },
      { name: "Samba Cabriolet", yearFrom: 1982, yearTo: 1986 },
      { name: "Tagora", yearFrom: 1980, yearTo: 1983, variants: ["GL", "GLS", "SX", "Présidence"] },
      { name: "1510", yearFrom: 1979, yearTo: 1982, variants: ["LS", "GL", "GLS", "SX"] },
      { name: "1610", yearFrom: 1979, yearTo: 1982, variants: ["LS", "GL", "GLS", "SX"] },
    ],
  },
  {
    name: "Matra",
    models: [
      { name: "Djet V", yearFrom: 1962, yearTo: 1967 },
      { name: "Djet VS", yearFrom: 1962, yearTo: 1967 },
      { name: "530", yearFrom: 1967, yearTo: 1973, variants: ["A", "LX"] },
      { name: "Bagheera", yearFrom: 1973, yearTo: 1980, variants: ["Standard", "S", "U8"] },
      { name: "Murena", yearFrom: 1980, yearTo: 1983, variants: ["1.6", "2.2", "2.2 S"] },
      { name: "Rancho", yearFrom: 1977, yearTo: 1984, variants: ["Standard", "X", "Grand Raid", "AS"] },
      { name: "Espace I", yearFrom: 1984, yearTo: 1991, variants: ["2000", "2000 TSE", "2000 GTS", "Quadra"] },
    ],
  },
];

// Helper function to get models for a brand
export function getModelsForBrand(brandName: string): CarModel[] {
  const brand = CAR_BRANDS.find((b) => b.name === brandName);
  return brand?.models || [];
}

// Helper function to get year range for a specific model
export function getYearRangeForModel(brandName: string, modelName: string): { from: number; to: number } | null {
  const models = getModelsForBrand(brandName);
  const model = models.find((m) => m.name === modelName);
  if (model) {
    return { from: model.yearFrom, to: model.yearTo };
  }
  return null;
}

// Helper function to generate years array for a model
export function getYearsForModel(brandName: string, modelName: string): number[] {
  const range = getYearRangeForModel(brandName, modelName);
  if (!range) return [];
  
  const years: number[] = [];
  for (let year = range.from; year <= range.to; year++) {
    years.push(year);
  }
  return years;
}

// Helper function to get variants for a specific model
export function getVariantsForModel(brandName: string, modelName: string): string[] {
  const models = getModelsForBrand(brandName);
  const model = models.find((m) => m.name === modelName);
  return model?.variants || [];
}

// Helper to generate display title from brand, model and year
export function generateCarTitle(brand: string, model: string, year?: number | null): string {
  if (year) {
    return `${brand} ${model} ${year}`;
  }
  return `${brand} ${model}`;
}
