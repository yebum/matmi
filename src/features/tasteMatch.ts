import type { SupportedFood } from '../data/supportedFoods';
import { allergenLabel, sensitivityFields, type Allergen } from '../data/personalization';
import type { TasteProfile } from './profileMigration';

export type { TasteProfile } from './profileMigration';
export type TasteMatchResult = { score: number; positiveReasons: string[]; warnings: string[]; allergenConflicts: Allergen[] };

const comfortReason: Record<keyof TasteProfile['sensitivities'], string> = {
  spicy: 'The spice level is within your comfort range.',
  rich: 'This dish is within your richness preference.',
  strongAroma: 'You’re comfortable with this level of aroma.',
  unfamiliarTexture: 'You’re comfortable exploring this texture.',
  organMeat: 'Organ meat is within your comfort range.',
};
const comfortWarning: Record<keyof TasteProfile['sensitivities'], string> = {
  spicy: 'This may be spicier than you usually prefer.',
  rich: 'This may be richer than you usually prefer.',
  strongAroma: 'The aroma may be stronger than you usually prefer.',
  unfamiliarTexture: 'The texture may feel less familiar to you.',
  organMeat: 'This may contain more organ meat than you prefer.',
};

export function calculateTasteMatch(food: SupportedFood, profile: TasteProfile): TasteMatchResult {
  let score = 56;
  const positiveReasons: string[] = [];
  const warnings: string[] = [];
  const signals = [...food.ingredients, ...food.tasteTags, ...food.textureTags, ...food.traits].map(value => value.toLocaleLowerCase());
  for (const like of profile.likes) {
    if (signals.includes(like.toLocaleLowerCase())) {
      score += 8;
      positiveReasons.push(`You like ${like.toLocaleLowerCase()}.`);
    }
  }
  for (const avoid of profile.avoids) {
    const normalized = avoid.toLocaleLowerCase();
    if (signals.includes(normalized) || (normalized === 'strong fish smell' && food.cautions.some(item => /fish|seafood|shrimp/i.test(item)))) {
      score -= 28;
      warnings.push(`This dish may contain ingredients related to ${avoid.toLocaleLowerCase()}. Confirm with the restaurant.`);
    }
  }
  for (const field of sensitivityFields) {
    const intensity = food.sensoryProfile[field.key];
    if (intensity === 0) continue;
    const gap = intensity - profile.sensitivities[field.key];
    if (gap <= 0) {
      score += 2;
      positiveReasons.push(comfortReason[field.key]);
    } else {
      score -= gap * 5;
      if (gap >= 2) warnings.push(comfortWarning[field.key]);
    }
  }
  const allergenConflicts = profile.allergens.filter(allergen => food.commonAllergens.includes(allergen));
  if (allergenConflicts.length > 0) score -= 35 + (allergenConflicts.length - 1) * 5;
  return { score: Math.max(0, Math.min(100, score)), positiveReasons, warnings, allergenConflicts };
}

export function allergenWarning(conflicts: Allergen[]): string {
  return `Potential allergen${conflicts.length > 1 ? 's' : ''}: ${conflicts.map(allergenLabel).join(', ')}`;
}
