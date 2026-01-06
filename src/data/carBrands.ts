// Complete list of Simca, Talbot and Matra models with year ranges

export interface CarModel {
  name: string;
  yearFrom: number;
  yearTo: number;
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
      { name: "1000", yearFrom: 1961, yearTo: 1978 },
      { name: "1000 Coupé (Bertone)", yearFrom: 1962, yearTo: 1967 },
      { name: "1000 Rallye 1", yearFrom: 1970, yearTo: 1972 },
      { name: "1000 Rallye 2", yearFrom: 1972, yearTo: 1978 },
      { name: "1000 Rallye 3", yearFrom: 1970, yearTo: 1978 },
      // 1100-serien
      { name: "1100", yearFrom: 1967, yearTo: 1985 },
      { name: "1100 TI", yearFrom: 1973, yearTo: 1978 },
      { name: "1100 VF1", yearFrom: 1968, yearTo: 1981 },
      { name: "1100 VF2", yearFrom: 1968, yearTo: 1981 },
      { name: "1100 VF Pick-Up", yearFrom: 1972, yearTo: 1978 },
      { name: "1100 Pickup / Van", yearFrom: 1967, yearTo: 1981 },
      // 1200 S Coupé
      { name: "1200 S Coupé", yearFrom: 1967, yearTo: 1971 },
      // 1300/1301/1500/1501
      { name: "1300", yearFrom: 1963, yearTo: 1966 },
      { name: "1301", yearFrom: 1966, yearTo: 1975 },
      { name: "1307", yearFrom: 1975, yearTo: 1980 },
      { name: "1308", yearFrom: 1975, yearTo: 1980 },
      { name: "1309", yearFrom: 1975, yearTo: 1980 },
      { name: "1500", yearFrom: 1963, yearTo: 1966 },
      { name: "1501", yearFrom: 1967, yearTo: 1975 },
      // 160/180/2-Litre
      { name: "160", yearFrom: 1969, yearTo: 1973 },
      { name: "180", yearFrom: 1970, yearTo: 1977 },
      { name: "2-Litre", yearFrom: 1973, yearTo: 1977 },
      // Horizon
      { name: "Horizon", yearFrom: 1977, yearTo: 1986 },
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
      { name: "Horizon", yearFrom: 1979, yearTo: 1986 },
      { name: "Alpine", yearFrom: 1979, yearTo: 1985 },
      { name: "Solara", yearFrom: 1980, yearTo: 1986 },
      { name: "Samba", yearFrom: 1981, yearTo: 1986 },
      { name: "Samba Cabriolet", yearFrom: 1982, yearTo: 1986 },
      { name: "Tagora", yearFrom: 1980, yearTo: 1983 },
      { name: "1510", yearFrom: 1979, yearTo: 1982 },
      { name: "1610", yearFrom: 1979, yearTo: 1982 },
    ],
  },
  {
    name: "Matra",
    models: [
      { name: "Djet V", yearFrom: 1962, yearTo: 1967 },
      { name: "Djet VS", yearFrom: 1962, yearTo: 1967 },
      { name: "530", yearFrom: 1967, yearTo: 1973 },
      { name: "Bagheera", yearFrom: 1973, yearTo: 1980 },
      { name: "Murena", yearFrom: 1980, yearTo: 1983 },
      { name: "Rancho", yearFrom: 1977, yearTo: 1984 },
      { name: "Espace I", yearFrom: 1984, yearTo: 1991 },
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

// Helper to generate display title from brand, model and year
export function generateCarTitle(brand: string, model: string, year?: number | null): string {
  if (year) {
    return `${brand} ${model} ${year}`;
  }
  return `${brand} ${model}`;
}
