import type { FoodProfile, TasteMatch, UserTasteProfile } from '../../models/food';

const has = (values: string[], value: string) => values.some(item => item.toLowerCase() === value.toLowerCase());
const display = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function calculateTasteMatch(food: FoodProfile, profile: UserTasteProfile): TasteMatch {
  let score = 54;
  const positiveReasons: string[] = [];
  const warnings: string[] = [];

  for (const tag of food.tasteTags) if (has(profile.preferredTasteTags, tag)) {
    score += 9; positiveReasons.push(`You enjoy ${tag} flavors`);
  }
  for (const tag of food.textureTags) if (has(profile.preferredTextureTags, tag)) {
    score += 9; positiveReasons.push(`You prefer ${tag} textures`);
  }
  for (const liked of profile.likes) {
    const matches = has(food.ingredients, liked) || (liked === 'fried food' && has(food.cookingMethods, 'fried'));
    if (matches) { score += 12; positiveReasons.push(`You like ${liked}`); }
  }
  for (const avoided of [...profile.dislikes, ...profile.avoidIngredients]) {
    if (has(food.ingredients, avoided) || (avoided === 'strong fish smell' && has(food.ingredients, 'fish'))) {
      score -= 48;
      warnings.push(`${display(food.canonicalName)} may contain ${avoided}, which you said you avoid.`);
    }
  }
  return { score: Math.max(5, Math.min(98, score)), positiveReasons: [...new Set(positiveReasons)], warnings: [...new Set(warnings)] };
}
