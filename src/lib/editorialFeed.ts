/**
 * Editorial Feed Builder
 * 
 * Blander biler fra ulike moduler i en "magasin-feed" rekkefølge
 * slik at store og små saker varierer naturlig.
 * 
 * REGLER:
 * - Max 1 hero per 8-12 elementer
 * - Aldri mer enn 2 av samme modul på rad
 * - Alle biler skal inkluderes
 * - Mønsteret skal føles kuratert, ikke tilfeldig
 */

import { type EditorialModule } from './carEditorialResolver';

export type BlockSize = 'xl' | 'lg' | 'md' | 'sm';

export interface CarBlock<T> {
  car: T;
  module: EditorialModule;
  size: BlockSize;
  key: string;
}

/**
 * Bestem størrelse basert på modul og variasjon
 * Archive får ALLTID minst 'md' for lesbarhet
 */
function getBlockSize(module: EditorialModule, index: number, car: { story?: string | null }): BlockSize {
  switch (module) {
    case 'hero':
      return 'xl';
    case 'feature':
      // Varier mellom lg og md
      return index % 2 === 0 ? 'lg' : 'md';
    case 'standard':
      // Varier basert på om bilen har lang story
      const hasLongStory = car.story && car.story.length > 300;
      return hasLongStory ? 'md' : 'sm';
    case 'archive':
      // Archive får 'lg' for å fylle mer av skjermen
      return 'lg';
    default:
      return 'md';
  }
}

/**
 * Interleave-mønster for magasin-feel
 * 
 * Pattern: hero (sjelden), feature, standard, archive blandes
 * med varierende rytme. Føles som puslespill.
 */
const PATTERN: EditorialModule[] = [
  'hero',      // Starter med hero hvis tilgjengelig
  'feature',
  'standard',
  'archive',
  'standard',
  'feature',
  'standard',
  'standard',
  'archive',
  'feature',
  'standard',
  'archive',
  'standard',
];

interface ModuleQueues<T> {
  hero: T[];
  feature: T[];
  standard: T[];
  archive: T[];
}

/**
 * Bygg en blandet editorial feed fra grupperte biler
 */
export function interleaveEditorialFeed<T extends { id: string; story?: string | null }>(
  queues: ModuleQueues<T>
): CarBlock<T>[] {
  const blocks: CarBlock<T>[] = [];
  
  // Lag kopier av køene som vi kan mutere
  const remaining: ModuleQueues<T> = {
    hero: [...queues.hero],
    feature: [...queues.feature],
    standard: [...queues.standard],
    archive: [...queues.archive],
  };

  // Teller for å variere størrelser
  const moduleCounters: Record<EditorialModule, number> = {
    hero: 0,
    feature: 0,
    standard: 0,
    archive: 0,
  };

  // Track siste 2 moduler for å unngå >2 på rad
  const recentModules: EditorialModule[] = [];

  // Hero-begrensning: maks 1 hero per ~10 elementer
  let lastHeroIndex = -10;
  const HERO_MIN_GAP = 8;

  let patternIndex = 0;
  let safetyCounter = 0;
  const maxIterations = 1000;

  // Fortsett til alle køer er tomme
  while (
    remaining.hero.length > 0 ||
    remaining.feature.length > 0 ||
    remaining.standard.length > 0 ||
    remaining.archive.length > 0
  ) {
    safetyCounter++;
    if (safetyCounter > maxIterations) break;

    // Finn neste modul fra pattern
    let targetModule = PATTERN[patternIndex % PATTERN.length];
    patternIndex++;

    // Sjekk hero-begrensning
    if (targetModule === 'hero' && blocks.length - lastHeroIndex < HERO_MIN_GAP) {
      targetModule = 'feature'; // Fall tilbake til feature
    }

    // Sjekk om vi har 2 av samme på rad
    if (recentModules.length >= 2 && 
        recentModules[0] === targetModule && 
        recentModules[1] === targetModule) {
      // Finn alternativ modul
      const alternatives: EditorialModule[] = ['feature', 'standard', 'archive', 'hero'];
      for (const alt of alternatives) {
        if (alt !== targetModule && remaining[alt].length > 0) {
          targetModule = alt;
          break;
        }
      }
    }

    // Finn en modul som har biler igjen
    let foundModule: EditorialModule | null = null;
    const priority: EditorialModule[] = [targetModule, 'standard', 'feature', 'archive', 'hero'];
    
    for (const mod of priority) {
      if (remaining[mod].length > 0) {
        // Ekstra sjekk for hero
        if (mod === 'hero' && blocks.length - lastHeroIndex < HERO_MIN_GAP && blocks.length > 0) {
          continue;
        }
        foundModule = mod;
        break;
      }
    }

    if (!foundModule) break;

    // Ta neste bil fra køen
    const car = remaining[foundModule].shift()!;
    const size = getBlockSize(foundModule, moduleCounters[foundModule], car);
    
    blocks.push({
      car,
      module: foundModule,
      size,
      key: `${foundModule}-${car.id}`,
    });

    // Oppdater tracking
    moduleCounters[foundModule]++;
    if (foundModule === 'hero') {
      lastHeroIndex = blocks.length - 1;
    }
    
    recentModules.unshift(foundModule);
    if (recentModules.length > 2) {
      recentModules.pop();
    }
  }

  return blocks;
}

/**
 * CSS grid klasser basert på BlockSize
 * Justert for tettere pakking og færre hull
 * Bruker 12-col grid med spans som summerer pent
 */
export function getGridClasses(size: BlockSize): string {
  switch (size) {
    case 'xl':
      // Full bredde hero
      return 'col-span-12';
    case 'lg':
      // 7/12 = ~58% - god for feature
      return 'col-span-12 md:col-span-7';
    case 'md':
      // 5/12 = ~42% - komplementerer lg
      return 'col-span-12 md:col-span-5';
    case 'sm':
      // 4/12 = 33% - tre på rad, eller 8/12 på tablet
      return 'col-span-12 md:col-span-6 lg:col-span-4';
    default:
      return 'col-span-12 md:col-span-6';
  }
}
