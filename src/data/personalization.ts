export const foodCultures = [
  { value: 'Korean', label: 'Korean food', country: 'South Korea', code: 'KR', language: 'ko' },
  { value: 'Vietnamese', label: 'Vietnamese food', country: 'Vietnam', code: 'VN', language: 'vi' },
  { value: 'Thai', label: 'Thai food', country: 'Thailand', code: 'TH', language: 'th' },
  { value: 'Indonesian', label: 'Indonesian food', country: 'Indonesia', code: 'ID', language: 'id' },
  { value: 'Hungarian', label: 'Hungarian food', country: 'Hungary', code: 'HU', language: 'hu' },
] as const;
export type FoodCulture = (typeof foodCultures)[number]['value'];
export const isFoodCulture = (value: unknown): value is FoodCulture => foodCultures.some(item => item.value === value);
export function cultureFromLanguage(language: string | undefined): FoodCulture | null {
  return foodCultures.find(item => language?.toLowerCase().startsWith(item.language))?.value ?? null;
}

export const sensitivityFields = [
  { key: 'spicy', label: 'Spicy food', shortLabel: 'Spicy', explanation: 'How much heat feels comfortable?', low: 'Very mild', high: 'Very spicy' },
  { key: 'rich', label: 'Rich & oily food', shortLabel: 'Rich', explanation: 'From light dishes to rich, oily ones.', low: 'Light', high: 'Rich & oily' },
  { key: 'strongAroma', label: 'Strong aromas', shortLabel: 'Strong aromas', explanation: 'How do bold food aromas feel?', low: 'Subtle', high: 'Strong aromas' },
  { key: 'unfamiliarTexture', label: 'Unfamiliar textures', shortLabel: 'New textures', explanation: 'Chewy, slippery or very soft textures.', low: 'Familiar', high: 'Adventurous' },
  { key: 'organMeat', label: 'Organ meat', shortLabel: 'Organ meat', explanation: 'Your comfort with organ meat dishes.', low: 'Avoid', high: 'Comfortable' },
] as const;
export type SensitivityKey = (typeof sensitivityFields)[number]['key'];
export type FoodSensitivityProfile = Record<SensitivityKey, number>;
export const defaultSensitivities: FoodSensitivityProfile = { spicy: 5, rich: 5, strongAroma: 5, unfamiliarTexture: 5, organMeat: 3 };
export function clampSensitivity(value: unknown, fallback = 5): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(10, Math.round(value))) : fallback;
}

export const allergenOptions = [
  { value: 'nuts', label: 'Peanuts / tree nuts' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'fish', label: 'Fish' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'egg', label: 'Egg' },
  { value: 'wheat', label: 'Wheat / gluten' },
  { value: 'soy', label: 'Soy' },
] as const;
export type Allergen = (typeof allergenOptions)[number]['value'];
export const isAllergen = (value: unknown): value is Allergen => allergenOptions.some(item => item.value === value);
export const allergenLabel = (value: Allergen) => allergenOptions.find(item => item.value === value)?.label ?? value;
export function toggleAllergen(current: Allergen[], selection: Allergen | 'none'): Allergen[] {
  return selection === 'none' ? [] : current.includes(selection) ? current.filter(value => value !== selection) : [...current, selection];
}
