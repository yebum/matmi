import { culturalExplanationSchema, type CulturalExplanation, type FoodProfile, type UserTasteProfile } from '../../models/food';

export interface CulturalTranslationService {
  generateCulturalExplanation(food: FoodProfile, profile: UserTasteProfile): Promise<CulturalExplanation>;
}

export class MockCulturalTranslationService implements CulturalTranslationService {
  async generateCulturalExplanation(food: FoodProfile, profile: UserTasteProfile): Promise<CulturalExplanation> {
    const comparison = food.comparison[profile.familiarFoodCulture] ?? `Picture ${food.description.toLowerCase()} This is an analogy to help imagine the dish, not an exact equivalent in ${profile.familiarFoodCulture} cuisine.`;
    return culturalExplanationSchema.parse({
      summary: food.description,
      familiarComparison: comparison,
      tasteExplanation: `Expect ${food.tasteTags.join(' and ')} flavors.`,
      textureExplanation: `Typically ${food.textureTags.join(' and ')} in texture.`,
      caution: food.dietaryFlags.length ? food.dietaryFlags.join('; ') : undefined,
    });
  }
}

// Run a real provider on a trusted backend; never bundle its secret key in the app.
export function buildCulturalExplanationPrompt(food: FoodProfile, profile: UserTasteProfile): string {
  return JSON.stringify({
    task: 'Explain this dish for a traveler. Return JSON with summary, familiarComparison, tasteExplanation, textureExplanation, and optional caution. Use only supplied food facts. Clearly frame cultural comparisons as analogies, never identical foods. Keep each field concise. Do not claim restaurant-specific ingredients or allergy safety. Express uncertainty where recipes vary.',
    foodFacts: { name: food.canonicalName, country: food.country, ingredients: food.ingredients, methods: food.cookingMethods, tastes: food.tasteTags, textures: food.textureTags, description: food.description, dietaryFlags: food.dietaryFlags, allergens: food.allergens },
    user: { familiarFoodCulture: profile.familiarFoodCulture, preferredLanguage: profile.preferredLanguage, likes: profile.likes, dislikes: profile.dislikes },
  });
}

export function parseCulturalExplanation(json: unknown): CulturalExplanation {
  return culturalExplanationSchema.parse(json);
}

// An app can call a trusted server endpoint that owns the provider credentials.
// The server can use OpenAI or Gemini without changing any screen code.
export class BackendCulturalTranslationService implements CulturalTranslationService {
  constructor(private readonly endpoint: string) {}

  async generateCulturalExplanation(food: FoodProfile, profile: UserTasteProfile): Promise<CulturalExplanation> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildCulturalExplanationPrompt(food, profile),
    });
    if (!response.ok) throw new Error(`Cultural explanation request failed: ${response.status}`);
    return parseCulturalExplanation(await response.json());
  }
}
