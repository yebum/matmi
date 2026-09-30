import { z } from 'zod';

export const foodProfileSchema = z.object({
  id: z.string(), canonicalName: z.string(), localNames: z.array(z.string()),
  country: z.string(), subtitle: z.string(), ingredients: z.array(z.string()),
  cookingMethods: z.array(z.string()), tasteTags: z.array(z.string()),
  textureTags: z.array(z.string()), dietaryFlags: z.array(z.string()),
  allergens: z.array(z.string()), description: z.string(),
  comparison: z.record(z.string(), z.string()),
});
export type FoodProfile = z.infer<typeof foodProfileSchema>;

export const userTasteProfileSchema = z.object({
  preferredLanguage: z.string(), familiarFoodCulture: z.string(),
  likes: z.array(z.string()), dislikes: z.array(z.string()),
  preferredTasteTags: z.array(z.string()), preferredTextureTags: z.array(z.string()),
  avoidIngredients: z.array(z.string()),
});
export type UserTasteProfile = z.infer<typeof userTasteProfileSchema>;

export const culturalExplanationSchema = z.object({
  summary: z.string(), familiarComparison: z.string(), tasteExplanation: z.string(),
  textureExplanation: z.string(), caution: z.string().optional(),
});
export type CulturalExplanation = z.infer<typeof culturalExplanationSchema>;

export type MenuItemCandidate = {
  rawText: string;
  detectedName: string;
  matchedFoodId?: string;
  confidence?: number;
};

export type TasteMatch = { score: number; positiveReasons: string[]; warnings: string[] };
