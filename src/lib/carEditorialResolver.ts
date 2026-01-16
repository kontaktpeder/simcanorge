/**
 * Car Editorial Resolver
 * 
 * Determines which display module to use for a car based on:
 * 1. Admin override (editorial_status field)
 * 2. Automatic scoring based on content richness
 */

export type EditorialModule = 'hero' | 'feature' | 'standard' | 'archive';
export type EditorialStatus = 'arkiv' | 'omtalt' | 'utvalgt' | 'manedens_bil' | null;

interface CarForScoring {
  story?: string | null;
  tags?: string[] | null;
  editorial_status?: EditorialStatus | string | null;
  featured?: boolean;
  image_count?: number;
  event_count?: number;
  // For when we have nested data
  car_images?: Array<unknown>;
  car_events?: Array<unknown>;
}

// Tags that indicate editorial value
const VALUABLE_TAGS = ['original', 'restaurert', 'sjeldent', 'sjelden', 'rally', 'racing', 'konkurransebil'];

/**
 * Calculate editorial score for automatic module selection
 */
export function calculateEditorialScore(car: CarForScoring): number {
  let score = 0;

  // Image count: +1 per image (max 10 points)
  const imageCount = car.image_count ?? car.car_images?.length ?? 0;
  score += Math.min(imageCount, 10);

  // Event count: +2 per timeline event (max 10 points)
  const eventCount = car.event_count ?? car.car_events?.length ?? 0;
  score += Math.min(eventCount * 2, 10);

  // Story: +3 if exists, +2 more if substantial (>200 chars)
  if (car.story) {
    score += 3;
    if (car.story.length > 200) score += 2;
    if (car.story.length > 500) score += 2;
  }

  // Valuable tags: +1 per matching tag
  if (car.tags && Array.isArray(car.tags)) {
    const lowerTags = car.tags.map(t => t.toLowerCase());
    for (const tag of VALUABLE_TAGS) {
      if (lowerTags.some(t => t.includes(tag))) {
        score += 1;
      }
    }
  }

  return score;
}

/**
 * Map editorial_status to module
 */
function statusToModule(status: EditorialStatus): EditorialModule | null {
  switch (status) {
    case 'manedens_bil':
      return 'hero';
    case 'utvalgt':
      return 'feature';
    case 'omtalt':
      return 'standard';
    case 'arkiv':
      return 'archive';
    default:
      return null;
  }
}

/**
 * Map score to module (automatic selection)
 */
function scoreToModule(score: number): EditorialModule {
  if (score >= 15) return 'hero';
  if (score >= 8) return 'feature';
  if (score >= 3) return 'standard';
  return 'archive';
}

/**
 * Resolve which editorial module to use for a car
 */
export function resolveEditorialModule(car: CarForScoring): EditorialModule {
  // 1. Check for featured flag (legacy support → hero)
  if (car.featured) {
    return 'hero';
  }

  // 2. Check for admin override
  if (car.editorial_status) {
    const moduleFromStatus = statusToModule(car.editorial_status as EditorialStatus);
    if (moduleFromStatus) return moduleFromStatus;
  }

  // 3. Automatic scoring
  const score = calculateEditorialScore(car);
  return scoreToModule(score);
}

/**
 * Group cars by their resolved editorial module
 */
export function groupCarsByModule<T extends CarForScoring>(
  cars: T[]
): Record<EditorialModule, T[]> {
  const groups: Record<EditorialModule, T[]> = {
    hero: [],
    feature: [],
    standard: [],
    archive: [],
  };

  for (const car of cars) {
    const module = resolveEditorialModule(car);
    groups[module].push(car);
  }

  return groups;
}

/**
 * Get module display order for rendering
 */
export function getModuleOrder(): EditorialModule[] {
  return ['hero', 'feature', 'standard', 'archive'];
}
