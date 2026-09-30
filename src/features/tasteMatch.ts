import type { SupportedFood } from '../data/supportedFoods';

export type TasteProfile = { culture: string; likes: string[]; avoids: string[] };
export type TasteMatchResult = { score: number; positiveReasons: string[]; warnings: string[] };

export function calculateTasteMatch(food: SupportedFood, profile: TasteProfile): TasteMatchResult {
  let score = 56;
  const positiveReasons: string[] = [];
  const warnings: string[] = [];
  const signals = [...food.ingredients, ...food.tasteTags, ...food.textureTags, ...food.traits].map(value => value.toLocaleLowerCase());
  for (const like of profile.likes) {
    if (signals.includes(like.toLocaleLowerCase())) {
      score += 8;
      positiveReasons.push(`You like ${like.toLocaleLowerCase()}`);
    }
  }
  for (const avoid of profile.avoids) {
    const normalized = avoid.toLocaleLowerCase();
    if (signals.includes(normalized) || (normalized === 'strong fish smell' && food.cautions.some(item => /fish|seafood|shrimp/i.test(item)))) {
      score -= 28;
      warnings.push(`This dish may contain ingredients related to ${avoid.toLocaleLowerCase()}. Confirm with the restaurant.`);
    }
  }
  return { score: Math.max(0, Math.min(100, score)), positiveReasons, warnings };
}
