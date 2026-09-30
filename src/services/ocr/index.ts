// Compatibility entry point for the older, unused FoodLensApp component.
// It deliberately uses real OCR and never substitutes a sample menu.
import type { MenuItemCandidate } from '../../models/food';
import { detectSupportedFoods } from '../../features/recognition';
import { ocrService } from './ocrService';

export async function scanMenu(imageUri: string): Promise<MenuItemCandidate[]> {
  const response = await fetch(imageUri);
  if (!response.ok) throw new Error('Could not load the selected image.');
  const blob = await response.blob();
  const image = new File([blob], 'menu-image', { type: blob.type || 'image/jpeg' });
  const result = await ocrService.extractText(image);
  return detectSupportedFoods(result.rawText).map(food => ({ rawText: food.name, detectedName: food.name, matchedFoodId: food.id }));
}
